import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../helpers.js';

test('version and help are fast and clean', () => {
  const version = runCli(['--version']);
  assert.equal(version.status, 0);
  assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/);
  const help = runCli(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /modelpick/);
  assert.match(help.stdout, /pick/);
  assert.match(help.stdout, /mcp/);
});

test('tasks lists all 20 nodes as JSON', () => {
  const result = runCli(['tasks', '--json']);
  assert.equal(result.status, 0);
  assert.equal(result.json.kind, 'tasks');
  assert.equal(result.json.count, 20);
  assert.ok(result.json.tasks.some((task) => task.id === '3d-gen'));
});

test('models filters by modality and task', () => {
  const images = runCli(['models', '--modality', 'image', '--json']);
  assert.equal(images.status, 0);
  assert.ok(images.json.models.length >= 4);
  assert.ok(images.json.models.every((model) => model.modality === 'image'));

  const ranked = runCli(['models', '--task', 'coding-agent', '--json']);
  assert.equal(ranked.status, 0);
  assert.ok(ranked.json.models.length > 0);
  assert.equal(ranked.json.models[0].modality, 'text');
});

test('pick returns a complete agent-ready recommendation', () => {
  const result = runCli(['pick', 'create a stylized 3D sword for a Unity game', '--json']);
  assert.equal(result.status, 0);
  assert.equal(result.json.kind, 'recommendation');
  assert.equal(result.json.task.id, '3d-gen');
  assert.ok(result.json.recommendation.slug);
  assert.ok(result.json.recommendation.costPerTask > 0);
  assert.ok(result.json.recommendation.setup.direct.env.length > 0);
  assert.ok(result.json.recommendation.why.length > 0);
  assert.ok(result.json.catalog.version);
});

test('pick respects open-weights and budget constraints', () => {
  const open = runCli(['pick', 'refactor this repo', '--open-weights', '--json']);
  assert.equal(open.status, 0);
  assert.equal(open.json.recommendation.openWeights, true);

  const budget = runCli(['pick', 'generate a hero image for a product', '--max-cost', '0.05', '--json']);
  assert.equal(budget.status, 0);
  assert.ok(budget.json.recommendation.costPerTask <= 0.05 + 1e-9);
});

test('no eligible model returns a structured error and exit code 3', () => {
  const result = runCli(['pick', 'generate a 3D sword', '--max-cost', '0.001', '--json']);
  assert.equal(result.status, 3);
  assert.equal(result.json.error, 'NO_ELIGIBLE_MODEL');
  assert.ok(result.json.nearMisses.length > 0);
});

test('plan returns a multi-step route with a total', () => {
  const result = runCli(['plan', '30 second product launch video for a coffee brand', '--json']);
  assert.equal(result.status, 0);
  assert.equal(result.json.kind, 'plan');
  assert.ok(result.json.steps.length >= 4);
  assert.ok(result.json.estimate.totalCost > 0);
  assert.ok(result.json.steps.every((step) => step.pick?.slug));
});

test('compare exposes cost per solved task', () => {
  const result = runCli(['compare', 'claude-fable-5.2', 'gemini-4-carbon', '--task', 'coding-agent', '--json']);
  assert.equal(result.status, 0);
  assert.equal(result.json.kind, 'comparison');
  assert.equal(result.json.models.length, 2);
  assert.ok(result.json.models.every((model) => model.costPerTask > 0 && model.quality > 0));
});

test('doctor and keys return machine-readable diagnostics without secrets', () => {
  const doctor = runCli(['doctor', '--json']);
  assert.equal(doctor.status, 0);
  assert.equal(doctor.json.kind, 'doctor');
  assert.ok(doctor.json.checks.length >= 4);

  const keys = runCli(['keys', '--json'], { env: { OPENAI_API_KEY: 'sk-test-secret' } });
  assert.equal(keys.status, 0);
  assert.ok(!keys.stdout.includes('sk-test-secret'));
});

test('update imports a local snapshot and validates it', () => {
  const result = runCli(['update', '--file', 'catalog/models.json', '--json']);
  assert.equal(result.status, 0);
  assert.equal(result.json.kind, 'update');
  assert.equal(result.json.written, false);
});

test('invalid optimize is rejected with a helpful hint', () => {
  const result = runCli(['pick', 'build a feature', '--optimize', 'nope', '--json']);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('ERR_INVALID_OPTIMIZE'));
});
