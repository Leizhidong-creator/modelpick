import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tempDir } from '../helpers.js';

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
