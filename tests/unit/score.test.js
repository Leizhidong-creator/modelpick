import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../../src/core/catalog.js';
import { loadPolicy } from '../../src/core/policy.js';
import {
  qualityFor,
  attemptsFor,
  unitCostFor,
  workloadFor,
  evaluateModel,
  rankModels
} from '../../src/core/score.js';

const catalog = loadCatalog();
const coding = catalog.taskById.get('coding-agent');
const image = catalog.taskById.get('image-gen');
const video = catalog.taskById.get('video-gen');
const long = catalog.taskById.get('long-context');

const model = (slug) => catalog.bySlug.get(slug);

test('qualityFor weights capability scores and is bounded', () => {
  const fable = qualityFor(model('claude-fable-5.2'), coding);
  const haiku = qualityFor(model('claude-haiku-5.5'), coding);
  assert.ok(fable > haiku);
  for (const item of catalog.models) {
    const q = qualityFor(item, coding);
    assert.ok(q >= 0 && q <= 100, `${item.slug} quality ${q}`);
  }
});

test('attempts increase monotonically as quality falls', () => {
  assert.ok(attemptsFor(99) < attemptsFor(80));
  assert.ok(attemptsFor(80) < attemptsFor(60));
  assert.equal(attemptsFor(100), 1.02);
  assert.ok(attemptsFor(0) <= 4);
});

test('cache hits reduce text cost', () => {
  const m = model('gemini-4-carbon');
  const noCache = unitCostFor(m, coding, workloadFor(coding, { cacheHit: 0 }));
  const cached = unitCostFor(m, coding, workloadFor(coding, { cacheHit: 0.9 }));
  assert.ok(cached < noCache);
});

test('media unit cost multiplies units and picks the default variant', () => {
  const veo = model('veo-3.1');
  const cost = unitCostFor(veo, video, workloadFor(video, { units: 5 }));
  assert.equal(cost, 2);
  const nb = model('nano-banana-2.1');
  assert.equal(unitCostFor(nb, image, workloadFor(image, { units: 1 })), 0.0336);
});

test('context window is a hard filter for long-context work', () => {
  const gpt = model('gpt-6.2-sol');
  const evaluated = evaluateModel(gpt, long, { workload: { inputTokens: 1200000, outputTokens: 8000, requiredContext: 1200000 } });
  assert.equal(evaluated.contextOk, false);
  assert.ok(evaluated.reasons.includes('context_too_small'));
});

test('open-weight constraint is enforced', () => {
  const ranked = rankModels(catalog, coding, { constraints: { openWeights: true }, limit: 10 });
  assert.ok(ranked.candidates.length > 0);
  assert.ok(ranked.candidates.every((candidate) => candidate.openWeights));
});

test('budget constraint is enforced and reports over-budget rejects', () => {
  const ranked = rankModels(catalog, image, { constraints: { maxCost: 0.045 }, limit: 10 });
  assert.ok(ranked.candidates.length > 0);
  assert.ok(ranked.candidates.every((candidate) => candidate.costPerTask <= 0.045 + 1e-9));
  assert.ok(ranked.rejected.some((item) => item.reasons.includes('over_budget')));
});

test('cost preset never costs more than balanced preset', () => {
  const balanced = rankModels(catalog, coding, { limit: 1 }).candidates[0];
  const cheap = rankModels(catalog, coding, { optimize: 'cost', limit: 1 }).candidates[0];
  assert.ok(cheap.costPerTask <= balanced.costPerTask + 1e-9, `${cheap.slug} ${cheap.costPerTask} vs ${balanced.slug} ${balanced.costPerTask}`);
});

test('quality preset never has lower quality than balanced preset', () => {
  const balanced = rankModels(catalog, coding, { limit: 1 }).candidates[0];
  const best = rankModels(catalog, coding, { optimize: 'quality', limit: 1 }).candidates[0];
  assert.ok(best.quality >= balanced.quality, `${best.slug} ${best.quality} vs ${balanced.slug} ${balanced.quality}`);
});

test('scores stay inside 0-100 and every finalist has a setup block', () => {
  const ranked = rankModels(catalog, coding, { limit: 5 });
  for (const candidate of ranked.candidates) {
    assert.ok(candidate.score >= 0 && candidate.score <= 100);
    assert.ok(candidate.setup.direct.env.length > 0);
    assert.ok(candidate.why.length > 0);
  }
});

test('media tasks exclude models that lack the required output capability', () => {
  const ranked = rankModels(catalog, catalog.taskById.get('music'), { limit: 10 });
  assert.ok(ranked.candidates.length > 0);
  assert.ok(ranked.candidates.every((candidate) => catalog.bySlug.get(candidate.slug).capabilities?.musicGeneration));
});

test('text-in-image requirement filters weak renderers', () => {
  const ranked = rankModels(catalog, image, { constraints: { minTextInImage: 90 }, limit: 10 });
  assert.ok(ranked.candidates.length > 0);
  assert.ok(ranked.candidates.every((candidate) => model(candidate.slug).quality.textInImage >= 90));
});

test('rigging requirement filters models without rigging', () => {
  const ranked = rankModels(catalog, catalog.taskById.get('3d-gen'), { constraints: { requiresRigging: true }, limit: 10 });
  assert.ok(ranked.candidates.length > 0);
  assert.ok(ranked.candidates.every((candidate) => candidate.slug === 'tripo-h3.1' || candidate.slug === 'meshy-7.1'));
});

test('video duration requirement filters short generators', () => {
  const ranked = rankModels(catalog, video, { constraints: { minDurationSec: 30 }, limit: 10 });
  assert.ok(ranked.candidates.length > 0);
  assert.ok(ranked.candidates.every((candidate) => ['kling-4.0', 'seedance-2.5'].includes(candidate.slug)));
});

test('value pick is the cheapest model inside the policy quality band', () => {
  const tolerance = loadPolicy().value.qualityTolerance;
  for (const task of [coding, image, video, catalog.taskById.get('tts')]) {
    const ranked = rankModels(catalog, task, { limit: 50 });
    const best = Math.max(...ranked.all.map((item) => item.quality));
    const band = ranked.all.filter((item) => item.quality >= best - tolerance);
    assert.ok(band.length > 0);
    const cheapest = band.reduce((min, item) => (item.costPerTask < min.costPerTask ? item : min), band[0]);
    assert.equal(ranked.value.slug, cheapest.slug, task.id);
    assert.ok(ranked.value.quality >= best - tolerance, `${task.id} value outside band`);
  }
});

