# ModelPick multi-dimensional scorecard

Generated: 2026-11-19T11:15:37.646Z

**Composite: 96.8/100 · grade A**

| Dimension | Weight | Score | Target | Evidence |
|---|---:|---:|---:|---|
| Correctness | 25% | 100 | 90 | benchmark-latest.json + holdout-latest.json |
| Cost efficiency | 20% | 84.2 | 80 | benchmark regret + value-latest.json |
| Robustness | 15% | 100 | 90 | priceStability + sensitivity-latest.json + determinism |
| Coverage | 15% | 100 | 95 | catalog + task requirements |
| Safety | 15% | 100 | 100 | adversarial-latest.json |
| Operability | 10% | 100 | 90 | p95 latency + verify receipt + line coverage |

## Metrics

### Correctness — 100/100
- `top1`: 1
- `top3`: 1
- `intent`: 1
- `constraints`: 1

### Cost efficiency — 84.2/100
- `medianCostRegret`: 0
- `qualityParity`: 0.942
- `costRatio`: 0.549

### Robustness — 100/100
- `priceStability`: 1
- `retryFlips`: 0
- `deterministic`: true

### Coverage — 100/100
- `taskCoverage`: 1
- `modelCoverage`: 1
- `modalityCoverage`: 1

### Safety — 100/100
- `adversarialPass`: 1
- `cases`: 28

### Operability — 100/100
- `p95Ms`: 1.1
- `verifyOk`: true
- `coverage`: 90.04

## What this does not measure

Decision benchmark, not a live output benchmark. Cost, coverage, safety, and operability are measured from committed evidence; quality labels are expert-authored.

Every dimension is at or above target.
