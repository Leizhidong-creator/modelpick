import fs from 'node:fs';
import path from 'node:path';
import { ensureHome, paths, writeJsonAtomic } from './config.js';
import { ModelPickError } from './errors.js';

const SCHEMA_VERSION = 1;
const MAX_SECRET_LENGTH = 20000;
const ENV_NAME = /^[A-Z][A-Z0-9_]*$/;

export function secretsFile() {
  return path.join(paths().home, 'secrets.json');
}

function emptyStore() {
  return { schemaVersion: SCHEMA_VERSION, updatedAt: null, keys: {} };
}

function assertNotSymlink(file) {
  try {
    if (fs.lstatSync(file).isSymbolicLink()) {
      throw new ModelPickError('Refusing to use a symlinked secrets file.', {
        code: 'ERR_KEYSTORE_SYMLINK',
        hint: 'Remove the symlink; keys must live in a regular file with mode 0600.'
      });
    }
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
}

export function readSecrets() {
  const file = secretsFile();
  assertNotSymlink(file);
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION || typeof parsed.keys !== 'object' || parsed.keys === null) {
      throw new ModelPickError('secrets.json has an unsupported shape.', {
        code: 'ERR_KEYSTORE_INVALID',
        hint: 'Move it aside and run `modelpick keys --ui` again.'
      });
    }
    return { ...emptyStore(), ...parsed, keys: { ...parsed.keys } };
  } catch (error) {
    if (error.code === 'ENOENT') return emptyStore();
    if (error instanceof ModelPickError) throw error;
    throw new ModelPickError(`Could not read ${file}: ${error.message}`, {
      code: 'ERR_KEYSTORE_READ',
      hint: 'Fix the file permissions or move it aside.'
    });
  }
}

export function writeSecrets(store) {
  ensureHome();
  const file = secretsFile();
  assertNotSymlink(file);
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    keys: store.keys ?? {}
  };
  writeJsonAtomic(file, payload, { mode: 0o600 });
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // Windows may ignore POSIX modes; the user profile is still access-controlled.
  }
  return file;
}

export function assertEnvName(name) {
  if (!ENV_NAME.test(name)) {
    throw new ModelPickError(`Invalid key name: ${name}`, {
      code: 'ERR_INVALID_KEY_NAME',
      hint: 'Use the provider env var, e.g. OPENAI_API_KEY.'
    });
  }
}

export function setSecret(name, value) {
  assertEnvName(name);
  const secret = String(value ?? '').trim();
  if (!secret) {
    throw new ModelPickError('The key is empty.', {
      code: 'ERR_EMPTY_KEY',
      hint: 'Paste the key again, or press Ctrl+C to cancel.'
    });
  }
  if (secret.length > MAX_SECRET_LENGTH || /[\r\n]/.test(secret)) {
    throw new ModelPickError('The key is not a single-line value.', {
      code: 'ERR_INVALID_KEY',
      hint: 'Paste only the key value, without newlines.'
    });
  }
  const store = readSecrets();
  store.keys[name] = { value: secret, updatedAt: new Date().toISOString() };
  writeSecrets(store);
  return secretStatus(name);
}

export function removeSecret(name) {
  assertEnvName(name);
  const store = readSecrets();
  if (!store.keys[name]) return false;
  delete store.keys[name];
  writeSecrets(store);
  return true;
}

export function storedEnvNames() {
  try {
    return new Set(Object.keys(readSecrets().keys));
  } catch {
    return new Set();
  }
}

export function secretStatus(name) {
  const envValue = process.env[name];
  const envSet = typeof envValue === 'string' && envValue.length > 0;
  let storedValue = null;
  let updatedAt = null;
  try {
    const entry = readSecrets().keys[name];
    storedValue = entry?.value ?? null;
    updatedAt = entry?.updatedAt ?? null;
  } catch {
    storedValue = null;
  }
  const value = envSet ? envValue : storedValue;
  return {
    name,
    configured: Boolean(value),
    source: envSet ? 'env' : storedValue ? 'file' : 'none',
    last4: value ? redact(value) : null,
    updatedAt
  };
}

export function getSecret(name) {
  if (process.env[name]) return process.env[name];
  try {
    return readSecrets().keys[name]?.value ?? null;
  } catch {
    return null;
  }
}

export function redact(value) {
  const text = String(value ?? '');
  if (text.length <= 4) return '****';
  return `…${text.slice(-4)}`;
}

export const KEYSTORE = {
  schemaVersion: SCHEMA_VERSION,
  maxSecretLength: MAX_SECRET_LENGTH
};
