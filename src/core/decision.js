import fs from 'node:fs';
import { buildJudgePrompt, parseVerdict } from './judge.js';
import { ModelPickError } from './errors.js';

/**
 * A portable decision packet: everything a judge/decision model needs, and
 * nothing it does not. The packet can be sent to any provider by the user; the
 * returned verdict is applied locally with `modelpick pick --verdict`.
 */
export function buildDecisionPacket(result) {
  const candidates = [result.recommendation, ...(result.alternatives ?? [])].filter(Boolean);
  const allowedSlugs = candidates.map((candidate) => candidate.slug);
  const task = result.task;
  return {
    schemaVersion: '1.0',
    kind: 'decision-packet',
    task: { id: task.id, label: task.label, blurb: task.blurb },
    constraints: result.assumptions?.requirements ?? {},
    allowedSlugs,
    candidates: candidates.map((candidate, index) => ({
      label: String.fromCharCode(65 + index),
      slug: candidate.slug,
      name: candidate.name,
      quality: candidate.quality,
      costPerTask: candidate.costPerTask,
      expectedAttempts: candidate.expectedAttempts,
      latencySec: candidate.latencySec,
      openWeights: candidate.openWeights,
      availability: candidate.availability,
      why: candidate.why
    })),
    prompt: buildJudgePrompt({
      task: { id: task.id, label: task.label, blurb: task.blurb },
      candidates,
      constraints: result.assumptions?.requirements ?? {}
    }),
    outputSchema: {
      ranking: 'array of every allowedSlug exactly once',
      confidence: 'number 0..1',
      reason: 'string <=320 chars'
    },
    applyCommand: 'modelpick pick "<same query>" --verdict verdict.json'
  };
}

export function readVerdict(file) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new ModelPickError(`Could not read verdict file: ${file}`, {
      code: 'ERR_VERDICT_READ',
      hint: error.message
    });
  }
  const verdict = parsed.verdict ?? parsed;
  if (!Array.isArray(verdict.ranking)) {
    throw new ModelPickError('Verdict needs a ranking array.', {
      code: 'ERR_VERDICT_INVALID',
      hint: 'Expected {"ranking":["slug1","slug2"],"confidence":0.7,"reason":"..."}'
    });
  }
  return verdict;
}

export function validateVerdict(verdict, allowedSlugs) {
  try {
    return parseVerdict(JSON.stringify(verdict), allowedSlugs);
  } catch (error) {
    throw new ModelPickError(`Verdict rejected: ${error.message}`, {
      code: 'ERR_VERDICT_INVALID',
      hint: `Allowed models: ${allowedSlugs.join(', ')}`
    });
  }
}
