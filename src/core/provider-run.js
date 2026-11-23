import crypto from 'node:crypto';
import { ModelPickError } from './errors.js';
import { getSecret } from './secrets.js';

const TIMEOUT_MS = 120000;
const MAX_ERROR = 300;
const MAX_TOKENS = 4096;
const SAFETY_TOKENS = 512;
const ROLES = new Set(['user', 'assistant']);

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

/** Conservative, dependency-free estimate: CJK ~1 token/char, other ~4 chars/token. */
export function estimateTokens(text) {
  const value = String(text ?? '');
  let cjk = 0;
  let other = 0;
  for (const char of value) {
    if (char.codePointAt(0) >= 0x2e80) cjk += 1;
    else other += 1;
  }
  return Math.ceil(cjk + other / 4);
}

function normalizeMessages({ prompt, messages = [], system = null, context = null }) {
  if (!Array.isArray(messages)) throw new ModelPickError('messages must be an array.', { code: 'ERR_INVALID_MESSAGES' });
  const normalized = messages.map((message, index) => {
    const role = message?.role;
    const content = typeof message?.content === 'string' ? message.content : null;
    if (!ROLES.has(role) || content === null) {
      throw new ModelPickError(`messages[${index}] must be {role:"user"|"assistant", content:string}.`, {
        code: 'ERR_INVALID_MESSAGES'
      });
    }
    return { role, content };
  });
  if (prompt && String(prompt).trim()) normalized.push({ role: 'user', content: String(prompt) });
  if (!normalized.length) throw new ModelPickError('A prompt or messages are required.', { code: 'ERR_MISSING_PROMPT' });
  if (context && String(context).trim()) {
    const text = `Context:\n${String(context)}`;
    const firstUser = normalized.findIndex((message) => message.role === 'user');
    if (firstUser === -1) normalized.unshift({ role: 'user', content: text });
    else normalized[firstUser] = { ...normalized[firstUser], content: `${text}\n\n${normalized[firstUser].content}` };
  }
  return { messages: normalized, system: system ? String(system) : null };
}

function jsonInstruction(schema) {
  return `Return ONLY valid JSON${schema ? ' matching this JSON Schema' : ''}. No markdown fences, no prose.\n${schema ? JSON.stringify(schema) : ''}`;
}

function buildRequest({ model, adapter, messages, system, output, maxTokens }) {
  const apiModel = model.access?.apiModel;
  if (!apiModel) throw new ModelPickError(`No API model id for ${model.name}.`, { code: 'ERR_NO_API_MODEL' });
  const wantsJson = output?.format === 'json';
  if (adapter.kind === 'anthropic') {
    const merged = [];
    for (const message of messages) {
      if (merged.length && merged[merged.length - 1].role === message.role) merged[merged.length - 1].content += `\n\n${message.content}`;
      else merged.push({ ...message });
    }
    const systemText = [system, wantsJson ? jsonInstruction(output.schema) : null].filter(Boolean).join('\n\n');
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: { 'content-type': 'application/json', 'x-api-key': adapter.key.value, 'anthropic-version': '2023-06-01' },
      body: { model: apiModel, max_tokens: maxTokens, ...(systemText ? { system: systemText } : {}), messages: merged }
    };
  }
  if (adapter.kind === 'google') {
    const contents = messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }));
    const systemText = [system, wantsJson ? jsonInstruction(output.schema) : null].filter(Boolean).join('\n\n');
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(apiModel)}:generateContent`,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': adapter.key.value },
      body: {
        ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
        contents,
        ...(wantsJson ? { generationConfig: { responseMimeType: 'application/json' } } : {})
      }
    };
  }
  const apiMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...(wantsJson ? [{ role: 'system', content: jsonInstruction(output.schema) }] : []),
    ...messages
  ];
  return {
    url: OPENAI_COMPATIBLE[adapter.kind],
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${adapter.key.value}` },
    body: {
      model: apiModel,
      messages: apiMessages,
      max_tokens: maxTokens,
      ...(wantsJson
        ? {
            response_format: output.schema
              ? { type: 'json_schema', json_schema: { name: 'modelpick_output', schema: output.schema, strict: false } }
              : { type: 'json_object' }
          }
        : {})
    }
  };
}

function usageFrom(provider, data) {
  if (provider === 'anthropic') return { inputTokens: Number(data.usage?.input_tokens ?? 0), outputTokens: Number(data.usage?.output_tokens ?? 0) };
  if (provider === 'google') return { inputTokens: Number(data.usageMetadata?.promptTokenCount ?? 0), outputTokens: Number(data.usageMetadata?.candidatesTokenCount ?? 0) };
  return { inputTokens: Number(data.usage?.prompt_tokens ?? 0), outputTokens: Number(data.usage?.completion_tokens ?? 0) };
}

