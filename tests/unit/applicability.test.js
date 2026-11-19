import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../../src/core/catalog.js';
import { rankModels } from '../../src/core/score.js';

const catalog = loadCatalog();
const rankings = new Map(catalog.tasks.map((task) => [task.id, rankModels(catalog, task, { limit: 50 })]));

test('every task has a top-1 and at least two eligible models', () => {
  for (const task of catalog.tasks) {
    const ranked = rankings.get(task.id);
    assert.ok(ranked.candidates.length >= 1, `${task.id} has no candidate`);
    assert.ok(ranked.all.length >= 2, `${task.id} has fewer than two eligible models`);
    assert.ok(ranked.candidates[0].quality >= (task.defaults?.qualityFloor ?? 0), `${task.id} top-1 below floor`);
  }
});

test('every model is eligible for at least one task', () => {
  for (const model of catalog.models) {
    const eligible = catalog.tasks.some((task) => {
      const ranked = rankings.get(task.id);
      return ranked.all.some((candidate) => candidate.slug === model.slug);
    });
    assert.ok(eligible, `${model.slug} is not eligible for any task`);
  }
});

test('top-3 placements cover a meaningful share of the catalog', () => {
  const placed = new Set();
  for (const ranked of rankings.values()) {
    for (const candidate of ranked.candidates.slice(0, 3)) placed.add(candidate.slug);
  }
  assert.ok(placed.size / catalog.models.length >= 0.5, `top-3 coverage ${placed.size}/${catalog.models.length}`);
});

test('every task winner has a source and a setup path', () => {
  for (const task of catalog.tasks) {
    const winner = rankings.get(task.id).candidates[0];
    assert.ok(winner.setup?.direct?.env?.length > 0, `${task.id} winner has no env setup`);
    assert.ok(winner.evidence?.length > 0, `${task.id} winner has no evidence`);
  }
});
