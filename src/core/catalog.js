import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModelPickError } from './errors.js';
import { paths, readJson } from './config.js';

export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CAPABILITIES = [
  'overall', 'coding', 'codingAgent', 'reasoning', 'longContext', 'writing', 'multimodal',
  'cheapWork', 'imageGen', 'imageEdit', 'textInImage', 'videoGen', 'threeD', 'tts', 'stt', 'music'
];
export const PRICE_UNITS = ['mtok', 'image', 'second', 'asset', 'kchar', 'minute', 'song'];
export const MODALITIES = ['text', 'image', 'video', '3d', 'audio'];

function fail(message, details) {
  throw new ModelPickError(message, {
    code: 'ERR_INVALID_CATALOG',
    hint: 'Run `npm run validate` and fix catalog/models.json or catalog/tasks.json.',
    details
  });
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function validateCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') fail('Catalog must be an object.');
  if (catalog.schemaVersion !== 1) fail(`Unsupported catalog schemaVersion: ${catalog.schemaVersion}`);
  if (!Array.isArray(catalog.models) || catalog.models.length === 0) fail('Catalog has no models.');
  const slugs = new Set();
  const ids = new Set();

  catalog.models.forEach((model, index) => {
    const where = `models[${index}]`;
    if (!isNonEmptyString(model.slug)) fail(`${where}.slug is required.`);
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(model.slug)) fail(`${where}.slug must be lowercase kebab-case: ${model.slug}`);
    if (slugs.has(model.slug)) fail(`Duplicate model slug: ${model.slug}`);
    slugs.add(model.slug);
    if (model.id) {
      if (ids.has(model.id)) fail(`Duplicate model id: ${model.id}`);
      ids.add(model.id);
    }
    if (!isNonEmptyString(model.name)) fail(`${where}.name is required.`);
    if (!isNonEmptyString(model.provider?.name)) fail(`${where}.provider.name is required.`);
    if (!Array.isArray(model.provider?.env)) fail(`${where}.provider.env must be an array.`);
    if (!MODALITIES.includes(model.modality)) fail(`${where}.modality is invalid: ${model.modality}`);
    if (model.contextWindow != null && (!isFiniteNumber(model.contextWindow) || model.contextWindow <= 0)) {
      fail(`${where}.contextWindow must be a positive number.`);
    }
    if (!model.pricing || !PRICE_UNITS.includes(model.pricing.unit)) {
      fail(`${where}.pricing.unit must be one of ${PRICE_UNITS.join(', ')}.`);
    }
    if (model.pricing.unit === 'mtok') {
      if (!isFiniteNumber(model.pricing.input) || !isFiniteNumber(model.pricing.output)) {
        fail(`${where}.pricing needs numeric input and output for mtok.`);
      }
      if (model.pricing.input < 0 || model.pricing.output < 0) {
        fail(`${where}.pricing input and output must be non-negative.`);
      }
    } else if (!isFiniteNumber(model.pricing.amount) && !Array.isArray(model.pricing.variants)) {
      fail(`${where}.pricing needs amount or variants for unit ${model.pricing.unit}.`);
    }
    if (!model.quality || !isFiniteNumber(model.quality.overall)) {
      fail(`${where}.quality.overall is required.`);
    }
    for (const [key, value] of Object.entries(model.quality)) {
      if (!CAPABILITIES.includes(key)) fail(`${where}.quality has unknown capability: ${key}`);
      if (!isFiniteNumber(value) || value < 0 || value > 100) fail(`${where}.quality.${key} must be 0-100.`);
    }
  });

  return catalog;
}

export function validateTasks(tasks) {
  if (!tasks || !Array.isArray(tasks.tasks) || tasks.tasks.length === 0) fail('No tasks found.');
  const ids = new Set();
  tasks.tasks.forEach((task, index) => {
    const where = `tasks[${index}]`;
    if (!isNonEmptyString(task.id)) fail(`${where}.id is required.`);
    if (ids.has(task.id)) fail(`Duplicate task id: ${task.id}`);
    ids.add(task.id);
    if (!isNonEmptyString(task.label)) fail(`${where}.label is required.`);
    if (!MODALITIES.includes(task.modality)) fail(`${where}.modality is invalid: ${task.modality}`);
    if (!Array.isArray(task.keywords) || task.keywords.length === 0) fail(`${where}.keywords must be a non-empty array.`);
    task.keywords.forEach((pair, i) => {
      if (!Array.isArray(pair) || pair.length !== 2 || !isNonEmptyString(pair[0]) || !isFiniteNumber(pair[1])) {
        fail(`${where}.keywords[${i}] must be [phrase, weight].`);
      }
    });
    const weightSum = Object.values(task.weights ?? {}).reduce((sum, value) => sum + value, 0);
    if (Math.abs(weightSum - 1) > 0.011) fail(`${where}.weights must sum to 1 (got ${round(weightSum, 3)}).`);
    const mixSum = Object.values(task.qualityMix ?? {}).reduce((sum, value) => sum + value, 0);
    if (Math.abs(mixSum - 1) > 0.011) fail(`${where}.qualityMix must sum to 1 (got ${round(mixSum, 3)}).`);
    for (const key of Object.keys(task.qualityMix ?? {})) {
      if (!CAPABILITIES.includes(key)) fail(`${where}.qualityMix has unknown capability: ${key}`);
    }
  });
  return tasks;
}

