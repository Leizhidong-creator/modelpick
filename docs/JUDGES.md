# Judge and decision models

**Status:** the offline verdict bridge is shipped and tested (`decide`, `pick --verdict`, MCP `verdict`); live judge API calls are **not** shipped and not enabled by default. A judge layer that cannot be calibrated is worse than no judge at all.

## Try it without an API key

```bash
# 1. Build a portable packet: task, allowed models, constraints, prompt.
modelpick decide "rigged 3D character for Unity" --json > packet.json

# 2. Send packet.prompt to any judge/decision model (Claude, GPT, Gemini,
#    a Google decision model, or a local model). Save its JSON.

# 3. Apply the verdict locally. It cannot invent a model or override a filter.
modelpick pick "rigged 3D character for Unity" --verdict verdict.json
```

The packet and the verdict are plain JSON. The same flow works through MCP:
`pick_model` accepts an optional `verdict` object, so an agent can ask a judge
and feed the answer back without a second integration.

## Why a judge at all

The deterministic router is a strong prior. It can still be blind to interactions a model handles better than its benchmark score suggests: exact output format, language nuance, a design brief, a codebase convention.

A **judge model** can look at the shortlist, the task, and the constraints and re-rank the top candidates. A **decision-tuned model** (the class Google and others ship for routing/selection) can do the same with a different prior. Neither should replace the hard filters, the price model, or the benchmark.

## What is shipped

`src/core/judge.js`:

| Function | Purpose |
|---|---|
| `shouldJudge(ranked, {minGap})` | only invoke a judge when the top two scores are within 2 points |
| `buildJudgePrompt({task, candidates, constraints})` | blind A/B/C labels; only the shortlist; strict JSON contract |
| `parseVerdict(text, allowedSlugs)` | rejects missing, duplicate, invented, or malformed candidates |
| `aggregateVerdicts(verdicts)` | Borda count, confidence, top-1 agreement |
| `applyVerdict(candidates, verdict, {maxShift})` | reorders only the shortlist, caps movement at 2 positions |

`tests/unit/judge.test.js` covers the contract, including a judge trying to invent a model.

## Candidate judges

| Role | Candidate | Why |
|---|---|---|
| Strong general judge | Claude Fable 5.2 | best overall quality on the current board |
| Structured-output judge | GPT-6.2 Astra | strong instruction following and JSON |
| Cheap judge | DeepSeek V4.1 Flash | ~2% of frontier cost; useful for high-volume calibration |
| Decision-tuned / router model | Google's decision-model line and similar selection models | trained for choice, not generation |
| Ensemble | three of the above | majority/Borda; catches single-judge bias |

No provider is endorsed. The judge list is catalog data, not a partnership claim.

## Protocol

1. **Deterministic first.** Run the normal router. If the top two scores differ by more than 2 points, do not judge.
2. **Blind the candidates.** Replace names with A/B/C; shuffle order per judge; do not include brand names.
3. **Two passes.** Run A→C and C→A; drop the verdict if the ranking is inconsistent.
4. **Three judges.** Majority/Borda; record each verdict and confidence.
5. **Cap the shift.** A judge may move a candidate at most two positions; it cannot introduce a model outside the shortlist.
6. **Log the receipt.** Task, shortlist, judge slugs, raw verdicts, aggregate, final pick, cost of judging.
7. **Human spot-check.** 10% of judged decisions go to a human reviewer; disagreements are added to the benchmark.

## Guardrails

- A judge cannot override budget, context, modality, text-in-image, rigging, lip-sync, open weights, or availability.
- A judge cannot invent a price, model id, or capability.
- A judge is skipped when its own cost would exceed 5% of the task's estimated cost per solved task.
- No judge output is trusted without JSON-schema validation.
- Judge verdicts are advisory; the deterministic result is the fallback.

## Meta-evaluation (the part that decides whether this ships)

Before enabling judge reranking by default, it must pass:

| Metric | Threshold |
|---|---|
| Top-1 agreement with expert labels | +2 percentage points over deterministic |
| Cohen's κ vs expert labels | ≥0.60 |
| Position consistency (A/B vs B/A) | ≥90% |
| Constraint violations | 0 |
| Judge failure / invalid JSON rate | <2% |
| Added cost per decision | <5% of task cost per solved task |
| Latency | p95 <8s (judge calls are network-bound) |

If it fails, the judge remains an opt-in research tool. The current deterministic benchmark is already at 100% on the authored sets; a judge that "improves" that is more likely to be overfitting than adding signal.

## Cost math

For a coding task at $0.17 per solved task, a three-judge panel at ~$0.01–$0.03 per judgment adds $0.03–$0.09 — 18–53% overhead. That is only justified for high-stakes nodes (architecture, security review, hero asset), not for classification or extraction. `shouldJudge` and the 5% cap encode this.

## What "Google Decision model" means here

Google and other labs ship models optimized for **selection and decision tasks**, not just generation. If such a model is available through the same provider key, it is a natural judge candidate. The integration is the same: add it to the judge list in `~/.modelpick/overrides.json`, call it with `buildJudgePrompt`, validate with `parseVerdict`. It is not a special-case code path.

## Next step

A live judge calibration run requires API keys and an expert-labeled output set. The harness is ready; the evidence is not. Until then, the product says so.
