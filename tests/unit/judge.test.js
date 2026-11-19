import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldJudge, buildJudgePrompt, parseVerdict, aggregateVerdicts, applyVerdict } from '../../src/core/judge.js';

const candidates = [
  { slug: 'a', name: 'A', quality: 90, costPerTask: 0.2, attempts: 1.1, latencySec: 5, openWeights: false, why: ['x'] },
  { slug: 'b', name: 'B', quality: 88, costPerTask: 0.08, attempts: 1.2, latencySec: 4, openWeights: true, why: ['y'] },
  { slug: 'c', name: 'C', quality: 80, costPerTask: 0.02, attempts: 1.5, latencySec: 3, openWeights: false, why: ['z'] }
];

test('shouldJudge only fires on a close top two', () => {
  const close = { candidates: [{ score: 80 }, { score: 79 }] };
  const far = { candidates: [{ score: 90 }, { score: 70 }] };
  assert.equal(shouldJudge(close), true);
  assert.equal(shouldJudge(far), false);
  assert.equal(shouldJudge({ candidates: [{ score: 90 }] }), false);
});

test('judge prompt contains only allowed slugs and the output contract', () => {
  const prompt = buildJudgePrompt({ task: { id: '3d-gen', label: '3D', blurb: 'b' }, candidates });
  for (const candidate of candidates) assert.ok(prompt.includes(candidate.slug));
  assert.ok(prompt.includes('Return ONLY JSON'));
  assert.ok(prompt.includes('ranking must contain every candidate'));
  assert.ok(!prompt.includes('claude-fable-5.2'), 'prompt must not leak models outside the shortlist');
});

test('parseVerdict accepts fenced JSON and rejects duplicates, missing, invented slugs', () => {
  const good = parseVerdict('```json\n{"ranking":["b","a","c"],"confidence":0.7,"reason":"cheaper"}\n```', ['a', 'b', 'c']);
  assert.deepEqual(good.ranking, ['b', 'a', 'c']);
  assert.equal(good.confidence, 0.7);
  assert.throws(() => parseVerdict('{"ranking":["a","a","c"],"confidence":0.5}', ['a', 'b', 'c']), /duplicates/);
  assert.throws(() => parseVerdict('{"ranking":["a","b"],"confidence":0.5}', ['a', 'b', 'c']), /every candidate/);
  assert.throws(() => parseVerdict('{"ranking":["a","b","x"],"confidence":0.5}', ['a', 'b', 'c']), /invented/);
  assert.throws(() => parseVerdict('not json', ['a']), /JSON/);
});

test('aggregateVerdicts uses Borda and reports agreement', () => {
  const result = aggregateVerdicts([
    { ranking: ['b', 'a', 'c'], confidence: 0.7 },
    { ranking: ['b', 'c', 'a'], confidence: 0.6 },
    { ranking: ['a', 'b', 'c'], confidence: 0.5 }
  ]);
  assert.equal(result.ranking[0], 'b');
  assert.equal(result.verdicts, 3);
  assert.equal(result.agreement, 0.67);
});

test('applyVerdict reorders only within the shortlist and caps movement', () => {
  const ok = applyVerdict(candidates, { ranking: ['b', 'a', 'c'] }, { maxShift: 2 });
  assert.equal(ok.applied, true);
  assert.equal(ok.candidates[0].slug, 'b');

  const tooFar = applyVerdict(candidates, { ranking: ['c', 'b', 'a'] }, { maxShift: 1 });
  assert.equal(tooFar.applied, false);
  assert.equal(tooFar.reason, 'shift-too-large');
});

test('a judge cannot introduce a model outside the shortlist', () => {
  const result = applyVerdict(candidates, { ranking: ['x', 'a', 'b'] }, { maxShift: 2 });
  assert.equal(result.applied, false);
  assert.equal(result.candidates, candidates);
});
