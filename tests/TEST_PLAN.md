# Test plan and evidence

This is the execution record for ModelPick 0.1.0. It covers nine dimensions: unit logic, data integrity, integration, end-to-end flows, adversarial/security, performance, cross-platform CI, benchmark quality, and UX/manual review.

The adversarial findings, severities, and dispositions are in [`ADVERSARIAL_REVIEW.md`](ADVERSARIAL_REVIEW.md). The value definition and sensitivity are in [`../docs/VALUE.md`](../docs/VALUE.md); the evidence behind quality scores is in [`../docs/QUALITY.md`](../docs/QUALITY.md).

## How to run everything

```bash
node scripts/validate.js
node --test "tests/**/*.test.js"
node bench/run.js
node bench/holdout.js
node scripts/check.js
```

Evidence lives in `tests/results/` (JSON + HTML) and `tests/evidence/` (images + this plan).

## Dimensions

### 1. Unit logic — 87 tests

| Area | File | What is asserted |
|---|---|---|
| Scoring | `tests/unit/score.test.js` | quality weighting, monotonic retries, cache discount, media variants, context filter, open-weight filter, budget filter, cost/quality preset monotonicity, capability filters, text-in-image, rigging, clip length |
| Task detection | `tests/unit/tasks.test.js` | 25 English/Chinese queries, unknown text, ambiguity, intent parsing, id/label/prefix lookup, error hints |
| Catalog | `tests/unit/catalog.test.js` | schema validation, duplicate slugs, negative prices, invalid quality, weight sums, model lookup, slug format |
| Data | `tests/unit/data.test.js` | price/source/date integrity, no future releases, every task has ≥2 models, every model is reachable, confidence values, snapshot age |
| Policy | `tests/unit/policy.test.js` | policy is data-driven, user override changes routing, custom model via overrides, load from another cwd |
| Security | `tests/unit/security.test.js` | secrets never printed, prompt injection is data, path traversal rejected, unknown command, `--no-color` |
| Availability | `tests/unit/availability.test.js` | direct/multi-env/OpenRouter keys, missing-key fallback, `--available` filter |
| Judge | `tests/unit/judge.test.js` | prompt blindness, strict JSON, invented slug rejection, Borda, movement cap |
| Links | `tests/unit/links.test.js` | README/launch links resolve, video assets exist, site mirrors assets |

Result: **87/87 pass**.

### 2. Data integrity

- 40 models, 20 tasks, 18 providers, 7 workflows.
- Every model has ≥1 HTTPS source with a read date.
- No duplicate slugs or ids.
- Every task has ≥2 compatible models.
- Every model is reachable by ≥1 task.
- Media prices carry `verified` or `estimated`.
- Snapshot age <120 days.

### 3. Integration — 39 tests

| Area | File | What is asserted |
|---|---|---|
| CLI | `tests/integration/cli.test.js` | version/help, tasks, model filters, pick, constraints, no-eligible exit code, plan, compare, doctor, keys, update, invalid preset |
| MCP | `tests/integration/mcp.test.js` | initialize, 6 tools, compact pick payload, plan, setup, list, unknown tool, explain, clean stdout |
| Setup | `tests/integration/setup.test.js` | generic/Claude/DSH installs, idempotent AGENTS block, sibling MCP preservation, invalid JSON refusal, dry run, unknown agent, DSH row/backup |
| Decision | `tests/integration/decision.test.js` | packet contract, verdict application, invented slug rejection, missing file |
| Add-model | `tests/integration/add-model.test.js` | validation before write, routable custom model, removal |

Result: **39/39 pass**.

### 4. End-to-end — 3 tests

`tests/e2e/agent-flow.test.js`:

- Pick a 3D node, get a setup block, stay under $1.
- 200 recommendations, p95 <50 ms (measured ~1.1 ms).
- Full decision benchmark passes thresholds.

### 5. Adversarial / security

25 cases in `tests/adversarial/run.js`; raw results in `tests/results/adversarial-latest.json`; full findings table in [`ADVERSARIAL_REVIEW.md`](ADVERSARIAL_REVIEW.md). Result: **25/25 pass**.

