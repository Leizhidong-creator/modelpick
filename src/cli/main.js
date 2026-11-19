import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../util/args.js';
import { colorEnabled, symbols } from '../util/ansi.js';
import { ModelPickError } from '../core/errors.js';
import { loadCatalog } from '../core/catalog.js';
import { readConfig } from '../core/config.js';
import { makeStyle } from './format.js';

const COMMANDS = new Set([
  'pick', 'choose', 'recommend', 'plan', 'compare', 'models', 'list', 'tasks',
  'setup', 'mcp', 'doctor', 'keys', 'update', 'bench', 'add-model', 'show', 'decide', 'verify', 'version', 'help'
]);

const ALIASES = { choose: 'pick', recommend: 'pick', list: 'models' };

function version() {
  const pkgPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
}

function helpText(style) {
  const b = (text) => style.bold(text);
  const c = (text) => style.cyan(text);
  return `
${b('modelpick')} — pick the right model at every step.

${b('USAGE')}
  modelpick ${c('pick')} "generate a 3D game asset"
  modelpick ${c('plan')} "launch video for my coffee brand"
  modelpick ${c('compare')} claude-fable-5.2 gemini-4-carbon --task coding-agent
  modelpick ${c('setup')} claude-code          # write MCP config + skill
  modelpick ${c('mcp')}                        # stdio MCP server
  modelpick ${c('doctor')}                     # check keys, config, freshness

${b('CORE COMMANDS')}
  pick <task>        Rank models for one workflow node (alias: choose)
                     (--max-cost, --open-weights, --available, --verdict)
  plan <goal>        Multi-step workflow with a model per step
  compare <a> <b..>  Side-by-side cost per solved task
  models             Browse the catalog (--modality, --provider, --task)
  tasks              List supported task nodes

${b('AGENT INTEGRATION')}
  setup [agent]      Configure Claude Code, Codex, Cursor, DSH, or generic MCP
                     (--global, --write, --profile for DSH; --dry-run to preview)
  mcp                Run the Model Context Protocol server (stdio)
  keys               Show required key env vars (never prints values)
  doctor             Diagnose install, keys, catalog freshness

${b('MAINTAIN')}
  update             Refresh the price/ID snapshot from GitHub
  bench              Run the offline decision benchmark
  add-model <file>   Add a private/custom model to ~/.modelpick/overrides.json
                     (--example prints a template, --remove <slug> deletes)
  show <model>       Endpoint, auth, SDK, curl example, and evidence for one model
  decide <task>      Build a portable decision packet for any judge/decision model
  verify             Verify catalog, evidence, benchmark, and package hashes

${b('OPTIONS')}
  --task <id>        Force a task node (see modelpick tasks)
  --optimize <mode>  balanced | value | quality | cost | speed | privacy
  --max-cost <usd>   Budget per solved task
  --min-quality <n>  Quality floor (0-100)
  --open-weights     Only open-weight models
  --available        Only models whose provider key is present
  --context <n>      Input tokens required (filters context windows)
  --exclude <ids>    Comma-separated provider ids to exclude
  --top <n>          Number of alternatives (default 3)
  --json             Machine-readable output for agents and CI
  --explain          Show the scoring math
  --no-color         Plain text (NO_COLOR also works)

${b('EXAMPLES')}
  modelpick pick "refactor this 40k-line repo, cheapest that works"
  modelpick pick "edit this product photo, remove background" --json
  modelpick plan "30s product launch video" --optimize cost
  modelpick pick "classify 2M support tickets" --max-cost 0.001
  modelpick pick "refactor this repo" --available
  modelpick show tripo-h3.1
  modelpick add-model --example > my-model.json

${style.dim('Catalog is a dated snapshot. Prices change; verify before committing budget.')}
`;
}

function printError(error, { json, style }) {
  if (json) {
    const payload = error instanceof ModelPickError ? error.toJSON() : { error: 'ERR_UNEXPECTED', message: error.message };
    console.error(JSON.stringify(payload, null, 2));
  } else {
    console.error(`\n${style.red(symbols().cross)} ${error.message}`);
    if (error.hint) console.error(`  ${style.dim('hint:')} ${error.hint}`);
  }
}

/**
 * @param {string[]} argv
 */
export async function main(argv) {
  const args = parseArgs(argv);
  const flags = args.flags;
  const json = Boolean(flags.json);
  const style = makeStyle(colorEnabled() && !flags['no-color']);
  const pkgVersion = version();

  if (flags.version) {
    console.log(pkgVersion);
    return;
  }

  let command = args.command;
  if (command && !COMMANDS.has(command)) {
    args.positionals.unshift(command);
    command = 'pick';
  }
  if (!command) command = args.positionals.length ? 'pick' : 'help';
  command = ALIASES[command] ?? command;

  if (flags.help || command === 'help') {
    console.log(helpText(style));
    return;
  }

  if (command === 'version') {
    console.log(pkgVersion);
    return;
  }

  const config = readConfig();
  const ctx = {
    args,
    flags,
    options: args.options,
    positionals: args.positionals,
    json,
    style,
    version: pkgVersion,
    config,
    loadCatalog: () => loadCatalog({ preferCache: !flags['no-cache'] })
  };

  try {
    switch (command) {
      case 'pick': {
        const { runPick } = await import('../commands/pick.js');
        await runPick(ctx);
        break;
      }
      case 'plan': {
        const { runPlan } = await import('../commands/plan.js');
        await runPlan(ctx);
        break;
      }
      case 'compare': {
        const { runCompare } = await import('../commands/compare.js');
        await runCompare(ctx);
        break;
      }
      case 'models': {
        const { runModels } = await import('../commands/models.js');
        await runModels(ctx);
        break;
      }
      case 'tasks': {
        const { runTasks } = await import('../commands/tasks.js');
        await runTasks(ctx);
        break;
      }
      case 'setup': {
        const { runSetup } = await import('../commands/setup.js');
        await runSetup(ctx);
        break;
      }
      case 'mcp': {
        const { runMcp } = await import('../commands/mcp.js');
        await runMcp(ctx);
        break;
      }
      case 'doctor': {
        const { runDoctor } = await import('../commands/doctor.js');
        await runDoctor(ctx);
        break;
      }
      case 'keys': {
        const { runKeys } = await import('../commands/keys.js');
        await runKeys(ctx);
        break;
      }
      case 'update': {
        const { runUpdate } = await import('../commands/update.js');
        await runUpdate(ctx);
        break;
      }
      case 'bench': {
        const { runBench } = await import('../commands/bench.js');
        await runBench(ctx);
        break;
      }
      case 'add-model': {
        const { runAddModel } = await import('../commands/add-model.js');
        await runAddModel(ctx);
        break;
      }
      case 'show': {
        const { runShow } = await import('../commands/show.js');
        await runShow(ctx);
        break;
      }
      case 'decide': {
        const { runDecide } = await import('../commands/decide.js');
        await runDecide(ctx);
        break;
      }
      case 'verify': {
        const { runVerify } = await import('../commands/verify.js');
        await runVerify(ctx);
        break;
      }
      default:
        throw new ModelPickError(`Unknown command: ${command}`, {
          code: 'ERR_UNKNOWN_COMMAND',
          hint: 'Run `modelpick help`.',
          exitCode: 2
        });
    }
  } catch (error) {
    printError(error, { json, style });
    process.exitCode = error instanceof ModelPickError ? error.exitCode : 1;
  }
}
