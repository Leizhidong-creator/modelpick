# AGENTS.md

ModelPick is a zero-dependency, data-first model router. Read `CONTRIBUTING.md` before changing ranking behaviour.

## Commands

```bash
node scripts/validate.js
node --test "tests/**/*.test.js"
node bench/run.js
node bench/holdout.js
node scripts/check.js
```

There is no install step and no build step.

## Project rules

- **No runtime dependencies.** Node standard library only. Do not add a package to `dependencies`.
- **Data over code.** Prices, task weights, retry curves, and presets live in `catalog/*.json`. Do not hard-code a model name or a price in the engine.
- **Hard constraints before scoring.** Context, modality, text-in-image, rigging, lip-sync, clip length, budget, and open weights are filters.
- **`--json` is a public API.** Additive changes only within `schemaVersion: "1.0"`.
- **Every price needs a source URL and a read date.** Mark derived numbers `confidence: "estimated"`.
- **Ranking changes need before/after benchmark numbers.** Run the dev and held-out sets.
- **No telemetry, no proxying, no key storage.**

## Layout

| Path | Purpose |
|---|---|
| `src/core/` | pure decision logic and data loading |
| `src/mcp/` | stdio MCP server |
| `src/integrations/` | agent installers |
| `catalog/` | models, tasks, policy, plans |
| `bench/` | scenarios, runner, methodology |
| `tests/` | unit, integration, e2e, evidence |
| `docs/` | architecture, data, leaderboard |
| `site/` | GitHub Pages landing page |

## When adding a model

1. Text model in models.dev: add to `catalog/quality.json`; run the sync script with `MODELS_DEV_SNAPSHOT`.
2. Media model: add to `catalog/manual-models.json`; run the sync script.
3. Add a benchmark scenario that would catch a bad ranking.
4. Run validation, tests, and both benchmarks.

## When adding an agent adapter

Add a branch to `installAgent()` in `src/integrations/index.js`; reuse `mergeMcpFile`, `upsertBlock`, `copySkill`; support `--dry-run`; add a setup integration test; update the README table.
