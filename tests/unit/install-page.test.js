import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const install = fs.readFileSync(path.join(root, 'docs', 'install.html'), 'utf8');

test('install page is a complete copy-paste path', () => {
  assert.match(install, /npm install -g modelpick/);
  assert.match(install, /npx --yes --package=modelpick@latest modelpick keys --ui/);
  assert.match(install, /start-modelpick\.cmd/);
  assert.match(install, /modelpick keys --ui/);
  assert.match(install, /modelpick --version/);
});

test('install page explains the three common CMD failures', () => {
  assert.match(install, /not recognized/);
  assert.match(install, /Ok to proceed/);
  assert.match(install, /#.*not recognized|not a Windows CMD comment/i);
});

test('Windows launcher uses no-prompt npx', () => {
  const launcher = fs.readFileSync(path.join(root, 'docs', 'start-modelpick.cmd'), 'utf8');
  assert.match(launcher, /npx --yes --package=modelpick@latest modelpick keys --ui/);
  assert.match(launcher, /where node/);
});
