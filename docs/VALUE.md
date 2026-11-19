# How ModelPick defines value

**Value is not the cheapest model.** It is the cheapest model that still produces a result close to the best model's result at that node. The unit is **cost per solved task**, and "close" is an explicit, testable quality band.

This document defines the metric, shows the simulation, and states where it is fragile.

## 1. The quality vector

A model is not one number. For task \(t\), ModelPick computes:

\[
Q(m,t) = \sum_i w_{t,i} \cdot q_{m,i}
\]

- \(q_{m,i}\) is a capability score in 0–100 (`coding`, `codingAgent`, `imageGen`, `threeD`, …).
- \(w_{t,i}\) is the task's `qualityMix` (sums to 1). A coding-agent node weights `codingAgent`, `coding`, and `overall` differently from a long-context node.
- Missing capabilities fall back to `overall − 8`, but hard capability filters usually prevent that path.
- Every media score is a **prior**, not an independent measurement. See [`QUALITY.md`](QUALITY.md).

This is why the same model can be the right answer for a 3D prop and the wrong answer for a headline image: the vector and the task mix change, not just the price.

## 2. The cost

\[
C(m,t) = \text{unitCost}(m,t) \times \text{attempts}(Q)
\]

- Text: cache-aware input + output tokens (per million).
- Media: unit amount × units (image, second, asset, 1k chars, minute, song).
- Attempts: `1 / (1 − clamp(1.15 × (100 − Q)/100, 0.02, 0.75))`, capped at 4.
- Budget and quality floors are **hard filters** applied before scoring.

The retry curve is a model, not a measurement. It is shown on every result and tested in `tests/unit/score.test.js`.

## 3. Value pick

1. Filter to eligible models (modality, capability, context, budget, openness, keys).
2. Find the best quality \(Q^*\).
3. Keep models with \(Q \ge \max(Q^* - 6,\ Q_{\text{top}} - 0.5)\).
4. Pick the lowest \(C\) in that band; break ties by higher \(Q\).

Two properties matter:

- The value pick is **never worse than the recommendation**. A cheaper model below the recommendation's quality is not "value"; it is a downgrade.
- The band is a **quality-constrained cost minimization**, not a quality/cost ratio. A ratio rewards a $0.001 model with 60 quality; that is not the product.

`--optimize value` uses the same band with a value-oriented utility. `--optimize cost` drops the quality preference to the task floor: it is the "cheapest that still clears the bar" mode, not the default.

## 4. Simulation: value vs cheapest vs frontier

`node bench/value.js` simulates 4,000 jobs per task across five task types. Each model's catalog quality becomes a first-pass success probability; retries follow the router curve; cost accumulates per attempt. Results are seeded and reproducible.

`tests/results/value-latest.json`:

| Strategy | First-pass | Cost / solved | Quality parity | Cost vs frontier | Parity ≥90% |
|---|---:|---:|---:|---:|---:|
| Frontier always | 93.7% | $0.6417 | 100.0% | 100.0% | 100% |
| **Value pick** | **91.7%** | **$0.2708** | **97.9%** | **58.4%** | **100%** |
| Cheapest always | 83.3% | $0.1736 | 88.8% | 34.1% | 60% |
| Task default (balanced) | 84.0% | $0.1752 | 89.6% | 34.6% | 60% |
| Per-trial oracle | — | $0.1625 | 100.0% | 32.6% | 100% |

**Reading it:** the value pick keeps **97.9% of frontier first-pass quality at 58% of the cost**, and clears the 90%-parity bar on all five tasks. The cheapest strategy saves another 24 cost points but loses 11 quality points and fails the parity bar on two of five tasks. That is the trade the product exists to make explicit.

This is a **synthetic sanity check**, not a live model eval. It validates the arithmetic and the definition. The decision benchmark (`bench/run.js`) is the separate test of whether the labels agree with the router.

## 5. Sensitivity: where the value pick moves

`node bench/sensitivity.js` varies the two assumptions users cannot see: the quality band and the retry multiplier.

| Task | band ±3 | band ±6 (default) | band ±10 |
|---|---|---|---|
| coding-agent | Claude Fable 5.2 $0.642 | Gemini 4 Carbon $0.174 | Gemini 4 Carbon $0.174 |
| image-gen | Nano Banana 2.1 $0.036 | Nano Banana 2.1 $0.036 | Nano Banana 2.1 $0.036 |
| video-gen | Kling 4.0 $0.843 | Kling 4.0 $0.843 | Veo 3.1 Fast $0.596 |
| 3d-gen | Tripo H3.1 $0.215 | Tripo H3.1 $0.215 | Tripo H3.1 $0.215 |
| tts | Eleven v4 $0.085 | Eleven v4 $0.085 | Voxtral TTS 3 $0.015 |

- **Value pick flips across bands: 3/5 tasks.** The definition is sensitive; the UI always shows the band and the quality gap.
- **Value pick flips across retry multipliers 0.8/1.15/1.5: 0/5 tasks.** Cost ranking is robust to the retry assumption in this catalog.

If a user disagrees with the band, they can use `--optimize quality` (band ±0), `--optimize cost` (task floor), or edit `policy.value.qualityTolerance`.

## 6. Multi-dimensional scorecard

| Dimension | How it enters | Visible? |
|---|---|---|
| Quality for this task | weighted capability vector | `quality`, `why`, evidence |
| Cost per solved task | price × attempts | `costPerTask`, `attempts` |
| Latency | normalized within candidates | `latencySec` |
| Context fit | required tokens / window | hard filter + `contextWindow` |
| Availability | provider key or OpenRouter | `availability` |
| Openness | hard filter with `--open-weights` | `openWeights` |
| Price confidence | `verified` / `estimated` | `~` prefix |
| Uncertainty | evidence count, media priors | `confidence` |

No single dimension is allowed to override a hard constraint. A 100-quality model with a 128K window cannot win a 400K-token task; a $0.001 model with no key is not runnable.

## 7. What would change this definition

- A live outcome benchmark showing that a 6-point quality band is too wide or too narrow for a specific task.
- A retry correlation study showing attempts are not independent (the current model assumes independence).
- A rework-cost study: if a 90-quality asset needs 2 hours of artist cleanup and a 96-quality asset needs 20 minutes, the cost model should include labor, not just API spend.
- A quality parity definition that is relative to the **task's** best model rather than the global best.

These are tracked in `CHANGELOG.md` and the issue templates. The definition is allowed to change; it is not allowed to be hidden.
