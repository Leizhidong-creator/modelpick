#!/usr/bin/env node
/**
 * Per-model applicability: for every model, which task nodes can it serve, and
 * where does it actually win or place? This is the audit that catches catalog
 * dead weight and "recommended for everything" claims.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/core/catalog.js';
import { rankModels, qualityFor } from '../src/core/score.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = loadCatalog({ preferCache: false });

const perModel = new Map(
  catalog.models.map((model) => [
    model.slug,
    {
      slug: model.slug,
      name: model.name,
      provider: model.provider.name,
      modality: model.modality,
      openWeights: Boolean(model.openWeights),
      eligible: [],
      top1: [],
      top3: [],
      bestTask: null,
      bestScore: -Infinity
    }
  ])
);
const perTask = [];

for (const task of catalog.tasks) {
  const ranked = rankModels(catalog, task, { limit: 50 });
  const top = ranked.candidates[0] ?? null;
  const top3 = new Set(ranked.candidates.slice(0, 3).map((candidate) => candidate.slug));
  const eligible = new Set(ranked.all.map((candidate) => candidate.slug));
  const bestQuality = Math.max(...ranked.all.map((candidate) => candidate.quality));

  perTask.push({
    task: task.id,
    label: task.label,
    modality: task.modality,
    eligible: eligible.size,
    top1: top?.slug ?? null,
    top1Quality: top?.quality ?? null,
    top1Cost: top?.costPerTask ?? null,
    bestQuality,
    top3: [...top3]
  });

  for (const model of catalog.models) {
    const entry = perModel.get(model.slug);
    if (eligible.has(model.slug)) entry.eligible.push(task.id);
    if (top?.slug === model.slug) entry.top1.push(task.id);
    if (top3.has(model.slug)) entry.top3.push(task.id);
    if (eligible.has(model.slug)) {
      const candidate = ranked.all.find((item) => item.slug === model.slug);
      if (candidate && candidate.score > entry.bestScore) {
        entry.bestScore = candidate.score;
        entry.bestTask = task.id;
        entry.bestQuality = candidate.quality;
        entry.bestCost = candidate.costPerTask;
      }
    }
  }
}

const models = [...perModel.values()]
  .map((entry) => ({
    ...entry,
    eligibleCount: entry.eligible.length,
    top1Count: entry.top1.length,
    top3Count: entry.top3.length,
    qualityForBestTask: entry.bestTask ? qualityFor(catalog.bySlug.get(entry.slug), catalog.taskById.get(entry.bestTask)) : null
  }))
  .sort((a, b) => b.top1Count - a.top1Count || b.top3Count - a.top3Count || b.eligibleCount - a.eligibleCount);

const neverTop3 = models.filter((model) => model.top3Count === 0).map((model) => model.slug);
const neverTop1 = models.filter((model) => model.top1Count === 0).map((model) => model.slug);
const tasksWithoutTop1 = perTask.filter((task) => !task.top1).map((task) => task.task);
const tasksUnderTwo = perTask.filter((task) => task.eligible < 2).map((task) => task.task);

const result = {
  schemaVersion: '1.0',
  kind: 'model-applicability',
  generatedAt: new Date().toISOString(),
  catalog: catalog.catalogVersion,
  totals: {
    models: models.length,
    tasks: perTask.length,
    neverTop3: neverTop3.length,
    neverTop1: neverTop1.length,
    tasksWithoutTop1: tasksWithoutTop1.length,
    tasksUnderTwo: tasksUnderTwo.length
  },
  models,
  tasks: perTask,
  gaps: { neverTop3, neverTop1, tasksWithoutTop1, tasksUnderTwo }
};
fs.writeFileSync(path.join(ROOT, 'tests', 'results', 'applicability-latest.json'), `${JSON.stringify(result, null, 2)}\n`);

const lines = [];
lines.push('# Model applicability', '');
lines.push(`Catalog ${result.catalog} · ${models.length} models · ${perTask.length} task nodes.`);
lines.push('');
lines.push('Every model must be eligible for at least one node. A model with no top-3 finish is kept only because a task’s hard constraints need it; that is recorded, not hidden.');
lines.push('');
lines.push('| Model | Provider | Eligible nodes | Top-1 | Top-3 | Best node | Best quality |');
lines.push('|---|---|---:|---:|---:|---|---:|');
for (const model of models) {
  lines.push(
    `| ${model.name} | ${model.provider} | ${model.eligibleCount} | ${model.top1Count} | ${model.top3Count} | ${model.bestTask ?? '—'} | ${model.bestQuality == null ? '—' : Math.round(model.bestQuality * 10) / 10} |`
  );
}
lines.push('', '## Task winners', '');
lines.push('| Node | Eligible | Top-1 | Quality | Cost | Top-3 |');
lines.push('|---|---:|---|---:|---:|---|');
for (const task of perTask) {
  lines.push(
    `| ${task.task} | ${task.eligible} | ${task.top1 ?? '—'} | ${task.top1Quality == null ? '—' : Math.round(task.top1Quality * 10) / 10} | ${task.top1Cost == null ? '—' : `$${task.top1Cost.toFixed(4)}`} | ${task.top3.join(', ')} |`
  );
}
lines.push('', '## Gaps', '');
lines.push(`- Models never in a top-3: **${neverTop3.length}/${models.length}** (${neverTop3.join(', ') || 'none'})`);
lines.push(`- Models never top-1: **${neverTop1.length}/${models.length}**`);
lines.push(`- Tasks without a top-1: **${tasksWithoutTop1.length}**`);
lines.push(`- Tasks with fewer than two eligible models: **${tasksUnderTwo.length}**`);
lines.push('');
fs.writeFileSync(path.join(ROOT, 'docs', 'APPLICABILITY.md'), `${lines.join('\n')}\n`);

console.log(`models ${models.length} · tasks ${perTask.length} · never top-3 ${neverTop3.length} · never top-1 ${neverTop1.length}`);
console.log(`wrote docs/APPLICABILITY.md and tests/results/applicability-latest.json`);
if (tasksWithoutTop1.length || tasksUnderTwo.length || models.some((model) => model.eligibleCount === 0)) process.exitCode = 1;
