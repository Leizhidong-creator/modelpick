# Adversarial review — ModelPick 0.1.0

**Review date:** 2026-11-19
**Method:** red-team the product as five roles — a hostile user, a security reviewer, a benchmark methodologist, an agent-platform engineer, and a skeptical buyer. Every finding must have a reproduction, a severity, and a disposition. No finding is closed by assertion; each is closed by a test or a disclosure.

**Scope:** CLI, MCP server, catalog data, scoring/value definition, agent setup, connection metadata, benchmark claims, launch claims, video.

## Findings

| ID | Severity | Finding / attack | Evidence | Disposition | Verification |
|---|---|---|---|---|---|
| F-01 | **Critical** | The router ignored whether the user had the provider key. It recommended a model the user could not call, and offered no runnable fallback. | `pick` with no keys returned a paid recommendation; `keys` showed missing | **Fixed.** `availability` is computed per model; `bestAvailable`, `fallbacks`, `--available`, MCP `available_only`; human output shows "key missing" and "run now". | `tests/unit/availability.test.js` (5), `A23` |
| F-02 | **High** | "Value" could label the most expensive model as the value pick when no other model fell inside a rigid ±5 band. | `refactor` → value = Fable 5.2 at 100% cost | **Fixed.** Value band is `max(best − tolerance, top − 0.5)`, so value is never worse than the recommendation; tolerance is policy data (6). Sensitivity documented. | `tests/unit/score.test.js`, `bench/sensitivity.js`, `A02` |
| F-03 | **High** | `setup` run through `npx` wrote an absolute path into the npx cache. The config would break when the cache was cleaned. | Setup from a cache path wrote `D:\...\_npx\...\bin` | **Fixed.** Detects npx cache and emits a portable `npx -y github:… mcp` command; `--portable` forces it. | `tests/integration/setup.test.js`; `setup --dry-run` |
| F-04 | **High** | Media endpoints and providers were inconsistent: Tripo showed a fal model id against the Tripo endpoint; Seedream/Seedance used BytePlus ids against fal prices; Veo was listed on the Gemini API although it is Vertex-only. | `show tripo-h3.1`, `show seedream-5.5`, `show veo-3.1` | **Fixed.** Provider alignment, `connectionFor` endpoint cards, `typical` vs `verified` flags, explicit notes. Veo requires Vertex project + ADC. | `show` smoke tests; `data.test.js` |
| F-05 | **High** | A negative numeric option (`--max-cost -1`) was parsed as a boolean flag, so the budget became `$1` instead of an error. | `A07` returned exit 0 before fix | **Fixed.** Parser accepts `-1` as a value and rejects negative budgets. | `A07`, `tests/unit/security.test.js` |
| F-06 | **Medium** | `--no-color` and `--no-cache` were parsed with inconsistent flag semantics; `--no-color` could still emit ANSI under `FORCE_COLOR`. | Parser stored `color=false` but callers read `no-color` | **Fixed.** `--no-*` sets both the positive and negative keys; regression test forces color. | `tests/unit/security.test.js` |
| F-07 | **Medium** | `loadCatalog({ overridesFile: null })` still read the user's overrides because of `??`. Tests could pass while using real user data. | code inspection | **Fixed.** `null` now explicitly disables overrides. | `tests/unit/policy.test.js` |
| F-08 | **Medium** | `add-model` wrote an incomplete model before validation; one bad file could brick the next CLI start. | A18 | **Fixed.** Full catalog merge + `validateCatalog` before atomic write; backups on existing overrides. | `tests/integration/add-model.test.js` (4), `A18` |
| F-09 | **Medium** | Catalog contained a discontinued video model and an audio claim (Kling) that the fal endpoint does not support. | Sora 2 shutdown; Kling schema | **Fixed.** Sora/Imagen/GPT-Image-1 excluded; Kling audio/lip-sync removed; Seedance keeps synchronized audio. | `docs/DATA.md` |
| F-10 | **Medium** | Value simulation averaged raw dollars across tasks, so a $2 video clip dominated a $0.01 TTS job and the table was unreadable. | first `bench/value.js` output | **Fixed.** Normalized quality parity and cost ratio per task; added first-pass success. | `bench/value.js`, `docs/VALUE.md` |
| F-11 | **Medium** | Video typography was flat: one sans face, one mono face, no grain or camera motion; it looked like a slide deck, not a launch film. | video review at 36s / 64s | **Fixed.** Editorial serif display, gold rules, letter-spaced wordmark, grain, vignette, 1% camera push, richer score. | `assets/modelpick-intro.mp4`, `launch/video-storyboard.md` |
| F-12 | **Low** | A malformed research dossier shipped mojibake (`鈥?`, `路`) into the repo. | `research/competitive-landscape.md` | **Fixed.** Re-written clean; link test checks repo files. | `tests/unit/links.test.js` |
| F-13 | **Operational** | GitHub rejected a push containing `.github/workflows/*` because the CLI token has no `workflow` scope. | first push | **Accepted / documented.** Workflows moved to `docs/ci/` with a one-command enable path and `gh auth refresh -s workflow`. | `docs/ci/README.md` |
| F-14 | **Claim risk** | "100% top-1" could be read as a general claim. The labels were authored by the same maintainer as the catalog; the benchmark is a decision benchmark, not a live output benchmark. | README/methodology | **Disclosed.** Dev + held-out both stated; methodology, failure files, and "what would falsify" published. | `bench/METHODOLOGY.md` |
| F-15 | **Claim risk** | Media quality scores are priors, but the UI initially presented them like measured scores. | media catalog | **Disclosed + UI.** `priceConfidence` and `confidence`; docs/QUALITY labels media as weakest. | `docs/QUALITY.md` |
| F-16 | **Residual** | npm package not published; install path is GitHub only. | package registry | **Accepted.** README uses GitHub install; `docs/ci` notes npm before directory submissions. | `README.md` |

