import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tempDir } from '../helpers.js';

test('human models and tasks tables render', () => {
  const models = runCli(['models']);
  assert.equal(models.status, 0);
  assert.match(models.stdout, /tripo-h3\.1/);
  assert.match(models.stdout, /40 models|models/i);

  const filtered = runCli(['models', '--search', 'tripo']);
  assert.equal(filtered.status, 0);
  assert.match(filtered.stdout, /tripo-h3\.1/);

  const tasks = runCli(['tasks']);
  assert.equal(tasks.status, 0);
  assert.match(tasks.stdout, /3D asset generation/);
  assert.match(tasks.stdout, /20/);
});

test('human keys and doctor output explain the state without a key', () => {
  const keys = runCli(['keys'], { env: { MODELPICK_HOME: path.join(tempDir('mp-keys-'), 'home') } });
  assert.equal(keys.status, 0);
  assert.match(keys.stdout, /key|env|provider/i);

  const doctor = runCli(['doctor'], { env: { MODELPICK_HOME: path.join(tempDir('mp-doctor-'), 'home') } });
  assert.equal(doctor.status, 0);
  assert.match(doctor.stdout, /Node|catalog|OK/i);
});

test('every agent dry-run renders human instructions without writing', () => {
  const cwd = tempDir('mp-agents-output-');
  for (const agent of ['claude-code', 'codex', 'cursor', 'dsh', 'copilot', 'vscode', 'generic']) {
    const result = runCli(['setup', agent, '--dry-run'], { cwd });
    assert.equal(result.status, 0, `${agent}: ${result.stderr}`);
    assert.match(result.stdout, /MCP|skill|config|setup/i, agent);
  }
  assert.ok(!fs.existsSync(path.join(cwd, '.mcp.json')));
  assert.ok(!fs.existsSync(path.join(cwd, '.vscode')));
});

test('human pick and plan output include a decision and a dollar cost', () => {
  const pick = runCli(['pick', '3D sword for a Unity game']);
  assert.equal(pick.status, 0);
  assert.match(pick.stdout, /Tripo H3\.1/);
  assert.match(pick.stdout, /\$/);

  const plan = runCli(['plan', '30-second launch video for a coffee brand']);
  assert.equal(plan.status, 0);
  assert.match(plan.stdout, /Total|Budget|step/i);
});

test('human add-model example and local update path render', () => {
  const cwd = tempDir('mp-human-add-');
  const example = runCli(['add-model', '--example'], { cwd });
  assert.equal(example.status, 0);
  assert.match(example.stdout, /my-private-model/);

  const update = runCli(['update', '--file', path.join(process.cwd(), 'catalog', 'models.json')], {
    cwd,
    env: { MODELPICK_HOME: path.join(cwd, 'home') }
  });
  assert.equal(update.status, 0);
  assert.match(update.stdout, /catalog|models|current/i);
});

test('human verify prints a receipt', () => {
  const result = runCli(['verify']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /verification|OK|pass/i);
});

test('version, help, and unknown command render', () => {
  const version = runCli(['version']);
  assert.equal(version.status, 0);
  assert.match(version.stdout, /0\.1\.2/);

  const help = runCli(['help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /USAGE/);

  const unknown = runCli(['not-a-command']);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /could not map|task|unknown/i);
});

test('human add-model success and removal render', () => {
  const cwd = tempDir('mp-add-human-');
  const example = runCli(['add-model', '--example'], { cwd });
  const model = JSON.parse(example.stdout);
  fs.writeFileSync(path.join(cwd, 'model.json'), JSON.stringify(model));
  const home = path.join(cwd, 'home');
  const added = runCli(['add-model', 'model.json'], { cwd, env: { MODELPICK_HOME: home } });
  assert.equal(added.status, 0);
  assert.match(added.stdout, /Added/);
  const removed = runCli(['add-model', '--remove', model.slug], { cwd, env: { MODELPICK_HOME: home } });
  assert.equal(removed.status, 0);
  assert.match(removed.stdout, /Removed/);
});

test('models and tasks JSON are parseable', () => {
  const models = runCli(['models', '--json']);
  assert.equal(models.status, 0);
  assert.ok(Array.isArray(JSON.parse(models.stdout).models));
  const tasks = runCli(['tasks', '--json']);
  assert.equal(tasks.status, 0);
  assert.ok(Array.isArray(JSON.parse(tasks.stdout).tasks));
});

test('budget and available filters are honest', () => {
  const budget = runCli(['pick', '3D sword for Unity', '--max-cost', '0.01', '--json']);
  assert.equal(budget.status, 3);
  assert.match(budget.stdout + budget.stderr, /NO_ELIGIBLE|over_budget|budget/i);
  const available = runCli(['pick', '3D sword for Unity', '--available', '--json'], { env: { MODELPICK_HOME: path.join(tempDir('mp-avail-'), 'home') } });
  assert.ok([0, 3].includes(available.status));
});

test('unknown setup agent is a structured error', () => {
  const result = runCli(['setup', 'not-an-agent']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ERR_UNKNOWN_AGENT|Unknown agent/i);
});
