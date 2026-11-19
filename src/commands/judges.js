import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT } from '../core/catalog.js';

function loadJudges() {
  const file = path.join(PACKAGE_ROOT, 'catalog', 'decision-models.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export async function runJudges(ctx) {
  const data = loadJudges();
  if (ctx.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  const s = ctx.style;
  console.log(`\n  ${s.bold('Decision / judge models')}  ${s.dim(`catalog ${data.updated}`)}`);
  console.log(`  ${s.dim('Not generation models. Use them to judge a shortlist, not to write the asset.')}\n`);
  for (const model of data.models) {
    const price = model.pricing.input === 0 ? 'free' : `$${model.pricing.input}/1M in`;
    console.log(`  ${s.cyan(model.id.padEnd(22))} ${model.name}`);
    console.log(`  ${' '.repeat(22)} ${model.provider} · ${price} · ${model.limits.contextTokens.toLocaleString()} ctx · ${model.status}`);
    console.log(`  ${' '.repeat(22)} ${model.env.join(', ')} · ${model.endpoint}`);
    console.log(`  ${' '.repeat(22)} ${model.notes}\n`);
  }
  console.log(`  ${s.dim('Use `modelpick decide "<task>"` to build a portable packet, then call one of these with your own key.')}`);
  console.log(`  ${s.dim('Live judge calls are not enabled by default; the packet is the stable interface.')}\n`);
}
