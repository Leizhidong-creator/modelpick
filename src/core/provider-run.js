import crypto from 'node:crypto';
import { ModelPickError } from './errors.js';
import { getSecret } from './secrets.js';

const TIMEOUT_MS = 120000;
const MAX_ERROR = 300;
const MAX_TOKENS = 4096;

const OPENAI_COMPATIBLE = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions'
};

function signal() {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(TIMEOUT_MS);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), TIMEOUT_MS).unref?.();
  return controller.signal;
}

function providerKey(model, providerId) {
  const env = model.provider?.env ?? [];
  if (providerId === 'openrouter') return { env: 'OPENROUTER_API_KEY', value: getSecret('OPENROUTER_API_KEY') };
  for (const name of env) {
    const value = getSecret(name);
    if (value) return { env: name, value };
  }
  return { env: env[0] ?? null, value: null };
}

function missingKey(model, env) {
  return new ModelPickError(`No key configured for ${model.provider.name}.`, {
    code: 'ERR_MISSING_KEY',
    hint: env
      ? `Run \`modelpick keys set ${env}\` or \`modelpick keys --ui\`. The recommendation is still valid.`
      : 'This provider has no key path.',
    details: {
      provider: model.provider.name,
      env,
      keysUrl: model.provider.keysUrl ?? null,
      command: env ? `modelpick keys set ${env}` : null,
      setupUi: 'modelpick keys --ui',
      model: model.slug,
      needsUserAction: true
    }
  });
}

function usageFrom(provider, data) {
  if (provider === 'anthropic') {
    return {
      inputTokens: Number(data.usage?.input_tokens ?? 0),
      outputTokens: Number(data.usage?.output_tokens ?? 0)
    };
  }
  if (provider === 'google') {
    return {
      inputTokens: Number(data.usageMetadata?.promptTokenCount ?? 0),
      outputTokens: Number(data.usageMetadata?.candidatesTokenCount ?? 0)
    };
  }
  return {
    inputTokens: Number(data.usage?.prompt_tokens ?? 0),
    outputTokens: Number(data.usage?.completion_tokens ?? 0)
  };
}

function outputFrom(provider, data) {
  if (provider === 'anthropic') {
    return (data.content ?? []).filter((part) => part.type === 'text').map((part) => part.text).join('');
  }
  if (provider === 'google') {
    return (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('');
  }
  return data.choices?.[0]?.message?.content ?? '';
}

function errorMessage(data, text) {
  const message = data?.error?.message || data?.message || text;
  return String(message ?? '').slice(0, MAX_ERROR);
}

export function adapterFor(model) {
  if (model.modality !== 'text') {
    throw new ModelPickError(`Cloud execution currently supports text models only.`, {
      code: 'ERR_UNSUPPORTED_MODALITY',
      hint: 'Use `pick`/`plan` for image, video, 3D, and audio; execution adapters for those are next.'
    });
  }
  const direct = providerKey(model, model.provider.id);
  if (direct.value && OPENAI_COMPATIBLE[model.provider.id]) return { kind: model.provider.id, key: direct };
  if (direct.value && model.provider.id === 'anthropic') return { kind: 'anthropic', key: direct };
  if (direct.value && model.provider.id === 'google') return { kind: 'google', key: direct };
  const openrouter = model.access?.openrouter && providerKey(model, 'openrouter');
  if (openrouter?.value) return { kind: 'openrouter', key: openrouter };
  if (OPENAI_COMPATIBLE[model.provider.id] || model.provider.id === 'anthropic' || model.provider.id === 'google') {
    throw missingKey(model, direct.env);
  }
  throw new ModelPickError(`No execution adapter for ${model.provider.name}.`, {
    code: 'ERR_UNSUPPORTED_PROVIDER',
    hint: direct.env ? `Configured key: ${direct.env}. This provider is not wired yet.` : 'Use a text provider with a known adapter.'
  });
}

export async function runTextModel({ model, prompt, fetchImpl = fetch, maxTokens = MAX_TOKENS } = {}) {
  if (!prompt || !String(prompt).trim()) {
    throw new ModelPickError('A prompt is required.', { code: 'ERR_MISSING_PROMPT' });
  }
  const adapter = adapterFor(model);
  const apiModel = model.access?.apiModel;
  if (!apiModel) {
    throw new ModelPickError(`No API model id for ${model.name}.`, { code: 'ERR_NO_API_MODEL' });
  }
  const requestId = crypto.randomUUID();
  let url;
  let headers;
  let body;
  if (adapter.kind === 'anthropic') {
    url = 'https://api.anthropic.com/v1/messages';
    headers = { 'content-type': 'application/json', 'x-api-key': adapter.key.value, 'anthropic-version': '2023-06-01' };
    body = { model: apiModel, max_tokens: maxTokens, messages: [{ role: 'user', content: String(prompt) }] };
  } else if (adapter.kind === 'google') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(apiModel)}:generateContent`;
    headers = { 'content-type': 'application/json', 'x-goog-api-key': adapter.key.value };
    body = { contents: [{ parts: [{ text: String(prompt) }] }] };
  } else {
    url = OPENAI_COMPATIBLE[adapter.kind];
    headers = { 'content-type': 'application/json', Authorization: `Bearer ${adapter.key.value}` };
    body = { model: apiModel, messages: [{ role: 'user', content: String(prompt) }], max_tokens: maxTokens };
  }

  let response;
  try {
    response = await fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body), signal: signal() });
  } catch (error) {
    throw new ModelPickError(
      error.name === 'AbortError' ? `${model.provider.name} request timed out.` : `Could not reach ${model.provider.name}.`,
      { code: error.name === 'AbortError' ? 'ERR_PROVIDER_TIMEOUT' : 'ERR_PROVIDER_UNREACHABLE', hint: 'Check your network and retry.' }
    );
  }
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  if (!response.ok || data?.error) {
    const message = errorMessage(data, text);
    const code = response.status === 401 || response.status === 403
      ? 'ERR_PROVIDER_AUTH'
      : response.status === 429
        ? 'ERR_PROVIDER_RATE_LIMIT'
        : 'ERR_PROVIDER_HTTP';
    throw new ModelPickError(`${model.provider.name} returned HTTP ${response.status}: ${message}`, {
      code,
      hint: code === 'ERR_PROVIDER_AUTH'
        ? 'The key was rejected. Run `modelpick keys test ENV` or replace it with `modelpick keys --ui`.'
        : code === 'ERR_PROVIDER_RATE_LIMIT'
          ? 'Rate limited. Wait, or let ModelPick use a fallback.'
          : 'The request reached the provider but was not accepted.'
    });
  }
  const output = outputFrom(adapter.kind, data);
  if (!output) {
    throw new ModelPickError(`${model.provider.name} returned no text.`, { code: 'ERR_EMPTY_OUTPUT' });
  }
  const usage = usageFrom(adapter.kind, data);
  const price = model.pricing;
  const cost = price?.unit === 'mtok' && Number.isFinite(price.input) && Number.isFinite(price.output)
    ? (usage.inputTokens / 1e6) * price.input + (usage.outputTokens / 1e6) * price.output
    : null;
  return {
    requestId,
    model: model.slug,
    name: model.name,
    provider: model.provider.name,
    providerId: model.provider.id,
    adapter: adapter.kind,
    output,
    usage,
    cost: cost === null ? null : Math.round(cost * 1e6) / 1e6,
    keySource: adapter.key.env
  };
}
