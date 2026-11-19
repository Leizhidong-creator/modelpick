import { renderModels } from '../cli/format.js';
import { qualityFor } from '../core/score.js';
import { findTask } from '../core/tasks.js';
import { modelAvailability } from '../core/availability.js';
import { ModelPickError } from '../core/errors.js';

export async function runModels(ctx) {
  const catalog = ctx.loadCatalog();
  let models = catalog.models;
  if (ctx.options.modality) models = models.filter((model) => model.modality === ctx.options.modality);
  if (ctx.options.provider) models = models.filter((model) => model.provider.id === ctx.options.provider);
  if (ctx.options.tag) models = models.filter((model) => model.tags?.includes(ctx.options.tag));
  if (ctx.flags['open-weights'] || ctx.flags.local) models = models.filter((model) => model.openWeights);
  if (ctx.flags.available || ctx.flags['only-available']) {
    models = models.filter((model) => modelAvailability(model).ready);
  }

  let task = null;
  if (ctx.options.task) {
    task = findTask(catalog, ctx.options.task);
    if (!task) throw new ModelPickError(`Unknown task: ${ctx.options.task}`, { code: 'ERR_UNKNOWN_TASK' });
    models = models.filter((model) => model.modality === task.modality);
    models = [...models].sort((a, b) => qualityFor(b, task) - qualityFor(a, task));
  } else {
    models = [...models].sort((a, b) => b.quality.overall - a.quality.overall);
  }

  if (ctx.options.search) {
    const needle = String(ctx.options.search).toLowerCase();
    models = models.filter((model) => `${model.name} ${model.slug} ${model.provider.name}`.toLowerCase().includes(needle));
  }

  if (ctx.json) {
    console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'models', count: models.length, models }, null, 2));
    return;
  }
  if (!models.length) {
    console.log('No models matched those filters.');
    return;
  }
  console.log(renderModels(models, { style: ctx.style }));
  if (task) console.log(`\n  ${ctx.style.dim(`Ranked for ${task.label} (${task.id})`)}`);
}
