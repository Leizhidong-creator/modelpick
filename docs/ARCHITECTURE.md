# Architecture

ModelPick is a **decision layer**. It does not proxy model calls, store keys, or mark up usage. It turns a task description plus constraints into a ranked, explained model choice, and exposes that choice through surfaces an agent already understands.

## Design principles

1. **Data over code.** Model prices, task weights, retry curves, and scoring presets are JSON. Changing a price or a weight does not require an engine release.
2. **Pure decision core.** `src/core/score.js` takes a catalog, a task, and options; returns an evaluation. No I/O, no network, no clock-dependent behaviour.
3. **Adapters at the edge.** CLI, MCP, and agent installers are thin. They format or persist the same result; they do not re-implement ranking.
4. **Hard constraints before utility.** Context, modality, text rendering, rigging, lip-sync, clip length, budget, and open weights are filters. A high score can never override a missing capability.
5. **Zero runtime dependencies.** Node's standard library only. Fast cold start matters: DSH probes stdio servers twice; Codex defaults to a 10s startup timeout.
6. **Explainability is part of the result.** Every recommendation carries `why`, `tradeoffs`, component scores, expected attempts, and source evidence.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│  SURFACES                                                   │
│  CLI · MCP server · SKILL.md · Claude plugin · adapters     │
├─────────────────────────────────────────────────────────────┤
│  ORCHESTRATION                                              │
│  recommend() · plan() · compare() · task detection          │
├─────────────────────────────────────────────────────────────┤
│  DECISION CORE                                              │
│  filters → quality → cost × attempts → utility → labels     │
├─────────────────────────────────────────────────────────────┤
│  DATA                                                       │
│  models.json · tasks.json · policy.json · plans.json        │
│  overrides.json (user) · catalog cache (update)             │
└─────────────────────────────────────────────────────────────┘
```

### Data layer

| File | Owns | Invariants |
|---|---|---|
| `catalog/models.json` | model ids, prices, context, capabilities, quality, sources | unique slug; price ≥ 0; quality 0–100; one source minimum |
| `catalog/tasks.json` | 20 nodes, weights, workload, keyword map, quality mix | weights sum to 1; qualityMix sums to 1; keywords are `[phrase, weight]` |
| `catalog/policy.json` | retry curve, presets, cost anchors, confidence tags | preset weights sum to 1; failure bounds valid |
| `catalog/plans.json` | multi-step workflows | every step references a real task id |
| `catalog/quality.json` | curated quality scores keyed by models.dev id | every id exists upstream when syncing |
| `catalog/manual-models.json` | media/creative models not in models.dev | same model invariants |

The bundled catalog is a **dated snapshot**. `modelpick update` fetches a newer snapshot from GitHub and writes `~/.modelpick/catalog-cache.json`; the loader prefers the cache only if its `catalogVersion` is newer. The cache is validated before use.

`~/.modelpick/overrides.json` is merged last. It can patch a model, exclude a model, add a complete custom model, or replace policy sections.

### Decision core

`recommend(catalog, input)`:

1. **Resolve task.** Explicit `--task` wins; otherwise keyword scoring over 20 nodes (`detectTask`), returning confidence and runner-up candidates.
2. **Parse intent.** `cheapest`, `fastest`, `open source`, `under $0.05`, `without OpenAI` become options. Explicit flags always override text.
3. **Detect hard requirements.** Text-in-image, rigging, lip-sync, cinematic, clip length.
4. **Filter candidates.** Modality, required output capability, context window, budget, quality floor, open weights, provider exclusions.
5. **Score quality.** Weighted mix of capability scores (`coding`, `codingAgent`, `imageGen`, `threeD`, …). Missing capabilities fall back to `overall − 8`, but capability filters normally prevent this.
6. **Price one attempt.** Text: cache-aware input + output tokens per million. Media: unit amount × units, with the default variant.
7. **Apply retries.** `attempts = 1 / (1 − clamp((100 − quality)/100 × 1.15, 0.02, 0.75))`, capped at 4.
8. **Normalize cost against an anchor.** `costScore = 1 − log1p(cost)/log1p(anchor)`, where anchor is the task's willingness-to-pay, the budget, or 2.5× the cheapest eligible model. This avoids min–max normalization, which makes every cheap model look equally good.
9. **Utility.** Weighted sum of quality, cost, speed, and context fit; weights come from the task or a preset.
10. **Labels.** `best-overall`, `best-quality`, `best-value`, `fastest`, `cheapest` are independent of the rank order.
11. **Explain.** Human-readable reasons are derived from rank deltas, price ratios, tags, and capability matches.

`plan()` runs `recommend()` per step and sums `costPerTask`. `compare()` evaluates the requested models on the same task and workload.

### Surfaces

| Surface | Entry | Contract |
|---|---|---|
| CLI | `bin/modelpick.js` | human output + `--json`; exit 3 when no model fits constraints |
| MCP | `src/mcp/server.js` | JSON-RPC over stdio, 6 tools, compact payloads |
| Skill | `skills/modelpick/SKILL.md` | when to call, how to read results, fallback CLI |
| Claude plugin | `plugins/modelpick/` | manifest, `.mcp.json`, command, skill |
| Installers | `src/integrations/index.js` | idempotent writes with backups; never clobber invalid JSON |
| Connections | `src/core/connect.js` | endpoint, auth header, SDK, curl example per provider |

## Extension points

### Add a model

1. Text model present in models.dev: add an entry to `catalog/quality.json`, run `MODELS_DEV_SNAPSHOT=… node scripts/sync-catalog.js`.
2. Media model: add an entry to `catalog/manual-models.json`, run the sync script.
3. Private model: add it to `~/.modelpick/overrides.json`; no release required.

### Change routing behaviour

- Task weights, quality floors, cost anchors → `catalog/tasks.json`.
- Retry curve, optimizer presets, anchor multipliers → `catalog/policy.json`.
- User-specific policy → `~/.modelpick/overrides.json` under `policy`.

### Add an agent

Add a branch to `installAgent()` that returns actions. Reuse `mergeMcpFile`, `upsertBlock`, `copySkill`. The decision engine is untouched.

### Add a provider connection

Add an entry to `PROVIDERS` in `src/core/connect.js` with `baseUrl`, `auth`, `platformUrl`, `docs`, `sdk`, and an `example(model)` function. The `show` command and MCP `get_setup` pick it up automatically.

### Add a surface

Call `recommend()` from `src/core/recommend.js` and format the result. Do not call `rankModels` directly unless you need the full candidate pool.

## Failure modes and handling

| Failure | Behaviour |
|---|---|
| Corrupt catalog cache | ignored; bundled snapshot is used |
| Invalid user overrides | hard error with file path; never silently ignored |
| Corrupt agent config | setup refuses to overwrite and prints the manual merge |
| No model fits constraints | structured `NO_ELIGIBLE_MODEL` with near-misses and reasons; exit 3 |
| Stale catalog (>120 days) | `doctor` warns; recommendation includes `catalog.stale` |
| Unknown provider key | recommendations still work; `keys` shows presence only |
| MCP client sends invalid JSON | JSON-RPC parse error; process stays alive |

## Performance

The core is O(models × capabilities) with no network. On the development machine, p95 decision latency over 200 calls is **< 1 ms**; the MCP server cold start is dominated by Node startup (~60 ms). The benchmark enforces p95 ≤ 300 ms.

## Security boundaries

- No telemetry, no analytics, no remote calls in the decision path.
- `keys` reads `process.env` presence only; it never prints values.
- Setup writes only known paths under the project or the user's config directory, creates backups, and refuses invalid JSON.
- Task text is data. It is never interpolated into a shell command.
- MCP logs go to stderr; stdout carries JSON-RPC only.

## Versioning

- `schemaVersion` on catalog, tasks, and policy.
- `catalogVersion` is a date (`YYYY.MM.DD`).
- CLI output uses `schemaVersion: "1.0"` for agent-facing JSON.
- Breaking catalog schema changes require a migration note in `CHANGELOG.md`.
