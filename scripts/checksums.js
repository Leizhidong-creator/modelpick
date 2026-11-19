#!/usr/bin/env node
/** Regenerate catalog/checksums.json after an intentional catalog edit. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['catalog/models.json', 'catalog/tasks.json', 'catalog/policy.json'];
const files = {};
for (const file of FILES) {
  files[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
}
const payload = {
  schemaVersion: 1,
  algorithm: 'sha256',
  generatedAt: new Date().toISOString(),
  files
};
fs.writeFileSync(path.join(ROOT, 'catalog', 'checksums.json'), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`wrote catalog/checksums.json (${FILES.length} files)`);
