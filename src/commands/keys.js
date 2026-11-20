import readline from 'node:readline';
import { loadCatalog } from '../core/catalog.js';
import { ModelPickError } from '../core/errors.js';
import { getSecret, removeSecret, secretStatus, setSecret } from '../core/secrets.js';
import { assertKnownKeyEnv, checkOllama, validateKey } from '../core/key-check.js';

function providersFrom(catalog) {
  const map = new Map();
  for (const model of catalog.models) {
    const provider = model.provider;
    if (!provider?.id) continue;
    if (!map.has(provider.id)) {
      map.set(provider.id, {
        id: provider.id,
        name: provider.name,
        env: provider.env ?? [],
        keysUrl: provider.keysUrl ?? null,
        docsUrl: provider.docsUrl ?? null,
        models: []
      });
    }
    map.get(provider.id).models.push(model.slug);
  }
  const local = {
    id: 'ollama',
    name: 'Ollama (local)',
    env: [],
    keysUrl: 'https://ollama.com/download',
    docsUrl: 'https://ollama.com',
    models: []
  };
  return [...map.values(), local].sort((a, b) => a.name.localeCompare(b.name));
}

function knownEnvSet(providers) {
  return new Set(providers.flatMap((provider) => provider.env));
}

export function keyRows(providers, ollama) {
  return providers.map((provider) => {
    const statuses = provider.env.map((name) => secretStatus(name));
    const configured = statuses.filter((status) => status.configured);
    return {
      id: provider.id,
      name: provider.name,
      keysUrl: provider.keysUrl,
      docsUrl: provider.docsUrl,
      models: provider.models.length,
      local: provider.id === 'ollama' || provider.env.length === 0,
      ollama,
      env: statuses.map((status) => ({
        name: status.name,
        configured: status.configured,
        source: status.source,
        last4: status.last4,
        updatedAt: status.updatedAt
      })),
      present: statuses.map((status) => ({ name: status.name, set: status.configured })),
      configured: configured.length > 0
    };
  });
}

function printRows(ctx, rows, { json } = {}) {
  if (json) {
    console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'keys', providers: rows }, null, 2));
    return;
  }
  const s = ctx.style;
  console.log(`\n  ${s.bold('Provider connections')} ${s.dim('— values are never read or printed')}\n`);
  for (const row of rows) {
    if (row.local) {
      const state = row.ollama?.running ? s.green('running') : s.dim('not running');
      console.log(`  ${row.name.padEnd(20)} ${state}  ${s.dim('local, no key')}`);
      if (row.keysUrl) console.log(`  ${''.padEnd(20)} ${s.dim(row.keysUrl)}`);
      continue;
    }
    const state = row.env
      .map((entry) => `${entry.configured ? s.green('✓') : s.dim('·')} ${entry.name}${entry.last4 ? s.dim(` ${entry.last4}`) : ''}`)
      .join('  ');
    console.log(`  ${row.name.padEnd(20)} ${state}`);
    if (!row.configured && row.keysUrl) console.log(`  ${''.padEnd(20)} ${s.dim(row.keysUrl)}`);
  }
  const configured = rows.filter((row) => row.configured).length;
  console.log(`\n  ${s.dim(`${configured}/${rows.length} providers configured.`)}`);
  console.log(`  ${s.dim('Configure with:')} ${s.cyan('modelpick keys')} ${s.dim('or')} ${s.cyan('modelpick keys --ui')}`);
  console.log(`  ${s.dim('Local Ollama needs no key:')} ${s.cyan('ollama pull qwen2.5:0.5b')}\n`);
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

export function readHidden(question, { input = process.stdin, output = process.stdout } = {}) {
  if (!input.isTTY) {
    throw new ModelPickError('No interactive terminal.', {
      code: 'ERR_NO_TTY',
      hint: 'Use `modelpick keys set ENV --stdin` in a pipe, or run `modelpick keys --ui`.'
    });
  }
  return new Promise((resolve, reject) => {
    const stdin = input;
    const stdout = output;
    let value = '';
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const done = (error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') return done(new Error('Cancelled.'));
        if (char === '\r' || char === '\n') return done();
        if (char === '\u007f' || char === '\b') {
          if (value.length) {
            value = value.slice(0, -1);
            stdout.write('\b \b');
          }
          continue;
        }
        if (char >= ' ') {
          value += char;
          stdout.write('*');
        }
      }
    };
    stdin.on('data', onData);
  });
}

async function validateAndReport(ctx, env, value) {
  const result = await validateKey(env, value);
  if (ctx.json) return result;
  const s = ctx.style;
  if (result.status === 'valid') console.log(`  ${s.green('✓')} ${env}: ${result.message}`);
  else if (result.status === 'invalid') console.log(`  ${s.yellow('!')} ${env}: ${result.message} — saved, but check the key.`);
  else console.log(`  ${s.dim('·')} ${env}: ${result.message}`);
  return result;
}