function mergeOverride(models, overrides) {
  if (!overrides || !Array.isArray(overrides.models)) return models;
  const bySlug = new Map(models.map((model) => [model.slug, model]));
  for (const override of overrides.models) {
    if (!override?.slug) continue;
    const current = bySlug.get(override.slug);
    if (!current) {
      // A full custom model can be added without touching source code.
      if (override.name && override.provider && override.modality && override.pricing && override.quality) {
        bySlug.set(override.slug, override);
      }
      continue;
    }
    bySlug.set(override.slug, {
      ...current,
      ...override,
      pricing: { ...current.pricing, ...(override.pricing ?? {}) },
      quality: { ...current.quality, ...(override.quality ?? {}) },
      speed: { ...(current.speed ?? {}), ...(override.speed ?? {}) },
      provider: { ...current.provider, ...(override.provider ?? {}) },
      access: { ...(current.access ?? {}), ...(override.access ?? {}) }
    });
  }
  const excluded = new Set(overrides.exclude ?? []);
  return [...bySlug.values()].filter((model) => !excluded.has(model.slug));
}

/**
 * Load the bundled catalog, optionally layering a cached update and local overrides.
 * @param {{catalogFile?: string, tasksFile?: string, overridesFile?: string, cacheFile?: string|null, preferCache?: boolean}} [options]
 */
export function loadCatalog(options = {}) {
  const catalogFile = options.catalogFile ?? path.join(PACKAGE_ROOT, 'catalog', 'models.json');
  const tasksFile = options.tasksFile ?? path.join(PACKAGE_ROOT, 'catalog', 'tasks.json');
  const overridesFile = options.overridesFile ?? paths().overrides;

  let raw;
  let source = catalogFile;
  const cacheFile = options.cacheFile === null ? null : (options.cacheFile ?? paths().cache);

  if (options.preferCache !== false && cacheFile && fs.existsSync(cacheFile)) {
    try {
      const cached = readJson(cacheFile);
      const bundled = readJson(catalogFile);
      if (String(cached.catalogVersion ?? '') > String(bundled.catalogVersion ?? '')) {
        raw = cached;
        source = cacheFile;
      }
    } catch {
      // A corrupt cache is never fatal; fall back to the bundled snapshot.
    }
  }

  if (!raw) {
    try {
      raw = readJson(catalogFile);
    } catch (error) {
      throw new ModelPickError(`Could not read catalog: ${catalogFile}`, {
        code: 'ERR_CATALOG_MISSING',
        hint: error.message
      });
    }
  }

  let taskFile;
  try {
    taskFile = readJson(tasksFile);
  } catch (error) {
    throw new ModelPickError(`Could not read tasks: ${tasksFile}`, {
      code: 'ERR_TASKS_MISSING',
      hint: error.message
    });
  }

  if (fs.existsSync(overridesFile)) {
    try {
      raw = { ...raw, models: mergeOverride(raw.models, readJson(overridesFile)) };
    } catch (error) {
      throw new ModelPickError(`Could not read overrides: ${overridesFile}`, {
        code: 'ERR_OVERRIDES_INVALID',
        hint: error.message
      });
    }
  }

  validateCatalog(raw);
  validateTasks(taskFile);

  const models = raw.models.map((model) => ({
    ...model,
    pricing: { ...model.pricing, currency: model.pricing.currency ?? 'USD' }
  }));
  const bySlug = new Map(models.map((model) => [model.slug, model]));
  const byId = new Map(models.filter((model) => model.id).map((model) => [model.id, model]));
  const byName = new Map(models.map((model) => [model.name.toLowerCase(), model]));
  const tasks = taskFile.tasks;
  const taskById = new Map(tasks.map((task) => [task.id, task]));

  return {
    schemaVersion: raw.schemaVersion,
    catalogVersion: raw.catalogVersion,
    updatedAt: raw.updatedAt,
    disclaimer: raw.disclaimer,
    source,
    models,
    tasks,
    bySlug,
    byId,
    byName,
    taskById
  };
}

/** Resolve a model by slug, canonical id, name, or unambiguous prefix. */
export function findModel(catalog, query) {
  if (!query) return null;
  const cleaned = String(query).trim().toLowerCase();
  return (
    catalog.bySlug.get(cleaned) ??
    catalog.byId.get(cleaned) ??
    catalog.byName.get(cleaned) ??
    catalog.models.find((model) => model.slug.startsWith(cleaned)) ??
    null
  );
}

export function catalogStats(catalog) {
  const byModality = {};
  const byProvider = {};
  for (const model of catalog.models) {
    byModality[model.modality] = (byModality[model.modality] ?? 0) + 1;
    byProvider[model.provider.name] = (byProvider[model.provider.name] ?? 0) + 1;
  }
  return {
    models: catalog.models.length,
    tasks: catalog.tasks.length,
    providers: Object.keys(byProvider).length,
    byModality,
    byProvider,
    catalogVersion: catalog.catalogVersion,
    updatedAt: catalog.updatedAt
  };
}
