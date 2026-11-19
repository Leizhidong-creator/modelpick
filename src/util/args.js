import { ModelPickError } from '../core/errors.js';

const BOOLEAN_FLAGS = new Set([
  'help', 'version', 'json', 'explain', 'open-weights', 'local', 'no-color', 'quiet',
  'dry-run', 'force', 'all', 'no-input', 'check', 'yes', 'list', 'offline', 'verbose',
  'no-cache', 'include-deprecated', 'portable', 'global', 'available', 'only-available', 'openrouter'
]);

/**
 * Minimal, dependency-free argument parser that behaves the way CLI users expect:
 *   --task coding-agent
 *   --task=coding-agent
 *   --no-color
 *   --json
 *   -h
 * Everything after `--` is positional.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  const options = {};
  let command = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith('--')) {
      const raw = arg.slice(2);
      const eq = raw.indexOf('=');
      const key = eq === -1 ? raw : raw.slice(0, eq);
      if (key.startsWith('no-')) {
        flags[key.slice(3)] = false;
        flags[key] = true;
        continue;
      }
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = eq === -1 ? true : raw.slice(eq + 1) !== 'false';
        continue;
      }
      if (eq !== -1) {
        options[key] = raw.slice(eq + 1);
        continue;
      }
      const next = argv[i + 1];
      if (next != null && (!next.startsWith('-') || /^-\d/.test(next))) {
        options[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
      continue;
    }
    if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1);
      if (key === 'h') flags.help = true;
      else if (key === 'v') flags.version = true;
      else if (key === 'j') flags.json = true;
      else if (key === 'q') flags.quiet = true;
      else flags[key] = true;
      continue;
    }
    if (command == null) command = arg;
    else positionals.push(arg);
  }

  return { command, positionals, flags, options };
}

export function requirePositional(positionals, name, usage) {
  if (!positionals.length || !positionals[0]) {
    throw new ModelPickError(`Missing ${name}.`, {
      code: 'ERR_MISSING_ARGUMENT',
      hint: usage,
      exitCode: 2
    });
  }
  return positionals.join(' ').trim();
}

/** Parse a positive number flag with a helpful error. */
export function numberOption(options, key, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = options[key];
  if (raw == null) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ModelPickError(`--${key} must be a number between ${min} and ${max}.`, {
      code: 'ERR_INVALID_OPTION',
      hint: `Got: ${raw}`
    });
  }
  return value;
}

export function choiceOption(options, key, allowed) {
  const raw = options[key];
  if (raw == null) return undefined;
  if (!allowed.includes(raw)) {
    throw new ModelPickError(`--${key} must be one of: ${allowed.join(', ')}`, {
      code: 'ERR_INVALID_OPTION'
    });
  }
  return raw;
}

export function csvOption(options, key) {
  const raw = options[key];
  if (!raw) return undefined;
  return String(raw)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
