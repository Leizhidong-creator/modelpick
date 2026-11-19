import fs from 'node:fs';
import path from 'node:path';
import { evaluateRuns } from '../core/evaluate.js';
import { ModelPickError } from '../core/errors.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function reportHtml(result, source) {
  const rows = result.models.map((model) => {
    const ci = `${Math.round(model.passRateLow * 100)}–${Math.round(model.passRateHigh * 100)}%`;
    const cost = model.costPerSolved == null ? '—' : `$${model.costPerSolved.toFixed(4)}`;
    return `<tr><td>${esc(model.slug)}</td><td>${model.runs}</td><td>${model.solved}</td><td>${Math.round(model.passRate * 100)}%</td><td>${ci}</td><td>${model.meanAttempts.toFixed(2)}</td><td>${cost}</td><td>${model.catalogQuality ?? '—'}</td></tr>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ModelPick eval report</title>
<style>
body{margin:0;background:#070a0e;color:#f5efe4;font:16px/1.55 "Segoe UI",Arial,sans-serif}main{max-width:1100px;margin:0 auto;padding:48px 24px}
h1{font:700 42px/1.05 "Bodoni MT",Georgia,serif;margin:0 0 8px}p{color:#8b9aaa}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #263442}th{color:#8b9aaa;font:600 12px "Consolas";text-transform:uppercase}
td:nth-child(n+2){font-family:"Consolas",monospace}.note{border-left:2px solid #c9a96e;padding-left:14px;color:#8b9aaa;margin-top:24px}
</style></head><body><main>
<div style="font:600 13px Consolas;letter-spacing:.16em;color:#c9a96e;text-transform:uppercase">User eval · ${new Date().toISOString().slice(0, 10)}</div>
<h1>Your eval report</h1>
<p>${esc(result.task.label)} · ${result.runs} runs · source: ${esc(source)}</p>
<table><thead><tr><th>Model</th><th>Runs</th><th>Solved</th><th>Pass</th><th>Wilson 95%</th><th>Attempts</th><th>Cost / solved</th><th>Catalog quality</th></tr></thead><tbody>
${rows}
</tbody></table>
<p class="note">${esc(result.caveat)} Cost per solved is omitted if any run lacks a cost. Catalog quality is the task-weighted prior, not a measured output score.</p>
</main></body></html>`;
}


function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ''));
}

function csvToInput(text, taskOverride) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('CSV needs a header and at least one run');
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const index = (name) => header.indexOf(name);
  const need = ['model', 'passed'];
  for (const key of need) if (index(key) < 0) throw new Error(`CSV header needs ${key}`);
  const taskIndex = index('task');
  const runs = rows.slice(1).map((row, i) => {
    const get = (name) => (index(name) >= 0 ? String(row[index(name)] ?? '').trim() : '');
    const rawPassed = get('passed').toLowerCase();
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(rawPassed)) {
      throw new Error(`Row ${i + 2}: passed must be true/false`);
    }
    const passed = rawPassed === 'true' || rawPassed === '1' || rawPassed === 'yes';
    const costText = get('cost');
    const qualityText = get('quality');
    const attemptsText = get('attempts');
    return {
      task: taskIndex >= 0 ? get('task') : taskOverride,
      model: get('model'),
      passed,
      cost: costText === '' ? null : Number(costText),
      attempts: attemptsText === '' ? 1 : Number(attemptsText),
      quality: qualityText === '' ? null : Number(qualityText)
    };
  });
  const task = taskOverride || (taskIndex >= 0 ? runs[0].task : null);
  if (!task) throw new Error('CSV has no task column; pass --task <task-id>');
  for (const run of runs) if (!run.task) run.task = task;
  return { task, runs };
}

export async function runEval(ctx) {
  const file = ctx.positionals[0];
  if (!file) {
    throw new ModelPickError('Pass an eval JSON file.', {
      code: 'ERR_MISSING_EVAL',
      hint: 'Example: modelpick eval evals.json --json'
    });
  }
  let input;
  try {
    const raw = fs.readFileSync(path.resolve(file), 'utf8');
    input = /\.csv$/i.test(file) || ctx.flags.csv
      ? csvToInput(raw, ctx.options.task)
      : JSON.parse(raw);
  } catch (error) {
    throw new ModelPickError(`Could not read eval file: ${file}`, {
      code: 'ERR_EVAL_READ',
      hint: error.message
    });
  }
  const catalog = ctx.loadCatalog();
  let result;
  try {
    result = evaluateRuns(input, catalog, {
      minSamples: ctx.options['min-samples'] ? Number(ctx.options['min-samples']) : 5
    });
  } catch (error) {
    throw new ModelPickError(error.message, { code: 'ERR_EVAL_INVALID' });
  }

  if (ctx.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (ctx.options.html || ctx.flags.html) {
    const target = typeof ctx.options.html === 'string' ? path.resolve(ctx.options.html) : path.resolve('eval-report.html');
    fs.writeFileSync(target, reportHtml(result, file));
    console.log(`\n  Wrote ${target}\n`);
    return;
  }

  const s = ctx.style;
  console.log(`\n  ${s.bold('User eval')} ${s.dim('·')} ${result.task.label} ${s.dim(`· ${result.runs} runs`)}\n`);
  console.log(`  ${'model'.padEnd(28)} ${'runs'.padStart(5)} ${'pass'.padStart(7)} ${'95% CI'.padStart(13)} ${'cost/solved'.padStart(13)}`);
  console.log(`  ${'─'.repeat(72)}`);
  for (const model of result.models) {
    const ci = `${Math.round(model.passRateLow * 100)}–${Math.round(model.passRateHigh * 100)}%`;
    const cost = model.costPerSolved == null ? (model.costCoverage === 'partial' ? '— *' : '—') : `$${model.costPerSolved.toFixed(4)}`;
    const flag = model.enoughSamples ? '' : s.yellow(' *');
    console.log(
      `  ${model.name.slice(0, 27).padEnd(28)} ${String(model.runs).padStart(5)} ${`${Math.round(model.passRate * 100)}%`.padStart(7)} ${ci.padStart(13)} ${cost.padStart(13)}${flag}`
    );
  }
  console.log(`\n  ${s.dim('* fewer than')} ${result.minSamples} ${s.dim('runs; interval is too wide for a ranking claim.')}`);
  console.log(`  ${s.dim('— * means at least one run has no cost, so cost per solved is omitted rather than shown as $0.')}`);
  console.log(`  ${s.dim(result.caveat)}\n`);
}
