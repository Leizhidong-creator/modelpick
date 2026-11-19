import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tempDir } from '../helpers.js';

test('decide --json returns a complete, self-contained decision packet', () => {
  const result = runCli(['decide', '3D sword for a Unity game', '--json']);
  assert.equal(result.status, 0);
  const packet = JSON.parse(result.stdout);
  assert.equal(packet.kind, 'decision-packet');
  assert.ok(packet.allowedSlugs.length >= 2);
  assert.equal(packet.candidates.length, packet.allowedSlugs.length);
  assert.ok(packet.prompt.includes('Return ONLY JSON'));
  for (const slug of packet.allowedSlugs) assert.ok(packet.prompt.includes(slug));
});

test('a verdict is applied locally and reported', () => {
  const cwd = tempDir();
  const packetResult = runCli(['decide', '3D sword for a Unity game', '--json'], { cwd });
  const packet = JSON.parse(packetResult.stdout);
  const verdict = { ranking: [...packet.allowedSlugs].reverse(), confidence: 0.8, reason: 'test' };
  fs.writeFileSync(path.join(cwd, 'verdict.json'), JSON.stringify(verdict));
  const result = runCli(['pick', '3D sword for a Unity game', '--verdict', 'verdict.json', '--json'], { cwd });
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.recommendation.slug, packet.allowedSlugs.at(-1));
  assert.equal(parsed.decision.applied, true);
  assert.equal(parsed.decision.source, 'external-verdict');
});

test('an invented slug in a verdict is rejected, not silently ignored', () => {
  const cwd = tempDir();
  fs.writeFileSync(path.join(cwd, 'bad.json'), JSON.stringify({ ranking: ['not-a-model'], confidence: 0.5 }));
  const result = runCli(['pick', '3D sword for a Unity game', '--verdict', 'bad.json', '--json'], { cwd });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('ERR_VERDICT_INVALID'));
});

test('a missing verdict file is a structured error', () => {
  const result = runCli(['pick', '3D sword', '--verdict', 'nope.json', '--json']);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('ERR_VERDICT_READ'));
});
