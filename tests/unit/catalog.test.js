import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, validateCatalog, validateTasks, findModel, catalogStats } from '../../src/core/catalog.js';
import { ModelPickError } from '../../src/core/errors.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const catalog = loadCatalog();
const rawCatalog = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'models.json'), 'utf8'));
const rawTasks = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'tasks.json'), 'utf8'));

test('catalog loads with expected shape', () => {
  assert.equal(catalog.schemaVersion, 1);
  assert.ok(catalog.models.length >= 35);
  assert.ok(catalog.tasks.length >= 20);
  const stats = catalogStats(catalog);
  assert.equal(stats.models, catalog.models.length);
  assert.ok(stats.providers >= 10);
});

test('validateCatalog rejects duplicate slugs', () => {
  const copy = rawCatalog();
  copy.models.push({ ...copy.models[0] });
  assert.throws(() => validateCatalog(copy), (error) => error instanceof ModelPickError && /Duplicate model slug/.test(error.message));
});

test('validateCatalog rejects a non-positive text price', () => {
  const copy = rawCatalog();
  const model = copy.models.find((item) => item.pricing.unit === 'mtok');
  model.pricing.input = -1;
  assert.throws(() => validateCatalog(copy), /pricing/);
});

test('validateCatalog rejects quality above 100', () => {
  const copy = rawCatalog();
  copy.models[0].quality.overall = 101;
  assert.throws(() => validateCatalog(copy), /quality/);
});

test('validateTasks rejects weights that do not sum to one', () => {
  const copy = rawTasks();
  copy.tasks[0].weights.quality = 0.99;
  assert.throws(() => validateTasks(copy), /weights must sum to 1/);
});

test('findModel resolves slug, id, name and prefix', () => {
  assert.equal(findModel(catalog, 'claude-fable-5.2').slug, 'claude-fable-5.2');
  assert.equal(findModel(catalog, 'anthropic/claude-fable-5-2').slug, 'claude-fable-5.2');
  assert.equal(findModel(catalog, 'Claude Fable 5.2').slug, 'claude-fable-5.2');
  assert.equal(findModel(catalog, 'nano-banana').slug, 'nano-banana-2.1');
  assert.equal(findModel(catalog, 'does-not-exist'), null);
});

test('all slugs are unique and URL safe', () => {
  const slugs = catalog.models.map((model) => model.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9][a-z0-9.-]*$/);
});
