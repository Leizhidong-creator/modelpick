import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModelPickError } from '../core/errors.js';
import { backupFile } from '../core/config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BIN = path.join(ROOT, 'bin', 'modelpick.js');
const SKILL_SOURCE = path.join(ROOT, 'skills', 'modelpick', 'SKILL.md');
const REFERENCE_SOURCE = path.join(ROOT, 'skills', 'modelpick', 'reference.md');

const MARK_START = '<!-- modelpick:start -->';
const MARK_END = '<!-- modelpick:end -->';

export const AGENTS = [
  { id: 'claude-code', label: 'Claude Code', kind: 'plugin + MCP' },
  { id: 'codex', label: 'OpenAI Codex CLI', kind: 'MCP + portable skill' },
  { id: 'cursor', label: 'Cursor', kind: 'MCP + rules + skill' },
  { id: 'dsh', label: 'DeepSeek Harness', kind: 'skill + MCP plugin row' },
  { id: 'copilot', label: 'GitHub Copilot CLI', kind: 'MCP + skill' },
  { id: 'generic', label: 'Any AGENTS.md agent', kind: 'MCP + portable skill' }
];

function home(...parts) {
  return path.join(os.homedir(), ...parts);
}

function portableSkillPaths(cwd) {
  return [path.join(cwd, '.agents', 'skills', 'modelpick'), path.join(cwd, '.claude', 'skills', 'modelpick')];
}

/**
 * Build the MCP server command.
 * `node` is the most reliable default: no npx shim, no network, ~60ms startup.
 * `npx` is portable across machines once the package is published.
 */
export function mcpCommand({ mode = 'node', cwd = process.cwd() } = {}) {  if (mode === 'npx' || mode === 'github') {
    if (process.platform === 'win32') {
      return {
        command: 'cmd',
        args: ['/c', 'npx', '-y', 'github:Leizhidong-creator/modelpick', 'mcp'],
        label: 'npx from GitHub (Windows shim)'
      };
    }
    return {
      command: 'npx',
      args: ['-y', 'github:Leizhidong-creator/modelpick', 'mcp'],
      label: 'npx from GitHub'
    };
  }
  return { command: process.execPath, args: [BIN, 'mcp'], label: 'node (local install)' };
}

function mcpJson(server) {
  return { mcpServers: { modelpick: { command: server.command, args: server.args } } };
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function writeFile(file, content, { force = false } = {}) {
  if (fs.existsSync(file) && !force) {
    const current = fs.readFileSync(file, 'utf8');
    if (current === content) return { file, changed: false, reason: 'unchanged' };
  }
  ensureDir(file);
  const backup = fs.existsSync(file) ? backupFile(file) : null;
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content, { mode: 0o644 });
  fs.renameSync(tmp, file);
  return { file, changed: true, backup };
}

/** Merge one server into an existing mcpServers JSON object without clobbering siblings. */
function mergeMcpFile(file, server, { dryRun = false } = {}) {
  let data = {};
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8').trim();
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (error) {
        throw new ModelPickError(`Existing ${file} is not valid JSON; refusing to overwrite it.`, {
          code: 'ERR_INVALID_AGENT_CONFIG',
          hint: `Fix the JSON or merge this manually: ${JSON.stringify(mcpJson(server), null, 2)}`,
          details: error.message
        });
      }
    }
  }
  const next = {
    ...data,
    mcpServers: { ...(data.mcpServers ?? {}), modelpick: mcpJson(server).mcpServers.modelpick }
  };
  if (!dryRun) writeFile(file, `${JSON.stringify(next, null, 2)}\n`);
  return { file, changed: true, action: fs.existsSync(file) ? 'merged' : 'created', content: next };
}

