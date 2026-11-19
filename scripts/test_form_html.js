#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/core/catalog.js';
import { rankModels } from '../src/core/score.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = path.join(ROOT, 'tests', 'results');
const catalog = loadCatalog({ preferCache: false });
const read = (file, fallback = null) => {
  const p = path.join(RESULTS, file);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback;
};
const coverage = read('coverage.json', {});
const adversarial = read('adversarial-latest.json', { results: [] });
const live = read('live-smoke-latest.json', { cases: [] });
const bench = read('benchmark-latest.json', { metrics: {} });
const holdout = read('holdout-latest.json', { metrics: {} });
const value = read('value-latest.json', { aggregate: {} });

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => (n == null ? '—' : n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(3)}`);

const tasks = catalog.tasks.map((task) => {
  const ranked = rankModels(catalog, task, { limit: 100 });
  const top = ranked.candidates[0];
  const band = ranked.candidates.filter((c) => c.quality >= top.quality - 8).sort((a, b) => a.costPerTask - b.costPerTask);
  const valuePick = band[0] ?? top;
  return { task, eligible: ranked.candidates.length, top, valuePick };
});
const modelStats = new Map(catalog.models.map((m) => [m.slug, { eligible: 0, top1: 0, top3: 0 }]));
for (const task of catalog.tasks) {
  const ranked = rankModels(catalog, task, { limit: 100 });
  ranked.candidates.forEach((candidate, index) => {
    const s = modelStats.get(candidate.slug);
    if (!s) return;
    s.eligible += 1;
    if (index === 0) s.top1 += 1;
    if (index < 3) s.top3 += 1;
  });
}
const models = [...modelStats.entries()]
  .map(([slug, stats]) => ({ slug, name: catalog.bySlug.get(slug)?.name ?? slug, ...stats }))
  .sort((a, b) => b.top1 - a.top1 || b.top3 - a.top3 || a.slug.localeCompare(b.slug));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ModelPick test form</title>
<style>
  :root { --bg:#070a0e; --panel:#0d141c; --line:#263442; --ivory:#f5efe4; --dim:#8b9aaa; --gold:#c9a96e; --cyan:#39c5cf; --green:#3fb950; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ivory); font:16px/1.55 "Segoe UI",Arial,sans-serif; }
  main { max-width: 1400px; margin: 0 auto; padding: 56px 24px 100px; }
  h1 { font: 700 48px/1.05 "Bodoni MT",Georgia,serif; margin: 0 0 12px; }
  h2 { font: 700 32px/1.1 "Bodoni MT",Georgia,serif; margin: 52px 0 14px; }
  p { color: var(--dim); max-width: 900px; }
  a { color: var(--cyan); }
  .kicker { font: 600 13px "Consolas"; letter-spacing: .16em; color: var(--gold); text-transform: uppercase; }
  .stats { display:flex; flex-wrap:wrap; gap:12px; margin:24px 0 8px; }
  .stat { border:1px solid var(--line); border-radius:8px; padding:14px 18px; background:var(--panel); }
  .stat b { display:block; font:700 30px "Bodoni MT",Georgia,serif; color:var(--gold); }
  .stat span { color:var(--dim); font-size:13px; }
  table { width:100%; border-collapse:collapse; margin-top:14px; font-size:14px; }
  th,td { text-align:left; padding:9px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--dim); font:600 12px "Consolas"; letter-spacing:.06em; text-transform:uppercase; }
  td.num, th.num { text-align:right; font-family:"Consolas",monospace; }
  tr:hover td { background:rgba(57,197,207,.04); }
  .ok { color:var(--green); } .bad { color:#f85149; }
  .note { border-left:2px solid var(--gold); padding-left:14px; color:var(--dim); }
  footer { margin-top:60px; color:var(--dim); font-size:13px; }
</style>
</head>
<body><main>
<div class="kicker">Evidence sheet · ${new Date().toISOString().slice(0, 10)}</div>
<h1>Test form</h1>
<p>20 tasks × 40 models, the actual test receipt, and the live endpoint smoke. This is the human-readable view of <a href="https://github.com/Leizhidong-creator/modelpick/blob/main/tests/results/TEST_FORM.md">tests/results/TEST_FORM.md</a>.</p>
<div class="stats">
  <div class="stat"><b>${coverage.tests ?? '—'}</b><span>tests passing</span></div>
  <div class="stat"><b>${coverage.lines ?? '—'}%</b><span>line coverage</span></div>
  <div class="stat"><b>${adversarial.passed ?? '—'}/${adversarial.total ?? '—'}</b><span>adversarial cases</span></div>
  <div class="stat"><b>${Math.round((bench.metrics?.top1 ?? 0) * 100)}%</b><span>dev top-1</span></div>
  <div class="stat"><b>${Math.round((holdout.metrics?.top1 ?? 0) * 100)}%</b><span>held-out top-1</span></div>
  <div class="stat"><b>${Math.round((value.aggregate?.value?.qualityParity ?? 0) * 100)}%</b><span>value quality parity</span></div>
</div>
<p class="note">This is a decision benchmark, not an independent model-output benchmark. Image/video quality is arena-informed; 3D/audio remain expert priors. Live smoke proves transport and response format, not quality.</p>

<h2>Per-task matrix</h2>
<table><thead><tr><th>Task</th><th class="num">Eligible</th><th>Top model</th><th class="num">Quality</th><th class="num">Cost / task</th><th>Value pick</th><th class="num">Value cost</th></tr></thead><tbody>
${tasks.map(({ task, eligible, top, valuePick }) => `<tr><td>${esc(task.id)}<br><span class="note">${esc(task.label)}</span></td><td class="num">${eligible}</td><td>${esc(top.slug)}</td><td class="num">${top.quality}</td><td class="num">${money(top.costPerTask)}</td><td>${esc(valuePick.slug)}</td><td class="num">${money(valuePick.costPerTask)}</td></tr>`).join('\n')}
</tbody></table>

<h2>Per-model applicability</h2>
<table><thead><tr><th>Model</th><th class="num">Eligible</th><th class="num">Top-1</th><th class="num">Top-3</th></tr></thead><tbody>
${models.map((m) => `<tr><td>${esc(m.slug)}</td><td class="num">${m.eligible}</td><td class="num">${m.top1}</td><td class="num">${m.top3}</td></tr>`).join('\n')}
</tbody></table>

<h2>Adversarial cases</h2>
<table><thead><tr><th>ID</th><th>Area</th><th>Attack</th><th>Observed</th><th>Result</th></tr></thead><tbody>
${(adversarial.results ?? []).map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.area)}</td><td>${esc(r.vector)}</td><td>${esc(r.observed)}</td><td class="${r.pass ? 'ok' : 'bad'}">${r.pass ? 'PASS' : 'FAIL'}</td></tr>`).join('\n')}
</tbody></table>

<h2>Live smoke</h2>
<table><thead><tr><th>Endpoint</th><th>Result</th><th class="num">Latency</th><th>Evidence</th></tr></thead><tbody>
${(live.cases ?? []).map((c) => `<tr><td>${esc(c.name)}</td><td class="${c.ok ? 'ok' : 'bad'}">${c.ok ? 'PASS' : 'FAIL'}</td><td class="num">${c.ms} ms</td><td>${esc(c.status ?? '—')} ${esc(c.contentType ?? c.error ?? '')}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">Free/public endpoints only. No API keys are used or stored. The third paid-provider slot is still open.</p>

<footer>ModelPick 0.1.0 · MIT · <a href="index.html">home</a> · <a href="https://github.com/Leizhidong-creator/modelpick">GitHub</a></footer>
</main></body></html>`;

fs.writeFileSync(path.join(ROOT, 'docs', 'test-form.html'), html);
console.log('wrote docs/test-form.html');