export async function runKeyWizard(ctx, providers, rows, io = {}) {
  const s = ctx.style;
  printRows(ctx, rows);
  const known = knownEnvSet(providers);
  let rl = null;
  let askLine = io.askLine;
  if (!askLine) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    askLine = (question) => ask(rl, question);
  }
  const hidden = io.hidden ?? readHidden;
  try {
    for (;;) {
      const answer = (await askLine(`  Configure provider [1-${providers.length}] (Enter to finish): `)).trim();
      if (!answer) break;
      const index = Number(answer) - 1;
      const provider = providers[index];
      if (!provider) {
        console.log(`  ${s.dim('Pick a number from the list.')}`);
        continue;
      }
      if (provider.env.length === 0) {
        console.log(`  ${provider.name} is local and needs no key.`);
        continue;
      }
      const env = provider.env[0];
      assertKnownKeyEnv(env, known);
      const value = await hidden(`  ${env} (hidden, Enter to skip): `);
      if (!value) continue;
      const status = setSecret(env, value);
      console.log(`  ${s.green('✓')} saved ${status.last4} to ~/.modelpick/secrets.json (0600)`);
      if (ctx.flags.test !== false) await validateAndReport(ctx, env, value);
    }
  } finally {
    rl?.close();
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8').trim();
}

export async function runKeys(ctx) {
  const catalog = loadCatalog({ preferCache: !ctx.flags['no-cache'] });
  const providers = providersFrom(catalog);
  const known = knownEnvSet(providers);
  const sub = ctx.positionals[0];
  const target = ctx.positionals[1];

  if (ctx.flags.ui) {
    const { runKeysUi } = await import('../keys-ui/server.js');
    await runKeysUi({ ctx, providers });
    return;
  }

  const ollama = await checkOllama();
  const rows = keyRows(providers, ollama);

  if (sub === 'set') {
    if (!target) {
      throw new ModelPickError('Name the env var to set.', {
        code: 'ERR_MISSING_KEY_NAME',
        hint: 'Example: modelpick keys set OPENAI_API_KEY'
      });
    }
    assertKnownKeyEnv(target, known);
    const value = ctx.flags.stdin ? await readStdin() : await readHidden(`  ${target} (hidden): `);
    if (!value) throw new ModelPickError('No key entered.', { code: 'ERR_EMPTY_KEY' });
    const status = setSecret(target, value);
    if (ctx.json) {
      const result = ctx.flags.test === false ? null : await validateKey(target, value);
      console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'keys-set', env: target, status, validation: result }, null, 2));
      return;
    }
    const s = ctx.style;
    console.log(`\n  ${s.green('✓')} saved ${status.last4} to ${'~/.modelpick/secrets.json'} (0600)`);
    if (ctx.flags.test !== false) await validateAndReport(ctx, target, value);
    console.log(`  ${s.dim('Check with:')} ${s.cyan('modelpick doctor')}\n`);
    return;
  }

  if (sub === 'remove') {
    if (!target) throw new ModelPickError('Name the env var to remove.', { code: 'ERR_MISSING_KEY_NAME' });
    const removed = removeSecret(target);
    if (ctx.json) {
      console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'keys-remove', env: target, removed }, null, 2));
    } else {
      console.log(`\n  ${removed ? ctx.style.green('✓ removed') : ctx.style.dim('not set')} ${target}\n`);
    }
    return;
  }

  if (sub === 'test') {
    if (!target) throw new ModelPickError('Name the env var to test.', { code: 'ERR_MISSING_KEY_NAME' });
    const value = getSecret(target);
    if (!value) throw new ModelPickError(`${target} is not configured.`, { code: 'ERR_MISSING_KEY' });
    const result = await validateKey(target, value);
    if (ctx.json) console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'keys-test', env: target, ...result }, null, 2));
    else console.log(`\n  ${result.status === 'valid' ? ctx.style.green('✓') : ctx.style.yellow('!')} ${target}: ${result.message}\n`);
    return;
  }

  if (sub === 'list') {
    printRows(ctx, rows, { json: ctx.json });
    return;
  }

  if (sub) {
    throw new ModelPickError(`Unknown keys subcommand: ${sub}`, {
      code: 'ERR_UNKNOWN_KEYS_COMMAND',
      hint: 'Use `modelpick keys`, `keys list`, `keys set ENV`, `keys test ENV`, `keys remove ENV`, or `keys --ui`.'
    });
  }

  if (ctx.json || !process.stdin.isTTY) {
    printRows(ctx, rows, { json: ctx.json });
    return;
  }
  await runKeyWizard(ctx, providers, rows);
}

