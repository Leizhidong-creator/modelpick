import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { BIN, baseEnv, runCli } from '../helpers.js';

const execFileAsync = promisify(execFile);

function fakeOllama() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/api/tags') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ models: [{ name: 'qwen2.5:0.5b' }] }));
        return;
      }
      if (req.url === '/api/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          const parsed = JSON.parse(body);
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({
            response: `local answer for: ${parsed.prompt}`,
            prompt_eval_count: 7,
            eval_count: 3,
            total_duration: 250000000
          }));
        });
        return;
      }
      res.writeHead(404); res.end();
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

test('run --local calls Ollama and returns keyless output', async () => {
  const { server, port } = await fakeOllama();
  try {
    const result = await execFileAsync(process.execPath, [BIN, 'run', 'hello local', '--local', '--host', `http://127.0.0.1:${port}`, '--json'], {
      cwd: process.cwd(),
      env: baseEnv(),
      timeout: 10000
    });
    const data = JSON.parse(result.stdout);
    assert.equal(data.provider, 'ollama');
    assert.equal(data.keyless, true);
    assert.match(data.output, /hello local/);
    assert.equal(data.usage.inputTokens, 7);
    assert.equal(data.usage.outputTokens, 3);
  } finally {
    server.close();
  }
});

test('run --local human output and --status work', async () => {
  const { server, port } = await fakeOllama();
  const env = baseEnv();
  try {
    const human = await execFileAsync(process.execPath, [BIN, 'run', 'hello', '--local', '--host', `http://127.0.0.1:${port}`], { cwd: process.cwd(), env, timeout: 10000 });
    assert.match(human.stdout, /local answer for: hello/);
    const status = await execFileAsync(process.execPath, [BIN, 'run', '--status', '--host', `http://127.0.0.1:${port}`, '--json'], { cwd: process.cwd(), env, timeout: 10000 });
    const parsed = JSON.parse(status.stdout);
    assert.equal(parsed.running, true);
    assert.deepEqual(parsed.models, ['qwen2.5:0.5b']);
    const humanStatus = await execFileAsync(process.execPath, [BIN, 'run', '--status', '--host', `http://127.0.0.1:${port}`], { cwd: process.cwd(), env, timeout: 10000 });
    assert.match(humanStatus.stdout, /running/);
    assert.match(humanStatus.stdout, /qwen2.5:0.5b/);
  } finally {
    server.close();
  }
});

test('run without --local explains the current execution boundary', () => {
  const result = runCli(['run', 'hello']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cloud execution is not enabled|--local/i);
});

test('run refuses a non-loopback Ollama host', () => {
  const result = runCli(['run', 'hello', '--local', '--host', 'http://example.com:11434']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /loopback|local runtime/i);
});