## Adversarial test matrix

23 cases, run by `node tests/adversarial/run.js`; raw results in `tests/results/adversarial-latest.json`.

| ID | Area | Attack | Expected | Observed | Result |
|---|---|---|---|---|---|
| A01 | Input | Empty query | `ERR_MISSING_TASK` | `ERR_MISSING_TASK` | PASS |
| A02 | Input | 100,000-character query | no crash, <2s | 12 ms | PASS |
| A03 | Input | Prompt injection + `rm -rf` | data, task 3d-gen | 3d-gen | PASS |
| A04 | Input | Shell metacharacters | structured result, no shell | tripo-h3.1 | PASS |
| A05 | Input | RTL + emoji + zero-width | no crash, task detected | image-gen | PASS |
| A06 | Path | `--task ../../etc/passwd` | `ERR_UNKNOWN_TASK` | exit 1 | PASS |
| A07 | Budget | Negative budget | rejected | exit 1 | PASS |
| A08 | Budget | NaN budget | rejected | exit 1 | PASS |
| A09 | Constraints | Open weights + $0.001 | no silent fallback | `NO_ELIGIBLE_MODEL` | PASS |
| A10 | Constraints | 2M context | no eligible + near misses | `NO_ELIGIBLE_MODEL` | PASS |
| A11 | Constraints | Unknown optimize | rejected | exit 1 | PASS |
| A12 | Catalog | Invalid overrides JSON | no silent ignore | `ERR_OVERRIDES_INVALID` | PASS |
| A13 | Catalog | Corrupt cache | fallback to bundled | 41 models | PASS |
| A14 | Catalog | Duplicate slug | rejected | `ERR_INVALID_CATALOG` | PASS |
| A15 | Secrets | Secret in env | never printed | no leak | PASS |
| A16 | Setup | Dry run | zero writes | none | PASS |
| A17 | Setup | Invalid `.mcp.json` | preserve bytes | unchanged | PASS |
| A18 | Add-model | Incomplete model | no overrides write | exit 1 | PASS |
| A19 | MCP | Null arguments | tool error, alive | `TOOL_ERROR` | PASS |
| A20 | MCP | Unknown tool | -32602 | -32602 | PASS |
| A21 | MCP | 10 concurrent calls | 10 responses | 10 | PASS |
| A22 | Claims | Stale catalog | `stale=true` | 687 days | PASS |
| A23 | Keys | No keys | decision, availability false | false | PASS |

**Result: 23/23 pass.**

## Claims audit

| Claim | Backing | What it does not prove |
|---|---|---|
| "Cost per solved task" | Formula, cache-aware pricing, attempts model, tests | Not measured pass@1; attempts are a model |
| "100% top-1 acceptable" | 115 dev runs + 35 held-out runs | Labels are expert-authored, not independent |
| "41 models, 20 nodes" | Catalog + data tests | Coverage ≠ quality of every model |
| "0 runtime dependencies" | `package.json` + CI | Dev tooling still has Python/Pillow for assets |
| "No keys stored / no telemetry" | code + tests | Host agent could log env, outside our control |
| "Works with Claude/Codex/Cursor/DSH" | installers + exact file formats | Not end-to-end tested inside every vendor UI on every OS |

## Residual risks

1. **Media quality** is a prior. The next independent VBench/GenEval/3D run is the highest-value evidence upgrade.
2. **Benchmark authorship** is not independent. A community-labeled v2 is the next credibility step.
3. **Retry independence** is assumed. Correlated failures would raise cost per solved task for cheap models.
4. **Windows MCP** uses an absolute `node` path by default; portable configs need `cmd /c npx`.
5. **No live provider calls** are made by tests. A keyed smoke test is opt-in and not in CI.

## Decision

Ship 0.1.0 with the disclosures above. The product is safe to run, honest about its evidence, and has a runnable fallback for users who do not own every key. The remaining gaps are evidence gaps, not correctness bugs.