function outputFrom(provider, data) {
  if (provider === 'anthropic') return (data.content ?? []).filter((part) => part.type === 'text').map((part) => part.text).join('');
  if (provider === 'google') return (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('');
  return data.choices?.[0]?.message?.content ?? '';
}

function errorMessage(data, text) {
  return String(data?.error?.message || data?.message || text || '').slice(0, MAX_ERROR);
}

function validateSchema(value, schema, path = 'output') {
  if (!schema || typeof schema !== 'object') return;
  const type = schema.type;
  if (type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path} must be an object`);
    for (const key of schema.required ?? []) if (!(key in value)) throw new Error(`${path}.${key} is required`);
    for (const [key, child] of Object.entries(schema.properties ?? {})) if (key in value) validateSchema(value[key], child, `${path}.${key}`);
    return;
  }
  if (type === 'array') {
    if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
    if (schema.items) value.forEach((item, index) => validateSchema(item, schema.items, `${path}[${index}]`));
    return;
  }
  if (type === 'string' && typeof value !== 'string') throw new Error(`${path} must be a string`);
  if (type === 'number' && typeof value !== 'number') throw new Error(`${path} must be a number`);
  if (type === 'boolean' && typeof value !== 'boolean') throw new Error(`${path} must be a boolean`);
  if (type === 'integer' && !Number.isInteger(value)) throw new Error(`${path} must be an integer`);
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`${path} must be one of ${schema.enum.join(', ')}`);
}

export function adapterFor(model) {
  if (model.modality !== 'text') {
    throw new ModelPickError('Cloud execution currently supports text models only.', {
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
  if (OPENAI_COMPATIBLE[model.provider.id] || model.provider.id === 'anthropic' || model.provider.id === 'google') throw missingKey(model, direct.env);
  throw new ModelPickError(`No execution adapter for ${model.provider.name}.`, {
    code: 'ERR_UNSUPPORTED_PROVIDER',
    hint: direct.env ? `Configured key: ${direct.env}. This provider is not wired yet.` : 'Use a text provider with a known adapter.'
  });
}

export async function runTextModel({ model, prompt, messages, system, context, output = { format: 'text' }, fetchImpl = fetch, maxTokens = MAX_TOKENS } = {}) {
  const normalized = normalizeMessages({ prompt, messages, system, context });
  const adapter = adapterFor(model);
  const outputReserve = Math.min(Math.max(Number(maxTokens) || MAX_TOKENS, 1), 32768);
  const contextWindow = Number(model.contextWindow ?? 128000);
  const budget = contextWindow - outputReserve - SAFETY_TOKENS;
  const inputText = [
    normalized.system ?? '',
    ...normalized.messages.map((message) => `${message.role}: ${message.content}`)
  ].join('\n');
  const estimatedInputTokens = estimateTokens(inputText);
  if (budget <= 0 || estimatedInputTokens > budget) {
    throw new ModelPickError('The node context exceeds this model\'s budget.', {
      code: 'ERR_CONTEXT_TOO_LARGE',
      hint: 'Have the main agent compress or select less context, lower max_tokens, or choose a larger-context model.',
      details: { estimatedInputTokens, inputBudget: Math.max(0, budget), contextWindow, outputReserved: outputReserve, model: model.slug }
    });
  }
  const request = buildRequest({ model, adapter, messages: normalized.messages, system: normalized.system, output, maxTokens: outputReserve });
  let response;
  try {
    response = await fetchImpl(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify(request.body), signal: signal() });
  } catch (error) {
    throw new ModelPickError(error.name === 'AbortError' ? `${model.provider.name} request timed out.` : `Could not reach ${model.provider.name}.`, {
      code: error.name === 'AbortError' ? 'ERR_PROVIDER_TIMEOUT' : 'ERR_PROVIDER_UNREACHABLE',
      hint: 'Check your network and retry.'
    });
  }
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!response.ok || data?.error) {
    const code = response.status === 401 || response.status === 403 ? 'ERR_PROVIDER_AUTH' : response.status === 429 ? 'ERR_PROVIDER_RATE_LIMIT' : 'ERR_PROVIDER_HTTP';
    throw new ModelPickError(`${model.provider.name} returned HTTP ${response.status}: ${errorMessage(data, text)}`, {
      code,
      hint: code === 'ERR_PROVIDER_AUTH' ? 'The key was rejected. Run `modelpick keys test ENV` or replace it.' : code === 'ERR_PROVIDER_RATE_LIMIT' ? 'Rate limited; retry or choose a fallback.' : 'The request reached the provider but was not accepted.'
    });
  }
  const textOutput = outputFrom(adapter.kind, data);
  if (!textOutput) throw new ModelPickError(`${model.provider.name} returned no text.`, { code: 'ERR_EMPTY_OUTPUT' });
  let parsed = null;
  if (output?.format === 'json') {
    const cleaned = textOutput.replace(/```(?:json)?/gi, '').trim();
    try { parsed = JSON.parse(cleaned); } catch (error) {
      throw new ModelPickError(`Provider did not return valid JSON: ${error.message}`, { code: 'ERR_OUTPUT_SCHEMA', hint: 'Retry with a stricter prompt or a model with better structured output.' });
    }
    try { validateSchema(parsed, output.schema); } catch (error) {
      throw new ModelPickError(`Provider output does not match the schema: ${error.message}`, { code: 'ERR_OUTPUT_SCHEMA' });
    }
  }
  const usage = usageFrom(adapter.kind, data);
  const price = model.pricing;
  const cost = price?.unit === 'mtok' && Number.isFinite(price.input) && Number.isFinite(price.output)
    ? (usage.inputTokens / 1e6) * price.input + (usage.outputTokens / 1e6) * price.output
    : null;
  return {
    requestId: crypto.randomUUID(),
    model: model.slug,
    name: model.name,
    provider: model.provider.name,
    providerId: model.provider.id,
    adapter: adapter.kind,
    output: textOutput,
    data: parsed,
    usage,
    cost: cost === null ? null : Math.round(cost * 1e6) / 1e6,
    keySource: adapter.key.env,
    context: { estimatedInputTokens, inputBudget: budget, outputReserved: outputReserve, contextWindow, truncated: false }
  };
}
