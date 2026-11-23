import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const start = fs.readFileSync(path.join(root, 'docs', 'start.html'), 'utf8');
const index = fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');

test('start page documents the full four-step path', () => {
  assert.match(start, /Install the CLI and MCP server/);
  assert.match(start, /Add one provider API key/);
  assert.match(start, /Connect the agent once/);
  assert.match(start, /Run directly or ask the agent/);
});

test('start page has key commands, agent commands, and security text', () => {
  assert.match(start, /npm install -g modelpick/);
  assert.match(start, /modelpick keys --ui/);
  assert.match(start, /modelpick setup claude-code --global --write/);
  assert.match(start, /modelpick setup cursor --global --write/);
  assert.match(start, /modelpick setup codex --global --write/);
  assert.match(start, /modelpick setup dsh --global --write/);
  assert.match(start, /127\.0\.0\.1/);
  assert.match(start, /0600/);
});

test('homepage links directly to the start guide and busts asset cache', () => {
  assert.match(index, /href="start\.html"/);
  assert.match(index, /styles\.css\?v=/);
  assert.match(index, /app\.js\?v=/);
});
