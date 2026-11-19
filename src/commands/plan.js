import { plan } from '../core/recommend.js';
import { renderHeader, renderPlan } from '../cli/format.js';
import { ModelPickError } from '../core/errors.js';
import { numberOption } from '../util/args.js';

export async function runPlan(ctx) {
  const goal = ctx.positionals.join(' ').trim();
  if (!goal) {
    throw new ModelPickError('Describe the workflow you want to plan.', {
      code: 'ERR_MISSING_GOAL',
      hint: 'Example: modelpick plan "30s product launch video"',
      exitCode: 2
    });
  }
  const catalog = ctx.loadCatalog();
  const result = plan(catalog, goal, {
    optimize: ctx.options.optimize ?? ctx.config.defaultOptimize ?? 'balanced',
    maxCost: numberOption(ctx.options, 'max-cost'),
    minQuality: numberOption(ctx.options, 'min-quality', { max: 100 }),
    openWeights: Boolean(ctx.flags['open-weights'] || ctx.flags.local)
  });

  if (ctx.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(
    renderHeader(
      { version: ctx.version, catalogVersion: result.catalog.version, updatedAt: result.catalog.updatedAt },
      { style: ctx.style }
    )
  );
  console.log(renderPlan(result, { style: ctx.style }));
}
