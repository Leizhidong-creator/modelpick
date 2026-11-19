import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tempDir } from '../helpers.js';
import { modelTemplate } from '../../src/commands/add-model.js';

test('add-model --example prints a valid template', () => {
  const result = runCli(['add-model', '--example']);
  assert.equal(result.status, 0);
  const model = JSON.parse(result.stdout);
  assert.equal(model.slug, 'my-private-model');
  assert.ok(model.pricing);
});

test('add-model writes overrides and the model becomes routable', () => {
  const home = tempDir('modelpick-add-');
  const cwd = tempDir('modelpick-add-cwd-');
  const model = modelTemplate();
  model.slug = 'my-private-model';
  model.quality.overall = 99;
  model.quality.coding = 99;
  model.quality.codingAgent = 99;
  model.quality.reasoning = 99;
  model.quality.longContext = 99;
  model.quality.writing = 99;
  model.quality.multimodal = 99;
  model.quality.cheapWork = 99;
  const file = path.join(cwd, 'my-model.json');
  fs.writeFileSync(file, JSON.stringify(model, null, 2));

  const add = runCli(['add-model', file, '--json'], { cwd, env: { MODELPICK_HOME: home } });
  assert.equal(add.status, 0);
  assert.equal(add.json.kind, 'add-model');
  assert.ok(fs.existsSync(path.join(home, 'overrides.json')));

  const list = runCli(['models', '--search', 'my-private-model', '--json'], { cwd, env: { MODELPICK_HOME: home } });
  assert.equal(list.status, 0);
  assert.equal(list.json.count, 1);
  assert.equal(list.json.models[0].slug, 'my-private-model');

  const pick = runCli(['pick', 'refactor this repo', '--task', 'refactor', '--json'], { cwd, env: { MODELPICK_HOME: home } });
  assert.equal(pick.status, 0);
  assert.equal(pick.json.recommendation.slug, 'my-private-model');
});

test('add-model rejects an incomplete model without writing', () => {
  const home = tempDir('modelpick-add-bad-');
  const cwd = tempDir('modelpick-add-bad-cwd-');
  const file = path.join(cwd, 'bad.json');
  fs.writeFileSync(file, JSON.stringify({ slug: 'bad' }));
  const result = runCli(['add-model', file, '--json'], { cwd, env: { MODELPICK_HOME: home } });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('ERR_INVALID_MODEL'));
  assert.ok(!fs.existsSync(path.join(home, 'overrides.json')));
});

test('add-model --remove deletes a custom model', () => {
  const home = tempDir('modelpick-remove-');
  const cwd = tempDir('modelpick-remove-cwd-');
  const model = modelTemplate();
  model.slug = 'temp-model';
  const file = path.join(cwd, 'temp.json');
  fs.writeFileSync(file, JSON.stringify(model, null, 2));
  assert.equal(runCli(['add-model', file, '--json'], { cwd, env: { MODELPICK_HOME: home } }).status, 0);
  const remove = runCli(['add-model', '--remove', 'temp-model', '--json'], { cwd, env: { MODELPICK_HOME: home } });
  assert.equal(remove.status, 0);
  const list = runCli(['models', '--search', 'temp-model', '--json'], { cwd, env: { MODELPICK_HOME: home } });
  assert.equal(list.json.count, 0);
});
