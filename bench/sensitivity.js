#!/usr/bin/env node
/** Sensitivity of the value pick to the two assumptions users cannot see: the
 * quality tolerance and the retry curve. If the pick flips wildly, the claim is
 * fragile and the UI should say so. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/core/catalog.js';
import { rankModels } from '../src/core/score.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TASKS = ['coding-agent', 'image-gen', 'video-gen', '3d-gen', 'tts'];
const TOLERANCES = [3, 8, 10];
const RETRIES = [0.8, 1.15, 1.5];

const catalog = loadCatalog({ preferCache: false });

function snapshot(label, options = {}) {
  return TASKS.map((taskId) => {
    const task = catalog.taskById.get(taskId);
    const ranked = rankModels(catalog, task, {
      limit: 50,
      valueTolerance: options.tolerance,
      retryMultiplier: options.retry
    });
    const value = ranked.value;
    const best = Math.max(...ranked.all.map((item) => item.quality));
    const frontier = ranked.all.reduce((cheapest, item) => (item.costPerTask < cheapest.costPerTask ? item : cheapest), ranked.all[0]);
    return {
      task: taskId,
      value: value.slug,
      quality: value.quality,
      qualityGap: Math.round((best - value.quality) * 10) / 10,
      cost: value.costPerTask,
      costRatio: Math.round((value.costPerTask / frontier.costPerTask) * 1000) / 1000,
      label
    };
  });
}

const toleranceRows = [];
for (const tolerance of TOLERANCES) {
  toleranceRows.push({ tolerance, picks: snapshot(`tolerance ${tolerance}`, { tolerance }) });
}

const retryRows = [];
for (const multiplier of RETRIES) {
  retryRows.push({ multiplier, picks: snapshot(`retry ${multiplier}`, { retry: multiplier }) });
}

const flips = (rows, key) => {
  const byTask = new Map();
  for (const row of rows) for (const pick of row.picks) {
    if (!byTask.has(pick.task)) byTask.set(pick.task, new Set());
    byTask.get(pick.task).add(pick[key]);
  }
  return [...byTask.values()].filter((set) => set.size > 1).length;
};

const result = {
  schemaVersion: '1.0',
  kind: 'sensitivity',
  generatedAt: new Date().toISOString(),
  toleranceRows,
  retryRows,
  flips: {
    tolerance: flips(toleranceRows, 'value'),
    retry: flips(retryRows, 'value')
  }
};
fs.writeFileSync(path.join(ROOT, 'tests', 'results', 'sensitivity-latest.json'), `${JSON.stringify(result, null, 2)}\n`);

console.log('\n  Tolerance sensitivity (value pick)');
console.log('  task            tol=3                tol=6                tol=10');
for (let i = 0; i < TASKS.length; i += 1) {
  const cells = TOLERANCES.filter((t) => [3, 8, 10].includes(t)).map((t) => {
    const row = toleranceRows.find((item) => item.tolerance === t);
    const pick = row.picks[i];
    return `${pick.value} $${pick.cost.toFixed(3)}`;
  });
  console.log(`  ${TASKS[i].padEnd(15)} ${cells.map((cell) => cell.padEnd(20)).join('')}`);
}
console.log(`\n  Value pick flips across tolerance: ${result.flips.tolerance}/5 tasks`);
console.log(`  Value pick flips across retry multiplier: ${result.flips.retry}/5 tasks`);
console.log('  Raw: tests/results/sensitivity-latest.json\n');
