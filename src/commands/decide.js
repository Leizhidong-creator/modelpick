import { recommend } from '../core/recommend.js';
import { buildDecisionPacket } from '../core/decision.js';
import { ModelPickError } from '../core/errors.js';

export async function runDecide(ctx) {
  const query = ctx.positionals.join(' ').trim();
  if (!query && !ctx.options.task) {
    throw new ModelPickError('Describe the node you want a decision packet for.', {
      code: 'ERR_MISSING_TASK',
      hint: 'Example: modelpick decide "rigged 3D character"'
    });
  }
  const catalog = ctx.loadCatalog();
  const result = recommend(catalog, {
    query,
    task: ctx.options.task,
    optimize: ctx.options.optimize ?? ctx.config.defaultOptimize ?? 'balanced',
    maxCost: ctx.options['max-cost'] ? Number(ctx.options['max-cost']) : undefined,
    openWeights: Boolean(ctx.flags['open-weights'] || ctx.flags.local),
    topK: ctx.options.top ? Number(ctx.options.top) : 3
  });
  if (result.error) {
    throw new ModelPickError(result.message ?? 'No eligible model for this node.', {
      code: result.error,
      hint: 'Relax the constraints, then try again.'
    });
  }
  const packet = buildDecisionPacket(result);
  if (ctx.json) {
    console.log(JSON.stringify(packet, null, 2));
    return;
  }
  const s = ctx.style;
  console.log(`\n  ${s.bold('Decision packet')} ${s.dim('·')} ${result.task.label}`);
  console.log(`  ${s.dim('Send the prompt below to any judge/decision model, then apply the verdict locally.')}\n`);
  console.log(`  ${s.dim('allowed models')}`);
  for (const candidate of packet.candidates) {
    console.log(`  ${candidate.label}  ${candidate.name.padEnd(30)} quality ${candidate.quality}  $${candidate.costPerTask.toFixed(4)}  ${candidate.slug}`);
  }
  console.log(`\n  ${s.dim('PROMPT')}\n`);
  console.log(packet.prompt.split('\n').map((line) => `  ${line}`).join('\n'));
  console.log(`\n  ${s.dim('Save the judge JSON as verdict.json, then:')}`);
  console.log(`  ${s.cyan(`modelpick pick "${query || result.task.label}" --verdict verdict.json`)}\n`);
}
