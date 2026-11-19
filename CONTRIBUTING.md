# Contributing

ModelPick is a data-first project. The most valuable contributions are **catalog corrections**, **new benchmark scenarios**, and **agent adapters** — not refactors of the scoring engine.

## Quick start

```bash
git clone https://github.com/Leizhidong-creator/modelpick
cd modelpick
node scripts/validate.js
node --test "tests/**/*.test.js"
node bench/run.js
```

No install step, no runtime dependencies. Node ≥ 20.11.

## The four contribution lanes

### 1. Correct a price or model id

- Text models: edit `catalog/quality.json` only if the model is new; prices come from models.dev.
- Media models: edit `catalog/manual-models.json`.
- Include a **first-party URL** and a read date. Mark `confidence: "estimated"` if you derived the number.
- Run `node scripts/validate.js`.

A model-update PR should include the source link and, if the change is >10%, a note in `CHANGELOG.md`.

### 2. Add a benchmark scenario

Add an object to `bench/scenarios.json`:

```json
{
  "id": "image-menu-text",
  "query": "design a menu image with prices in Chinese",
  "task": "image-gen",
  "accept": ["nano-banana-pro", "seedream-5.5", "gpt-image-2"],
  "note": "Text rendering is the binding constraint."
}
```

Rules:

- `accept[]` means defensible, not "the one true answer".
- Include the capability that makes the task hard.
- Do not add a scenario that the engine already passes trivially; add one that could fail.
- Run `node bench/run.js`; a new scenario may expose a real ranking bug. That is the point.

### 3. Add an agent adapter

`src/integrations/index.js` — add a branch to `installAgent()`:

- Reuse `mergeMcpFile`, `upsertBlock`, `copySkill`.
- Support `--dry-run` and `--global` where it makes sense.
- Never overwrite invalid JSON; back up before writing.
- Add an integration test in `tests/integration/setup.test.js`.
- Add a row to the README compatibility table.

### 4. Add a task node

- `catalog/tasks.json`: id, label, modality, keywords (English + Chinese), qualityMix, weights, workload, floor, cost anchor.
- `catalog/quality.json` / `manual-models.json`: capability scores for every compatible model (at least two).
- Add a plan step only if it belongs to a real workflow.
- Add a benchmark scenario.

## What we will not merge

- A model with no source URL.
- A price without a read date.
- A scoring change without a benchmark before/after.
- Telemetry, analytics, or a hosted proxy.
- A dependency in the runtime path. The zero-dependency property is a feature.

## Style

- Plain ESM JavaScript, JSDoc types, no build step.
- Pure functions in `src/core/`; I/O at the edges.
- Error messages say what to do next.
- `--json` output is a public API: additive changes only within a schema version.

## Pull requests

Use the PR template. Include:

1. What changed and why.
2. The command you ran.
3. Before/after benchmark metrics if ranking changed.
4. A source URL for any data change.

CI runs Ubuntu, Windows, and macOS on Node 20/22/24.

## Code of conduct

Be precise, be kind, and attack the claim, not the person. See `CODE_OF_CONDUCT.md`.
