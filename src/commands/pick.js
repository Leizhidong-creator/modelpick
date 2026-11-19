import { recommend } from '../core/recommend.js';
import { readVerdict } from '../core/decision.js';
import { renderHeader, renderRecommendation } from '../cli/format.js';
import { ModelPickError } from '../core/errors.js';
import { numberOption, csvOption } from '../util/args.js';

export async function runPick(ctx) {
  const query = ctx.positionals.join(' ').trim();
  if (!query && !ctx.options.task) {
    throw new ModelPickError('Tell me what you are trying to do.', {
      code: 'ERR_MISSING_TASK',
      hint: 'Example: modelpick pick "generate a 3D game asset"',
      exitCode: 2
    });
  }
  const catalog = ctx.loadCatalog();
  const verdict = ctx.options.verdict ? readVerdict(ctx.options.verdict) : undefined;
  const result = recommend(catalog, {
    query,
    task: ctx.options.task,
    optimize: ctx.options.optimize ?? ctx.config.defaultOptimize ?? 'balanced',
    maxCost: numberOption(ctx.options, 'max-cost'),
    minQuality: numberOption(ctx.options, 'min-quality', { max: 100 }),
    openWeights: Boolean(ctx.flags['open-weights'] || ctx.flags.local),
    contextTokens: numberOption(ctx.options, 'context', { min: 1 }),
    excludeProviders: csvOption(ctx.options, 'exclude'),
    availableOnly: Boolean(ctx.flags.available || ctx.flags['only-available']),
    verdict,
    topK: numberOption(ctx.options, 'top', { min: 1, max: 10 }) ?? 3
  });

  if (ctx.json) {
    console.log(JSON.stringify(result, null, 2));
    if (result.error) process.exitCode = 3;
    return;
  }

  if (ctx.flags.quiet) {
    if (result.recommendation) console.log(`${result.recommendation.slug}\t${result.recommendation.costPerTask}`);
    else process.exitCode = 3;
    return;
  }

  const header = renderHeader(
    { version: ctx.version, catalogVersion: result.catalog.version, updatedAt: result.catalog.updatedAt },
    { style: ctx.style }
  );
  console.log(header);
  console.log(renderRecommendation(result, { style: ctx.style, explain: Boolean(ctx.flags.explain) }));
  if (result.error) process.exitCode = 3;
}
