#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, validateCatalog, validateTasks, catalogStats } from '../src/core/catalog.js';
import { loadPolicy, validatePolicy } from '../src/core/policy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const checks = [];

function check(name, fn) {
  try {
    const detail = fn();
    checks.push({ name, ok: true, detail });
  } catch (error) {
    checks.push({ name, ok: false, detail: error.message });
    errors.push(`${name}: ${error.message}`);
  }
}

check('catalog', () => {
  const catalog = loadCatalog({ preferCache: false });
  const stats = catalogStats(catalog);
  return `${stats.models} models, ${stats.tasks} tasks, ${stats.providers} providers`;
});

check('catalog schema', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'models.json'), 'utf8'));
  validateCatalog(catalog);
  return 'valid';
});

check('task schema', () => {
  validateTasks(JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'tasks.json'), 'utf8')));
  return 'valid';
});

check('policy', () => {
  validatePolicy(loadPolicy());
  return 'valid';
});

check('plans reference real tasks', () => {
  const catalog = loadCatalog({ preferCache: false });
  const plans = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'plans.json'), 'utf8')).plans;
  for (const plan of plans) {
    for (const step of plan.steps) {
      if (!catalog.taskById.has(step.task)) throw new Error(`${plan.id}/${step.id} references ${step.task}`);
    }
  }
  return `${plans.length} plans`;
});

const manifests = [
  'package.json',
  '.claude-plugin/marketplace.json',
  'plugins/modelpick/.claude-plugin/plugin.json',
  'plugins/modelpick/plugin.json',
  'plugins/modelpick/.mcp.json',
  '.agents/plugins/marketplace.json'
];
check('JSON manifests parse', () => {
  for (const file of manifests) JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  return `${manifests.length} files`;
});

check('skill files exist', () => {
  const files = [
    'skills/modelpick/SKILL.md',
    '.agents/skills/modelpick/SKILL.md',
    '.dsh/skills/modelpick/SKILL.md',
    'plugins/modelpick/skills/modelpick/SKILL.md'
  ];
  for (const file of files) {
    if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`missing ${file}`);
  }
  return `${files.length} copies`;
});

for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.name.padEnd(28)} ${item.detail}`);
}
if (errors.length) {
  console.error(`\n${errors.length} validation error(s).`);
  process.exit(1);
}
console.log('\nCatalog is valid.');
