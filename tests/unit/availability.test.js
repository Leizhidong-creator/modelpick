import test from 'node:test';
import assert from 'node:assert/strict';
import { modelAvailability } from '../../src/core/availability.js';
import { loadCatalog } from '../../src/core/catalog.js';
import { recommend } from '../../src/core/recommend.js';

const catalog = loadCatalog();

test('project keys and OpenRouter are treated as available', () => {
  const carbon = catalog.bySlug.get('gemini-4-carbon');
  assert.equal(modelAvailability(carbon, {}).ready, false);
  assert.equal(modelAvailability(carbon, { GEMINI_API_KEY: 'x' }).ready, true);
  assert.equal(modelAvailability(carbon, { OPENROUTER_API_KEY: 'x' }).ready, true);
  assert.equal(modelAvailability(carbon, { OPENROUTER_API_KEY: 'x' }).mode, 'openrouter');
});

test('a provider that requires two env vars is not ready with one', () => {
  const veo = catalog.bySlug.get('veo-3.1');
  assert.equal(veo.provider.envMode, 'all');
  assert.equal(modelAvailability(veo, { GOOGLE_CLOUD_PROJECT: 'x' }).ready, false);
  assert.equal(modelAvailability(veo, { GOOGLE_CLOUD_PROJECT: 'x', GOOGLE_APPLICATION_CREDENTIALS: 'y' }).ready, true);
});

test('recommend exposes the best model the user can actually run', () => {
  const result = recommend(catalog, {
    query: 'refactor this repo',
    env: { OPENAI_API_KEY: 'sk-test' }
  });
  assert.ok(result.recommendation);
  assert.equal(result.availability.bestAvailable.provider, 'OpenAI');
  assert.equal(result.picks.available.provider, 'OpenAI');
  assert.equal(result.keyStatus.anyKeys, true);
  assert.ok(result.availability.fallbacks.every((item) => item.availability.ready));
});

test('availableOnly filters out models without a key', () => {
  const result = recommend(catalog, {
    query: 'refactor this repo',
    availableOnly: true,
    env: { ANTHROPIC_API_KEY: 'sk-test' }
  });
  assert.ok(result.recommendation);
  assert.equal(result.recommendation.provider, 'Anthropic');
  assert.equal(result.recommendation.availability.mode, 'direct');
});

test('no keys is not an error', () => {
  const result = recommend(catalog, { query: 'make a 3D game asset', env: {} });
  assert.ok(result.recommendation);
  assert.equal(result.availability.recommendedReady, false);
  assert.equal(result.availability.bestAvailable, null);
  assert.ok(result.availability.note.includes('No provider keys'));
});
