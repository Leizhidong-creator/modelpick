import fs from 'node:fs';
import { validateCatalog, loadCatalog } from '../core/catalog.js';
import { paths, writeJsonAtomic } from '../core/config.js';
import { ModelPickError } from '../core/errors.js';

const REMOTE_URL = 'https://raw.githubusercontent.com/Leizhidong-creator/modelpick/main/catalog/models.json';

async function fetchCatalog(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'modelpick' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function runUpdate(ctx) {
  const file = ctx.options.file;
  let next;
  try {
    if (file) {
      next = JSON.parse(fs.readFileSync(file, 'utf8'));
    } else {
      if (ctx.flags.offline) {
        throw new ModelPickError('--offline means there is nothing to fetch.', {
          code: 'ERR_OFFLINE',
          hint: 'Pass --file <path> to import a local snapshot.'
        });
      }
      next = await fetchCatalog(ctx.options.url ?? REMOTE_URL);
    }
  } catch (error) {
    throw new ModelPickError(`Could not fetch a catalog update: ${error.message}`, {
      code: 'ERR_UPDATE_FAILED',
      hint: `Import a local snapshot instead: modelpick update --file <path>`
    });
  }

  try {
    validateCatalog(next);
  } catch (error) {
    throw new ModelPickError(`Remote catalog failed validation: ${error.message}`, {
      code: 'ERR_UPDATE_INVALID',
      hint: 'The snapshot was not written. Nothing changed.'
    });
  }

  const current = loadCatalog();
  const newer = String(next.catalogVersion ?? '') > String(current.catalogVersion ?? '');
  const summary = {
    schemaVersion: '1.0',
    kind: 'update',
    from: current.catalogVersion,
    to: next.catalogVersion,
    models: next.models.length,
    newer,
    path: paths().cache,
    check: Boolean(ctx.flags.check)
  };

  if (!ctx.flags.check) {
    if (!newer) {
      summary.written = false;
      summary.message = 'Already current; cache not rewritten.';
    } else {
      writeJsonAtomic(paths().cache, next);
      summary.written = true;
      summary.message = 'Updated local cache. The bundled snapshot is untouched.';
    }
  }

  if (ctx.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const s = ctx.style;
  console.log(`\n  ${s.bold('Catalog update')}`);
  console.log(`  ${s.dim('installed')} ${current.catalogVersion}  ${s.dim('available')} ${next.catalogVersion} ${s.dim(`(${next.models.length} models)`)}`);
  if (ctx.flags.check) {
    console.log(`  ${newer ? s.yellow('An update is available.') : s.green('You are current.')}\n`);
    return;
  }
  if (!newer) {
    console.log(`  ${s.green('Already current.')}\n`);
    return;
  }
  console.log(`  ${s.green('Updated.')} ${summary.message}`);
  console.log(`  ${s.dim(summary.path)}\n`);
}
