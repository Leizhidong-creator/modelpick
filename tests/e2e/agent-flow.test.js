import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../../src/core/catalog.js';
import { recommend } from '../../src/core/recommend.js';
import { runBench } from '../../bench/run.js';

const catalog = loadCatalog();

test('agent flow: pick 3D -> setup -> plan video', () => {
  const pick = recommend(catalog, { query: 'create a stylized 3D game asset', optimize: 'cost' });
  assert.equal(pick.task.id, '3d-gen');
  assert.ok(pick.recommendation.setup.direct.env.length > 0);
  assert.ok(pick.recommendation.costPerTask < 1);

  const plan = recommend(catalog, { query: 'create a 3D game asset', task: '3d-gen' });
  assert.ok(plan.recommendation.slug);
});

test('recommendation latency stays below 50ms p95 over 200 calls', () => {
  const queries = [
    'refactor this repo',
    'generate a hero image',
    'create a 3D prop',
    'transcribe a podcast',
    'plan a multi-tenant system',
    'write a launch post'
  ];
  const timings = [];
  for (let index = 0; index < 200; index += 1) {
    const query = queries[index % queries.length];
    const start = performance.now();
    recommend(catalog, { query });
    timings.push(performance.now() - start);
  }
  timings.sort((a, b) => a - b);
  const p95 = timings[Math.floor(timings.length * 0.95)];
  assert.ok(p95 < 50, `p95 was ${p95.toFixed(1)}ms`);
});

test('decision benchmark passes all thresholds', async () => {
  const result = await runBench({ quiet: true });
  assert.ok(result.passed, JSON.stringify(result.metrics));
  assert.ok(result.metrics.top1 >= 0.75);
  assert.equal(result.metrics.constraintPass, 1);
  assert.ok(result.metrics.priceStability >= 0.8);
});
