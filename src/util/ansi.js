const isWindows = process.platform === 'win32';

function envFlag(name) {
  const value = process.env[name];
  return value != null && value !== '' && value !== '0' && value.toLowerCase() !== 'false';
}

/**
 * Colour is opt-out (NO_COLOR), opt-in (FORCE_COLOR), and TTY-aware.
 * Piped output is plain text by default so it can be diffed and tested.
 */
export function colorEnabled(stream = process.stdout) {
  if (envFlag('NO_COLOR')) return false;
  if (envFlag('FORCE_COLOR')) return true;
  if (process.env.TERM === 'dumb') return false;
  return Boolean(stream && stream.isTTY);
}

export function createStyler(enabled = colorEnabled()) {
  const wrap = (open, close) => (text) => (enabled ? `\u001b[${open}m${text}\u001b[${close}m` : String(text));
  return {
    enabled,
    bold: wrap(1, 22),
    dim: wrap(2, 22),
    italic: wrap(3, 23),
    underline: wrap(4, 24),
    red: wrap(31, 39),
    green: wrap(32, 39),
    yellow: wrap(33, 39),
    blue: wrap(34, 39),
    magenta: wrap(35, 39),
    cyan: wrap(36, 39),
    gray: wrap(90, 39),
    white: wrap(97, 39)
  };
}

export const style = createStyler();

const ANSI_RE = /\u001b\[[0-9;]*m/g;

export function stripAnsi(text) {
  return String(text).replace(ANSI_RE, '');
}

/** Approximate terminal width; CJK and emoji count as two columns. */
export function displayWidth(text) {
  let width = 0;
  for (const char of stripAnsi(text)) {
    const code = char.codePointAt(0);
    if (
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x1f300 && code <= 0x1faff)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

export function symbols() {
  if (envFlag('MODELPICK_ASCII') || process.env.TERM === 'dumb') {
    return { bullet: '-', check: '+', cross: 'x', arrow: '>', dot: '.', line: '-', spark: '*' };
  }
  return { bullet: '•', check: '✓', cross: '×', arrow: '→', dot: '·', line: '─', spark: '◆' };
}

export function pad(text, width, align = 'left') {
  const gap = Math.max(0, width - displayWidth(text));
  if (align === 'right') return ' '.repeat(gap) + text;
  if (align === 'center') {
    const left = Math.floor(gap / 2);
    return ' '.repeat(left) + text + ' '.repeat(gap - left);
  }
  return text + ' '.repeat(gap);
}

export function truncate(text, width) {
  if (displayWidth(text) <= width) return text;
  let out = '';
  for (const char of String(text)) {
    if (displayWidth(out + char) > width - 1) break;
    out += char;
  }
  return out + '…';
}
