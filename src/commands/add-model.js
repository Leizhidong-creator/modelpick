import fs from 'node:fs';
import { loadCatalog, validateCatalog, findModel } from '../core/catalog.js';
import { paths, readJson, writeJsonAtomic, ensureHome } from '../core/config.js';
import { ModelPickError } from '../core/errors.js';

export function modelTemplate() {
  return {
    slug: 'my-private-model',
    name: 'My Private Model',
    provider: {
      id: 'internal',
      name: 'Internal',
      env: ['INTERNAL_API_KEY'],
      keysUrl: 'https://example.com/keys',
      docsUrl: 'https://example.com/docs',
      envMode: 'any'
    },
    modality: 'text',
    contextWindow: 200000,
    pricing: { unit: 'mtok', input: 1, output: 2, cachedInput: 0.1, currency: 'USD', confidence: 'verified' },
    quality: {
      overall: 85,
      coding: 85,
      codingAgent: 85,
      reasoning: 85,
      longContext: 80,
      writing: 80,
      multimodal: 60,
      cheapWork: 70
    },
    speed: { outputTps: 50, ttftMs: 1000 },
    tags: ['benchmarked'],
    openWeights: false,
    capabilities: { tools: true, structuredOutput: true },
    access: { apiModel: 'my-model-v1' },
    notes: 'Internal endpoint behind a gateway.',
    sources: [{ name: 'internal docs', url: 'https://example.com/docs', readAt: new Date().toISOString().slice(0, 10) }]
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') throw new ModelPickError('Expected a JSON object or { models: [...] }.', { code: 'ERR_INVALID_MODEL' });
  const models = Array.isArray(input.models) ? input.models : [input];
  for (const model of models) {
    if (!model.slug || !model.name || !model.provider || !model.modality || !model.pricing || !model.quality) {
      throw new ModelPickError('A model needs slug, name, provider, modality, pricing, and quality.', {
        code: 'ERR_INVALID_MODEL',
        hint: 'Run `modelpick add-model --example` to see a complete example.'
      });
    }
  }
  return models;
}

export function addModels(file, options = {}) {
  const input = file ? readJson(file) : options.model;
  const models = normalizeInput(input);
  const home = ensureHome();
  const overridesFile = paths().overrides;
  let overrides = { schemaVersion: 1, models: [] };
  if (fs.existsSync(overridesFile)) {
    try {
      overrides = readJson(overridesFile);
    } catch (error) {
      throw new ModelPickError(`Could not read ${overridesFile}: ${error.message}`, { code: 'ERR_OVERRIDES_INVALID' });
    }
  }
  overrides.models = Array.isArray(overrides.models) ? overrides.models : [];

  for (const model of models) {
    const index = overrides.models.findIndex((item) => item.slug === model.slug);
    if (index >= 0) overrides.models[index] = model;
    else overrides.models.push(model);
  }

  // Validate against the bundled catalog before writing. A broken model must not
  // brick the CLI on the next run.
  const catalog = loadCatalog({ overridesFile: null, preferCache: false });
  const merged = {
    ...catalog,
    models: [...catalog.models.filter((model) => !models.some((item) => item.slug === model.slug)), ...models]
  };
  validateCatalog(merged);
  writeJsonAtomic(overridesFile, overrides);
  return { file: overridesFile, models, home };
}

export function removeModel(slug) {
  const overridesFile = paths().overrides;
  if (!fs.existsSync(overridesFile)) {
    throw new ModelPickError(`No overrides file at ${overridesFile}`, { code: 'ERR_NO_OVERRIDES' });
  }
  const overrides = readJson(overridesFile);
  const before = overrides.models?.length ?? 0;
  overrides.models = (overrides.models ?? []).filter((model) => model.slug !== slug);
  if (overrides.models.length === before) {
    throw new ModelPickError(`No custom model named ${slug} in ${overridesFile}`, { code: 'ERR_MODEL_NOT_FOUND' });
  }
  writeJsonAtomic(overridesFile, overrides);
  return { file: overridesFile, slug };
}

export function describeModel(slug) {
  const catalog = loadCatalog({ preferCache: false });
  return findModel(catalog, slug);
}

export async function runAddModel(ctx) {
  if (ctx.flags.example) {
    console.log(JSON.stringify(modelTemplate(), null, 2));
    return;
  }
  if (ctx.options.remove) {
    const result = removeModel(ctx.options.remove);
    if (ctx.json) {
      console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'remove-model', ...result }, null, 2));
      return;
    }
    console.log(`  ${ctx.style.green('Removed')} ${ctx.style.bold(result.slug)} from ${result.file}`);
    return;
  }
  const file = ctx.positionals[0];
  if (!file && !ctx.options.json) {
    throw new ModelPickError('Pass a model JSON file.', {
      code: 'ERR_MISSING_MODEL_FILE',
      hint: 'modelpick add-model ./my-model.json   (or `modelpick add-model --example`)'
    });
  }
  let input;
  if (file) {
    if (!fs.existsSync(file)) {
      throw new ModelPickError(`Model file not found: ${file}`, {
        code: 'ERR_MODEL_FILE_MISSING',
        hint: 'Use `modelpick add-model --example > my-model.json` to start from a valid template.'
      });
    }
    input = readJson(file);
  } else {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  }
  const result = addModels(null, { model: input });
  if (ctx.json) {
    console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'add-model', ...result }, null, 2));
    return;
  }
  console.log(`\n  ${ctx.style.green('Added')} ${result.models.map((model) => ctx.style.bold(model.slug)).join(', ')}`);
  console.log(`  ${ctx.style.dim(result.file)}`);
  console.log(`\n  ${ctx.style.dim('Verify:')} modelpick models --search ${result.models[0].slug}`);
  console.log(`  ${ctx.style.dim('Route:')}  modelpick pick "your task"`);
  console.log(`  ${ctx.style.dim('Remove:')} modelpick add-model --remove ${result.models[0].slug}\n`);
}
