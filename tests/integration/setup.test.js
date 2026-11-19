import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tempDir } from '../helpers.js';
import { writeDshMcp, writeCodexMcp, mcpCommand } from '../../src/integrations/index.js';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('generic setup writes MCP, skill, and AGENTS.md once', () => {
  const cwd = tempDir();
  const first = runCli(['setup', 'generic', '--json'], { cwd });
  assert.equal(first.status, 0);
  assert.ok(fs.existsSync(path.join(cwd, '.mcp.json')));
  assert.ok(fs.existsSync(path.join(cwd, '.agents', 'skills', 'modelpick', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd, 'AGENTS.md')));
  const mcp = readJson(path.join(cwd, '.mcp.json'));
  assert.ok(mcp.mcpServers.modelpick);
  const agents = fs.readFileSync(path.join(cwd, 'AGENTS.md'), 'utf8');
  assert.equal((agents.match(/<!-- modelpick:start -->/g) ?? []).length, 1);

  const second = runCli(['setup', 'generic', '--json'], { cwd });
  assert.equal(second.status, 0);
  const agentsAgain = fs.readFileSync(path.join(cwd, 'AGENTS.md'), 'utf8');
  assert.equal((agentsAgain.match(/<!-- modelpick:start -->/g) ?? []).length, 1, 'AGENTS block must be idempotent');
});

test('setup preserves sibling MCP servers', () => {
  const cwd = tempDir();
  fs.writeFileSync(
    path.join(cwd, '.mcp.json'),
    JSON.stringify({ mcpServers: { other: { command: 'other', args: [] } } }, null, 2)
  );
  const result = runCli(['setup', 'generic', '--json'], { cwd });
  assert.equal(result.status, 0);
  const mcp = readJson(path.join(cwd, '.mcp.json'));
  assert.deepEqual(mcp.mcpServers.other, { command: 'other', args: [] });
  assert.ok(mcp.mcpServers.modelpick);
});

test('setup refuses to clobber invalid JSON', () => {
  const cwd = tempDir();
  const original = '{ this is not json';
  fs.writeFileSync(path.join(cwd, '.mcp.json'), original);
  const result = runCli(['setup', 'generic', '--json'], { cwd });
  assert.equal(result.status, 1);
  assert.equal(fs.readFileSync(path.join(cwd, '.mcp.json'), 'utf8'), original);
});

test('dry run writes nothing', () => {
  const cwd = tempDir();
  const result = runCli(['setup', 'claude-code', '--dry-run', '--json'], { cwd });
  assert.equal(result.status, 0);
  assert.ok(!fs.existsSync(path.join(cwd, '.mcp.json')));
  assert.ok(!fs.existsSync(path.join(cwd, '.claude')));
  assert.ok(!fs.existsSync(path.join(cwd, 'CLAUDE.md')));
});

test('claude-code setup writes project MCP + skill + CLAUDE.md', () => {
  const cwd = tempDir();
  const result = runCli(['setup', 'claude-code', '--json'], { cwd });
  assert.equal(result.status, 0);
  assert.ok(fs.existsSync(path.join(cwd, '.mcp.json')));
  assert.ok(fs.existsSync(path.join(cwd, '.claude', 'skills', 'modelpick', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd, 'CLAUDE.md')));
});

test('dsh setup writes both skill roots and AGENTS.md', () => {
  const cwd = tempDir();
  const result = runCli(['setup', 'dsh', '--json'], { cwd });
  assert.equal(result.status, 0);
  assert.ok(fs.existsSync(path.join(cwd, '.dsh', 'skills', 'modelpick', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd, '.agents', 'skills', 'modelpick', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd, 'AGENTS.md')));
});

test('unknown agent is rejected before writing', () => {
  const cwd = tempDir();
  const result = runCli(['setup', 'not-an-agent', '--json'], { cwd });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('ERR_UNKNOWN_AGENT'));
  assert.ok(!fs.existsSync(path.join(cwd, '.mcp.json')));
});