| Case | Expected | Observed |
|---|---|---|
| Empty query | `ERR_MISSING_TASK` | pass |
| 100k-character query | no crash, <2s | 12 ms |
| Prompt injection + `rm -rf` | data, task 3d-gen | pass |
| Shell metacharacters | no shell, structured result | pass |
| RTL + emoji + zero-width | no crash, task detected | pass |
| `--task ../../etc/passwd` | `ERR_UNKNOWN_TASK` | pass |
| Negative / NaN budget | rejected | pass |
| Open weights + $0.001 | no silent fallback | pass |
| 2M context | no eligible + near misses | pass |
| Invalid overrides | `ERR_OVERRIDES_INVALID` | pass |
| Corrupt cache | fallback to bundled | pass |
| Duplicate slug | `ERR_INVALID_CATALOG` | pass |
| Secret in env | never printed | pass |
| Setup dry-run | zero writes | pass |
| Invalid `.mcp.json` | preserved | pass |
| Incomplete custom model | no write | pass |
| MCP null args | tool error, alive | pass |
| MCP unknown tool | -32602 | pass |
| MCP 10 concurrent calls | 10 responses | pass |
| Stale catalog | flagged | pass |
| No keys | decision + availability false | pass |
| Verdict invents a model | `ERR_VERDICT_INVALID` | pass |
| Verdict reorders | applied, verdict top wins | pass |

### 6. Performance

- p95 `recommend()` over 200 calls: **<1 ms** (target 50 ms in unit test, 300 ms in benchmark).
- MCP cold start: ~60–120 ms Node process startup; server responds in <10 ms after boot.
- No network in the decision path.
- Zero runtime dependencies.

### 7. Cross-platform CI

The workflow template lives in `docs/ci/ci.yml`; it is **not enabled on GitHub yet** because the publishing token lacks the `workflow` scope. The template runs:

- OS: Ubuntu, Windows, macOS.
- Node: 20.x, 22.x, 24.x.
- Steps: validate → test → benchmark → held-out → value → adversarial → upload artifacts.

Local runtime matrix actually executed:

| Runtime | Result |
|---|---|
| Node 20.20.2 | 122/122 tests, 115-run benchmark, value simulation |
| Node 22.x | 122/122 tests |
| Node 24.15.0 | 122/122 tests |

Evidence: `tests/results/node-version-verification.md`.

The CLI avoids POSIX-only shell assumptions; setup uses absolute `node` paths on Windows and `cmd /c npx` for portable configs.

### 8. Decision benchmark

| Metric | Development | Held-out | Target |
|---|---:|---:|---:|
| Top-1 acceptable | 100% (115 runs) | 100% (35 runs) | ≥75% |
| Top-3 acceptable | 100% | 100% | ≥92% |
| Intent accuracy | 100% (39 scenarios) | 100% (12 scenarios) | ≥95% |
| Hard constraints | 100% | 100% | 100% |
| Median cost regret | 0.00 | 0.00 | reported |
| Price stability | 100% | 100% | ≥80% |
| p95 latency | 1.1 ms | 1.1 ms | ≤300 ms |

Full methodology and limitations: `bench/METHODOLOGY.md`. Raw runs: `tests/results/benchmark-latest.json`, `holdout-latest.json`, `value-latest.json`, `sensitivity-latest.json`.

**Value simulation** (`node bench/value.js`, 4,000 jobs × 5 tasks): value pick keeps **95.4%** of frontier first-pass quality at **41.6%** of the cost; cheapest keeps 93.5% at 39.1%. Sensitivity: value flips on 4/5 tasks across ±3/±8/±10 quality bands, 0/5 across retry multipliers 0.8/1.15/1.5. Full table in [`../docs/VALUE.md`](../docs/VALUE.md).

### 9. UX / manual review

- First-run path: `npx … pick "..."` works with no key.
- JSON output is stable and documented.
- Human output fits 76 columns; no color dependency.
- Error messages include a next command.
- `doctor` covers Node, catalog, freshness, config, keys, agents.
- `setup --dry-run` prints actions without writing.
- README above-the-fold answers: what, why, install, demo, agents, benchmark, limits.

Screenshots and charts: `tests/evidence/terminal-pick.png`, `terminal-plan.png`, `benchmark.png`, `cost-quality.png`, `architecture.png`, `social-preview.png`.

## Known gaps

1. No live provider calls; quality labels are not outcome-tested.
2. Media quality scores are priors, not independent measurements.
3. The benchmark labels and catalog share one author.
4. Windows MCP configs use an absolute `node` path by default; portable configs need `cmd /c npx`.
5. Claude Code plugin is validated with the real `claude plugin validate` (2.1.170); headless MCP approval is still manual.
6. npm package is not published yet; GitHub install is the tested path.
7. GitHub Actions are template-only until a token with `workflow` scope pushes `docs/ci/`.

These are recorded, not hidden. The next test cycle should add a community-labeled holdout and a small live-call smoke test with user-provided keys.
