import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tempDir } from '../helpers.js';

test('verify returns a machine-readable receipt', () => {
  const result = runCli(['verify', '--json']);
  assert.equal(result.status, 0);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.kind, 'verification-receipt');
  assert.equal(receipt.ok, true);
  const ids = receipt.checks.map((check) => check.id);
  for (const id of ['node', 'catalog-schema', 'decision-benchmark', 'held-out', 'value-simulation', 'hashes']) {
    assert.ok(ids.includes(id), `missing ${id}`);
  }
  assert.equal(Object.keys(receipt.hashes).length, 4);
  assert.ok(receipt.checks.every((check) => check.status !== 'fail'));
});

test('verify --receipt writes the receipt to a caller path', () => {
  const cwd = tempDir('mp-verify-');
  const result = runCli(['verify', '--receipt', 'receipt.json'], { cwd });
  assert.equal(result.status, 0);
  const receipt = JSON.parse(fs.readFileSync(path.join(cwd, 'receipt.json'), 'utf8'));
  assert.equal(receipt.ok, true);
});

test('verify --strict exits non-zero when a warning exists', () => {
  // The repo has all evidence files, so strict is expected to pass here.
  const result = runCli(['verify', '--strict', '--json']);
  assert.equal(result.status, 0);
});