test('DSH MCP row is written once, with a backup', () => {
  const home = tempDir('mp-dsh-');
  const profileDir = path.join(home, 'profiles', 'desktop');
  fs.mkdirSync(profileDir, { recursive: true });
  const file = path.join(profileDir, 'cordis.patch.yml');
  fs.writeFileSync(file, '- id: existing\n  name: test\n');
  const first = writeDshMcp(mcpCommand({ mode: 'node' }), { profile: 'desktop', dshHome: home });
  assert.equal(first.action, 'appended');
  assert.ok(fs.existsSync(file));
  assert.ok(fs.readFileSync(file, 'utf8').includes('mcp-modelpick'));
  assert.ok(first.backup && fs.existsSync(first.backup));
  const second = writeDshMcp(mcpCommand({ mode: 'node' }), { profile: 'desktop', dshHome: home });
  assert.equal(second.action, 'already-present');
  assert.equal((fs.readFileSync(file, 'utf8').match(/id: mcp-modelpick/g) ?? []).length, 1);
});

test('DSH dry-run does not create a profile file', () => {
  const home = tempDir('mp-dsh-dry-');
  const result = writeDshMcp(mcpCommand({ mode: 'node' }), { profile: 'web', dryRun: true, dshHome: home });
  assert.equal(result.action, 'append');
  assert.ok(!fs.existsSync(result.file));
});

test('Codex MCP row is written once, with a backup', () => {
  const dir = tempDir('mp-codex-');
  const file = path.join(dir, 'config.toml');
  fs.writeFileSync(file, '[mcp_servers.other]\ncommand = "existing"\n');
  const first = writeCodexMcp(mcpCommand({ mode: 'node' }), { configFile: file });
  assert.equal(first.action, 'appended');
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.includes('[mcp_servers.modelpick]'));
  assert.ok(text.includes('[mcp_servers.other]'));
  assert.ok(first.backup && fs.existsSync(first.backup));
  const second = writeCodexMcp(mcpCommand({ mode: 'node' }), { configFile: file });
  assert.equal(second.action, 'already-present');
  assert.equal((text.match(/\[mcp_servers\.modelpick\]/g) ?? []).length, 1);
});

test('Codex dry-run does not create a config file', () => {
  const dir = tempDir('mp-codex-dry-');
  const file = path.join(dir, 'config.toml');
  const result = writeCodexMcp(mcpCommand({ mode: 'node' }), { configFile: file, dryRun: true });
  assert.equal(result.action, 'append');
  assert.ok(!fs.existsSync(file));
});

test('generated AGENTS block uses a runnable install command', () => {
  const cwd = tempDir();
  const result = runCli(['setup', 'generic', '--json'], { cwd });
  assert.equal(result.status, 0);
  const agents = fs.readFileSync(path.join(cwd, 'AGENTS.md'), 'utf8');
  assert.ok(agents.includes('github:Leizhidong-creator/modelpick'));
  assert.ok(agents.includes('get_decision_packet'));
  assert.ok(!agents.includes('modelpick@latest'));
});

test('VS Code setup writes .vscode/mcp.json without clobbering siblings', () => {
  const cwd = tempDir();
  fs.mkdirSync(path.join(cwd, '.vscode'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.vscode', 'mcp.json'),
    JSON.stringify({ servers: { other: { command: 'keep-me' } } }, null, 2)
  );
  const result = runCli(['setup', 'vscode', '--json'], { cwd });
  assert.equal(result.status, 0);
  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.vscode', 'mcp.json'), 'utf8'));
  assert.equal(config.servers.other.command, 'keep-me');
  assert.equal(config.servers.modelpick.type, 'stdio');
  assert.ok(config.servers.modelpick.args.includes('mcp'));
  assert.ok(fs.existsSync(path.join(cwd, '.agents', 'skills', 'modelpick', 'SKILL.md')));
});

test('Codex setup tells the user how to write the global config', () => {
  const cwd = tempDir();
  const result = runCli(['setup', 'codex', '--json'], { cwd });
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.ok(payload.results[0].notes.some((note) => note.includes('--global --write')));
});
