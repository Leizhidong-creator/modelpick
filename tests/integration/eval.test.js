import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tempDir } from '../helpers.js';

test('eval --json analyzes a user eval file', () => {
  const cwd = tempDir('mp-eval-');
  const file = path.join(cwd, 'evals.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      task: '3d-gen',
      runs: [
        { model: 'tripo-h3.1', passed: true, cost: 0.2, attempts: 1 },
        { model: 'tripo-h3.1', passed: false, cost: 0.2, attempts: 1 },
        { model: 'meshy-7.1', passed: true, cost: 1.2, attempts: 1 }
      ]
    })
  );
  const result = runCli(['eval', 'evals.json', '--min-samples', '2', '--json'], { cwd });
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.kind, 'user-eval');
  assert.equal(payload.task.id, '3d-gen');
  const tripo = payload.models.find((model) => model.slug === 'tripo-h3.1');
  assert.equal(tripo.passRate, 0.5);
  assert.equal(tripo.costPerSolved, 0.4);
});

test('eval rejects a missing file with a structured error', () => {
  const result = runCli(['eval', 'nope.json', '--json']);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('ERR_EVAL_READ'));
});

test('eval --html writes a self-contained report', () => {
  const cwd = tempDir('mp-eval-html-');
  fs.writeFileSync(path.join(cwd, 'evals.json'), JSON.stringify({
    task: '3d-gen',
    runs: [
      { model: 'tripo-h3.1', passed: true, cost: 0.2 },
      { model: 'tripo-h3.1', passed: false, cost: 0.2 }
    ]
  }));
  const result = runCli(['eval', 'evals.json', '--html', 'report.html'], { cwd });
  assert.equal(result.status, 0);
  const html = fs.readFileSync(path.join(cwd, 'report.html'), 'utf8');
  assert.match(html, /Your eval report/);
  assert.match(html, /Wilson 95%/);
  assert.match(html, /tripo-h3\.1/);
});
