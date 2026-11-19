import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../../src/core/catalog.js';
import { rankModels } from '../../src/core/score.js';

const catalog = loadCatalog();

test('every task has at least two eligible models and finite costs', () => {
  assert.equal(catalog.tasks.length, 20);
  for (const task of catalog.tasks) {
    const ranked = rankModels(catalog, task, { limit: 100 });
    assert.ok(ranked.candidates.length >= 2, `${task.id} has only ${ranked.candidates.length}`);
    for (const candidate of ranked.candidates) {
      assert.ok(Number.isFinite(candidate.costPerTask), `${task.id}/${candidate.slug} cost`);
      assert.ok(candidate.costPerTask >= 0, `${task.id}/${candidate.slug} negative cost`);
      assert.ok(candidate.quality >= 0 && candidate.quality <= 100, `${task.id}/${candidate.slug} quality`);
      assert.ok(candidate.expectedAttempts >= 1 && candidate.expectedAttempts <= 4, `${task.id}/${candidate.slug} attempts`);
    }
  }
});

test('every catalog model is eligible for at least one task', () => {
  const eligible = new Map(catalog.models.map((model) => [model.slug, 0]));
  for (const task of catalog.tasks) {
    for (const candidate of rankModels(catalog, task, { limit: 100 }).candidates) {
      eligible.set(candidate.slug, (eligible.get(candidate.slug) ?? 0) + 1);
    }
  }
  const dead = [...eligible].filter(([, count]) => count === 0).map(([slug]) => slug);
  assert.deepEqual(dead, [], `models with no eligible task: ${dead.join(', ')}`);
});
