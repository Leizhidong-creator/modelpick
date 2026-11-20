import { ModelPickError } from './errors.js';

export const DEFAULT_OLLAMA_HOST = 'http://127.0.0.1:11434';
export const DEFAULT_OLLAMA_MODEL = 'qwen2.5:0.5b';

export function assertLocalHost(host) {
  let url;
  try {
    url = new URL(host);
  } catch {
    throw new ModelPickError(`Invalid Ollama host: ${host}`, {
      code: 'ERR_INVALID_OLLAMA_HOST',
      hint: 'Use http://127.0.0.1:11434 or http://localhost:11434.'
    });
  }
  const local = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname);
  if (!local || !['http:', 'https:'].includes(url.protocol)) {
    throw new ModelPickError(`Ollama host must be loopback: ${host}`, {
      code: 'ERR_NON_LOCAL_OLLAMA_HOST',
      hint: 'Only 127.0.0.1 / localhost is allowed; this is a local runtime, not a remote proxy.'
    });
  }
  return url.origin;
}

function signal(timeoutMs) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
}

export async function listOllamaModels({ host = DEFAULT_OLLAMA_HOST, timeoutMs = 3000, fetchImpl = fetch } = {}) {
  const base = assertLocalHost(host);
  try {
    const response = await fetchImpl(`${base}/api/tags`, { signal: signal(timeoutMs) });
    if (!response.ok) return { running: false, models: [], message: `HTTP ${response.status}` };
    const data = await response.json();
    return {
      running: true,
      models: Array.isArray(data.models) ? data.models.map((model) => model.name).filter(Boolean) : [],
      message: 'running'
    };
  } catch (error) {
    return { running: false, models: [], message: error.name === 'AbortError' ? 'timed out' : 'not running' };
  }
}

export async function generateLocal({
  prompt,
  model = DEFAULT_OLLAMA_MODEL,
  host = DEFAULT_OLLAMA_HOST,
  timeoutMs = 120000,
  fetchImpl = fetch
} = {}) {
  if (!prompt || !String(prompt).trim()) {
    throw new ModelPickError('A prompt is required.', { code: 'ERR_MISSING_PROMPT' });
  }
  const base = assertLocalHost(host);
  let response;
  try {
    response = await fetchImpl(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt: String(prompt), stream: false }),
      signal: signal(timeoutMs)
    });
  } catch (error) {
    throw new ModelPickError(
      error.name === 'AbortError' ? 'Ollama request timed out.' : `Could not reach Ollama at ${base}.`,
      {
        code: 'ERR_OLLAMA_UNREACHABLE',
        hint: `Is Ollama running? Try \`ollama serve\`, then \`ollama pull ${model}\`.`
      }
    );
  }
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ModelPickError('Ollama returned a non-JSON response.', {
      code: 'ERR_OLLAMA_INVALID',
      hint: text.slice(0, 200)
    });
  }
  if (!response.ok || data.error) {
    const message = data.error || `HTTP ${response.status}`;
    const missing = /not found|pull/i.test(message);
    throw new ModelPickError(`Ollama failed: ${message}`, {
      code: missing ? 'ERR_OLLAMA_MODEL_MISSING' : 'ERR_OLLAMA_FAILED',
      hint: missing ? `Run: ollama pull ${model}` : `Check \`ollama list\` and the model name.`
    });
  }
  return {
    provider: 'ollama',
    model,
    local: true,
    keyless: true,
    output: String(data.response ?? ''),
    usage: {
      inputTokens: Number(data.prompt_eval_count ?? 0),
      outputTokens: Number(data.eval_count ?? 0),
      totalDurationMs: Number(data.total_duration ?? 0) / 1e6
    }
  };
}
