import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tempDir } from '../helpers.js';
import { getSecret, readSecrets, removeSecret, secretStatus, setSecret, storedEnvNames } from '../../src/core/secrets.js';
import { assertKnownKeyEnv, checkOllama, validateKey } from '../../src/core/key-check.js';

function withHome(fn) {
  const previous = process.env.MODELPICK_HOME;
  process.env.MODELPICK_HOME = path.join(tempDir('mp-secrets-unit-'), 'home');
  try {
    return fn(process.env.MODELPICK_HOME);
  } finally {
    if (previous === undefined) delete process.env.MODELPICK_HOME;
    else process.env.MODELPICK_HOME = previous;
  }
}

test('secrets store, redact, and env precedence', () => withHome((home) => {
  const status = setSecret('OPENAI_API_KEY', 'sk-secret-1234');
  assert.equal(status.last4, '…1234');
  assert.equal(getSecret('OPENAI_API_KEY'), 'sk-secret-1234');
  assert.equal(storedEnvNames().has('OPENAI_API_KEY'), true);
  const file = path.join(home, 'secrets.json');
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).keys.OPENAI_API_KEY.value, 'sk-secret-1234');
  process.env.OPENAI_API_KEY = 'sk-env-9999';
  try {
    assert.equal(secretStatus('OPENAI_API_KEY').source, 'env');
    assert.equal(getSecret('OPENAI_API_KEY'), 'sk-env-9999');
  } finally {
    delete process.env.OPENAI_API_KEY;
  }
  assert.equal(secretStatus('OPENAI_API_KEY').source, 'file');
  assert.equal(removeSecret('OPENAI_API_KEY'), true);
  assert.equal(readSecrets().keys.OPENAI_API_KEY, undefined);
}));

test('secrets reject empty, multiline, and invalid names', () => withHome(() => {
  assert.throws(() => setSecret('OPENAI_API_KEY', ''), /empty/i);
  assert.throws(() => setSecret('OPENAI_API_KEY', 'a\nb'), /single-line/i);
  assert.throws(() => setSecret('not-a-key', 'x'), /Invalid key name/i);
}));

test('key validation treats unknown providers as unverified and recognizes known envs', async () => {
  assert.doesNotThrow(() => assertKnownKeyEnv('OPENAI_API_KEY', new Set(['OPENAI_API_KEY'])));
  assert.throws(() => assertKnownKeyEnv('NOPE', new Set(['OPENAI_API_KEY'])), /Unknown key name/);
  const unknown = await validateKey('CUSTOM_KEY', 'x');
  assert.equal(unknown.status, 'unverified');
  const empty = await validateKey('OPENAI_API_KEY', '');
  assert.equal(empty.status, 'invalid');
});

test('provider validators handle success, auth failure, and rate limit without leaking keys', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.ok(options.headers.Authorization || options.headers['x-api-key'] || url.includes('key='));
      if (String(url).includes('anthropic')) return new Response('{}', { status: 401 });
      if (String(url).includes('venice')) return new Response('{}', { status: 429 });
      return new Response('{}', { status: 200 });
    };
    assert.equal((await validateKey('OPENAI_API_KEY', 'sk-valid')).status, 'valid');
    assert.equal((await validateKey('ANTHROPIC_API_KEY', 'sk-bad')).status, 'invalid');
    assert.equal((await validateKey('VENICE_API_KEY', 'sk-rate')).status, 'valid');
    assert.equal((await validateKey('GEMINI_API_KEY', 'g-key')).status, 'valid');
  } finally {
    globalThis.fetch = original;
  }
});

test('Ollama probe handles a running daemon', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ models: [{ name: 'qwen2.5:0.5b' }] }), { status: 200 });
    const result = await checkOllama();
    assert.equal(result.running, true);
    assert.deepEqual(result.models, ['qwen2.5:0.5b']);
  } finally {
    globalThis.fetch = original;
  }
});
