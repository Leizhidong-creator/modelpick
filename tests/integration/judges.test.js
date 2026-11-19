import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../helpers.js';

test('judges lists Jev and Gemini Decision 1 with exact API setup', () => {
  const result = runCli(['judges', '--json']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout);
  assert.equal(data.models.length, 2);
  const jev = data.models.find((m) => m.id === 'jev-latest');
  const gemini = data.models.find((m) => m.id === 'gemini-decision-1');
  assert.equal(jev.env[0], 'VENICE_API_KEY');
  assert.equal(jev.pricing.input, 0.042);
  assert.equal(jev.endpoint, 'https://api.venice.ai/api/v1/decisions');
  assert.equal(gemini.env[0], 'GEMINI_API_KEY');
  assert.equal(gemini.pricing.input, 0.1);
  assert.equal(gemini.endpoint, 'https://generativelanguage.googleapis.com/v1beta/decisions');
  assert.ok(jev.sources.every((s) => s.url.startsWith('https://') && s.readAt));
});

test('judges human output explains it is not a generation model', () => {
  const result = runCli(['judges']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Not generation models/);
  assert.match(result.stdout, /jev-latest/);
  assert.match(result.stdout, /gemini-decision-1/);
});
