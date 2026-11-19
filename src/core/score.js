import { ModelPickError } from './errors.js';
import { loadPolicy } from './policy.js';
import { modelAvailability } from './availability.js';
import { connectionFor } from './connect.js';

const UNIT_LABELS = {
  mtok: 'task',
  image: 'image',
  second: 'clip',
  asset: 'asset',
  kchar: '1k chars',
  minute: '10 min',
  song: 'song'
};

const DEFAULT_LATENCY = { image: 10, second: 75, asset: 60, kchar: 5, minute: 30, song: 30 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function qualityConfidenceFor(model) {
  if (model?.tags?.includes('estimated-quality')) {
    return {
      level: 'estimated',
      label: 'estimated prior',
      note: 'The vendor has not published benchmark scores; this is a price/spec-informed prior, not a measured score.'
    };
  }
  const modality = model?.modality;
  if (modality === 'image' || modality === 'video') {
    return {
      level: 'mixed',
      label: 'arena + prior',
      note: 'This modality is informed by a public arena; task weighting and other media dimensions remain expert priors.'
    };
  }
  const media = ['3d', 'audio'].includes(modality);
  return media
    ? {
        level: 'prior',
        label: 'expert prior',
        note: 'Media quality is an expert prior, not an independent output benchmark.'
      }
    : {
        level: 'benchmark',
        label: 'benchmark-backed',
        note: 'Text quality is anchored to public leaderboard scores; it is still not a live output benchmark.'
      };
}

export function qualityFor(model, task) {
  let weighted = 0;
  let total = 0;
  const missing = [];
  for (const [capability, weight] of Object.entries(task.qualityMix ?? {})) {
    let value = model.quality?.[capability];
    if (typeof value !== 'number') {
      missing.push(capability);
      value = typeof model.quality?.overall === 'number' ? Math.max(0, model.quality.overall - 8) : null;
    }
    if (value == null) continue;
    weighted += value * weight;
    total += weight;
  }
  if (!total) return model.quality?.overall ?? 0;
  return round(weighted / total, 2);
}

export function workloadFor(task, overrides = {}) {
  const workload = { ...(task.workload ?? {}), ...overrides };
  if (task.modality === 'text') {
    workload.inputTokens = workload.inputTokens ?? 10000;
    workload.outputTokens = workload.outputTokens ?? 2000;
    workload.cacheHit = clamp(workload.cacheHit ?? 0, 0, 1);
  } else {
    workload.units = workload.units ?? 1;
  }
  return workload;
}

function variantPrice(model, workload) {
  const pricing = model.pricing;
  if (Array.isArray(pricing.variants) && pricing.variants.length) {
    if (workload.variant) {
      const match = pricing.variants.find((variant) => String(variant.label).toLowerCase() === String(workload.variant).toLowerCase());
      if (match) return { amount: match.amount, variant: match.label };
    }
    const preferred = pricing.variants.find((variant) => variant.default) ?? pricing.variants[0];
    return { amount: preferred.amount, variant: preferred.label };
  }
  return { amount: pricing.amount ?? 0, variant: null };
}

/**
 * Expected cost of one attempt, before retries.
 * Text models are priced per million tokens; cache hits use the cached-input rate.
 */
export function unitCostFor(model, task, workload = workloadFor(task)) {
  const pricing = model.pricing;
  if (pricing.unit === 'mtok') {
    const inputPrice = pricing.input ?? 0;
    const outputPrice = pricing.output ?? 0;
    const cachePrice = pricing.cachedInput != null ? pricing.cachedInput : inputPrice;
    const cacheHit = workload.cacheHit ?? 0;
    const effectiveInput = inputPrice * (1 - cacheHit) + cachePrice * cacheHit;
    return round((workload.inputTokens / 1e6) * effectiveInput + (workload.outputTokens / 1e6) * outputPrice, 6);
  }
  const { amount, variant } = variantPrice(model, workload);
  return round(amount * (workload.units ?? 1), 6);
}

/**
 * Retries are the hidden cost of cheap models. A 60-quality model is assumed to
 * need ~1.9 attempts; a 95-quality model ~1.07. This is a model, not a measurement:
 * the UI always shows it and the benchmark evaluates it explicitly.
 */
export function attemptsFor(quality, multiplier) {
  const retry = loadPolicy().retry;
  const factor = multiplier ?? retry.failureMultiplier;
  const failure = clamp(((100 - quality) / 100) * factor, retry.minFailure, retry.maxFailure);
  return round(Math.min(1 / (1 - failure), retry.maxAttempts), 3);
}

export function latencyFor(model, task, workload = workloadFor(task)) {
  if (task.modality === 'text') {
    const tps = model.speed?.outputTps ?? 60;
    const ttft = model.speed?.ttftMs ?? 1200;
    return round((ttft + (workload.outputTokens / tps) * 1000) / 1000, 2);
  }
  return round(model.speed?.latencySec ?? DEFAULT_LATENCY[model.pricing.unit] ?? 30, 1);
}

function constraintReasons(model, task, evaluation, constraints) {
  const reasons = [];
  if (constraints.openWeights && !model.openWeights) reasons.push('not_open_weights');
  if (constraints.excludeProviders?.includes(model.provider.id)) reasons.push('excluded_provider');
  if (constraints.onlyProviders?.length && !constraints.onlyProviders.includes(model.provider.id)) reasons.push('provider_not_allowed');
  if (constraints.maxCost != null && evaluation.costPerTask > constraints.maxCost + 1e-9) reasons.push('over_budget');
  if (constraints.minQuality != null && evaluation.quality < constraints.minQuality) reasons.push('below_quality_floor');
  if (constraints.maxLatencySec != null && evaluation.latencySec > constraints.maxLatencySec) reasons.push('too_slow');
  if (constraints.minContext != null && (model.contextWindow ?? 0) < constraints.minContext) reasons.push('context_too_small');
  if (constraints.minTextInImage != null && (model.quality?.textInImage ?? 0) < constraints.minTextInImage) {
    reasons.push('text_rendering_too_weak');
  }
  if (constraints.availableOnly && !evaluation.availability?.ready) reasons.push('keys_missing');
  if (constraints.requiresRigging && !model.capabilities?.rigging) reasons.push('no_rigging');
  if (constraints.requiresLipSync && !model.capabilities?.lipSync) reasons.push('no_lip_sync');
  if (constraints.requiresCinematic && !model.capabilities?.cinematic) reasons.push('not_cinematic');
  if (constraints.minDurationSec != null && (model.capabilities?.maxDurationSec ?? 0) < constraints.minDurationSec) {
    reasons.push('clip_too_short');
  }
  return reasons;
}

export function evaluateModel(model, task, options = {}) {
  const workload = workloadFor(task, options.workload);
  const quality = qualityFor(model, task);
  const unitCost = unitCostFor(model, task, workload);
  const attempts = attemptsFor(quality, options.retryMultiplier);
  const costPerTask = round(unitCost * attempts, 6);
  const latencySec = latencyFor(model, task, workload);
  const requiredContext = task.modality === 'text' ? (workload.requiredContext ?? workload.inputTokens) : 0;
  const contextFit = requiredContext && model.contextWindow ? clamp(model.contextWindow / requiredContext, 0, 1) : 1;
  const contextOk = !requiredContext || !model.contextWindow || model.contextWindow >= requiredContext * 1.02;
  const availability = modelAvailability(model, options.env ?? process.env);

  const evaluation = {
    slug: model.slug,
    name: model.name,
    provider: model.provider.name,
    providerId: model.provider.id,
    modality: model.modality,
    quality,
    unitCost,
    attempts,
    costPerTask,
    latencySec,
    contextFit: round(contextFit, 3),
    contextOk,
    openWeights: Boolean(model.openWeights),
    tags: model.tags ?? [],
    availability,
    reasons: []
  };

  const constraints = options.constraints ?? {};
  evaluation.reasons = constraintReasons(model, task, evaluation, constraints);
  if (!contextOk) evaluation.reasons.push('context_too_small');
  evaluation.eligible = evaluation.reasons.length === 0;
  return evaluation;
}

function normalizeLog(value, min, max) {
  if (max <= min) return 1;
  return 1 - (Math.log1p(value) - Math.log1p(min)) / (Math.log1p(max) - Math.log1p(min));
}

function tagWhy(model, task) {
  const out = [];
  if (model.openWeights) out.push('open weights');
  if (model.tags?.includes('best-value')) out.push('best value in class');
  if (model.tags?.includes('long-context') && task.id === 'long-context') out.push('built for long context');
  if (model.tags?.includes('vision') && task.id === 'computer-use') out.push('vision + tool use');
  if (task.id.startsWith('code') && typeof model.quality?.coding === 'number') {
    out.push(`coding benchmark ${round(model.quality.coding, 1)}/100`);
  }
  if (task.modality === 'text' && model.openWeights) out.push('self-hostable if you need data residency');
  return out;
}

function setupFor(model) {
  const setup = {
    direct: {
      provider: model.provider.name,
      env: model.provider.env,
      keysUrl: model.provider.keysUrl,
      docsUrl: model.provider.docsUrl,
      apiModel: model.access?.apiModel ?? null,
      apiModelNote: model.access?.apiModelNote ?? null
    }
  };
  if (model.modality === 'text' && model.access?.openrouter) {
    setup.openrouter = {
      env: ['OPENROUTER_API_KEY'],
      model: model.access.openrouter,
      baseUrl: 'https://openrouter.ai/api/v1',
      keysUrl: 'https://openrouter.ai/keys'
    };
  }
  return setup;
}

function present(model, evaluation, labels, why, tradeoffs) {
  const policy = loadPolicy();
  const confidence = policy.confidence.highTags.some((tag) => model.tags?.includes(tag))
    ? 'high'
    : policy.confidence.default;
  return {
    ...evaluation,
    attempts: evaluation.attempts,
    expectedAttempts: evaluation.attempts,
    confidence,
    priceConfidence: model.pricing?.confidence ?? 'verified',
    score: evaluation.score,
    labels,
    why,
    tradeoffs,
    setup: setupFor(model),
    connection: connectionFor(model),
    evidence: model.sources ?? [],
    notes: model.notes ?? null,
    releaseDate: model.releaseDate ?? null
  };
}

/**
 * Rank every compatible model for a task.
 * @param {object} catalog
 * @param {object} task
 * @param {{optimize?: string, constraints?: object, workload?: object, weights?: object, limit?: number}} [options]
 */
export function rankModels(catalog, task, options = {}) {
  const policy = loadPolicy();
  const optimize = options.optimize ?? 'balanced';
  const preset = policy.presets[optimize];
  if (preset === undefined) {
    throw new ModelPickError(`Unknown optimize preset: ${optimize}`, {
      code: 'ERR_INVALID_OPTIMIZE',
      hint: `Use one of: ${Object.keys(policy.presets).join(', ')}`
    });
  }
  const baseWeights = options.weights ?? task.weights;
  const weights = { ...baseWeights, ...(preset ?? {}) };
  const weightSum = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  for (const key of Object.keys(weights)) weights[key] = weights[key] / weightSum;

  const workload = workloadFor(task, options.workload);
  const constraints = options.constraints ?? {};
  const requiredCapabilities = task.requires ?? [];
  const compatible = catalog.models.filter(
    (model) =>
      model.modality === task.modality &&
      requiredCapabilities.every((capability) => Boolean(model.capabilities?.[capability]))
  );
  const evaluated = compatible.map((model) => ({
    model,
    evaluation: evaluateModel(model, task, { workload, constraints, env: options.env, retryMultiplier: options.retryMultiplier })
  }));

  const hardEligible = evaluated.filter(({ evaluation }) => evaluation.eligible);
  let pool = hardEligible;
  let softFloorApplied = false;
  const floor = constraints.minQuality ?? task.defaults?.qualityFloor ?? 0;
  if (constraints.minQuality == null && floor > 0) {
    const above = hardEligible.filter(({ evaluation }) => evaluation.quality >= floor);
    if (above.length >= 2) {
      pool = above;
      softFloorApplied = true;
    }
  }

  if (!pool.length) {
    const bestNearMiss = evaluated
      .filter(({ model }) => model.modality === task.modality)
      .sort((a, b) => a.evaluation.reasons.length - b.evaluation.reasons.length || b.evaluation.quality - a.evaluation.quality)
      .slice(0, 3);
    return {
      task,
      workload,
      weights,
      optimize,
      floor,
      candidates: [],
      rejected: evaluated.filter(({ evaluation }) => !evaluation.eligible),
      nearMisses: bestNearMiss,
      error: 'NO_ELIGIBLE_MODEL',
      message: `No ${task.modality} model satisfies the current constraints.`
    };
  }

  const costs = pool.map(({ evaluation }) => evaluation.costPerTask);
  const latencies = pool.map(({ evaluation }) => evaluation.latencySec);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const minCost = Math.min(...costs);
  const anchorMultiplier =
    optimize === 'cost' ? policy.anchors.costPresetMultiplier : optimize === 'quality' ? policy.anchors.qualityPresetMultiplier : 1;
  const costAnchor =
    constraints.maxCost != null
      ? constraints.maxCost
      : Math.max(
          (task.defaults?.costAnchor ?? minCost) * anchorMultiplier,
          minCost * policy.anchors.minCostMultiple,
          1e-6
        );

  const ranked = pool.map(({ model, evaluation }) => {
    const costScore = Math.max(0, Math.min(1, 1 - Math.log1p(evaluation.costPerTask) / Math.log1p(costAnchor)));
    const speedScore = normalizeLog(evaluation.latencySec, minLatency, maxLatency);
    const qualityScore = evaluation.quality / 100;
    const contextScore = evaluation.contextFit;
    const score =
      (weights.quality ?? 0) * qualityScore +
      (weights.cost ?? 0) * costScore +
      (weights.speed ?? 0) * speedScore +
      (weights.context ?? 0) * contextScore;
    return {
      ...evaluation,
      score: round(score * 100, 1),
      components: {
        quality: round(qualityScore * 100, 1),
        cost: round(costScore * 100, 1),
        speed: round(speedScore * 100, 1),
        context: round(contextScore * 100, 1)
      },
      model
    };
  });

  ranked.sort((a, b) => b.score - a.score || b.quality - a.quality || a.costPerTask - b.costPerTask || a.slug.localeCompare(b.slug));

  const bestQuality = Math.max(...ranked.map((item) => item.quality));
  const cheapest = Math.min(...ranked.map((item) => item.costPerTask));
  const fastest = Math.min(...ranked.map((item) => item.latencySec));
  const tolerance = options.valueTolerance ?? loadPolicy().value?.qualityTolerance ?? 8;
  const leader = ranked[0];
  // Value is the cheapest model within tolerance of the best quality. If the
  // band is empty, fall back to the top recommendation rather than an arbitrary
  // expensive model. Value can cost more than the top pick when it buys real
  // quality; that is the point of a quality-constrained value metric.
  let valuePool = ranked.filter((item) => item.quality >= bestQuality - tolerance);
  if (!valuePool.length) valuePool = [leader];
  const value = valuePool.reduce(
    (best, item) =>
      item.costPerTask < best.costPerTask - 1e-9 ||
      (Math.abs(item.costPerTask - best.costPerTask) <= 1e-9 && item.quality > best.quality)
        ? item
        : best,
    valuePool[0]
  );
  const valueMeta = {
    slug: value.slug,
    name: value.name,
    quality: value.quality,
    costPerTask: value.costPerTask,
    bestQuality,
    qualityGap: round(bestQuality - value.quality, 1),
    costRatio: round(value.costPerTask / Math.max(ranked.find((item) => item.quality === bestQuality)?.costPerTask ?? value.costPerTask, 1e-9), 2),
    tolerance
  };

  const finalists = ranked.map((item, index) => {
    const labels = [];
    if (index === 0) labels.push('best-overall');
    if (item.quality === bestQuality) labels.push('best-quality');
    if (item.costPerTask === cheapest) labels.push('cheapest');
    if (item.latencySec === fastest) labels.push('fastest');
    if (item.slug === value.slug) labels.push('best-value');
    const top = ranked[0];
    const why = [];
    if (index === 0) why.push(`Best weighted fit for ${task.label.toLowerCase()} (${item.score}/100).`);
    if (index > 0) {
      const delta = round(top.quality - item.quality, 1);
      if (item.costPerTask < top.costPerTask && item.costPerTask > 0) {
        const cheaper = round(top.costPerTask / item.costPerTask, 1);
        if (delta > 0) why.push(`${delta} quality points below the top pick, but ${cheaper}× cheaper per solved task.`);
        else why.push(`${cheaper}× cheaper per solved task at equal quality.`);
      }
    }
    if (item.slug === value.slug) {
      if (value.slug === top.slug) {
        why.push(
          valueMeta.qualityGap <= 0.1
            ? `Best value: the highest quality at $${value.costPerTask.toFixed(4)} per solved task.`
            : `Value pick: ${valueMeta.qualityGap} quality points below the best, at ${Math.round(valueMeta.costRatio * 100)}% of the cost.`
        );
      } else {
        why.push(
          `Value pick: ${valueMeta.qualityGap} quality points below the best, at ${Math.round(valueMeta.costRatio * 100)}% of the cost.`
        );
      }
    }
    if (index === 0) {
      why.push(
        `${round(item.quality, 1)} quality at $${item.costPerTask.toFixed(4)} per ${UNIT_LABELS[modelUnit(item.model)] ?? 'task'}; ${item.attempts} expected attempts.`
      );
    }
    if (task.modality === 'text' && item.model.contextWindow) why.push(`${formatContext(item.model.contextWindow)} context window.`);
    why.push(...tagWhy(item.model, task));
    const tradeoffs = [];
    if (item.quality < bestQuality - 12) tradeoffs.push(`Quality is ${round(bestQuality - item.quality, 1)} points below the best pick.`);
    if (item.costPerTask > value.costPerTask * 2 && item.quality <= bestQuality) tradeoffs.push(`Costs ${round(item.costPerTask / Math.max(value.costPerTask, 1e-9), 1)}× the value pick.`);
    if (index > 0 && item.latencySec === fastest && fastest < maxLatency) tradeoffs.push('Fastest option, but not the quality leader.');
    if (item.contextFit < 0.25 && task.modality === 'text') tradeoffs.push('Context headroom is tight for this workload.');
    return present(item.model, item, labels, why, tradeoffs);
  });

  const limit = options.limit ?? 3;
  return {
    task,
    workload,
    weights,
    optimize,
    floor,
    softFloorApplied,
    candidates: finalists.slice(0, limit),
    all: finalists,
    value: valueMeta,
    rejected: evaluated.filter(({ evaluation }) => !evaluation.eligible).map(({ model, evaluation }) => ({
      slug: model.slug,
      name: model.name,
      reasons: evaluation.reasons
    })),
    nearMisses: [],
    error: null,
    message: null
  };
}

function modelUnit(model) {
  return model.pricing?.unit ?? 'mtok';
}

function formatContext(tokens) {
  if (tokens >= 1_000_000) return `${round(tokens / 1_000_000, 2)}M`;
  if (tokens >= 1000) return `${round(tokens / 1000, 0)}K`;
  return String(tokens);
}

export function unitLabel(task) {
  return UNIT_LABELS[task.modality === 'text' ? 'mtok' : task.workload?.unit] ?? 'task';
}

export function costBreakdown(evaluation, task, workload = workloadFor(task)) {
  if (task.modality === 'text') {
    return {
      inputTokens: workload.inputTokens,
      outputTokens: workload.outputTokens,
      cacheHit: workload.cacheHit,
      unitCost: evaluation.unitCost,
      attempts: evaluation.attempts,
      costPerTask: evaluation.costPerTask
    };
  }
  return {
    units: workload.units,
    unit: task.workload?.unit,
    unitCost: round(evaluation.unitCost / Math.max(workload.units ?? 1, 1), 6),
    attempts: evaluation.attempts,
    costPerTask: evaluation.costPerTask
  };
}

export const OPTIMIZE_PRESETS = Object.keys(loadPolicy().presets);
