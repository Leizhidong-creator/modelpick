import { ModelPickError } from './errors.js';
import { rankModels, qualityFor, unitCostFor, attemptsFor, workloadFor } from './score.js';
import { parseIntent, resolveTask, detectTask } from './tasks.js';
import { anyProviderKey, modelAvailability } from './availability.js';
import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT } from './catalog.js';

const SCHEMA_VERSION = '1.0';

function planCatalog() {
  try {
    return JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'catalog', 'plans.json'), 'utf8'));
  } catch {
    return { plans: [] };
  }
}

function normalized(text) {
  return String(text ?? '').toLowerCase();
}

function scorePlan(text, plan) {
  let score = 0;
  for (const [phrase, weight] of plan.keywords ?? []) {
    if (normalized(text).includes(normalized(phrase))) score += weight;
  }
  return score;
}

function freshness(catalog) {
  const updated = Date.parse(catalog.updatedAt ?? '');
  if (!Number.isFinite(updated)) return { ageDays: null, stale: false };
  const ageDays = Math.floor((Date.now() - updated) / 86400000);
  return { ageDays: Math.max(0, ageDays), stale: ageDays > 120 };
}

/**
 * Pull hard requirements out of the request. These are capability filters, not
 * preferences: asking for a headline in the image must exclude models that cannot
 * render text, and asking for a 30s film must exclude 8s models.
 */
export function detectRequirements(query, task) {
  const text = String(query ?? '').toLowerCase();
  const requirements = {};
  if (task.modality === 'image' && /headline|text in (the )?image|typography|calligraphy|title in|logo|poster with|wordmark/.test(text)) {
    requirements.minTextInImage = 90;
  }
  if (task.modality === '3d' && /\brig(ged|ging)?\b|skeleton|animation[ -]ready/.test(text)) {
    requirements.requiresRigging = true;
  }
  if (task.modality === 'video') {
    if (/lip[ -]?sync|dialogue|speaking|talking/.test(text)) requirements.requiresLipSync = true;
    if (/cinematic|brand film|commercial|film look/.test(text)) requirements.requiresCinematic = true;
    const durations = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:-|\s)?(?:second|seconds|sec|s)\b/g)].map((match) => Number(match[1]));
    if (durations.length) {
      const longest = Math.max(...durations);
      if (longest >= 5) requirements.minDurationSec = longest;
    }
  }
  return requirements;
}

function baseline(catalog, task, options) {
  const constraints = { ...(options.constraints ?? {}) };
  delete constraints.maxCost;
  delete constraints.minQuality;
  const quality = rankModels(catalog, task, {
    ...options,
    optimize: 'balanced',
    weights: { quality: 1, cost: 0, speed: 0, context: 0 },
    constraints
  });
  return quality.candidates[0] ?? null;
}

function compact(candidate, task) {
  if (!candidate) return null;
  return {
    slug: candidate.slug,
    name: candidate.name,
    provider: candidate.provider,
    quality: candidate.quality,
    costPerTask: candidate.costPerTask,
    unitCost: candidate.unitCost,
    attempts: candidate.attempts,
    expectedAttempts: candidate.attempts,
    latencySec: candidate.latencySec,
    score: candidate.score,
    labels: candidate.labels,
    priceConfidence: candidate.priceConfidence,
    availability: candidate.availability,
    why: candidate.why,
    tradeoffs: candidate.tradeoffs,
    setup: candidate.setup,
    connection: candidate.connection,
    openWeights: candidate.openWeights,
    contextWindow: candidate.model?.contextWindow ?? null,
    modalities: candidate.model?.modalities ?? null,
    evidence: candidate.evidence
  };
}

/**
 * The single decision entry point used by the CLI, MCP server, and API.
 */
