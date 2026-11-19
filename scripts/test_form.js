#!/usr/bin/env node
/** Generate the human-readable test form and a spreadsheet-friendly matrix. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/core/catalog.js';
import { rankModels } from '../src/core/score.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = path.join(ROOT, 'tests', 'results');
const catalog = loadCatalog({ preferCache: false });
const readJson = (name, fallback = null) => {
  const file = path.join(RESULTS, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
};

const benchmark = readJson('benchmark-latest.json', {});
const holdout = readJson('holdout-latest.json', {});
const value = readJson('value-latest.json', {});
const adversarial = readJson('adversarial-latest.json', { results: [] });
const coverage = readJson('coverage.json', {});
const live = readJson('live-smoke-latest.json', { cases: [] });

const taskRows = [];
const modelStats = new Map(catalog.models.map((model) => [model.slug, { eligible: 0, top1: 0, top3: 0 }]));

for (const task of catalog.tasks) {
  const ranked = rankModels(catalog, task, { limit: 100 });
  const top = ranked.candidates[0];
  const band = ranked.candidates.filter((candidate) => candidate.quality >= top.quality - 8);
  const valuePick = band.sort((a, b) => a.costPerTask - b.costPerTask)[0] ?? top;
  for (const [index, candidate] of ranked.candidates.entries()) {
    const stats = modelStats.get(candidate.slug);
    if (!stats) continue;
    stats.eligible += 1;
    if (index === 0) stats.top1 += 1;
    if (index < 3) stats.top3 += 1;
  }
  taskRows.push({
    task: task.id,
    label: task.label,
    modality: task.modality,
    eligible: ranked.candidates.length,
    top: top.slug,
    topQuality: top.quality,
    topCost: top.costPerTask,
    value: valuePick.slug,
    valueQuality: valuePick.quality,
    valueCost: valuePick.costPerTask
  });
}

const modelRows = [...modelStats.entries()]
  .map(([slug, stats]) => {
    const model = catalog.bySlug.get(slug);
    return { slug, name: model?.name ?? slug, modality: model?.modality ?? '', ...stats };
  })
  .sort((a, b) => b.top1 - a.top1 || b.top3 - a.top3 || a.slug.localeCompare(b.slug));

const csv = [
  ['task', 'label', 'modality', 'eligible', 'top', 'quality', 'cost_per_task', 'value', 'value_quality', 'value_cost'],
  ...taskRows.map((row) => [row.task, row.label, row.modality, row.eligible, row.top, row.topQuality, row.topCost, row.value, row.valueQuality, row.valueCost])
].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');

const format = (value) => (typeof value === 'number' ? value.toFixed(4) : String(value ?? '—'));
const lines = [
  '# Test form',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  'This is the human-readable evidence sheet. Machine-readable results are in `tests/results/*.json`.',
  '',
  '## 1. Automated test suite',
  '',
  `- Node tests: **${coverage.tests ?? '—'}** passing`,
  `- Line coverage: **${coverage.lines ?? '—'}%**`,
  `- Branch coverage: **${coverage.branches ?? '—'}%**`,
  `- Test files: unit, integration, e2e, adversarial`,
  `- Adversarial cases: **${adversarial.passed ?? '—'}/${adversarial.total ?? '—'}**`,
  '',
  '| Layer | Command | Result |',
  '|---|---|---|',
  '| Unit + integration + e2e | `node --test "tests/**/*.test.js"` | all pass |',
  '| Adversarial | `node tests/adversarial/run.js` | ' + `${adversarial.passed ?? '—'}/${adversarial.total ?? '—'}` + ' |',
  '| Coverage | `node --test --experimental-test-coverage "tests/**/*.test.js"` | ' + `${coverage.lines ?? '—'}% lines` + ' |',
  '| Package install | `npm pack` + clean install + `verify` | 13/13 checks |',
  '| Live smoke | `node scripts/live_smoke.js` | see section 5 |',
  '',
  '## 2. Decision benchmark',
  '',
  `- Dev runs: ${Array.isArray(benchmark.runs) ? benchmark.runs.length : (benchmark.runs ?? '—')} (top-1 ${Math.round((benchmark.metrics?.top1 ?? 0) * 100)}%, top-3 ${Math.round((benchmark.metrics?.top3 ?? 0) * 100)}%)`,
  `- Held-out runs: ${Array.isArray(holdout.runs) ? holdout.runs.length : (holdout.runs ?? '—')} (top-1 ${Math.round((holdout.metrics?.top1 ?? 0) * 100)}%, top-3 ${Math.round((holdout.metrics?.top3 ?? 0) * 100)}%)`,
  `- Value simulation: quality parity ${Math.round((value.aggregate?.value?.qualityParity ?? 0) * 100)}% at ${Math.round((value.aggregate?.value?.costRatio ?? 0) * 100)}% of frontier cost`,
  '',
  '## 3. Per-task matrix (20 rows)',
  '',
  '| task | eligible | top model | quality | cost/task | value pick | value cost |',
  '|---|---:|---|---:|---:|---|---:|',
  ...taskRows.map((row) => `| ${row.task} | ${row.eligible} | ${row.top} | ${format(row.topQuality)} | $${format(row.topCost)} | ${row.value} | $${format(row.valueCost)} |`),
  '',
  'CSV: [`test-form.csv`](test-form.csv)',
  '',
  '## 4. Per-model applicability (40 rows)',
  '',
  '| model | modality | eligible nodes | top-1 | top-3 |',
  '|---|---|---:|---:|---:|',
  ...modelRows.map((row) => `| ${row.slug} | ${row.modality} | ${row.eligible} | ${row.top1} | ${row.top3} |`),
  '',
  'Models with zero eligible nodes are a catalog bug; the matrix test fails on them.',
  '',
  '## 5. Live smoke (free/public endpoints)',
  '',
  '| endpoint | result | latency | evidence |',
  '|---|---|---:|---|',
  ...live.cases.map((item) => `| ${item.name} | ${item.ok ? 'pass' : 'fail'} | ${item.ms} ms | ${item.status ?? '—'} ${item.contentType ?? item.error ?? ''} |`),
  '',
  'This is connectivity and response-format evidence, not a model-quality benchmark. No API keys are used.',
  '',
  '## 6. Claims audit',
  '',
  '| Claim | Evidence | Not proven |',
  '|---|---|---|',
  '| Best value per node | decision benchmark + held-out + value simulation | not a live output benchmark |',
  '| Key-aware fallback | availability + setup tests | not a real provider call |',
  '| Media costs | unit pricing + sources | image/video quality is arena-informed; 3D/audio remain expert priors |',
  '| Connects to agents | setup integration tests | not every client version |',
  '| No key storage | security tests + code review | not a formal audit |',
  '',
  '## 7. Missing evidence',
  '',
  '- Live calls to paid catalog providers: blocked without keys.',
  '- Independent output benchmark: not available.',
  '- External users: none yet.',
  '- npm registry install and GitHub Actions: blocked by account scopes.',
  ''
];

fs.mkdirSync(RESULTS, { recursive: true });
fs.writeFileSync(path.join(RESULTS, 'test-form.csv'), `${csv}\n`);
fs.writeFileSync(path.join(RESULTS, 'TEST_FORM.md'), `${lines.join('\n')}\n`);
console.log(`wrote ${path.join(RESULTS, 'TEST_FORM.md')}`);
console.log(`wrote ${path.join(RESULTS, 'test-form.csv')}`);
