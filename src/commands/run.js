import { ModelPickError } from '../core/errors.js';
import { DEFAULT_OLLAMA_HOST, DEFAULT_OLLAMA_MODEL, generateLocal, listOllamaModels } from '../core/ollama.js';
import { runRecommended } from '../core/run-service.js';

function isLocal(ctx) {
  return Boolean(ctx.flags.local) || ctx.options.provider === 'ollama';
}

export async function runLocalStatus(ctx) {
  const host = ctx.options.host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;
  const status = await listOllamaModels({ host });
  if (ctx.json) {
    console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'ollama-status', host, ...status }, null, 2));
    return;
  }
  const s = ctx.style;
  console.log(`\n  ${status.running ? s.green('✓ running') : s.yellow('! not running')} ${s.dim(host)}`);
  if (status.models.length) console.log(`  ${s.dim(status.models.join(', '))}\n`);
  else console.log(`  ${s.dim('Install: https://ollama.com · then `ollama pull qwen2.5:0.5b`')}\n`);
}

export async function runLocal(ctx) {
  if (ctx.flags.status) return runLocalStatus(ctx);
  const prompt = ctx.positionals.join(' ').trim();
  if (!prompt) {
    throw new ModelPickError('Describe what the model should do.', {
      code: 'ERR_MISSING_PROMPT',
      hint: 'Example: modelpick run "explain this function"'
    });
  }

  if (isLocal(ctx)) {
    const host = ctx.options.host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;
    const model = ctx.options.model ?? DEFAULT_OLLAMA_MODEL;
    const result = await generateLocal({ prompt, model, host });
    if (ctx.json) {
      console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'local-run', ...result }, null, 2));
      return;
    }
    const s = ctx.style;
    console.log(`\n  ${s.bold('Local run')} ${s.dim(`· ${model} · no key`)}\n`);
    console.log(result.output.trim());
    console.log(`\n  ${s.dim(`input ${result.usage.inputTokens} tok · output ${result.usage.outputTokens} tok · ${Math.round(result.usage.totalDurationMs)}ms`)}\n`);
    return;
  }

  const catalog = ctx.loadCatalog();
  const maxTokens = ctx.options['max-tokens'] ? Number(ctx.options['max-tokens']) : undefined;
  const result = await runRecommended({
    catalog,
    prompt,
    model: ctx.options.model,
    task: ctx.options.task,
    provider: ctx.options.provider,
    maxTokens
  });
  if (ctx.json) {
    console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'run', ...result }, null, 2));
    return;
  }
  const s = ctx.style;
  console.log(`\n  ${s.bold(result.name)} ${s.dim(`· ${result.provider} · ${result.adapter}`)}\n`);
  console.log(result.output.trim());
  const cost = result.cost === null ? 'cost unavailable' : `$${result.cost.toFixed(6)}`;
  console.log(`\n  ${s.dim(`input ${result.usage.inputTokens} tok · output ${result.usage.outputTokens} tok · ${cost}`)}\n`);
}
