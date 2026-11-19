import { compare } from '../core/recommend.js';
import { renderCompare } from '../cli/format.js';
import { ModelPickError } from '../core/errors.js';
import { findTask } from '../core/tasks.js';

export async function runCompare(ctx) {
  const slugs = ctx.positionals;
  if (slugs.length < 2) {
    throw new ModelPickError('Compare needs at least two models.', {
      code: 'ERR_MISSING_MODELS',
      hint: 'Example: modelpick compare claude-fable-5.2 gemini-4-carbon --task coding-agent',
      exitCode: 2
    });
  }
  const catalog = ctx.loadCatalog();
  let task = ctx.options.task;
  if (!task) {
    const detected = findTask(catalog, ctx.options.query ?? '');
    if (!detected) {
      throw new ModelPickError('Which task should these models be compared on?', {
        code: 'ERR_MISSING_TASK',
        hint: 'Pass --task coding-agent (or another id from `modelpick tasks`).',
        exitCode: 2
      });
    }
    task = detected.id;
  }
  const result = compare(catalog, slugs, { task });
  if (ctx.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderCompare(result, { style: ctx.style }));
}
