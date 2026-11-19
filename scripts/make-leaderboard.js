#!/usr/bin/env node
import fs from 'node:fs';
import { loadCatalog } from '../src/core/catalog.js';
import { rankModels } from '../src/core/score.js';

const catalog = loadCatalog({ preferCache: false });
const tasks = ['coding-agent', 'code-review', 'long-context', 'image-gen', 'video-gen', '3d-gen', 'tts', 'stt'];

function money(value) {
  if (value == null) return '—';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

const lines = [
  '# ModelPick leaderboard',
  '',
  `Catalog \`${catalog.catalogVersion}\` · generated ${new Date().toISOString().slice(0, 10)} · [methodology](../bench/METHODOLOGY.md)`,
  '',
  'Two tables per node: **quality-first** (what to use when the output matters) and **value** (what to use when it does not). Cost is **cost per solved task**, not list price. The full interactive tool is `modelpick pick`.',
  '',
  '| Key | Meaning |',
  '|---|---|',
  '| quality | 0–100, derived from public benchmarks and capability fit |',
  '| cost | USD per solved task (price × expected attempts) |',
  '| attempts | expected attempts at this quality |',
  '| ctx | context window for text models |',
  ''
];

for (const taskId of tasks) {
  const task = catalog.taskById.get(taskId);
  const ranked = rankModels(catalog, task, { limit: 50, constraints: { minQuality: 0 } });
  const all = ranked.all;
  const quality = [...all].sort((a, b) => b.quality - a.quality || a.costPerTask - b.costPerTask).slice(0, 8);
  const value = [...all]
    .filter((item) => item.quality >= (task.defaults?.qualityFloor ?? 60))
    .sort((a, b) => a.costPerTask - b.costPerTask || b.quality - a.quality)
    .slice(0, 6);
  lines.push(`## ${task.label}`, '', `\`${task.id}\` · ${task.modality}`, '');
  lines.push('**Quality first**', '', '| # | model | quality | cost / solved | attempts |', '|---:|---|---:|---:|---:|');
  quality.forEach((item, index) => {
    lines.push(`| ${index + 1} | ${item.name} | ${item.quality.toFixed(1)} | ${money(item.costPerTask)} | ${item.attempts.toFixed(2)} |`);
  });
  lines.push('', '**Value**', '', '| # | model | quality | cost / solved | attempts |', '|---:|---|---:|---:|---:|');
  value.forEach((item, index) => {
    lines.push(`| ${index + 1} | ${item.name} | ${item.quality.toFixed(1)} | ${money(item.costPerTask)} | ${item.attempts.toFixed(2)} |`);
  });
  lines.push('');
}

lines.push('## Notes', '', '- Prices and model ids are a snapshot; run `modelpick update` or check the source link in the catalog.', '- Media quality scores are priors, not independent measurements. See [DATA.md](DATA.md).', '- The benchmark and raw failures are in [`tests/results/`](../tests/results/).', '');

fs.writeFileSync('docs/LEADERBOARD.md', `${lines.join('\n')}`);
console.log('wrote docs/LEADERBOARD.md');
