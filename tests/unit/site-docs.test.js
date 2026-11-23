import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const site = fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'docs', 'app.js'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

test('site explains install, keys, agent setup, and execution', () => {
  assert.match(site, /id="start"/);
  assert.match(site, /modelpick keys --ui/);
  assert.match(site, /modelpick setup claude-code --global --write/);
  assert.match(site, /run_model/);
  assert.match(site, /install\.html/);
  assert.match(site, /assets\/keys-ui\.png/);
});

test('site agent commands are usable and global by default', () => {
  for (const command of [
    'modelpick setup claude-code --global --write',
    'modelpick setup codex --global --write',
    'modelpick setup cursor --global --write',
    'modelpick setup dsh --global --write --profile desktop'
  ]) {
    assert.ok(app.includes(command), command);
  }
  assert.ok(!app.includes('npx -y github:Leizhidong-creator/modelpick setup'));
});

test('README has the same four-step path', () => {
  assert.match(readme, /## Start here/);
  assert.match(readme, /modelpick keys --ui/);
  assert.match(readme, /modelpick setup claude-code --global --write/);
  assert.match(readme, /modelpick run/);
  assert.match(readme, /docs\/KEYS\.md/);
});
