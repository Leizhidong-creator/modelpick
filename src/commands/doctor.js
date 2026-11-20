import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadCatalog, catalogStats } from '../core/catalog.js';
import { paths, ensureHome } from '../core/config.js';
import { detectAgents } from '../integrations/index.js';
import { secretStatus } from '../core/secrets.js';
import { checkOllama } from '../core/key-check.js';

const MIN_NODE = [20, 11];

function nodeOk() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  return major > MIN_NODE[0] || (major === MIN_NODE[0] && minor >= MIN_NODE[1]);
}

export async function runDoctor(ctx) {
  const checks = [];
  const add = (id, status, message, hint) => checks.push({ id, status, message, hint });

  add('node', nodeOk() ? 'pass' : 'fail', `Node ${process.versions.node} (need >= ${MIN_NODE.join('.')})`);

  let catalog;
  try {
    catalog = ctx.loadCatalog();
    const stats = catalogStats(catalog);
    add('catalog', 'pass', `${stats.models} models · ${stats.tasks} tasks · ${stats.providers} providers · v${stats.catalogVersion}`);
    const age = Math.floor((Date.now() - Date.parse(catalog.updatedAt)) / 86400000);
    if (Number.isFinite(age) && age > 120) add('freshness', 'warn', `Catalog snapshot is ${age} days old`, 'Run `modelpick update`');
    else add('freshness', 'pass', 'Catalog snapshot is fresh');
  } catch (error) {
    add('catalog', 'fail', error.message, error.hint);
    catalog = null;
  }

  try {
    ensureHome();
    const probe = path.join(paths().home, `.doctor-${process.pid}`);
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    add('config', 'pass', `Writable config directory: ${paths().home}`);
  } catch (error) {
    add('config', 'fail', `Config directory is not writable: ${error.message}`);
  }

  if (catalog) {
    const providers = new Map();
    for (const model of catalog.models) {
      if (!providers.has(model.provider.id)) {
        providers.set(model.provider.id, { name: model.provider.name, env: model.provider.env, set: false });
      }
      if (model.provider.env.some((name) => secretStatus(name).configured)) providers.get(model.provider.id).set = true;
    }
    const ready = [...providers.values()].filter((provider) => provider.set);
    add(
      'keys',
      ready.length ? 'pass' : 'warn',
      ready.length
        ? `${ready.length}/${providers.size} providers configured (${ready.map((p) => p.name).join(', ')})`
        : 'No provider keys configured',
      ready.length ? null : 'Recommendations work without keys. Configure one with `modelpick keys --ui` when you want execution.'
    );
  }

  const ollama = await checkOllama();
  add(
    'ollama',
    ollama.running ? 'pass' : 'warn',
    ollama.running ? `Ollama running (${ollama.message})` : 'Ollama not detected',
    ollama.running ? null : 'Optional local path: install Ollama, then `ollama pull qwen2.5:0.5b`.'
  );

  const detected = detectAgents();
  add('agents', detected.length ? 'pass' : 'warn', `Detected: ${detected.join(', ')}`, 'Run `modelpick setup` to install the MCP server + skill');

  const s = ctx.style;
  if (ctx.json) {
    console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'doctor', ok: !checks.some((check) => check.status === 'fail'), checks }, null, 2));
    if (checks.some((check) => check.status === 'fail')) process.exitCode = 1;
    return;
  }

  console.log(`\n  ${s.bold('modelpick doctor')}\n`);
  for (const check of checks) {
    const icon = check.status === 'pass' ? s.green('✓') : check.status === 'warn' ? s.yellow('!') : s.red('×');
    console.log(`  ${icon} ${check.message}`);
    if (check.hint) console.log(`    ${s.dim(check.hint)}`);
  }
  const failed = checks.some((check) => check.status === 'fail');
  console.log(`\n  ${failed ? s.red('Something needs fixing.') : s.green('Ready.')}\n`);
  if (failed) process.exitCode = 1;
}
