#!/usr/bin/env node
/**
 * Value simulation: does "value pick" keep frontier-level first-pass quality at
 * a much lower cost per solved task? The simulation uses the catalog's quality
 * as a first-pass success probability and the same retry model as the router.
 *
 * This is a sensitivity/sanity check, not a live model benchmark.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/core/catalog.js';
import { rankModels, qualityFor, unitCostFor, attemptsFor } from '../src/core/score.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TASKS = ['coding-agent', 'image-gen', 'video-gen', '3d-gen', 'tts'];
const TRIALS = 4000;
const MAX_ATTEMPTS = 4;
const PARITY = 0.9;

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function modelStats(model, task) {
  const quality = qualityFor(model, task);
  const failure = Math.min(0.75, Math.max(0.02, ((100 - quality) / 100) * 1.15));
  return {
    slug: model.slug,
    name: model.name,
    quality,
    firstPass: 1 - failure,
    unitCost: unitCostFor(model, task),
    expectedAttempts: attemptsFor(quality)
  };
}

function simulateFixed(model, random) {
  let solved = 0;
  let spent = 0;
  let attemptsTotal = 0;
  for (let trial = 0; trial < TRIALS; trial += 1) {
    let attempts = 0;
    let done = false;
    while (attempts < MAX_ATTEMPTS && !done) {
      attempts += 1;
      spent += model.unitCost;
      if (random() < model.firstPass) done = true;
    }
    attemptsTotal += attempts;
    if (done) solved += 1;
  }
  return {
    solved,
    solveRate: solved / TRIALS,
    spent,
    costPerSolved: solved ? spent / solved : null,
    attemptsMean: attemptsTotal / TRIALS
  };
}

function simulateOracle(models, random) {
  let solved = 0;
  let spent = 0;
  for (let trial = 0; trial < TRIALS; trial += 1) {
    let bestCost = Infinity;
    let anySolved = false;
    for (const model of models) {
      let attempts = 0;
      let done = false;
      while (attempts < MAX_ATTEMPTS && !done) {
        attempts += 1;
        if (random() < model.firstPass) done = true;
      }
      if (done) {
        anySolved = true;
        bestCost = Math.min(bestCost, model.unitCost * attempts);
      }
    }
    if (anySolved) {
      solved += 1;
      spent += bestCost;
    }
  }
  return { solved, solveRate: solved / TRIALS, spent, costPerSolved: solved ? spent / solved : null, attemptsMean: null };
}

export function runValueSimulation() {
  const catalog = loadCatalog({ preferCache: false });
  const rows = [];
  for (const taskId of TASKS) {
    const task = catalog.taskById.get(taskId);
    const ranked = rankModels(catalog, task, { limit: 50 });
    const stats = ranked.all.map((item) => modelStats(catalog.bySlug.get(item.slug), task));
    const byQuality = [...stats].sort((a, b) => b.quality - a.quality || a.unitCost - b.unitCost);
    const byCost = [...stats].sort((a, b) => a.unitCost - b.unitCost || b.quality - a.quality);
    const strategies = {
      frontier: byQuality[0],
      cheapest: byCost[0],
      value: stats.find((item) => item.slug === ranked.value?.slug),
      balanced: stats.find((item) => item.slug === ranked.candidates[0]?.slug)
    };
    const random = mulberry32(0x5eed + taskId.length);
    const results = {};
    for (const [name, model] of Object.entries(strategies)) {
      results[name] = {
        model: model.slug,
        name: model.name,
        quality: model.quality,
        firstPass: Math.round(model.firstPass * 1000) / 1000,
        ...simulateFixed(model, random)
      };
    }
    results.oracle = { model: 'oracle', name: 'per-trial oracle', quality: null, firstPass: null, ...simulateOracle(stats, random) };
    const frontier = results.frontier;
    for (const item of Object.values(results)) {
      item.qualityParity = item.firstPass == null ? null : Math.round((item.firstPass / frontier.firstPass) * 1000) / 1000;
      item.costRatio = frontier.costPerSolved ? Math.round((item.costPerSolved / frontier.costPerSolved) * 1000) / 1000 : null;
      item.parityPass = item.qualityParity == null ? null : item.qualityParity >= PARITY;
    }
    rows.push({ task: taskId, label: task.label, strategies: results });
  }

  const aggregate = {};
  for (const key of ['frontier', 'cheapest', 'value', 'balanced', 'oracle']) {
    const items = rows.map((row) => row.strategies[key]);
    const avg = (selector) => {
      const values = items.map(selector).filter((value) => value != null);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    };
    aggregate[key] = {
      firstPass: avg((item) => item.firstPass) == null ? null : Math.round(avg((item) => item.firstPass) * 1000) / 1000,
      solveRate: Math.round((avg((item) => item.solveRate) ?? 0) * 1000) / 1000,
      costPerSolved: Math.round((avg((item) => item.costPerSolved) ?? 0) * 10000) / 10000,
      qualityParity: Math.round((avg((item) => item.qualityParity) ?? 1) * 1000) / 1000,
      costRatio: Math.round((avg((item) => item.costRatio) ?? 1) * 1000) / 1000,
      parityPassShare: key === 'oracle' ? 1 : Math.round((items.filter((item) => item.parityPass).length / items.length) * 1000) / 1000
    };
  }

  const result = {
    schemaVersion: '1.0',
    kind: 'value-simulation',
    generatedAt: new Date().toISOString(),
    trialsPerTask: TRIALS,
    parityThreshold: PARITY,
    tasks: rows,
    aggregate,
    caveat:
      'Synthetic: uses catalog quality as first-pass success probability and the router retry curve. Validates the cost-per-solved-task arithmetic and the value definition; it is not a live model eval.'
  };
  fs.writeFileSync(path.join(ROOT, 'tests', 'results', 'value-latest.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

export function formatValue(result) {
  const lines = ['', '  Value simulation (synthetic, 4,000 jobs per task, 5 task types)', ''];
  lines.push('  strategy     first-pass   cost/solved   quality parity   cost vs frontier   parity@90%');
  for (const [key, item] of Object.entries(result.aggregate)) {
    lines.push(
      `  ${key.padEnd(12)} ${item.firstPass == null ? '     —' : `${(item.firstPass * 100).toFixed(1).padStart(8)}%`}   $${item.costPerSolved.toFixed(4).padStart(8)}   ` +
        `${(item.qualityParity * 100).toFixed(1).padStart(12)}%   ${(item.costRatio * 100).toFixed(1).padStart(14)}%   ${item.parityPassShare * 100}%`
    );
  }
  lines.push('', '  quality parity = first-pass success / frontier first-pass success');
  lines.push('  parity@90% = share of tasks where quality parity ≥ 90%.');
  lines.push('  Raw: tests/results/value-latest.json', '');
  return lines.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(formatValue(runValueSimulation()));
}
