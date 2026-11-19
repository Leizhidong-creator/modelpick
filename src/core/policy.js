import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT } from './catalog.js';
import { readJson, paths } from './config.js';

const DEFAULTS = {
  schemaVersion: 1,
  retry: { failureMultiplier: 1.15, minFailure: 0.02, maxFailure: 0.75, maxAttempts: 4 },
  presets: {
    balanced: null,
    quality: { quality: 0.82, cost: 0.08, speed: 0.02, context: 0.08 },
    cost: { quality: 0.35, cost: 0.65, speed: 0.0, context: 0.0 },
    speed: { quality: 0.3, cost: 0.1, speed: 0.6, context: 0.0 },
    privacy: { quality: 0.55, cost: 0.2, speed: 0.1, context: 0.15 }
  },
  anchors: { costPresetMultiplier: 0.5, qualityPresetMultiplier: 2, minCostMultiple: 2.5 },
  confidence: { highTags: ['frontier', 'benchmarked'], default: 'medium' }
};

let cached = null;

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = value && typeof value === 'object' && !Array.isArray(value) ? deepMerge(out[key] ?? {}, value) : value;
  }
  return out;
}

/**
 * Load the scoring policy from the bundled snapshot, then layer a user override.
 * The engine never hard-codes weights: retry curves, presets, and anchors are data.
 */
export function loadPolicy() {
  if (cached) return cached;
  let policy = DEFAULTS;
  const bundled = path.join(PACKAGE_ROOT, 'catalog', 'policy.json');
  try {
    policy = deepMerge(DEFAULTS, readJson(bundled));
  } catch {
    // A missing policy file is not fatal; defaults keep the CLI working.
  }
  try {
    const overrides = readJson(paths().overrides);
    if (overrides.policy) policy = deepMerge(policy, overrides.policy);
  } catch {
    // No overrides or invalid overrides are handled by the catalog loader.
  }
  validatePolicy(policy);
  cached = policy;
  return policy;
}

export function validatePolicy(policy) {
  const presets = policy.presets ?? {};
  if (!presets.balanced && presets.balanced !== null) throw new Error('policy.presets.balanced must exist');
  for (const [name, weights] of Object.entries(presets)) {
    if (weights == null) continue;
    const sum = Object.values(weights).reduce((total, value) => total + value, 0);
    if (Math.abs(sum - 1) > 0.02) throw new Error(`policy preset ${name} weights must sum to 1 (got ${sum})`);
  }
  const retry = policy.retry;
  if (!(retry.maxFailure > 0 && retry.maxFailure < 1)) throw new Error('policy.retry.maxFailure must be between 0 and 1');
  if (!(retry.failureMultiplier > 0)) throw new Error('policy.retry.failureMultiplier must be positive');
  return policy;
}

/** Clear the cache after a config change (used by tests and `modelpick update`). */
export function resetPolicy() {
  cached = null;
}

export function presetNames() {
  return Object.keys(loadPolicy().presets);
}
