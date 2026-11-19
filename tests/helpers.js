import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BIN = path.join(ROOT, 'bin', 'modelpick.js');

export function tempDir(prefix = 'modelpick-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function baseEnv(extra = {}) {
  return {
    ...process.env,
    NO_COLOR: '1',
    MODELPICK_HOME: extra.MODELPICK_HOME ?? path.join(tempDir('modelpick-home-'), 'home'),
    ...extra
  };
}

export function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd: options.cwd ?? ROOT,
    env: baseEnv(options.env),
    encoding: 'utf8',
    timeout: options.timeout ?? 30000
  });
  let json = null;
  if (result.stdout && result.stdout.trim().startsWith('{')) {
    try {
      json = JSON.parse(result.stdout);
    } catch {
      json = null;
    }
  }
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    json
  };
}

/**
 * Start the MCP server and send a list of JSON-RPC requests.
 * Returns responses keyed by id, plus raw stderr.
 */
export function mcpSession(requests, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN, 'mcp'], {
      cwd: options.cwd ?? ROOT,
      env: baseEnv(options.env),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let buffer = '';
    let stderr = '';
    const responses = new Map();
    const expected = requests.filter((request) => request.id != null).length;
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`MCP timeout. stderr: ${stderr}`));
    }, options.timeout ?? 15000);

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        if (!line.trim()) continue;
        try {
          const message = JSON.parse(line);
          if (message.id != null) responses.set(message.id, message);
        } catch {
          // Ignore non-JSON stdout; the server should never write it.
        }
      }
      if (responses.size >= expected) {
        clearTimeout(timer);
        child.stdin.end();
        child.kill();
        resolve({ responses, stderr });
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    for (const request of requests) child.stdin.write(`${JSON.stringify(request)}\n`);
  });
}

export function toolResult(response) {
  return response?.result?.structuredContent ?? JSON.parse(response?.result?.content?.[0]?.text ?? 'null');
}
