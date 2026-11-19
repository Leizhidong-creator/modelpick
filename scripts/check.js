#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const steps = [
  ['validate', [path.join(ROOT, 'scripts', 'validate.js')]],
  ['test', ['--test', 'tests/**/*.test.js']],
  ['bench', [path.join(ROOT, 'bench', 'run.js')]]
];

let failed = false;
for (const [name, args] of steps) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    failed = true;
    console.error(`\n${name} failed with exit code ${result.status}`);
    break;
  }
}
if (failed) process.exit(1);
console.log('\nAll checks passed.');
