import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRuns } from '../../src/core/evaluate.js';
import { loadCatalog } from '../../src/core/catalog.js';

const catalog = loadCatalog();
const input = {
  task: '3d-gen',
  runs: [
    { model: 'tripo-h3.1', passed: true, cost: 0.2, attempts: 1, quality: 94 },
    { model: 'tripo-h3.1', passed: true, cost: 0.2, attempts: 1, quality: 92 },
    { model: 'tripo-h3.1', passed: true, cost: 0.2, attempts: 2, quality: 95 },
    { model: 'tripo-h3.1', passed: true, cost: 0.2, attempts: 1, quality: 93 },
    { model: 'tripo-h3.1', passed: false, cost: 0.2, attempts: 1 },
    { model: 'meshy-7.1', passed: true, cost: 1.2, attempts: 1, quality: 91 },
    { model: 'meshy-7.1', passed: false, cost: 1.2, attempts: 1 },
    { model: 'meshy-7.1', passed: false, cost: 1.2, attempts: 1 }
  ]
};

test('evaluates pass rate, Wilson interval, attempts, and cost per solved', () => {
  const result = evaluateRuns(input, catalog, { minSamples: 4 });
  const tripo = result.models.find((model) => model.slug === 'tripo-h3.1');
  assert.equal(tripo.runs, 5);
  assert.equal(tripo.solved, 4);
  assert.equal(tripo.passRate, 0.8);
  assert.ok(tripo.passRateLow > 0.3 && tripo.passRateLow < 0.8);
  assert.ok(tripo.passRateHigh > 0.8 && tripo.passRateHigh <= 1);
  assert.equal(tripo.meanAttempts, 1.2);
  assert.equal(tripo.costPerSolved, 0.25);
  assert.equal(tripo.meanQuality, 93.5);
  assert.equal(tripo.enoughSamples, true);
});

test('omits cost per solved when any run lacks a cost', () => {
  const result = evaluateRuns(
    {
      task: '3d-gen',
      runs: [
        { model: 'tripo-h3.1', passed: true, cost: 0.2 },
        { model: 'tripo-h3.1', passed: true }
      ]
    },
    catalog
  );
  const tripo = result.models[0];
  assert.equal(tripo.costCoverage, 'partial');
  assert.equal(tripo.costPerSolved, null);
  assert.equal(tripo.totalCost, null);
});

test('flags small samples and sorts by cost per solved', () => {
  const result = evaluateRuns(input, catalog, { minSamples: 5 });
  assert.equal(result.models[0].slug, 'tripo-h3.1');
  assert.equal(result.models.find((model) => model.slug === 'meshy-7.1').enoughSamples, false);
});

test('rejects non-boolean, negative cost, and out-of-range quality', () => {
  assert.throws(() => evaluateRuns({ task: '3d-gen', runs: [{ model: 'tripo-h3.1', passed: 'yes' }] }, catalog), /passed/);
  assert.throws(() => evaluateRuns({ task: '3d-gen', runs: [{ model: 'tripo-h3.1', passed: true, cost: -1 }] }, catalog), /Cost/);
  assert.throws(() => evaluateRuns({ task: '3d-gen', runs: [{ model: 'tripo-h3.1', passed: true, quality: 101 }] }, catalog), /Quality/);
});

test('rejects an unknown task and malformed input', () => {
  assert.throws(() => evaluateRuns({ task: 'nope', runs: [] }, catalog), /Unknown task/);
  assert.throws(() => evaluateRuns({}, catalog), /needs a task/);
  assert.throws(() => evaluateRuns({ task: '3d-gen' }, catalog), /runs array/);
});
