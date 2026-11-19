import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../../src/core/catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const catalog = loadCatalog();
const TODAY = new Date('2026-11-19T23:59:59Z');

test('every model has a positive price and a source', () => {
  for (const model of catalog.models) {
    const { pricing } = model;
    if (pricing.unit === 'mtok') {
      assert.ok(pricing.input >= 0 && pricing.output >= 0, model.slug);
    } else {
      const amounts = [pricing.amount, ...(pricing.variants ?? []).map((variant) => variant.amount)].filter((value) => value != null);
      assert.ok(amounts.length > 0, `${model.slug} has no amount`);
      assert.ok(amounts.every((value) => value >= 0), `${model.slug} has a negative amount`);
    }
    assert.ok(model.sources.length > 0, `${model.slug} has no source`);
    for (const source of model.sources) {
      assert.match(source.url, /^https:\/\//, `${model.slug} source must be https`);
      assert.match(source.readAt ?? '', /^\d{4}-\d{2}-\d{2}$/, `${model.slug} source needs a read date`);
    }
  }
});

test('release dates are not in the future', () => {
  for (const model of catalog.models) {
    if (!model.releaseDate) continue;
    assert.ok(new Date(model.releaseDate) <= TODAY, `${model.slug} release date ${model.releaseDate} is in the future`);
  }
});

test('every task has at least two compatible models', () => {
  for (const task of catalog.tasks) {
    const compatible = catalog.models.filter(
      (model) =>
        model.modality === task.modality &&
        (task.requires ?? []).every((capability) => Boolean(model.capabilities?.[capability]))
    );
    assert.ok(compatible.length >= 2, `${task.id} only has ${compatible.length} compatible models`);
  }
});

test('every model is reachable by at least one task', () => {
  for (const model of catalog.models) {
    const tasks = catalog.tasks.filter(
      (task) =>
        model.modality === task.modality &&
        (task.requires ?? []).every((capability) => Boolean(model.capabilities?.[capability]))
    );
    assert.ok(tasks.length >= 1, `${model.slug} is not usable by any task`);
  }
});

test('price confidence is one of verified or estimated', () => {
  for (const model of catalog.models) {
    const confidence = model.pricing.confidence ?? 'verified';
    assert.ok(['verified', 'estimated'].includes(confidence), `${model.slug} has confidence ${confidence}`);
  }
});

test('open-weight models are marked consistently', () => {
  for (const model of catalog.models) {
    if (model.openWeights) assert.equal(model.capabilities?.openWeights ?? true, true, `${model.slug}`);
  }
});

test('catalog snapshot is not stale', () => {
  const age = (TODAY - new Date(catalog.updatedAt)) / 86400000;
  assert.ok(age <= 120, `catalog is ${Math.round(age)} days old`);
});

test('catalog checksums match the shipped manifest', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'checksums.json'), 'utf8'));
  for (const [file, expected] of Object.entries(manifest.files)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
    assert.equal(actual, expected, `${file} changed; run node scripts/checksums.js`);
  }
});
