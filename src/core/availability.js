/**
 * Turn the catalog's provider metadata into a practical "can I run this now?"
 * answer. Direct keys win; OpenRouter is a fallback for text models; media models
 * use their provider key (fal, Tripo, etc.).
 *
 * Values are never read — only presence is checked.
 */
import { storedEnvNames } from './secrets.js';

export function modelAvailability(model, env = process.env, stored = storedEnvNames()) {
  const providerEnv = model.provider?.env ?? [];
  const envMode = model.provider?.envMode === 'all' ? 'all' : 'any';
  const present = providerEnv.filter((name) => Boolean(env[name]) || stored.has(name));
  const directReady =
    providerEnv.length > 0 && (envMode === 'all' ? present.length === providerEnv.length : present.length > 0);
  const openrouterReady =
    model.modality === 'text' && Boolean(model.access?.openrouter) && (Boolean(env.OPENROUTER_API_KEY) || stored.has('OPENROUTER_API_KEY'));

  if (directReady) {
    return {
      ready: true,
      via: present,
      missing: providerEnv.filter((name) => !present.includes(name)),
      mode: 'direct'
    };
  }
  if (openrouterReady) {
    return { ready: true, via: ['OPENROUTER_API_KEY'], missing: [], mode: 'openrouter' };
  }
  return {
    ready: false,
    via: [],
    missing: providerEnv,
    mode: 'none'
  };
}

export function anyProviderKey(env = process.env) {
  return Object.keys(env).some(
    (name) => /_API_KEY$|_TOKEN$|_SECRET_ID$|_SECRET_KEY$|GOOGLE_APPLICATION_CREDENTIALS$/.test(name) && Boolean(env[name])
  );
}

/** A compact, token-efficient availability block for MCP/JSON consumers. */
export function compactAvailability(availability) {
  if (!availability) return null;
  return {
    ready: availability.ready,
    via: availability.via,
    missing: availability.missing,
    mode: availability.mode
  };
}
