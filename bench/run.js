#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/core/catalog.js';
import { recommend } from '../src/core/recommend.js';
import { detectTask } from '../src/core/tasks.js';
import { rankModels } from '../src/core/score.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS_DIR = path.join(ROOT, 'tests', 'results');

const THRESHOLDS = {
  intentAccuracy: 0.95,
  top1: 0.75,
  top3: 0.92,
  constraintPass: 1,
  p95Ms: 300,
  priceStability: 0.8
};

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function p95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
}

function perturbCatalog(catalog, factor) {
  return {
    ...catalog,
    models: catalog.models.map((model) => ({
      ...model,
      pricing: {
        ...model.pricing,
        ...(model.pricing.input != null ? { input: model.pricing.input * factor } : {}),
        ...(model.pricing.output != null ? { output: model.pricing.output * factor } : {}),
        ...(model.pricing.amount != null ? { amount: model.pricing.amount * factor } : {}),
        ...(model.pricing.cachedInput != null ? { cachedInput: model.pricing.cachedInput * factor } : {})
      }
    }))
  };
}

function variantsFor(scenario) {
  const modes = scenario.modes ?? ['balanced', 'cost', 'quality'];
  return modes.map((mode) => ({
    mode,
    optimize: mode,
    dropBudget: mode === 'quality'
  }));
}

function evaluateRun(catalog, scenario, variant) {
  const constraints = {
    maxCost: variant.dropBudget ? undefined : scenario.maxCost,
    openWeights: scenario.openWeights,
    contextTokens: scenario.contextTokens
  };
  const started = performance.now();
  const result = recommend(catalog, {
    query: scenario.query,
    task: scenario.task,
    optimize: variant.optimize,
    maxCost: constraints.maxCost,
    openWeights: constraints.openWeights,
    contextTokens: constraints.contextTokens,
    topK: 3
  });
  const elapsedMs = performance.now() - started;

  const chosen = result.recommendation;
  const top3 = [chosen, ...(result.alternatives ?? [])].filter(Boolean).slice(0, 3).map((item) => item.slug);
  const reasons = [];
  if (!chosen) reasons.push(result.error ?? 'no_recommendation');
  if (chosen && !scenario.accept.includes(chosen.slug)) reasons.push('top1_not_acceptable');
  if (!top3.some((slug) => scenario.accept.includes(slug))) reasons.push('top3_miss');
  if (chosen && constraints.maxCost != null && chosen.costPerTask > constraints.maxCost + 1e-9) reasons.push('over_budget');
  if (chosen && constraints.openWeights && !chosen.openWeights) reasons.push('not_open_weights');

  let costRegret = null;
  if (chosen && scenario.accept.length) {
    const ranked = rankModels(catalog, catalog.taskById.get(scenario.task), {
      optimize: variant.optimize,
      constraints: { openWeights: constraints.openWeights },
      limit: 50
    });
    const acceptable = (ranked.all ?? []).filter((item) => scenario.accept.includes(item.slug));
    if (acceptable.length) {
      const cheapest = Math.min(...acceptable.map((item) => item.costPerTask));
      costRegret = (chosen.costPerTask - cheapest) / Math.max(cheapest, 1e-9);
    }
  }

  return {
    scenario: scenario.id,
    mode: variant.mode,
    task: scenario.task,
    chosen: chosen?.slug ?? null,
    chosenName: chosen?.name ?? null,
    top3,
    costPerTask: chosen?.costPerTask ?? null,
    quality: chosen?.quality ?? null,
    elapsedMs: Math.round(elapsedMs * 100) / 100,
    costRegret,
    reasons,
    pass: reasons.length === 0
  };
}

