import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function modelpickHome() {
  if (process.env.MODELPICK_HOME) return path.resolve(process.env.MODELPICK_HOME);
  return path.join(os.homedir(), '.modelpick');
}

export function paths() {
  const home = modelpickHome();
  return {
    home,
    config: path.join(home, 'config.json'),
    overrides: path.join(home, 'overrides.json'),
    cache: path.join(home, 'catalog-cache.json'),
    backups: path.join(home, 'backups'),
    log: path.join(home, 'modelpick.log')
  };
}

export function ensureHome() {
  const { home, backups } = paths();
  fs.mkdirSync(home, { recursive: true, mode: 0o700 });
  fs.mkdirSync(backups, { recursive: true, mode: 0o700 });
  return home;
}

const DEFAULT_CONFIG = {
  schemaVersion: 1,
  defaultOptimize: 'balanced',
  telemetry: false,
  checkForUpdates: true,
  agents: {}
};

export function readConfig() {
  const file = paths().config;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { ...DEFAULT_CONFIG, ...parsed, agents: { ...(parsed.agents ?? {}) } };
  } catch (error) {
    if (error.code === 'ENOENT') return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, _error: `Could not read ${file}: ${error.message}` };
  }
}

export function writeConfig(next) {
  ensureHome();
  const file = paths().config;
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify({ ...DEFAULT_CONFIG, ...next }, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, file);
  return file;
}

export function updateConfig(patch) {
  return writeConfig({ ...readConfig(), ...patch });
}

/** Write JSON atomically so a killed process cannot leave a half-written catalog. */
export function writeJsonAtomic(file, value, { mode = 0o600 } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode });
  fs.renameSync(tmp, file);
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function backupFile(file) {
  if (!fs.existsSync(file)) return null;
  const { backups } = paths();
  fs.mkdirSync(backups, { recursive: true, mode: 0o700 });
  const target = path.join(backups, `${path.basename(file)}.${timestamp()}.bak`);
  fs.copyFileSync(file, target);
  return target;
}
