import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalog } from '../../src/core/catalog.js';
import { loadPolicy, resetPolicy } from '../../src/core/policy.js';
import { recommend } from '../../src/core/recommend.js';
import { tempDir, ROOT } from '../helpers.js';

test('policy is loaded from data, not hard-coded', () => {
  const policy = loadPolicy();
  assert.ok(policy.presets.quality);
  assert.equal(policy.retry.failureMultiplier, 1.15);
  assert.ok(policy.anchors.minCostMultiple >= 1);
});

test('user policy override changes routing without code changes', () => {
  const home = tempDir('modelpick-policy-');
  const overridesFile = path.join(home, 'overrides.json');
  fs.writeFileSync(
    overridesFile,
    JSON.stringify({
      policy: { presets: { cost: { quality: 1, cost: 0, speed: 0, context: 0 } } }
    })
  );
  const previous = process.env.MODELPICK_HOME;
  process.env.MODELPICK_HOME = home;
  resetPolicy();
  try {
    const catalog = loadCatalog({ preferCache: false });
    const result = recommend(catalog, { query: 'refactor a repo', optimize: 'cost' });
    const qualityLeader = recommend(catalog, { query: 'refactor a repo', optimize: 'quality' }).recommendation;
    assert.ok(result.recommendation.quality >= qualityLeader.quality - 0.1, 'a quality-only cost preset should match the quality leader');
  } finally {
    process.env.MODELPICK_HOME = previous;
    resetPolicy();
  }
});

test('a custom model can be added through overrides.json', () => {
  const home = tempDir('modelpick-custom-');
  const overridesFile = path.join(home, 'overrides.json');
  fs.writeFileSync(
    overridesFile,
    JSON.stringify({
      models: [
        {
          slug: 'my-private-model',
          name: 'My Private Model',
          provider: { id: 'internal', name: 'Internal', env: ['INTERNAL_KEY'], keysUrl: 'https://example.com', docsUrl: 'https://example.com' },
          modality: 'text',
          contextWindow: 200000,
          pricing: { unit: 'mtok', input: 1, output: 2, currency: 'USD' },
          quality: { overall: 88, coding: 88, codingAgent: 88, reasoning: 88, longContext: 80, writing: 80, multimodal: 60, cheapWork: 70 },
          speed: { outputTps: 50, ttftMs: 1000 },
          tags: ['benchmarked'],
          openWeights: false,
          sources: [{ name: 'internal', url: 'https://example.com', readAt: '2026-11-19' }]
        }
      ]
    })
  );
  const catalog = loadCatalog({ overridesFile, preferCache: false, tasksFile: path.join(ROOT, 'catalog/tasks.json') });
  assert.ok(catalog.bySlug.get('my-private-model'));
});

test('catalog can be validated from a different directory', () => {
  const cwd = process.cwd();
  process.chdir(tempDir());
  try {
    const catalog = loadCatalog({ preferCache: false, tasksFile: path.join(ROOT, 'catalog/tasks.json') });
    assert.ok(catalog.models.length >= 40);
  } finally {
    process.chdir(cwd);
  }
});
