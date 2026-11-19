import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateCatalog, catalogStats } from '../core/catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIN_NODE = [20, 11];

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function nodeOk() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  return major > MIN_NODE[0] || (major === MIN_NODE[0] && minor >= MIN_NODE[1]);
}

/**
 * A verification receipt, not a marketing checklist. Every check reads a file
 * from the installed package; the hashes let a user compare two installs.
 */
export async function runVerify(ctx) {
  const checks = [];
  const add = (id, status, message, detail) => checks.push({ id, status, message, detail });

  add('node', nodeOk() ? 'pass' : 'fail', `Node ${process.versions.node}`, `requires >= ${MIN_NODE.join('.')}`);

  const pkg = readJson(path.join(ROOT, 'package.json'));
  add('package', pkg?.version ? 'pass' : 'fail', pkg?.version ? `${pkg.name}@${pkg.version}` : 'package.json missing');
  add('dependencies', Object.keys(pkg?.dependencies ?? {}).length === 0 ? 'pass' : 'fail', 'zero runtime dependencies');

  let catalog;
  try {
    catalog = ctx.loadCatalog();
    add('catalog-schema', 'pass', 'catalog + policy schema valid');
  } catch (error) {
    add('catalog-schema', 'fail', error.message, error.code);
  }

  if (catalog) {
    try {
      validateCatalog(catalog);
      add('catalog-invariants', 'pass', 'slugs, prices, evidence, weights, plans');
    } catch (error) {
      add('catalog-invariants', 'fail', error.message);
    }
    const stats = catalogStats(catalog);
    add('coverage', stats.models >= 30 && stats.tasks >= 15 ? 'pass' : 'fail', `${stats.models} models · ${stats.tasks} tasks · ${stats.providers} providers`);

    const noSource = catalog.models.filter((model) => !model.sources?.length || model.sources.some((source) => !/^https:\/\//.test(source.url)));
    add('evidence', noSource.length === 0 ? 'pass' : 'fail', 'every model has an HTTPS source', noSource.map((model) => model.slug).join(', '));

    const missingTask = catalog.tasks.filter((task) => {
      const compatible = catalog.models.filter(
        (model) => model.modality === task.modality && (task.requires ?? []).every((capability) => Boolean(model.capabilities?.[capability]))
      );
      return compatible.length < 2;
    });
    add('task-coverage', missingTask.length === 0 ? 'pass' : 'fail', 'every task has at least two compatible models', missingTask.map((task) => task.id).join(', '));
  }

  const benchmark = readJson(path.join(ROOT, 'tests/results/benchmark-latest.json'));
  if (benchmark) {
    add(
      'decision-benchmark',
      benchmark.passed === true ? 'pass' : 'fail',
      `${benchmark.runs ?? '?'} dev runs · top-1 ${Math.round((benchmark.metrics?.top1 ?? 0) * 100)}%`,
      benchmark.failures?.length ? `${benchmark.failures.length} failures` : 'no failures'
    );
  } else {
    add('decision-benchmark', 'warn', 'benchmark result not packaged', 'run `modelpick bench`');
  }

  const holdout = readJson(path.join(ROOT, 'tests/results/holdout-latest.json'));
  if (holdout) {
    add('held-out', holdout.metrics?.top1 === 1 ? 'pass' : 'fail', `held-out top-1 ${Math.round((holdout.metrics?.top1 ?? 0) * 100)}%`, `${holdout.runs ?? '?'} runs`);
  } else {
    add('held-out', 'warn', 'held-out result not packaged', 'run `node bench/holdout.js`');
  }

  const value = readJson(path.join(ROOT, 'tests/results/value-latest.json'));
  if (value) {
    const parity = value.aggregate?.value?.qualityParity ?? 0;
    const cost = value.aggregate?.value?.costRatio ?? 1;
    add('value-simulation', parity >= 0.9 && cost < 1 ? 'pass' : 'warn', `quality parity ${Math.round(parity * 1000) / 10}% · cost ${Math.round(cost * 1000) / 10}% of frontier`);
  } else {
    add('value-simulation', 'warn', 'value result not packaged', 'run `modelpick bench:value`');
  }

  const hashes = {};
  for (const file of ['catalog/models.json', 'catalog/tasks.json', 'catalog/policy.json', 'package.json']) {
    const absolute = path.join(ROOT, file);
    if (fs.existsSync(absolute)) hashes[file] = sha256(absolute).slice(0, 16);
  }
  add('hashes', Object.keys(hashes).length === 4 ? 'pass' : 'fail', 'catalog/policy hashes available', JSON.stringify(hashes));

  const checksumFile = path.join(ROOT, 'catalog', 'checksums.json');
  if (fs.existsSync(checksumFile)) {
    const manifest = readJson(checksumFile);
    const mismatched = [];
    for (const [file, expected] of Object.entries(manifest?.files ?? {})) {
      const absolute = path.join(ROOT, file);
      if (!fs.existsSync(absolute) || sha256(absolute) !== expected) mismatched.push(file);
    }
    add(
      'integrity',
      mismatched.length === 0 ? 'pass' : 'fail',
      'catalog matches the shipped checksums',
      mismatched.length ? `changed: ${mismatched.join(', ')}` : `${Object.keys(manifest?.files ?? {}).length} files`
    );
  } else {
    add('integrity', 'warn', 'catalog/checksums.json missing', 'run node scripts/checksums.js');
  }

  const receipt = {
    schemaVersion: '1.0',
    kind: 'verification-receipt',
    generatedAt: new Date().toISOString(),
    ok: checks.every((check) => check.status !== 'fail'),
    warnings: checks.filter((check) => check.status === 'warn').length,
    version: pkg?.version ?? null,
    node: process.versions.node,
    checks,
    hashes
  };

  if (ctx.options.receipt) {
    fs.writeFileSync(path.resolve(ctx.options.receipt), `${JSON.stringify(receipt, null, 2)}\n`);
  }

  if (ctx.json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log(`\n  ${ctx.style.bold('ModelPick verification')} ${ctx.style.dim(`· ${pkg?.name ?? 'modelpick'}@${pkg?.version ?? '?'}`)}\n`);
    for (const check of checks) {
      const mark = check.status === 'pass' ? ctx.style.green('✓') : check.status === 'warn' ? ctx.style.yellow('!') : ctx.style.red('✗');
      console.log(`  ${mark} ${check.id.padEnd(20)} ${check.message}`);
      if (check.status !== 'pass' && check.detail) console.log(`    ${ctx.style.dim(check.detail)}`);
    }
    console.log(`\n  hashes ${Object.entries(hashes).map(([file, hash]) => `${path.basename(file)}=${hash}`).join('  ')}`);
    console.log(`  ${receipt.ok ? ctx.style.green('OK') : ctx.style.red('FAIL')}${receipt.warnings ? ctx.style.yellow(` · ${receipt.warnings} warning(s)`) : ''}\n`);
  }

  if (!receipt.ok || (ctx.flags.strict && receipt.warnings)) {
    process.exitCode = 1;
  }
}
