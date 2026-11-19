# Research

These dossiers are the evidence behind the catalog, the scoring policy, and the launch plan. They are working documents, not marketing copy. Each was produced on 2026-11-19 and contains its own source URLs and caveats.

| File | What it answers |
|---|---|
| [`competitive-landscape.md`](competitive-landscape.md) | Who else routes models, what they cover, what they miss, and where ModelPick should differentiate or integrate. |
| [`creative-models.md`](creative-models.md) | Current image, video, 3D, TTS, STT, and music models with prices, verified sources, and known conflicts. |
| [`agent-integrations.md`](agent-integrations.md) | Exact install mechanics for Claude Code, Codex, DSH, Cursor, Copilot CLI, Windsurf/Devin, Cline, and Zed. |
| [`routing-methodology.md`](routing-methodology.md) | Prior art in routing, evaluation design, scoring formulas, uncertainty, and a test plan. |
| [`launch-strategy.md`](launch-strategy.md) | Live GitHub/npm/HN data, comparable launches, channel map, drafts, and a 14-day plan. |

## How these feed the product

- **Catalog:** `creative-models.md` and provider pages → `catalog/manual-models.json` + `catalog/quality.json`.
- **Engine:** `routing-methodology.md` → hard filters, cost-per-solved-task, price anchors, confidence.
- **Integrations:** `agent-integrations.md` → `src/integrations/index.js` and the setup tests.
- **Benchmark:** methodology → `bench/scenarios.json`, `bench/run.js`, `tests/TEST_PLAN.md`.
- **Launch:** strategy → `launch/` drafts.

## Caveats

- Vendor claims are labeled as vendor claims. Independent leaderboards were not always retrievable.
- Prices move; the catalog is a dated snapshot and every row carries a read date.
- Some sources conflict (Veo's API surface, Nano Banana 4K pricing, Hunyuan3D's route). Resolutions are recorded in [`../docs/DATA.md`](../docs/DATA.md).
- The launch strategy's competitor star counts and HN scores were pulled live on 2026-11-19 and will drift.

## Raw data

The research pass cached ~1.7 MB of source pages. They are not committed to keep the repo fast to clone. The URLs and read dates in each dossier are sufficient to re-fetch.
