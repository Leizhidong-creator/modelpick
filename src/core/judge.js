/**
 * Optional judge/decision-model layer.
 *
 * The deterministic router is the default. A judge may only reorder the existing
 * top-k candidates; it cannot add a model, change a price, or override a hard
 * constraint. This module is pure so it can be tested without an API key.
 */
const MAX_REASON = 320;

export function shouldJudge(ranked, { minGap = 2, topK = 3 } = {}) {
  if (!ranked?.candidates || ranked.candidates.length < 2) return false;
  const top = ranked.candidates[0];
  const second = ranked.candidates[1];
  return Math.abs(top.score - second.score) <= minGap && topK >= 2;
}

export function buildJudgePrompt({ task, candidates, constraints = {} }) {
  const allowed = candidates.map((candidate) => candidate.slug);
  const rows = candidates.map((candidate, index) => ({
    label: String.fromCharCode(65 + index),
    slug: candidate.slug,
    name: candidate.name,
    quality: candidate.quality,
    costPerTask: candidate.costPerTask,
    expectedAttempts: candidate.attempts,
    latencySec: candidate.latencySec,
    openWeights: candidate.openWeights,
    why: candidate.why
  }));
  return `You are a model-selection judge for one workflow node.

TASK
${task.id}: ${task.label}
${task.blurb}

CONSTRAINTS
${JSON.stringify(constraints)}

CANDIDATES (only these are allowed)
${JSON.stringify(rows, null, 2)}

Pick the best price-performance choice for this task. "Best" means the highest
quality that still solves the task at a materially lower cost than the most
expensive candidate. Do not pick the cheapest if its quality is clearly below the
task's bar. Do not invent prices or capabilities.

Return ONLY JSON:
{"ranking":["slug1","slug2","..."],"confidence":0.0,"reason":"<= ${MAX_REASON} chars"}

Rules:
- ranking must contain every candidate exactly once.
- slugs must come from the list above.
- confidence is 0..1.
- reason must cite quality, cost, or a hard constraint.
- no prose outside JSON.`;
}

export function parseVerdict(text, allowedSlugs) {
  if (typeof text !== 'string') throw new Error('Judge output must be a string');
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Judge did not return JSON');
  let parsed;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch (error) {
    throw new Error(`Judge JSON is invalid: ${error.message}`);
  }
  if (!Array.isArray(parsed.ranking)) throw new Error('Judge JSON needs a ranking array');
  if (parsed.ranking.length !== allowedSlugs.length) throw new Error('Judge ranking must include every candidate');
  if (new Set(parsed.ranking).size !== parsed.ranking.length) throw new Error('Judge ranking contains duplicates');
  for (const slug of parsed.ranking) {
    if (!allowedSlugs.includes(slug)) throw new Error(`Judge invented a candidate: ${slug}`);
  }
  const confidence = Number(parsed.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error('Judge confidence must be 0..1');
  return {
    ranking: parsed.ranking,
    confidence,
    reason: String(parsed.reason ?? '').slice(0, MAX_REASON)
  };
}

function borda(ranking) {
  const scores = new Map();
  ranking.forEach((slug, index) => scores.set(slug, ranking.length - index));
  return scores;
}

export function aggregateVerdicts(verdicts) {
  if (!verdicts.length) throw new Error('No verdicts');
  const scores = new Map();
  for (const verdict of verdicts) {
    for (const [slug, points] of borda(verdict.ranking)) {
      scores.set(slug, (scores.get(slug) ?? 0) + points);
    }
  }
  const ranking = [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([slug]) => slug);
  const topVotes = verdicts.filter((verdict) => verdict.ranking[0] === ranking[0]).length;
  return {
    ranking,
    confidence: Math.round((verdicts.reduce((sum, verdict) => sum + verdict.confidence, 0) / verdicts.length) * 100) / 100,
    agreement: Math.round((topVotes / verdicts.length) * 100) / 100,
    verdicts: verdicts.length
  };
}

/**
 * Reorder the top-k only, and cap movement so a judge cannot promote a weak
 * candidate from outside the shortlist. Hard-constraint violations are impossible
 * because only already-eligible candidates are passed in.
 */
export function applyVerdict(candidates, verdict, { maxShift = 2 } = {}) {
  const bySlug = new Map(candidates.map((candidate) => [candidate.slug, candidate]));
  const current = candidates.map((candidate) => candidate.slug);
  const proposed = verdict.ranking.filter((slug) => bySlug.has(slug));
  if (proposed.length !== current.length) return { candidates, applied: false, reason: 'incomplete-ranking' };
  const reordered = proposed.map((slug) => bySlug.get(slug));
  for (let index = 0; index < reordered.length; index += 1) {
    const from = current.indexOf(reordered[index].slug);
    if (Math.abs(from - index) > maxShift) {
      return { candidates, applied: false, reason: 'shift-too-large' };
    }
  }
  return { candidates: reordered, applied: true, reason: 'ok' };
}

export const JUDGE_LIMITS = { maxReason: MAX_REASON };
