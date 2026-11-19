import path from 'node:path';
import { installAgent, detectAgents, AGENTS, ROOT } from '../integrations/index.js';
import { ModelPickError } from '../core/errors.js';

function fmtAction(action, cwd) {
  const rel = path.relative(cwd, action.file) || action.file;
  const verb = action.action ?? (action.changed ? 'write' : 'unchanged');
  return `  ${verb.padEnd(9)} ${rel}`;
}

export async function runSetup(ctx) {
  const requested = ctx.positionals[0];
  let agents;
  if (requested) {
    const match = AGENTS.find((agent) => agent.id === requested || agent.label.toLowerCase().includes(requested.toLowerCase()));
    if (!match) {
      throw new ModelPickError(`Unknown agent: ${requested}`, {
        code: 'ERR_UNKNOWN_AGENT',
        hint: `Choose one of: ${AGENTS.map((agent) => agent.id).join(', ')}`
      });
    }
    agents = [match.id];
  } else {
    agents = detectAgents();
  }

  const npxCache = /[\\/]_npx[\\/]|[\\/]npm-cache[\\/]/i.test(ROOT);
  const mode = ctx.flags.portable || npxCache ? 'npx' : (ctx.options.mode ?? 'node');
  const results = [];
  for (const agent of agents) {
    results.push(
      installAgent(agent, {
        cwd: process.cwd(),
        global: Boolean(ctx.flags.global),
        write: Boolean(ctx.flags.write),
        profile: ctx.options.profile,
        codexConfig: ctx.options['codex-config'],
        dryRun: Boolean(ctx.flags['dry-run']),
        mode
      })
    );
  }

  if (ctx.json) {
    console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'setup', mode, results }, null, 2));
    return;
  }

  console.log(`\n  ${ctx.style.bold('ModelPick setup')} ${ctx.style.dim(ctx.flags['dry-run'] ? '(dry run)' : '')}`);
  console.log(`  ${ctx.style.dim('MCP server:')} ${results[0].server.command} ${results[0].server.args.join(' ')}`);
  for (const result of results) {
    console.log(`\n  ${ctx.style.cyan(result.agent)}`);
    for (const action of result.actions) console.log(fmtAction(action, process.cwd()));
    for (const note of result.notes) console.log(`  ${ctx.style.dim('→')} ${note}`);
  }
  console.log(`\n  ${ctx.style.green('Done.')} Restart the agent, then ask it: ${ctx.style.italic('"pick a model for a 3D game asset"')}`);
  console.log(`  ${ctx.style.dim('Verify with')} ${ctx.style.cyan('modelpick doctor')}\n`);
}
