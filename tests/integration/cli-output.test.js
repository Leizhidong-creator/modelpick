import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tempDir } from '../helpers.js';

test('human compare output includes both models and a winner', () => {
  const result = runCli(['compare', 'tripo-h3.1', 'hunyuan3d-3.1-pro', '--task', '3d-gen']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Tripo H3\.1/);
  assert.match(result.stdout, /Hunyuan3D 3\.1 Pro/);
  assert.match(result.stdout, /cheaper|quality|winner/i);
});

test('human decide output includes a portable packet', () => {
  const result = runCli(['decide', '3D sword for a Unity game']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /decision|packet|judge/i);
  assert.match(result.stdout, /tripo-h3\.1/);
});

test('human eval output includes a table and the small-sample caveat', () => {
  const cwd = tempDir('mp-eval-human-');
  fs.writeFileSync(
    path.join(cwd, 'evals.json'),
    JSON.stringify({
      task: '3d-gen',
      runs: [
        { model: 'tripo-h3.1', passed: true, cost: 0.2 },
        { model: 'tripo-h3.1', passed: false, cost: 0.2 },
        { model: 'meshy-7.1', passed: true, cost: 1.2 }
      ]
    })
  );
  const result = runCli(['eval', 'evals.json', '--min-samples', '5'], { cwd });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /cost\/solved/);
  assert.match(result.stdout, /fewer than 5/);
});

test('human show output includes connection and applicability', () => {
  const result = runCli(['show', 'tripo-h3.1']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /BEST NODES/i);
  assert.match(result.stdout, /CONNECT/);
  assert.match(result.stdout, /TRIPO_API_KEY/);
});

test('human plan output lists steps and a cost', () => {
  const result = runCli(['plan', '30-second product launch video for a coffee brand']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /step|budget|total/i);
  assert.match(result.stdout, /\$/);
});

test('offline update explains how to import a local snapshot', () => {
  const result = runCli(['update', '--offline']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ERR_OFFLINE|local snapshot/i);
});
