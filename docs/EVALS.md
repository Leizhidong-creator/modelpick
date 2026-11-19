# Bring your own eval

ModelPick ships a decision benchmark, but your workload is not my workload. `modelpick eval` turns your own pass/fail runs into observed pass rate, a Wilson 95% interval, expected attempts, and **cost per solved task**.

It does not secretly change the catalog. It produces a report you can compare with the router's prediction.

## Input

```json
{
  "task": "3d-gen",
  "runs": [
    { "model": "tripo-h3.1", "passed": true,  "cost": 0.20, "attempts": 1, "quality": 94 },
    { "model": "tripo-h3.1", "passed": true,  "cost": 0.20, "attempts": 1, "quality": 92 },
    { "model": "tripo-h3.1", "passed": false, "cost": 0.20, "attempts": 1 },
    { "model": "meshy-7.1",  "passed": true,  "cost": 1.20, "attempts": 1, "quality": 91 },
    { "model": "meshy-7.1",  "passed": false, "cost": 1.20, "attempts": 1 }
  ]
}
```

Fields:

| Field | Required | Meaning |
|---|---|---|
| `task` | yes | A real ModelPick task id (`3d-gen`, `image-gen`, `coding-agent`, `tts`, …). |
| `model` | yes | Catalog slug, or a custom slug you added with `add-model`. |
| `passed` | yes | Did this run produce an acceptable result? |
| `cost` | no | Actual API spend for this run. If any run omits it, cost per solved is omitted instead of treated as $0. |
| `attempts` | no | Attempts used in this run. Default 1. |
| `quality` | no | A human 0–100 score for this output. |

The `models` grouped form is also accepted:

```json
{
  "task": "3d-gen",
  "models": {
    "tripo-h3.1": { "runs": [{ "passed": true, "cost": 0.2 }] },
    "meshy-7.1":  { "runs": [{ "passed": false, "cost": 1.2 }] }
  }
}
```

## CSV input\n\nA CSV with `task,model,passed,cost,attempts,quality` also works:\n\n```bash\nmodelpick eval evals.csv --json\nmodelpick eval evals.csv --task coding-agent --html report.html\n```\n\n`passed` accepts `true/false/1/0/yes/no`. Empty `cost` is treated as missing, not zero.\n\n## Run

```bash
modelpick eval evals.json
modelpick eval evals.json --json
modelpick eval evals.json --min-samples 10
modelpick eval evals.json --html report.html
```

Output ranks by **cost per solved task**, not pass rate alone. It prints:

- runs, solved, pass rate
- Wilson 95% interval
- mean attempts
- cost per solved
- `*` when the sample is below `--min-samples` (default 5)

## Why Wilson

A 4/5 pass rate is not "80% reliable". With n=5, the 95% interval is roughly 38–96%. The command prints the interval so a five-run difference does not become a ranking claim.

This is the same reason the built-in benchmark reports top-1, held-out, and cost regret separately instead of one "quality" number.

## Comparing with the catalog

The JSON includes `catalogQuality` and `enoughSamples`. Use it to answer:

- Is my observed cost per solved task close to the router's estimate?
- Is the model with the best catalog score actually winning on my data?
- Is a cheaper model outside the 8-point quality band still acceptable for my task?

If the answer changes the ranking, add the case to `bench/scenarios.json` or open a model-update issue with the raw runs. Do not edit `catalog/models.json` by hand.

## Limits

- Your eval is only as good as your `passed` definition. Write it down.
- Self-reported quality is not independent.
- One task and one prompt distribution do not generalize.
- The report does not auto-tune the catalog; that requires a curated benchmark and a maintainer review.

## Shareable HTML report

`--html report.html` writes a self-contained dark HTML report with the pass rate, Wilson interval, attempts, cost per solved, and catalog quality. It has no external assets and no tracking. Useful for a design-partner review or a PR comment.
