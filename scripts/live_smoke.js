#!/usr/bin/env node
/**
 * Opt-in live smoke test. It never reads or prints API keys.
 * It exercises free/public endpoints plus a local Ollama endpoint if present,
 * and writes a dated receipt. Network access is required.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests', 'results');

async function timed(name, fn) {
  const started = performance.now();
  try {
    const value = await fn();
    return { name, ok: true, ms: Math.round(performance.now() - started), ...value };
  } catch (error) {
    return { name, ok: false, ms: Math.round(performance.now() - started), error: error.message };
  }
}

async function text(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 120)}`);
  return { status: response.status, contentType: response.headers.get('content-type'), body: body.slice(0, 240) };
}

async function bytes(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  const body = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { status: response.status, contentType: response.headers.get('content-type'), bytes: body.length };
}

const cases = [];

cases.push(
  await timed('pollinations-text', async () => {
    const result = await text('https://text.pollinations.ai/What%20is%202%2B2%3F');
    if (!/4/.test(result.body)) throw new Error(`unexpected body: ${result.body}`);
    return result;
  })
);

cases.push(
  await timed('pollinations-image', async () => {
    const result = await bytes('https://image.pollinations.ai/prompt/a%20blue%20cube?width=64&height=64&nologo=true');
    if (!String(result.contentType).startsWith('image/')) throw new Error(`not an image: ${result.contentType}`);
    if (result.bytes < 500) throw new Error(`image too small: ${result.bytes}`);
    return result;
  })
);

cases.push(
  await timed('github-models', async () => {
    const result = await text('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
        max_tokens: 5
      })
    });
    if (!/OK/i.test(result.body)) throw new Error(`unexpected body: ${result.body}`);
    return result;
  })
);

cases.push(
  await timed('ollama-local', async () => {
    const tags = await text('http://127.0.0.1:11434/api/tags');
    const models = JSON.parse(tags.body).models ?? [];
    if (!models.length) throw new Error('Ollama is running but has no models');
    const model = models[0].name;
    const result = await text('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with OK.' }], stream: false })
    });
    return { status: result.status, model, body: result.body.slice(0, 160) };
  })
);

const receipt = {
  schemaVersion: '1.0',
  kind: 'live-smoke',
  generatedAt: new Date().toISOString(),
  note: 'Free/public endpoints only. No API keys are used or stored. These are connectivity/format checks, not model quality measurements.',
  cases
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'live-smoke-latest.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
if (cases.some((item) => item.name !== 'ollama-local' && !item.ok)) process.exitCode = 1;