export function recommend(catalog, input = {}) {
  const query = input.query ?? '';
  const intent = parseIntent(query);
  const { task, detection } = resolveTask(catalog, { task: input.task, query });

  const optimize = input.optimize ?? intent.optimize ?? 'balanced';
  const requirements = detectRequirements(query, task);
  const constraints = {
    maxCost: input.maxCost ?? intent.maxCost,
    minQuality: input.minQuality,
    openWeights: input.openWeights ?? intent.openWeights ?? false,
    excludeProviders: input.excludeProviders ?? intent.excludeProviders ?? [],
    onlyProviders: input.onlyProviders ?? [],
    maxLatencySec: input.maxLatencySec,
    minContext: input.contextTokens ?? undefined,
    availableOnly: Boolean(input.availableOnly),
    ...requirements
  };

  const workload = input.workload ?? (input.contextTokens ? { inputTokens: input.contextTokens, requiredContext: input.contextTokens } : undefined);
  const ranked = rankModels(catalog, task, {
    optimize,
    constraints,
    workload,
    env: input.env,
    limit: input.topK ?? 3
  });

  const fresh = freshness(catalog);
  const keyStatus = {
    anyKeys: anyProviderKey(input.env ?? process.env),
    checked: true
  };
  const response = {
    schemaVersion: SCHEMA_VERSION,
    kind: 'recommendation',
    query: query || null,
    task: {
      id: task.id,
      label: task.label,
      modality: task.modality,
      blurb: task.blurb,
      confidence: detection.confidence,
      matched: detection.matched ?? []
    },
    catalog: {
      version: catalog.catalogVersion,
      updatedAt: catalog.updatedAt,
      ageDays: fresh.ageDays,
      stale: fresh.stale,
      disclaimer: catalog.disclaimer
    },
    assumptions: {
      workload: ranked.workload,
      optimize,
      requirements,
      availableOnly: Boolean(input.availableOnly),
      valueTolerance: ranked.value?.tolerance ?? null,
      retryModel: 'attempts = 1 / (1 - 1.15 × (100 - quality) / 100), capped at 4.0',
      priceBasis: task.modality === 'text' ? 'USD per million tokens, cache-aware' : `USD per ${task.workload?.unit ?? 'unit'}`
    },
    keyStatus,
    availability: {
      recommendedReady: null,
      bestAvailable: null,
      fallbacks: [],
      note: null
    },
    recommendation: null,
    alternatives: [],
    picks: { quality: null, value: null, fastest: null, cheapest: null },
    value: ranked.value ?? null,
    rejected: ranked.rejected,
    error: ranked.error,
    message: ranked.message
  };

  if (ranked.error) {
    response.nearMisses = ranked.nearMisses.map(({ model, evaluation }) => ({
      slug: model.slug,
      name: model.name,
      quality: evaluation.quality,
      reasons: evaluation.reasons
    }));
    return response;
  }

  const base = baseline(catalog, task, { workload, constraints: { ...constraints, maxCost: undefined, minQuality: undefined } });
  response.recommendation = compact(ranked.candidates[0], task);
  response.alternatives = ranked.candidates.slice(1).map((candidate) => compact(candidate, task));
  const available = ranked.all.find((candidate) => candidate.availability?.ready) ?? null;
  const top = ranked.candidates[0];
  response.availability = {
    recommendedReady: Boolean(top?.availability?.ready),
    bestAvailable: available ? compact(available, task) : null,
    fallbacks: ranked.all
      .filter((candidate) => candidate.availability?.ready && candidate.slug !== top?.slug)
      .slice(0, 3)
      .map((candidate) => compact(candidate, task)),
    note: top?.availability?.ready
      ? `Key detected: ${top.availability.via.join(', ')}`
      : keyStatus.anyKeys
        ? `Top pick needs ${top?.availability?.missing?.join(', ') || 'a provider key'}; the best model you can run now is ${available?.name ?? 'not in the catalog'}.`
        : 'No provider keys detected. Recommendations work offline; add a key when you are ready to call a model.'
  };
  response.picks = {
    quality: compact(ranked.all.find((candidate) => candidate.labels.includes('best-quality')), task),
    value: compact(ranked.all.find((candidate) => candidate.labels.includes('best-value')), task),
    fastest: compact(ranked.all.find((candidate) => candidate.labels.includes('fastest')), task),
    cheapest: compact(ranked.all.find((candidate) => candidate.labels.includes('cheapest')), task),
    available: available ? compact(available, task) : null
  };
  response.value = ranked.value ?? null;
  response.savings = base && response.recommendation
    ? {
        baseline: base.slug,
        baselineCostPerTask: base.costPerTask,
        chosenCostPerTask: response.recommendation.costPerTask,
        ratio: base.costPerTask > 0 ? Math.round((base.costPerTask / Math.max(response.recommendation.costPerTask, 1e-9)) * 10) / 10 : null,
        qualityDelta: Math.round((response.recommendation.quality - base.quality) * 10) / 10
      }
    : null;
  response.assumptions.costPerTask = response.recommendation.costPerTask;
  return response;
}

