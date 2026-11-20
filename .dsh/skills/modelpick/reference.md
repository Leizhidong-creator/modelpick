# ModelPick reference

## Task nodes

| id | use it for | modality |
|---|---|---|
| `coding-agent` | multi-file implementation, tool loops | text |
| `code-review` | diff / PR review | text |
| `refactor` | large restructures | text |
| `debugging` | root cause from logs and code | text |
| `planning` | specs, architecture, milestones | text |
| `long-context` | whole repos, 500-page docs | text |
| `research` | multi-source synthesis | text |
| `writing` | launch copy, docs, long-form | text |
| `translation` | localization | text |
| `extraction` | text → JSON / entities | text |
| `classification` | high-volume tagging | text |
| `data-analysis` | SQL, notebooks, charts | text |
| `computer-use` | browser / desktop control | text |
| `image-gen` | concept art, ads, thumbnails | image |
| `image-edit` | inpaint, restyle, remove background | image |
| `video-gen` | text/image → clip | video |
| `3d-gen` | text/image → game-ready asset | 3d |
| `tts` | narration, character voice | audio |
| `stt` | transcription, captions | audio |
| `music` | beds, jingles, songs | audio |

## Optimize presets

| preset | what it does |
|---|---|
| `balanced` | task-specific weights (default) |
| `quality` | 72% quality, 12% cost, 6% speed, 10% context |
| `cost` | 25% quality, 65% cost, 10% speed |
| `speed` | 30% quality, 10% cost, 60% speed |
| `privacy` | prefers open weights and context headroom |

## Cost per solved task

```
raw cost per attempt = tokens × price (cache-aware)  OR  units × unit price
expected attempts    = 1 / (1 - 1.15 × (100 - quality) / 100)
cost per solved task = raw cost × expected attempts
```

`expected attempts` is a transparent model, not a measurement. It is capped at 4.0 and shown in every result. Use it to compare a cheap model that needs three retries with an expensive model that lands in one.

## Output fields that matter

- `recommendation.slug` — stable catalog id.
- `recommendation.costPerTask` — USD per usable output, retries included.
- `recommendation.quality` — 0–100, derived from public benchmarks (see `evidence`).
- `recommendation.setup.direct.env` — the env var to set.
- `recommendation.priceConfidence` — `verified` or `estimated`.
- `catalog.stale` — true when the snapshot is older than 120 days.

## Example calls

```bash
modelpick pick "remove the background from this product photo"
modelpick pick "classify 2M support tickets" --optimize cost --max-cost 0.001
modelpick pick "refactor this 40k-line repo" --open-weights --context 200000
modelpick compare claude-fable-5.2 gemini-4-carbon --task coding-agent
modelpick plan "3D game asset from concept art"
```

## run_model

`run_model` executes a **text** model with the locally configured provider key. It never accepts a key argument.

```json
{ "prompt": "refactor this function", "task": "coding-agent" }
```

Returns `output`, `usage.inputTokens`, `usage.outputTokens`, `cost` (actual, from the catalog price), `model`, `provider`, and `requestId`. If no key is configured it returns `ERR_MISSING_KEY` with `setupCommand` and `setupUi`.
