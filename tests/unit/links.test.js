import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

function localLinks(text) {
  const links = new Set();
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) links.add(match[1]);
  for (const match of text.matchAll(/src="([^"]+)"/g)) links.add(match[1]);
  return [...links].filter(
    (link) =>
      !link.startsWith('http') &&
      !link.startsWith('#') &&
      !link.startsWith('mailto:') &&
      !link.startsWith('data:') &&
      !link.startsWith('cursor:')
  );
}

test('README local links point at real files', () => {
  const links = localLinks(read('README.md'));
  const missing = links
    .map((link) => link.split('#')[0])
    .filter(Boolean)
    .filter((link) => !fs.existsSync(path.join(ROOT, link)));
  assert.deepEqual(missing, [], `missing: ${missing.join(', ')}`);
});

test('launch kit links point at real files', () => {
  const files = fs.readdirSync(path.join(ROOT, 'launch')).filter((file) => file.endsWith('.md'));
  const missing = [];
  for (const file of files) {
    for (const link of localLinks(read(path.join('launch', file)))) {
      const local = link.split('#')[0];
      if (!local) continue;
      if (!fs.existsSync(path.join(ROOT, 'launch', local))) missing.push(`${file} -> ${link}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('video deliverables exist and are non-empty', () => {
  for (const file of ['assets/modelpick-intro.mp4', 'assets/modelpick-intro.srt', 'assets/modelpick-intro-thumb.png', 'launch/video-storyboard.md']) {
    const stat = fs.statSync(path.join(ROOT, file));
    assert.ok(stat.size > 1000, `${file} is too small`);
  }
  for (const file of ['short-cost.mp4', 'short-3d.mp4', 'short-pipeline.mp4', 'short-proof.mp4']) {
    const stat = fs.statSync(path.join(ROOT, 'launch', 'shorts', file));
    assert.ok(stat.size > 300000, `launch/shorts/${file} is too small`);
  }
});

test('docs local links point at real files', () => {
  const files = fs.readdirSync(path.join(ROOT, 'docs')).filter((file) => file.endsWith('.md'));
  const missing = [];
  for (const file of files) {
    for (const link of localLinks(read(path.join('docs', file)))) {
      const local = link.split('#')[0];
      if (!local) continue;
      const resolved = path.resolve(path.join(ROOT, 'docs'), local);
      if (!fs.existsSync(resolved)) missing.push(`${file} -> ${link}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('site assets mirror the README assets', () => {
  for (const file of ['social-preview.png', 'terminal-pick.png', 'benchmark.png', 'modelpick-intro.mp4', 'modelpick-intro-thumb.png', 'modelpick-intro.bilingual.srt']) {
    assert.ok(fs.existsSync(path.join(ROOT, 'docs', 'assets', file)), `docs/assets/${file} missing`);
  }
});

test('skill copies contain no mojibake and mention the decision packet', () => {
  const files = [
    'skills/modelpick/SKILL.md',
    '.agents/skills/modelpick/SKILL.md',
    '.claude/skills/modelpick/SKILL.md',
    '.dsh/skills/modelpick/SKILL.md',
    'plugins/modelpick/skills/modelpick/SKILL.md'
  ];
  for (const file of files) {
    const text = read(file);
    assert.ok(!text.includes('鈥'), `${file} has mojibake`);
    assert.ok(!text.includes('\uFFFD'), `${file} has a replacement character`);
    assert.ok(text.includes('get_decision_packet'), `${file} does not mention get_decision_packet`);
  }
});
