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

test('eval accepts a CSV run log', () => {
  const cwd = tempDir('mp-eval-csv-');
  fs.writeFileSync(path.join(cwd, 'evals.csv'), 'task,model,passed,cost,attempts,quality\n3d-gen,tripo-h3.1,true,0.2,1,94\n3d-gen,tripo-h3.1,false,0.2,1,\n3d-gen,meshy-7.1,true,1.2,1,91\n');
  const result = runCli(['eval', 'evals.csv', '--json'], { cwd });
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.runs, 3);
  assert.equal(payload.models.find((m) => m.slug === 'tripo-h3.1').passRate, 0.5);
});

test('CSV supports --task and rejects an invalid passed value', () => {
  const cwd = tempDir('mp-eval-csv2-');
  fs.writeFileSync(path.join(cwd, 'no-task.csv'), 'model,passed,cost\ntripo-h3.1,true,0.2\n');
  const ok = runCli(['eval', 'no-task.csv', '--task', '3d-gen', '--json'], { cwd });
  assert.equal(ok.status, 0);
  assert.equal(JSON.parse(ok.stdout).task.id, '3d-gen');
  fs.writeFileSync(path.join(cwd, 'bad.csv'), 'model,passed\ntripo-h3.1,maybe\n');
  const bad = runCli(['eval', 'bad.csv', '--task', '3d-gen', '--json'], { cwd });
  assert.equal(bad.status, 1);
  assert.ok(bad.stderr.includes('ERR_EVAL_READ'));
});
