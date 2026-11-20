import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLocalHost, generateLocal, listOllamaModels } from '../../src/core/ollama.js';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}

test('Ollama host must be loopback', () => {
  assert.equal(assertLocalHost('http://127.0.0.1:11434'), 'http://127.0.0.1:11434');
  assert.equal(assertLocalHost('http://localhost:11434'), 'http://localhost:11434');
  assert.throws(() => assertLocalHost('nope'), /Invalid Ollama host/);
  assert.throws(() => assertLocalHost('http://example.com:11434'), /loopback/);
  assert.throws(() => assertLocalHost('ftp://127.0.0.1'), /loopback/);
});

test('Ollama model listing handles running and offline daemons', async () => {
  const running = await listOllamaModels({
    fetchImpl: async () => jsonResponse({ models: [{ name: 'qwen2.5:0.5b' }, { name: 'llama3.2:1b' }] })
  });
  assert.equal(running.running, true);
  assert.deepEqual(running.models, ['qwen2.5:0.5b', 'llama3.2:1b']);
  const offline = await listOllamaModels({ fetchImpl: async () => { throw new Error('ECONNREFUSED'); } });
  assert.equal(offline.running, false);
  assert.match(offline.message, /not running/);
  const bad = await listOllamaModels({ fetchImpl: async () => new Response('nope', { status: 500 }) });
  assert.equal(bad.running, false);
});

test('local generation validates input and reports provider failures', async () => {
  await assert.rejects(() => generateLocal({ prompt: '  ' }), /prompt is required/i);
  await assert.rejects(
    () => generateLocal({ prompt: 'x', fetchImpl: async () => { throw new Error('offline'); } }),
    /Could not reach Ollama/
  );
  await assert.rejects(
    () => generateLocal({ prompt: 'x', fetchImpl: async () => new Response('not json', { status: 200 }) }),
    /non-JSON/
  );
  await assert.rejects(
    () => generateLocal({ prompt: 'x', fetchImpl: async () => jsonResponse({ error: 'model not found' }, 404) }),
    /model not found/
  );
  await assert.rejects(
    () => generateLocal({ prompt: 'x', fetchImpl: async () => jsonResponse({ error: 'boom' }, 500) }),
    /Ollama failed/
  );
});

test('local generation returns text and usage', async () => {
  const result = await generateLocal({
    prompt: 'hello',
    model: 'test:1b',
    fetchImpl: async () => jsonResponse({ response: 'hi', prompt_eval_count: 4, eval_count: 2, total_duration: 1000000 })
  });
  assert.equal(result.provider, 'ollama');
  assert.equal(result.keyless, true);
  assert.equal(result.output, 'hi');
  assert.equal(result.usage.inputTokens, 4);
  assert.equal(result.usage.outputTokens, 2);
  assert.equal(result.usage.totalDurationMs, 1);
});
