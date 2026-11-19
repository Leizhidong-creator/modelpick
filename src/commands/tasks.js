import { taskListText } from '../core/tasks.js';

export async function runTasks(ctx) {
  const catalog = ctx.loadCatalog();
  if (ctx.json) {
    console.log(
      JSON.stringify(
        {
          schemaVersion: '1.0',
          kind: 'tasks',
          count: catalog.tasks.length,
          tasks: catalog.tasks.map((task) => ({
            id: task.id,
            label: task.label,
            modality: task.modality,
            blurb: task.blurb
          }))
        },
        null,
        2
      )
    );
    return;
  }
  console.log(`\n  ${ctx.style.bold('Task nodes')} ${ctx.style.dim(`(${catalog.tasks.length})`)}\n`);
  console.log(
    taskListText(catalog)
      .split('\n')
      .map((line) => (line.startsWith('  ') ? line : `\n  ${ctx.style.cyan(line)}`))
      .join('\n')
  );
  console.log(`\n  ${ctx.style.dim('Use an id with --task, e.g. modelpick pick "..." --task 3d-gen')}`);
}