export function compare(catalog, slugs, input = {}) {
  const { task } = resolveTask(catalog, { task: input.task, query: input.query ?? slugs.join(' ') });
  const workload = workloadFor(task, input.workload);
  const rows = slugs.map((slug) => {
    const model = catalog.bySlug.get(slug) ?? catalog.models.find((item) => item.name.toLowerCase() === slug.toLowerCase());
    if (!model) throw new ModelPickError(`Unknown model: ${slug}`, { code: 'ERR_UNKNOWN_MODEL', hint: 'Run `modelpick models` to list models.' });
    if (model.modality !== task.modality) {
      throw new ModelPickError(`${model.name} is a ${model.modality} model and cannot be compared on ${task.label}.`, {
        code: 'ERR_MODALITY_MISMATCH'
      });
    }
    const quality = qualityFor(model, task);
    const unitCost = unitCostFor(model, task, workload);
    const attempts = attemptsFor(quality);
    return {
      slug: model.slug,
      name: model.name,
      provider: model.provider.name,
      quality,
      unitCost,
      attempts,
      costPerTask: Math.round(unitCost * attempts * 1e6) / 1e6,
      contextWindow: model.contextWindow,
      openWeights: model.openWeights,
      availability: modelAvailability(model, input.env ?? process.env),
      pricing: model.pricing,
      setup: model.provider
    };
  });
  return { schemaVersion: SCHEMA_VERSION, kind: 'comparison', task: task.id, workload, models: rows };
}

/**
 * Multi-step route. Each step is an independent recommendation, priced end to end.
 */
export function plan(catalog, goal, input = {}) {
  const plans = planCatalog().plans ?? [];
  const scored = plans.map((item) => ({ plan: item, score: scorePlan(goal, item) })).sort((a, b) => b.score - a.score);
  const picked = scored[0]?.score > 0 ? scored[0].plan : null;

  let steps;
  if (picked) {
    steps = picked.steps.map((step, index) => ({ ...step, index }));
  } else {
    const detection = detectTask(goal, catalog.tasks);
    if (!detection.task) {
      throw new ModelPickError(`Could not map "${goal}" to a workflow.`, {
        code: 'ERR_NO_PLAN_MATCH',
        hint: 'Try `modelpick pick "<task>"` or `modelpick tasks`.'
      });
    }
    steps = [{ id: detection.task.id, task: detection.task.id, brief: goal, index: 0 }];
  }

  const results = steps.map((step) => {
    const task = catalog.taskById.get(step.task);
    if (!task) throw new ModelPickError(`Plan references unknown task: ${step.task}`, { code: 'ERR_INVALID_PLAN' });
    const recommendation = recommend(catalog, {
      query: `${goal} ${step.brief}`,
      task: task.id,
      optimize: input.optimize,
      maxCost: input.maxCost,
      minQuality: input.minQuality,
      openWeights: input.openWeights,
      topK: 2
    });
    return {
      id: step.id,
      index: step.index,
      brief: step.brief,
      optional: Boolean(step.optional),
      dependsOn: step.dependsOn ?? null,
      task: { id: task.id, label: task.label, modality: task.modality },
      pick: recommendation.recommendation,
      alternative: recommendation.alternatives[0] ?? null,
      stepCost: recommendation.recommendation?.costPerTask ?? null
    };
  });

  const total = results.reduce((sum, step) => sum + (step.stepCost ?? 0), 0);
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'plan',
    goal,
    plan: picked ? { id: picked.id, label: picked.label, blurb: picked.blurb } : { id: 'single-step', label: 'Single step', blurb: goal },
    steps: results,
    estimate: {
      totalCost: Math.round(total * 1e6) / 1e6,
      currency: 'USD',
      note: 'Sum of per-step cost-per-solved-task estimates; retries included, human review and infrastructure excluded.'
    },
    catalog: { version: catalog.catalogVersion, updatedAt: catalog.updatedAt }
  };
}
