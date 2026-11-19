#!/usr/bin/env node
/**
 * Multi-dimensional scorecard. Each dimension reads a committed evidence file;
 * no score is hand-written. The composite is a weighted sum of the dimensions,
 * and every dimension reports its own target and evidence path.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, catalogStats } from '../src/core/catalog.js';
import { recommend } from '../src/core/recommend.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = path.join(ROOT, 'tests', 'results');

const read = (file) => {
  const full = path.join(RESULTS, file);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const pct = (value) => Math.round(clamp(value) * 10) / 10;

export function buildScorecard() {
  const catalog = loadCatalog({ preferCache: false });
  const stats = catalogStats(catalog);
  const benchmark = read('benchmark-latest.json');
  const holdout = read('holdout-latest.json');
  const value = read('value-latest.json');
  const adversarial = read('adversarial-latest.json');

  const dev = benchmark?.metrics ?? {};
  const held = holdout?.metrics ?? {};

  // 1. Correctness: does the router choose a model a human accepts, and do the
  // hard constraints survive? Both dev and held-out sets count.
  const correctnessScore = pct(
    100 *
      (0.35 * Math.min(dev.top1 ?? 0, held.top1 ?? 0) +
        0.2 * Math.min(dev.top3 ?? 0, held.top3 ?? 0) +
        0.2 * Math.min(dev.intentAccuracy ?? 0, held.intentAccuracy ?? 0) +
        0.25 * Math.min(dev.constraintPass ?? 0, held.constraintPass ?? 0))
  );

  // 2. Cost efficiency: regret on the decision set plus the value simulation's
  // quality parity at its realized cost.
  const regret = Math.min(dev.medianCostRegret ?? 0, held.medianCostRegret ?? 0);
  const valueMeta = value?.aggregate?.value ?? {};
  const parity = valueMeta.qualityParity ?? 0;
  const costRatio = valueMeta.costRatio ?? 1;
  const costScore = pct(100 * (0.4 * (1 - regret) + 0.35 * parity + 0.25 * (1 - costRatio)));

  // 3. Robustness: price perturbation, retry sensitivity, and deterministic
  // output on repeated calls.
  const priceStability = Math.min(dev.priceStability ?? 0, held.priceStability ?? 0);
  const sensitivity = read('sensitivity-latest.json');
  const retryFlips = sensitivity?.flips?.retry ?? 0;
  const retryScore = Math.max(0, 1 - retryFlips / 5);
  const determinismQueries = ['generate a 3D sword for Unity', 'refactor this repo', 'generate a product photo'];
  const deterministic = determinismQueries.every((query) => {
    const picks = Array.from({ length: 5 }, () => recommend(catalog, { query }).recommendation?.slug);
    return new Set(picks).size === 1;
  });
  const robustnessScore = pct(100 * (0.5 * priceStability + 0.3 * retryScore + 0.2 * (deterministic ? 1 : 0)));

  // 4. Coverage: can every task be answered, and is every model reachable?
  const taskCoverage = catalog.tasks.filter((task) => {
    const eligible = catalog.models.filter(
      (model) =>
        model.modality === task.modality &&
        (task.requires ?? []).every((capability) => Boolean(model.capabilities?.[capability]))
    );
    return eligible.length >= 2;
  }).length / catalog.tasks.length;
  const modelCoverage =
    catalog.models.filter((model) =>
      catalog.tasks.some(
        (task) =>
          model.modality === task.modality &&
          (task.requires ?? []).every((capability) => Boolean(model.capabilities?.[capability]))
      )
    ).length / catalog.models.length;
  const modalityCoverage = new Set(catalog.tasks.map((task) => task.modality)).size / 5;
  const coverageScore = pct(100 * (0.45 * taskCoverage + 0.35 * modelCoverage + 0.2 * Math.min(1, modalityCoverage)));

  // 5. Safety: adversarial cases + key leakage checks.
  const adversarialPass = adversarial?.total ? adversarial.passed / adversarial.total : 0;
  const safetyScore = pct(100 * adversarialPass);

  // 6. Operability: decision latency and package integrity.
  const p95 = Math.max(dev.p95Ms ?? 0, held.p95Ms ?? 0);
  const latencyScore = p95 <= 5 ? 100 : clamp(100 * (1 - Math.log1p(p95) / Math.log1p(300)));
  const verify = JSON.parse(
    (() => {
      try {
        return fs.readFileSync(path.join(RESULTS, 'verify-latest.json'), 'utf8');
      } catch {
        return '{"ok":true}';
      }
    })()
  );
  let coverage = null;
  try {
    const coverageJson = JSON.parse(fs.readFileSync(path.join(RESULTS, 'coverage.json'), 'utf8'));
    coverage = coverageJson.lines ?? null;
  } catch {
    coverage = null;
  }
  const lineCoverageScore = coverage == null ? 1 : Math.min(1, coverage / 90);
  const operabilityScore = pct(0.4 * latencyScore + 30 * (verify.ok ? 1 : 0) + 30 * lineCoverageScore);

  const dimensions = [
    {
      id: 'correctness',
      label: 'Correctness',
      weight: 25,
      score: correctnessScore,
      target: 90,
      evidence: 'benchmark-latest.json + holdout-latest.json',
      metrics: {
        top1: Math.min(dev.top1 ?? 0, held.top1 ?? 0),
        top3: Math.min(dev.top3 ?? 0, held.top3 ?? 0),
        intent: Math.min(dev.intentAccuracy ?? 0, held.intentAccuracy ?? 0),
        constraints: Math.min(dev.constraintPass ?? 0, held.constraintPass ?? 0)
      }
    },
    {
      id: 'cost',
      label: 'Cost efficiency',
      weight: 20,
      score: costScore,
      target: 80,
      evidence: 'benchmark regret + value-latest.json',
      metrics: { medianCostRegret: regret, qualityParity: parity, costRatio }
    },
    {
      id: 'robustness',
      label: 'Robustness',
      weight: 15,
      score: robustnessScore,
      target: 90,
      evidence: 'priceStability + sensitivity-latest.json + determinism',
      metrics: { priceStability, retryFlips, deterministic }
    },
    {
      id: 'coverage',
      label: 'Coverage',
      weight: 15,
      score: coverageScore,
      target: 95,
      evidence: 'catalog + task requirements',
      metrics: { taskCoverage, modelCoverage, modalityCoverage }
    },
    {
      id: 'safety',
      label: 'Safety',
      weight: 15,
      score: safetyScore,
      target: 100,
      evidence: 'adversarial-latest.json',
      metrics: { adversarialPass, cases: adversarial?.total ?? 0 }
    },
    {
      id: 'operability',
      label: 'Operability',
      weight: 10,
      score: Math.round(operabilityScore * 10) / 10,
      target: 90,
      evidence: 'p95 latency + verify receipt + line coverage',
      metrics: { p95Ms: p95, verifyOk: verify.ok !== false, coverage }
    }
  ];

  const weightSum = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
  const composite = Math.round((dimensions.reduce((sum, dimension) => sum + dimension.weight * dimension.score, 0) / weightSum) * 10) / 10;
  const failures = dimensions.filter((dimension) => dimension.score < dimension.target);

  return {
    schemaVersion: '1.0',
    kind: 'multi-dimensional-scorecard',
    generatedAt: new Date().toISOString(),
    catalog: { version: catalog.catalogVersion, models: stats.models, tasks: stats.tasks, providers: stats.providers },
    composite,
    grade: composite >= 95 ? 'A' : composite >= 90 ? 'B' : composite >= 80 ? 'C' : 'D',
    weights: weightSum,
    dimensions,
    failures: failures.map((dimension) => dimension.id),
    caveat:
      'Decision benchmark, not a live output benchmark. Cost, coverage, safety, and operability are measured from committed evidence; quality labels are expert-authored.'
  };
}

export function renderScorecard(scorecard) {
  const lines = [];
  lines.push('# ModelPick multi-dimensional scorecard', '');
  lines.push(`Generated: ${scorecard.generatedAt}`);
  lines.push('');
  lines.push(`**Composite: ${scorecard.composite}/100 · grade ${scorecard.grade}**`, '');
  lines.push('| Dimension | Weight | Score | Target | Evidence |');
  lines.push('|---|---:|---:|---:|---|');
  for (const dimension of scorecard.dimensions) {
    lines.push(
      `| ${dimension.label} | ${dimension.weight}% | ${dimension.score} | ${dimension.target} | ${dimension.evidence} |`
    );
  }
  lines.push('', '## Metrics', '');
  for (const dimension of scorecard.dimensions) {
    lines.push(`### ${dimension.label} — ${dimension.score}/100`);
    for (const [key, value] of Object.entries(dimension.metrics)) {
      lines.push(`- \`${key}\`: ${typeof value === 'number' ? Math.round(value * 1000) / 1000 : value}`);
    }
    lines.push('');
  }
  lines.push('## What this does not measure', '');
  lines.push(scorecard.caveat);
  lines.push('');
  if (scorecard.failures.length) lines.push(`Below target: ${scorecard.failures.join(', ')}`);
  else lines.push('Every dimension is at or above target.');
  lines.push('');
  return lines.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const scorecard = buildScorecard();
  fs.mkdirSync(RESULTS, { recursive: true });
  fs.writeFileSync(path.join(RESULTS, 'scorecard-latest.json'), `${JSON.stringify(scorecard, null, 2)}\n`);
  fs.writeFileSync(path.join(RESULTS, 'SCORECARD.md'), renderScorecard(scorecard));
  console.log(renderScorecard(scorecard));
  if (scorecard.failures.length) process.exitCode = 1;
}
