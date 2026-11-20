import { ModelPickError } from './errors.js';

const TIMEOUT_MS = 8000;

const VALIDATORS = {
  OPENAI_API_KEY: {
    url: 'https://api.openai.com/v1/models',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  ANTHROPIC_API_KEY: {
    url: 'https://api.anthropic.com/v1/models',
    headers: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' })
  },
  DEEPSEEK_API_KEY: {
    url: 'https://api.deepseek.com/models',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  OPENROUTER_API_KEY: {
    url: 'https://openrouter.ai/api/v1/key',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  VENICE_API_KEY: {
    url: 'https://api.venice.ai/api/v1/models?type=decision',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  GEMINI_API_KEY: {
    url: (key) => `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
    headers: () => ({})
  }
};

function timeoutSignal() {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(TIMEOUT_MS);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), TIMEOUT_MS).unref?.();
  return controller.signal;
}

/**
 * Validate a provider key without ever logging it. This is a live network call.
 * Unknown providers are accepted as "unverified" rather than rejected.
 */
export async function validateKey(env, value) {
  if (!value) {
    return { status: 'invalid', message: 'No key value.' };
  }
  const validator = VALIDATORS[env];
  if (!validator) {
    return { status: 'unverified', message: 'No validator for this provider; saved without a live check.' };
  }
  try {
    const url = typeof validator.url === 'function' ? validator.url(value) : validator.url;
    const response = await fetch(url, {
      method: 'GET',
      headers: validator.headers(value),
      signal: timeoutSignal()
    });
    if (response.ok) return { status: 'valid', httpStatus: response.status, message: `HTTP ${response.status}` };
    if (response.status === 401 || response.status === 403) {
      return { status: 'invalid', httpStatus: response.status, message: `HTTP ${response.status}: rejected` };
    }
    if (response.status === 429) {
      return { status: 'valid', httpStatus: 429, message: 'HTTP 429: key accepted, rate limited' };
    }
    return { status: 'unverified', httpStatus: response.status, message: `HTTP ${response.status}: not a key verdict` };
  } catch (error) {
    return { status: 'unverified', message: error.name === 'AbortError' ? 'Validation timed out.' : error.message };
  }
}

/** Check the local Ollama daemon. No key involved. */
export async function checkOllama() {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: timeoutSignal() });
    if (!response.ok) return { running: false, models: [], message: `HTTP ${response.status}` };
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models.map((m) => m.name).filter(Boolean) : [];
    return { running: true, models, message: `${models.length} local model(s)` };
  } catch (error) {
    return { running: false, models: [], message: error.name === 'AbortError' ? 'Ollama probe timed out.' : 'Ollama is not running.' };
  }
}

export function assertKnownKeyEnv(env, knownEnvs) {
  if (!knownEnvs.has(env)) {
    throw new ModelPickError(`Unknown key name: ${env}`, {
      code: 'ERR_UNKNOWN_KEY',
      hint: `Known: ${[...knownEnvs].sort().join(', ')}`
    });
  }
}
