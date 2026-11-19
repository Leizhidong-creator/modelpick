import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeStyle,
  money,
  num,
  wrap,
  bulletList,
  rule,
  renderHeader,
  renderModels
} from '../../src/cli/format.js';
import { loadCatalog } from '../../src/core/catalog.js';

const style = makeStyle(false);
const catalog = loadCatalog();

test('money and num handle null, zero, and ranges', () => {
  assert.equal(money(null), '—');
  assert.equal(money(Number.NaN), '—');
  assert.equal(money(0), '$0');
  assert.equal(money(0.001), '$0.0010');
  assert.equal(money(0.25), '$0.250');
  assert.equal(money(5), '$5.00');
  assert.equal(money(1500), '$1,500');
  assert.equal(num(null), '—');
  assert.equal(num(1.04), '1');
  assert.equal(num(1.25), '1.3');
});

test('wrap honors width and indentation', () => {
  const wrapped = wrap('one two three four five six', 10, '> ');
  assert.ok(wrapped.split('\n').every((line) => line.length <= 12));
  assert.ok(wrapped.startsWith('> '));
});

test('bulletList and rule render without crashing', () => {
  const list = bulletList(['alpha', 'beta'], { width: 20, style });
  assert.match(list, /alpha/);
  assert.match(list, /beta/);
  assert.equal(rule(10, style).length, 10);
});

test('renderHeader includes name, version, and catalog date', () => {
  const text = renderHeader({ version: '0.1.0', catalogVersion: '2026-11-19', updatedAt: '2026-11-19' }, { style });
  assert.match(text, /0\.1\.0/);
});

test('renderModels renders a catalog slice', () => {
  const text = renderModels(catalog.models.slice(0, 3), { style, width: 100 });
  assert.match(text, /slug/);
  assert.match(text, /claude|slug/i);
});
