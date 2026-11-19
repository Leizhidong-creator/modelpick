# Benchmark methodology

## What is measured

A **decision benchmark**: given a task, constraints, and a preference, is the top recommendation acceptable to an expert, does it satisfy every hard constraint, and does it stay stable when prices move?

This is not a model-output benchmark. ModelPick does not call providers. The benchmark tests the router's reasoning against a labeled set.

## Scenario design

- **39 development scenarios** across 20 task nodes and 5 modalities.
- **12 held-out scenarios** authored after the development benchmark was frozen.
- Each scenario has `query`, expected `task`, acceptable `accept[]` slugs, and an optional note.
- Some high-volume nodes (classification, extraction) run only balanced/cost; a "max quality" run is not meaningful at 500k items.
- Development scenarios are expanded into **balanced / cost / quality** variants (115 runs). Held-out has 35 runs.

Queries include English and Chinese, explicit constraints, capability requirements, and adversarial phrasing. The intent set is separate from the ranking set: task detection is scored once per scenario.

## Labels

Labels are authored by the maintainer from the catalog research, **before** the final ranking run. A label is "acceptable", not "the one true answer": for a 3D game asset, Tripo, Hunyuan, and Meshy are all defensible. This avoids a benchmark that simply rewards the engine's existing weights.

Known limitation: the same person authored the catalog and the labels. The held-out set reduces, but does not eliminate, overfitting. A community-labeled v2 is the next step.

## Metrics

| Metric | Definition | Blocker |
|---|---|---|
| Intent accuracy | detected task == expected task | ≥95% |
| Top-1 acceptable | top recommendation ∈ `accept[]` | ≥75% |
| Top-3 acceptable | any of top 3 ∈ `accept[]` | ≥92% |
| Hard constraint pass | budget, open weights, context all satisfied | 100% |
| Cost regret | `(chosen − cheapest acceptable) / cheapest acceptable`, balanced runs | reported |
| Price stability | top-1 unchanged under ±20% price perturbation, 40-run sample | ≥80% |
| p95 latency | wall-clock `recommend()` per run | ≤300 ms |

Thresholds are deliberately looser than the observed scores. A benchmark that passes at exactly 100.0% has no headroom to detect regressions.

## Cost regret

Only balanced runs are used. For each run, the acceptable set is re-ranked with the same preference and filters; the cheapest acceptable model is the reference. Median regret is reported because a single outlier should not define the result.

## Price perturbation

Every other balanced run gets a 1.2× or 0.8× multiplier on all input/output/amount prices. The catalog is rebuilt in memory, the same decision is asked, and the top-1 is compared. This tests whether the recommendation is a knife-edge artifact of one price row.

## Held-out protocol

1. Freeze the engine and catalog.
2. Author 12 scenarios from the research, without looking at engine output.
3. Run `node bench/holdout.js` once.
4. Record every failure and fix only genuine engine bugs; label gaps are documented.
5. Publish both numbers, not only the development set.

The current holdout was run after the development set and then audited for label coverage. It is a **second** set, not a pristine final exam. A v2 holdout should be authored by someone who has not seen the engine.

## Reproduce

```bash
node bench/run.js       # development set -> tests/results/benchmark-latest.json
node bench/holdout.js   # held-out set   -> tests/results/holdout-latest.json
```

Both write an HTML report (`report.html`, `holdout.html`) with every run, pick, and failure. CI uploads `tests/results/` as an artifact.

## What would falsify the product claim

- Top-1 acceptable below 75% on a larger, independently labeled set.
- A hard-constraint violation in any run.
- Median cost regret above 25%.
- Price stability below 80%, meaning the recommendation is not robust to normal price drift.
- A user study where developers ignore the recommendation because the explanation is not actionable.

None of these have been observed on the current sets. That is evidence, not proof.
