import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runBench(ctx) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const mod = await import(path.join(root, 'bench', 'run.js'));
  const result = await mod.runBench({ quiet: Boolean(ctx.json) });
  if (ctx.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(mod.formatSummary(result, ctx.style));
  if (!result.passed) process.exitCode = 1;
}
