import fs from 'node:fs';
import path from 'node:path';
import { evaluateRuns } from '../core/evaluate.js';
import { ModelPickError } from '../core/errors.js';

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
    input = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
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

  const s = ctx.style;
  console.log(`\n  ${s.bold('User eval')} ${s.dim('·')} ${result.task.label} ${s.dim(`· ${result.runs} runs`)}\n`);
  console.log(`  ${'model'.padEnd(28)} ${'runs'.padStart(5)} ${'pass'.padStart(7)} ${'95% CI'.padStart(13)} ${'cost/solved'.padStart(13)}`);
  console.log(`  ${'─'.repeat(72)}`);
  for (const model of result.models) {
    const ci = `${Math.round(model.passRateLow * 100)}–${Math.round(model.passRateHigh * 100)}%`;
    const cost = model.costPerSolved == null ? '—' : `$${model.costPerSolved.toFixed(4)}`;
    const flag = model.enoughSamples ? '' : s.yellow(' *');
    console.log(
      `  ${model.name.slice(0, 27).padEnd(28)} ${String(model.runs).padStart(5)} ${`${Math.round(model.passRate * 100)}%`.padStart(7)} ${ci.padStart(13)} ${cost.padStart(13)}${flag}`
    );
  }
  console.log(`\n  ${s.dim('* fewer than')} ${result.minSamples} ${s.dim('runs; interval is too wide for a ranking claim.')}`);
  console.log(`  ${s.dim(result.caveat)}\n`);
}
