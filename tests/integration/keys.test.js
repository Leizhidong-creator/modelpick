import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { tempDir, runCli, baseEnv } from '../helpers.js';
import { createKeysUiServer } from '../../src/keys-ui/server.js';
import { readHidden, runKeyWizard } from '../../src/commands/keys.js';
import { makeStyle } from '../../src/cli/format.js';
import { PassThrough } from 'node:stream';
import { loadCatalog } from '../../src/core/catalog.js';

test('keys list reports providers without reading values', () => {
  const home = path.join(tempDir('mp-keys-list-'), 'home');
  const result = runCli(['keys', 'list', '--json'], { env: { MODELPICK_HOME: home } });
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout);
  assert.ok(data.providers.length > 0);
  assert.ok(data.providers.some((provider) => provider.env.some((entry) => entry.name === 'OPENAI_API_KEY')));
});

test('keys set --stdin stores the key with mode 0600 and never prints it', () => {
  const home = path.join(tempDir('mp-keys-set-'), 'home');
  const env = { MODELPICK_HOME: home };
  const result = runCli(['keys', 'set', 'OPENAI_API_KEY', '--stdin', '--no-test', '--json'], { env, input: 'sk-test-1234\n' });
  assert.equal(result.status, 0);
  assert.ok(!result.stdout.includes('sk-test-1234'));
  const file = path.join(home, 'secrets.json');
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.keys.OPENAI_API_KEY.value, 'sk-test-1234');
  if (process.platform !== 'win32') assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  const listed = runCli(['keys', 'list', '--json'], { env });
  const provider = JSON.parse(listed.stdout).providers.find((entry) => entry.env.some((item) => item.name === 'OPENAI_API_KEY'));
  assert.equal(provider.configured, true);
  assert.equal(provider.env[0].last4, '…1234');
});

