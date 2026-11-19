# ModelPick 0.1.0 — decision foundation

The first public cut of a model router that prices **cost per solved task**, not per token.

## What ships

- **40 models · 20 task nodes · 18 providers** across coding, image, video, 3D, and audio.
- **`pick`** returns one recommendation with quality, expected attempts, cost per solved task, latency, why, trade-offs, and the exact key/env setup.
- **Key-aware fallbacks.** If you do not own the recommended provider, `picks.available` gives the best runnable model. `--available` filters to keys already present. No keys is not an error.
- **Value, defined.** The value pick is the cheapest model within 8 quality points of the best eligible model; if the band is empty, it falls back to the top pick. It keeps 95.4% of frontier first-pass quality at 41.6% of the cost in the simulation. Definition, simulation, and sensitivity: `docs/VALUE.md`.
- **7 MCP tools** over stdio: `pick_model`, `get_decision_packet`, `plan_workflow`, `compare_models`, `get_setup`, `list_models`, `explain_task`.
- **Embedded everywhere it can be:** Claude Code plugin + marketplace, Codex MCP/skill, Cursor, DeepSeek Harness profile row, Copilot, generic MCP.
- **Bring your own decision model.** `modelpick decide` emits a portable packet; `modelpick pick --verdict` applies a judge/decision-model ranking locally. The verdict can only reorder the shortlist by two positions and cannot override constraints. `pick_model` accepts the same object over MCP. Protocol: `docs/JUDGES.md`.
- **Evidence:** 175 tests, 90.04% line coverage, 28/28 adversarial cases, 115 dev + 35 held-out decision runs, and an explicit confidence label on every quality score and price.
- **93-second intro video** with a local English voice, natural English + 中文 captions, script, storyboard, and poster.

- **Independent image correction:** Nano Banana Pro was lowered from 96 to 91 after Artificial Analysis ranked it #18, below Nano Banana 2.1 (#8) and GPT Image 2 high (#6); Veo 3.1 was lowered from 95 to 89 after the video arena ranked it #26, below Seedance 2.5 (#4). `docs/MEDIA_EVIDENCE.md`.

## Honest limits

- Media quality scores are priors, not independent measurements.
- The decision benchmark labels are expert-authored; it is not a live output benchmark.
- The retry curve is a model, not a measured correlation.
- The npm package is not published yet; install is `npx -y github:Leizhidong-creator/modelpick`.
- CI workflows are in `docs/ci/` because the publishing token lacks the GitHub `workflow` scope.

## Install

```bash
npx -y github:Leizhidong-creator/modelpick pick "refactor this repo"
npx -y github:Leizhidong-creator/modelpick setup claude-code
```

MIT. No telemetry. No key storage. No gateway.