export async function runBench({ quiet = false, scenariosFile = 'bench/scenarios.json', resultsName = 'benchmark-latest.json', reportName = 'report.html' } = {}) {
  const catalog = loadCatalog({ preferCache: false });
  const scenarios = JSON.parse(fs.readFileSync(path.join(ROOT, scenariosFile), 'utf8')).scenarios;
  const runs = [];
  const intentResults = [];

  for (const scenario of scenarios) {
    const detection = detectTask(scenario.query, catalog.tasks);
    const intentOk = detection.task?.id === scenario.task;
    intentResults.push({ id: scenario.id, expected: scenario.task, detected: detection.task?.id ?? null, confidence: detection.confidence, pass: intentOk });
    for (const variant of variantsFor(scenario)) {
      runs.push(evaluateRun(catalog, scenario, variant));
    }
  }

  const balancedRuns = runs.filter((run) => run.mode === 'balanced');
  const stabilitySample = balancedRuns.slice(0, 40);
  let stable = 0;
  for (let i = 0; i < stabilitySample.length; i += 1) {
    const run = stabilitySample[i];
    const scenario = scenarios.find((item) => item.id === run.scenario);
    const factor = i % 2 === 0 ? 1.2 : 0.8;
    const perturbed = recommend(perturbCatalog(catalog, factor), {
      query: scenario.query,
      task: scenario.task,
      optimize: 'balanced',
      maxCost: scenario.maxCost,
      openWeights: scenario.openWeights,
      contextTokens: scenario.contextTokens,
      topK: 1
    });
    if (perturbed.recommendation?.slug === run.chosen) stable += 1;
  }

  const intentPass = intentResults.filter((item) => item.pass).length / intentResults.length;
  const top1 = runs.filter((run) => run.chosen && !run.reasons.includes('top1_not_acceptable')).length / runs.length;
  const top3 = runs.filter((run) => run.top3.some((slug) => scenarios.find((s) => s.id === run.scenario).accept.includes(slug))).length / runs.length;
  const constraintPass = runs.filter(
    (run) => !run.reasons.some((reason) => ['over_budget', 'not_open_weights', 'context_too_small'].includes(reason))
  ).length / runs.length;
  const regrets = balancedRuns.map((run) => run.costRegret).filter((value) => value != null);
  const priceStability = stable / stabilitySample.length;

  const metrics = {
    intentAccuracy: Math.round(intentPass * 1000) / 1000,
    top1: Math.round(top1 * 1000) / 1000,
    top3: Math.round(top3 * 1000) / 1000,
    constraintPass: Math.round(constraintPass * 1000) / 1000,
    medianCostRegret: Math.round(median(regrets) * 1000) / 1000,
    p95Ms: Math.round(p95(runs.map((run) => run.elapsedMs)) * 10) / 10,
    priceStability: Math.round(priceStability * 1000) / 1000
  };

  const failures = runs.filter((run) => !run.pass);
  const intentFailures = intentResults.filter((item) => !item.pass);
  const passed =
    metrics.intentAccuracy >= THRESHOLDS.intentAccuracy &&
    metrics.top1 >= THRESHOLDS.top1 &&
    metrics.top3 >= THRESHOLDS.top3 &&
    metrics.constraintPass >= THRESHOLDS.constraintPass &&
    metrics.p95Ms <= THRESHOLDS.p95Ms &&
    metrics.priceStability >= THRESHOLDS.priceStability;

  const result = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    catalogVersion: catalog.catalogVersion,
    scenarios: scenarios.length,
    runs: runs.length,
    metrics,
    thresholds: THRESHOLDS,
    passed,
    intentFailures,
    failures,
    details: runs,
    intent: intentResults
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, resultsName), `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(path.join(RESULTS_DIR, reportName), renderHtml(result, scenarios));
  if (!quiet) process.stderr.write(`[bench] ${runs.length} runs · top-1 ${metrics.top1} · top-3 ${metrics.top3} · ${passed ? 'PASS' : 'FAIL'}\n`);
  return result;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function renderHtml(result, scenarios) {
  const cards = Object.entries(result.metrics)
    .map(([key, value]) => `<div class="card"><div class="k">${esc(key)}</div><div class="v">${esc(value)}</div><div class="t">${esc(result.thresholds[key] ?? '')}</div></div>`)
    .join('');
  const rows = result.details
    .map(
      (run) => `<tr class="${run.pass ? '' : 'fail'}"><td>${esc(run.scenario)}</td><td>${esc(run.mode)}</td><td>${esc(run.chosenName ?? run.chosen ?? '—')}</td><td>${run.costPerTask ?? '—'}</td><td>${run.quality ?? '—'}</td><td>${run.pass ? 'PASS' : esc(run.reasons.join(', '))}</td></tr>`
    )
    .join('');
  const scenarioRows = scenarios
    .map((scenario) => {
      const intent = result.intent.find((item) => item.id === scenario.id);
      const runs = result.details.filter((run) => run.scenario === scenario.id);
      return `<tr><td>${esc(scenario.id)}</td><td>${esc(scenario.task)}</td><td>${intent?.pass ? '✓' : '✗'} ${esc(intent?.detected)}</td><td>${runs.map((run) => `${esc(run.mode)}:${esc(run.chosen)}`).join('<br>')}</td></tr>`;
    })
    .join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>ModelPick benchmark ${esc(result.generatedAt)}</title>
<style>
:root{--bg:#0b0f14;--panel:#121922;--line:#233040;--text:#e6edf3;--dim:#8b98a5;--green:#3fb950;--red:#f85149;--cyan:#39c5cf;--yellow:#d29922}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}
main{max-width:1180px;margin:0 auto;padding:40px 24px 80px}h1{font-size:28px;margin:0 0 4px}h2{font-size:16px;margin:36px 0 12px;color:var(--cyan)}
.sub{color:var(--dim);margin-bottom:24px}.badge{display:inline-block;padding:2px 8px;border:1px solid var(--line);border-radius:999px;color:${result.passed ? 'var(--green)' : 'var(--red)'}}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px}
.k{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.06em}.v{font-size:24px;margin-top:4px}.t{color:var(--dim);font-size:11px}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--dim);font-weight:500;font-size:11px;text-transform:uppercase}tr.fail td{color:#ffb3ae}
.note{color:var(--dim);margin-top:10px;font-size:12px}.pass{color:var(--green)}.failtext{color:var(--red)}
</style></head><body><main>
<h1>ModelPick decision benchmark</h1>
<div class="sub">${result.runs} runs · ${result.scenarios} scenarios · catalog ${esc(result.catalogVersion)} · ${esc(result.generatedAt)} <span class="badge">${result.passed ? 'PASS' : 'FAIL'}</span></div>
<div class="cards">${cards}</div>
<h2>Failures</h2>
<table><thead><tr><th>scenario</th><th>mode</th><th>chosen</th><th>cost</th><th>quality</th><th>result</th></tr></thead><tbody>${rows.replaceAll('class=""', '')}</tbody></table>
<h2>Scenario matrix</h2>
<table><thead><tr><th>scenario</th><th>expected task</th><th>intent</th><th>picks</th></tr></thead><tbody>${scenarioRows}</tbody></table>
<div class="note">Cost is USD per solved task. Labels are expert-authored before the final ranking run; see bench/scenarios.json. This is a decision benchmark, not a model-output benchmark.</div>
</main></body></html>`;
}

export function formatSummary(result, style) {
  const s = style ?? { bold: (x) => x, green: (x) => x, red: (x) => x, dim: (x) => x, cyan: (x) => x };
  const rows = Object.entries(result.metrics)
    .map(([key, value]) => `  ${key.padEnd(18)} ${String(value).padEnd(8)} ${result.thresholds[key] != null ? `target ${result.thresholds[key]}` : ''}`)
    .join('\n');
  return `\n  ${s.bold('ModelPick benchmark')} ${result.passed ? s.green('PASS') : s.red('FAIL')}\n\n${rows}\n\n  ${s.dim(`${result.runs} runs · ${result.failures.length} failures · tests/results/report.html`)}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBench().then((result) => {
    console.log(formatSummary(result));
    if (!result.passed) process.exitCode = 1;
  });
}