test('keys set rejects unknown env names', () => {
  const home = path.join(tempDir('mp-keys-bad-'), 'home');
  const result = runCli(['keys', 'set', 'NOT_A_REAL_KEY', '--stdin', '--no-test', '--json'], { env: { MODELPICK_HOME: home }, input: 'x' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ERR_UNKNOWN_KEY/);
});

test('keys remove deletes the stored key', () => {
  const home = path.join(tempDir('mp-keys-remove-'), 'home');
  const env = { MODELPICK_HOME: home };
  assert.equal(runCli(['keys', 'set', 'OPENAI_API_KEY', '--stdin', '--no-test', '--json'], { env, input: 'sk-remove-1234' }).status, 0);
  const removed = runCli(['keys', 'remove', 'OPENAI_API_KEY', '--json'], { env });
  assert.equal(removed.status, 0);
  assert.equal(JSON.parse(removed.stdout).removed, true);
  const file = JSON.parse(fs.readFileSync(path.join(home, 'secrets.json'), 'utf8'));
  assert.equal(file.keys.OPENAI_API_KEY, undefined);
});

test('doctor exposes keys and ollama without key values', () => {
  const home = path.join(tempDir('mp-doctor-keys-'), 'home');
  const env = { MODELPICK_HOME: home };
  assert.equal(runCli(['keys', 'set', 'OPENAI_API_KEY', '--stdin', '--no-test', '--json'], { env, input: 'sk-doctor-1234' }).status, 0);
  const result = runCli(['doctor', '--json'], { env, timeout: 30000 });
  assert.equal(result.status, 0);
  assert.ok(!result.stdout.includes('sk-doctor-1234'));
  const payload = JSON.parse(result.stdout);
  const keys = payload.checks.find((check) => check.id === 'keys');
  assert.equal(keys.status, 'pass');
  assert.ok(payload.checks.some((check) => check.id === 'ollama'));
});

test('keys command errors are actionable', () => {
  const home = path.join(tempDir('mp-keys-errors-'), 'home');
  const env = { MODELPICK_HOME: home };
  assert.equal(runCli(['keys', 'set'], { env }).status, 1);
  assert.equal(runCli(['keys', 'test', 'OPENAI_API_KEY'], { env }).status, 1);
  assert.equal(runCli(['keys', 'remove', 'OPENAI_API_KEY'], { env }).status, 0);
  assert.equal(runCli(['keys', 'nope'], { env }).status, 1);
  assert.equal(runCli(['keys'], { env }).status, 0);
});

test('keys --ui starts a localhost server and closes via its API', async () => {
  const home = path.join(tempDir('mp-keys-ui-cli-'), 'home');
  const child = spawn(process.execPath, ['bin/modelpick.js', 'keys', '--ui', '--no-open'], {
    cwd: path.resolve(import.meta.dirname, '..', '..'),
    env: baseEnv({ MODELPICK_HOME: home }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  try {
    let url = null;
    for (let i = 0; i < 40; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/keys\?token=[a-f0-9]+/);
      if (match) { url = match[0]; break; }
    }
    assert.ok(url, output);
    const parsed = new URL(url);
    const close = await fetch(`http://127.0.0.1:${parsed.port}/api/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-modelpick-token': parsed.searchParams.get('token') },
      body: '{}'
    });
    assert.equal(close.status, 200);
    await new Promise((resolve) => child.once('exit', resolve));
  } finally {
    child.kill();
  }
});

test('hidden input masks characters and supports backspace', async () => {
  const input = new PassThrough();
  input.isTTY = true;
  input.setRawMode = () => {};
  const output = new PassThrough();
  output.isTTY = true;
  const pending = readHidden('key: ', { input, output });
  input.write('ab\u007fc\r');
  assert.equal(await pending, 'ac');
  assert.equal(output.read().toString().includes('*'), true);
});

test('the CLI wizard selects a provider and saves without echoing the key', async () => {
  const home = path.join(tempDir('mp-keys-wizard-'), 'home');
  const previous = process.env.MODELPICK_HOME;
  process.env.MODELPICK_HOME = home;
  try {
    const providers = [{ id: 'openai', name: 'OpenAI', env: ['OPENAI_API_KEY'], keysUrl: null, docsUrl: null, models: [] }];
    const rows = [{ id: 'openai', name: 'OpenAI', env: [{ name: 'OPENAI_API_KEY', configured: false, source: 'none', last4: null }], configured: false, local: false, keysUrl: null, models: 0 }];
    const answers = ['1', ''];
    const ctx = { style: makeStyle(false), flags: { test: false }, json: false };
    await runKeyWizard(ctx, providers, rows, {
      askLine: async () => answers.shift(),
      hidden: async () => 'sk-wizard-1234'
    });
    const stored = JSON.parse(fs.readFileSync(path.join(home, 'secrets.json'), 'utf8'));
    assert.equal(stored.keys.OPENAI_API_KEY.value, 'sk-wizard-1234');
  } finally {
    if (previous === undefined) delete process.env.MODELPICK_HOME;
    else process.env.MODELPICK_HOME = previous;
  }
});

test('localhost key UI serves status, saves, and closes with a token', async () => {
  const home = path.join(tempDir('mp-keys-ui-'), 'home');
  const oldHome = process.env.MODELPICK_HOME;
  process.env.MODELPICK_HOME = home;
  const catalog = loadCatalog({ preferCache: false });
  const providers = [...new Map(catalog.models.map((model) => [model.provider.id, {
    id: model.provider.id,
    name: model.provider.name,
    env: model.provider.env ?? [],
    keysUrl: model.provider.keysUrl ?? null,
    docsUrl: model.provider.docsUrl ?? null,
    models: []
  }])).values()];
  const token = 'test-token';
  let closed = false;
  const ui = createKeysUiServer({ providers, token, onClose: () => { closed = true; } });
  await new Promise((resolve) => ui.server.listen(0, '127.0.0.1', resolve));
  const port = ui.server.address().port;
  const base = `http://127.0.0.1:${port}`;
  try {
    const unauth = await fetch(`${base}/api/status`);
    assert.equal(unauth.status, 401);
    const status = await fetch(`${base}/api/status`, { headers: { 'x-modelpick-token': token } });
    assert.equal(status.status, 200);
    const page = await fetch(`${base}/keys?token=${token}`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Connect the models/);
    const missingTest = await fetch(`${base}/api/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-modelpick-token': token },
      body: JSON.stringify({ env: 'OPENAI_API_KEY' })
    });
    assert.equal(missingTest.status, 400);
    const unknownEnv = await fetch(`${base}/api/key`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-modelpick-token': token },
      body: JSON.stringify({ env: 'NOPE', value: 'x', test: false })
    });
    assert.equal(unknownEnv.status, 400);
    const save = await fetch(`${base}/api/key`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-modelpick-token': token },
      body: JSON.stringify({ env: 'OPENAI_API_KEY', value: 'sk-ui-1234', test: false })
    });
    assert.equal(save.status, 200);
    const stored = JSON.parse(fs.readFileSync(path.join(home, 'secrets.json'), 'utf8'));
    assert.equal(stored.keys.OPENAI_API_KEY.value, 'sk-ui-1234');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ models: [{ name: 'qwen2.5:0.5b' }] }), { status: 200 });
    try {
      const tested = await fetch(`${base}/api/test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-modelpick-token': token },
        body: JSON.stringify({ env: 'OPENAI_API_KEY' })
      });
      assert.equal(tested.status, 200);
      const ollama = await fetch(`${base}/api/ollama`, { headers: { 'x-modelpick-token': token } });
      assert.equal(ollama.status, 200);
    } finally {
      globalThis.fetch = originalFetch;
    }
    const removed = await fetch(`${base}/api/remove`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-modelpick-token': token },
      body: JSON.stringify({ env: 'OPENAI_API_KEY' })
    });
    assert.equal(removed.status, 200);
    const close = await fetch(`${base}/api/close`, { method: 'POST', headers: { 'x-modelpick-token': token }, body: '{}' });
    assert.equal(close.status, 200);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(closed, true);
  } finally {
    ui.close();
    if (oldHome === undefined) delete process.env.MODELPICK_HOME;
    else process.env.MODELPICK_HOME = oldHome;
  }
});