function upsertBlock(file, block, { dryRun = false } = {}) {
  let current = '';
  if (fs.existsSync(file)) current = fs.readFileSync(file, 'utf8');
  let next;
  const regex = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`);
  if (regex.test(current)) {
    next = current.replace(regex, block);
  } else {
    next = `${current}${current && !current.endsWith('\n') ? '\n' : ''}${current ? '\n' : ''}${block}\n`;
  }
  if (dryRun) return { file, changed: next !== current, action: regex.test(current) ? 'updated' : 'appended' };
  const result = writeFile(file, next);
  return { ...result, action: regex.test(current) ? 'updated' : 'appended' };
}

function copySkill(dir, { dryRun = false } = {}) {
  const actions = [];
  const skill = fs.readFileSync(SKILL_SOURCE, 'utf8');
  const reference = fs.readFileSync(REFERENCE_SOURCE, 'utf8');
  actions.push(dryRun ? { file: path.join(dir, 'SKILL.md'), changed: true, action: 'write' } : writeFile(path.join(dir, 'SKILL.md'), skill));
  actions.push(dryRun ? { file: path.join(dir, 'reference.md'), changed: true, action: 'write' } : writeFile(path.join(dir, 'reference.md'), reference));
  return actions;
}

/**
 * Add a DSH MCP client row to a profile's cordis.patch.yml. DSH has no mcp.json:
 * MCP servers are Cordis plugin rows. We require an explicit `--write` because
 * this file is live application configuration.
 */
export function writeDshMcp(server, { profile = 'desktop', dryRun = false, dshHome } = {}) {
  const base = dshHome ?? home('.dsh');
  const file = path.join(base, 'profiles', profile, 'cordis.patch.yml');
  const block = `\n# modelpick:begin (managed by modelpick setup dsh --write)\n- id: mcp-modelpick\n  name: '@deepseek-ai/dsh-mcp-client'\n  config:\n    serverName: modelpick\n    transport: stdio\n    command: ${JSON.stringify(server.command)}\n    args: ${JSON.stringify(server.args)}\n# modelpick:end\n`;
  let current = '';
  if (fs.existsSync(file)) current = fs.readFileSync(file, 'utf8');
  if (current.includes('id: mcp-modelpick')) {
    return { file, changed: false, action: 'already-present' };
  }
  if (dryRun) return { file, changed: true, action: 'append', content: block };
  ensureDir(file);
  const backup = fs.existsSync(file) ? backupFile(file) : null;
  fs.appendFileSync(file, block, 'utf8');
  return { file, changed: true, action: 'appended', backup };
}

const AGENTS_BLOCK = `${MARK_START}
## Model selection (ModelPick)

Before you generate an image, video, 3D asset, or audio, start a long coding/refactor/review task, or quote a model price, call the \`modelpick\` MCP tools:

- \`pick_model\` — ranked model for one workflow node, with \`costPerTask\`, quality, latency, and key setup.
- \`plan_workflow\` — a multi-step deliverable (e.g. concept → 3D → render), one model per step.
- \`get_setup\` — the env var, key URL, docs, and API model id.

Use the tool's \`recommendation.setup.direct.env\` value; never invent prices or model ids. If MCP is not available, run:

\`\`\`bash
npx -y modelpick@latest pick "<what you are doing>" --json
\`\`\`

Report the chosen model and \`costPerTask\` in your final answer when the user cares about cost.
${MARK_END}`;

const CLAUDE_BLOCK = AGENTS_BLOCK.replace('## Model selection (ModelPick)', '## Model selection (ModelPick)');

