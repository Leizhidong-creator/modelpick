# Data provenance and limits

ModelPick is only as good as its catalog. This document records where every class of number comes from, how it is dated, and where it is weak.

## Snapshot

- **Catalog version:** `2026.11.19`
- **Text models:** generated from [models.dev](https://models.dev/api.json), cross-checked against [OpenRouter](https://openrouter.ai/api/v1/models).
- **Media models:** curated from provider docs and fal.ai pricing; stored in `catalog/manual-models.json`.
- **Quality scores:** BenchLM BenchAlign, CursorBench 4.0, and capability-specific public benchmarks.
- **Read date:** 2026-11-19 for every source.

Every model carries a `sources[]` array with `name`, `url`, and `readAt`. The data test suite enforces HTTPS URLs and a read date.

## Price sources

| Modality | Primary source | Secondary |
|---|---|---|
| Text | models.dev `cost` (USD per 1M tokens) | OpenRouter per-token price |
| Image | Google Gemini pricing, OpenAI token rates, fal.ai | BenchLM media pricing |
| Video | Google Vertex pricing, fal.ai | BenchLM media pricing |
| 3D | fal.ai, Tripo, Meshy docs | Tencent Cloud credit pricing |
| Audio | BenchLM media pricing, provider docs | — |

`pricing.confidence` is `verified` when a first-party or marketplace page was read, `estimated` when a per-unit number had to be derived. The CLI prints `~` for estimated prices.

## Quality scores

Text quality scores are a weighted composite of:

- **overall** — BenchLM BenchAlign score (0–100).
- **coding** — BenchLM coding board.
- **codingAgent** — CursorBench 4.0, normalized to 0–100, blended with the coding score.
- **reasoning, longContext, writing, multimodal** — BenchLM category signals and documented model strengths.
- **cheapWork** — a price-aware capability signal for high-volume, low-complexity work.

Media quality is the weakest part of the catalog. No independent, current, modality-wide leaderboard was retrievable for image, video, and 3D in this pass. Scores are derived from vendor positioning, public comparisons, and feature fit. They are labeled and should be treated as a **prior**, not a measurement. The benchmark tests decision consistency, not whether Tripo is exactly 94/100.

Known conflicts and resolutions:

| Item | Conflict | Resolution |
|---|---|---|
| Veo 3.1 | BenchLM lists Gemini API pricing; Google docs say Vertex-only | Use Vertex, `GOOGLE_CLOUD_PROJECT` + service account |
| Nano Banana 2.1 4K | Google $0.113 vs BenchLM $0.0756 | Use Google token math |
| Seedream 5.5 | fal $0.03; some aggregators $0.04 | Use fal, label `verified` |
| Hunyuan3D | Tencent credits (~$0.01–0.02) vs fal 3.1 Pro ($0.375 + PBR) | Use fal 3.1 Pro, because it is the current Pro route |
| Kling 4.0 audio | Some articles claim native audio on fal | fal endpoint has no audio parameter; removed audio/lip-sync from capabilities |

## Deliberate omissions

- **Sora 2 / Sora 2 Pro** — discontinued 2026-09-24, no replacement endpoint.
- **Imagen 4** — shut down.
- **GPT-Image-1** — shut down 2026-10-23.
- **Free promotional models** — excluded from value rankings because a $0 list price distorts the decision.

## Update cadence

Prices move weekly. The repo intends:

1. A weekly `modelpick update` snapshot on Mondays.
2. A monthly quality review for new frontier releases.
3. A `CHANGELOG.md` entry for every model added/removed and every price change >10%.

`modelpick doctor` warns when the snapshot is older than 120 days.

## Adding a model

Text models present in models.dev:

1. Add a `quality.models[]` entry to `catalog/quality.json` with `id`, `slug`, scores, speed, tags, and notes.
2. Run `MODELS_DEV_SNAPSHOT=/path/to/api.json node scripts/sync-catalog.js`.
3. Run `node scripts/validate.js` and `node bench/run.js`.
4. Add a scenario to `bench/scenarios.json` that would catch a bad ranking for this model.

Media models:

1. Add a complete object to `catalog/manual-models.json` with pricing, variants, quality, capabilities, sources.
2. Re-run the sync and validation.
3. Add a benchmark scenario.

Private models: use `~/.modelpick/overrides.json` and skip the release cycle.

## What the data cannot tell you

- Whether a model will pass **your** eval. Run your own 20–50 cases; ModelPick gives a prior.
- Your true cache-hit rate, thinking-token ratio, or retry correlation. All three are workload assumptions, not facts.
- Provider reliability, rate limits, or data residency. The catalog records capabilities, not SLAs.
- The quality of a model released after the snapshot date. `modelpick update` is the mitigation.
