/**
 * Analyze a user's own eval runs. This does not modify the catalog: it computes
 * observed pass rate, Wilson interval, expected attempts, and cost per solved
 * task, then compares the result with the catalog's prediction.
 */

function wilson(successes, total, z = 1.96) {
  if (!total) return { low: 0, high: 0 };
  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return {
    low: Math.max(0, (centre - margin) / denominator),
    high: Math.min(1, (centre + margin) / denominator)
  };
}

function normalise(input) {
  if (!input || typeof input !== 'object') throw new Error('Eval input must be an object');
  const task = input.task;
  if (!task) throw new Error('Eval input needs a task id');
  const runs = [];
  if (Array.isArray(input.runs)) {
    for (const run of input.runs) {
      if (!run.model) throw new Error('Each run needs a model slug');
      runs.push({
        model: run.model,
        passed: Boolean(run.passed),
        cost: Number(run.cost ?? 0),
        attempts: Math.max(1, Number(run.attempts ?? 1)),
        quality: run.quality == null ? null : Number(run.quality)
      });
    }
  } else if (input.models && typeof input.models === 'object') {
    for (const [model, item] of Object.entries(input.models)) {
      for (const run of item.runs ?? []) {
        runs.push({
          model,
          passed: Boolean(run.passed),
          cost: Number(run.cost ?? 0),
          attempts: Math.max(1, Number(run.attempts ?? 1)),
          quality: run.quality == null ? null : Number(run.quality)
        });
      }
    }
  } else {
    throw new Error('Eval input needs a runs array or a models object');
  }
  return { task, runs };
}

export function evaluateRuns(input, catalog, { minSamples = 5 } = {}) {
  const { task, runs } = normalise(input);
  const taskDef = catalog.taskById.get(task);
  if (!taskDef) throw new Error(`Unknown task: ${task}`);

  const byModel = new Map();
  for (const run of runs) {
    if (!byModel.has(run.model)) byModel.set(run.model, []);
    byModel.get(run.model).push(run);
  }

  const results = [];
  for (const [slug, items] of byModel) {
    const model = catalog.bySlug.get(slug);
    const solved = items.filter((item) => item.passed).length;
    const attempts = items.reduce((sum, item) => sum + item.attempts, 0);
    const cost = items.reduce((sum, item) => sum + item.cost, 0);
    const quality = items.filter((item) => item.quality != null).map((item) => item.quality);
    const interval = wilson(solved, items.length);
    results.push({
      slug,
      name: model?.name ?? slug,
      known: Boolean(model),
      runs: items.length,
      solved,
      passRate: items.length ? solved / items.length : 0,
      passRateLow: interval.low,
      passRateHigh: interval.high,
      meanAttempts: items.length ? attempts / items.length : 0,
      totalCost: cost,
      costPerSolved: solved ? cost / solved : null,
      meanQuality: quality.length ? quality.reduce((sum, value) => sum + value, 0) / quality.length : null,
      catalogQuality: model ? Number(model.quality?.overall ?? null) : null,
      enoughSamples: items.length >= minSamples
    });
  }

  results.sort((a, b) => {
    if (a.costPerSolved == null && b.costPerSolved == null) return b.passRate - a.passRate;
    if (a.costPerSolved == null) return 1;
    if (b.costPerSolved == null) return -1;
    return a.costPerSolved - b.costPerSolved;
  });

  return {
    schemaVersion: '1.0',
    kind: 'user-eval',
    task: { id: taskDef.id, label: taskDef.label, modality: taskDef.modality },
    minSamples,
    runs: runs.length,
    models: results,
    caveat:
      'Observed results from the supplied runs. Wilson intervals are wide at small n; do not treat a 5-run difference as a ranking change.'
  };
}