export function installAgent(agentId, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const dryRun = Boolean(options.dryRun);
  const global = Boolean(options.global);
  const server = mcpCommand({ mode: options.mode ?? 'node', cwd });
  const actions = [];
  const notes = [];

  switch (agentId) {
    case 'claude-code': {
      if (global) {
        actions.push(mergeMcpFile(home('.claude.json'), server, { dryRun }));
        actions.push(...copySkill(home('.claude', 'skills', 'modelpick'), { dryRun }));
        notes.push('Restart Claude Code, then run `/mcp` to confirm the modelpick server is connected.');
      } else {
        actions.push(mergeMcpFile(path.join(cwd, '.mcp.json'), server, { dryRun }));
        actions.push(...copySkill(path.join(cwd, '.claude', 'skills', 'modelpick'), { dryRun }));
        actions.push(upsertBlock(path.join(cwd, 'CLAUDE.md'), CLAUDE_BLOCK, { dryRun }));
        notes.push('Restart Claude Code, then run `/mcp` to confirm the modelpick server is connected.');
        notes.push('This repo is also a Claude plugin marketplace: `/plugin marketplace add Leizhidong-creator/modelpick` then `/plugin install modelpick@modelpick`.');
      }
      break;
    }
    case 'codex': {
      if (global) {
        notes.push(`Add this to ${home('.codex', 'config.toml')}:`);
        notes.push(`[mcp_servers.modelpick]\ncommand = ${JSON.stringify(server.command)}\nargs = ${JSON.stringify(server.args)}`);
        actions.push(...copySkill(home('.agents', 'skills', 'modelpick'), { dryRun }));
      } else {
        actions.push(upsertBlock(path.join(cwd, 'AGENTS.md'), AGENTS_BLOCK, { dryRun }));
        actions.push(...copySkill(path.join(cwd, '.agents', 'skills', 'modelpick'), { dryRun }));
        notes.push(`Register the MCP server once:\n  codex mcp add modelpick -- ${JSON.stringify(server.command)} ${server.args.map((arg) => JSON.stringify(arg)).join(' ')}`);
      }
      break;
    }
    case 'cursor': {
      const file = global ? home('.cursor', 'mcp.json') : path.join(cwd, '.cursor', 'mcp.json');
      actions.push(mergeMcpFile(file, server, { dryRun }));
      actions.push(...copySkill(global ? home('.cursor', 'skills', 'modelpick') : path.join(cwd, '.cursor', 'skills', 'modelpick'), { dryRun }));
      if (!global) {
        actions.push(upsertBlock(path.join(cwd, 'AGENTS.md'), AGENTS_BLOCK, { dryRun }));
        const rule = `---\ndescription: Pick the right model at every workflow node\nalwaysApply: false\n---\n\n${AGENTS_BLOCK}\n`;
        if (dryRun) actions.push({ file: path.join(cwd, '.cursor', 'rules', 'modelpick.mdc'), changed: true, action: 'write' });
        else actions.push(writeFile(path.join(cwd, '.cursor', 'rules', 'modelpick.mdc'), rule, { force: true }));
      }
      notes.push('Open Cursor → Settings → MCP and confirm modelpick is connected.');
      break;
    }
    case 'dsh': {
      const skillDir = global ? home('.dsh', 'skills', 'modelpick') : path.join(cwd, '.dsh', 'skills', 'modelpick');
      actions.push(...copySkill(skillDir, { dryRun }));
      actions.push(...copySkill(path.join(cwd, '.agents', 'skills', 'modelpick'), { dryRun }));
      actions.push(upsertBlock(path.join(cwd, 'AGENTS.md'), AGENTS_BLOCK, { dryRun }));
      notes.push('DSH has no mcp.json. Add this row to your profile patch:');
      notes.push(
        `- id: mcp-modelpick\n  name: '@deepseek-ai/dsh-mcp-client'\n  config:\n    serverName: modelpick\n    transport: stdio\n    command: ${JSON.stringify(server.command)}\n    args: ${JSON.stringify(server.args)}`
      );
      if (global && options.write) {
        const written = writeDshMcp(server, { profile: options.profile ?? 'desktop', dryRun, dshHome: options.dshHome });
        actions.push({ file: written.file, changed: written.changed, action: written.action });
        if (written.changed) notes.push(`Wrote the MCP row to ${written.file}. Restart DSH to load it.`);
      } else {
        notes.push(`Write it automatically with: modelpick setup dsh --global --write --profile desktop`);
      }
      notes.push(`Or use the skill without MCP: ${JSON.stringify(process.execPath)} ${JSON.stringify(BIN)} pick "<task>" --json`);
      break;
    }
    case 'copilot': {
      actions.push(mergeMcpFile(path.join(cwd, '.mcp.json'), server, { dryRun }));
      actions.push(...copySkill(path.join(cwd, '.github', 'skills', 'modelpick'), { dryRun }));
      actions.push(upsertBlock(path.join(cwd, 'AGENTS.md'), AGENTS_BLOCK, { dryRun }));
      notes.push('Run `copilot mcp list` to confirm the server is connected.');
      break;
    }
    case 'generic': {
      actions.push(mergeMcpFile(global ? home('.modelpick', 'mcp.json') : path.join(cwd, '.mcp.json'), server, { dryRun }));
      actions.push(...copySkill(global ? home('.agents', 'skills', 'modelpick') : path.join(cwd, '.agents', 'skills', 'modelpick'), { dryRun }));
      actions.push(upsertBlock(path.join(cwd, 'AGENTS.md'), AGENTS_BLOCK, { dryRun }));
      notes.push(`MCP: ${server.command} ${server.args.join(' ')}`);
      break;
    }
    default:
      throw new ModelPickError(`Unknown agent: ${agentId}`, {
        code: 'ERR_UNKNOWN_AGENT',
        hint: `Choose one of: ${AGENTS.map((agent) => agent.id).join(', ')}`
      });
  }

  return { agent: agentId, server, actions, notes, dryRun };
}

export function detectAgents(cwd = process.cwd()) {
  const found = [];
  if (fs.existsSync(path.join(cwd, '.claude')) || fs.existsSync(home('.claude'))) found.push('claude-code');
  if (fs.existsSync(home('.codex')) || fs.existsSync(path.join(cwd, 'AGENTS.md'))) found.push('codex');
  if (fs.existsSync(path.join(cwd, '.cursor')) || fs.existsSync(home('.cursor'))) found.push('cursor');
  if (fs.existsSync(home('.dsh'))) found.push('dsh');
  if (fs.existsSync(home('.copilot'))) found.push('copilot');
  if (!found.length) found.push('generic');
  return [...new Set(found)];
}

export { BIN, ROOT, AGENTS_BLOCK, MARK_START, MARK_END };
