import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('static npm registry metadata matches the package version', () => {
  const pkg = JSON.parse(read('package.json'));
  const registry = JSON.parse(read('docs/npm/modelpick'));
  assert.equal(registry.name, pkg.name);
  assert.equal(registry['dist-tags'].latest, pkg.version);
  const version = registry.versions[pkg.version];
  assert.ok(version, `missing ${pkg.version}`);
  assert.match(version.dist.tarball, /releases\/download\/v0\.1\.3\/modelpick-0\.1\.3\.tgz$/);
  assert.match(version.dist.integrity, /^sha512-/);
  assert.deepEqual(version.bin, pkg.bin);
});

test('npm package keeps the intro video out of the install payload', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(!pkg.files.includes('assets/*.mp4'));
  assert.ok(pkg.files.includes('assets/*.png'));
});
