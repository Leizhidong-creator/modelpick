import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../helpers.js';

test('show includes connection and task applicability', () => {
  const result = runCli(['show', 'tripo-h3.1', '--json']);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.kind, 'model');
  assert.equal(payload.model.slug, 'tripo-h3.1');
  assert.ok(payload.connection.baseUrl);
  assert.ok(payload.connection.env.includes('TRIPO_API_KEY'));
  assert.ok(payload.applicability.eligibleNodes >= 1);
  assert.equal(payload.applicability.best.task, '3d-gen');
  assert.equal(payload.applicability.best.rank, 1);
});

test('show rejects an unknown model with a structured error', () => {
  const result = runCli(['show', 'not-a-model', '--json']);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('ERR_UNKNOWN_MODEL'));
});
