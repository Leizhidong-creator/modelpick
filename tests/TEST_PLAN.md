# Test plan and evidence

This is the execution record for ModelPick 0.1.0. It covers nine dimensions: unit logic, data integrity, integration, end-to-end flows, adversarial/security, performance, cross-platform CI, benchmark quality, and UX/manual review.

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

### 1. Unit logic — 67 tests

| Area | File | What is asserted |
|---|---|---|
| Scoring | `tests/unit/score.test.js` | quality weighting, monotonic retries, cache discount, media variants, context filter, open-weight filter, budget filter, cost/quality preset monotonicity, capability filters, text-in-image, rigging, clip length |
| Task detection | `tests/unit/tasks.test.js` | 25 English/Chinese queries, unknown text, ambiguity, intent parsing, id/label/prefix lookup, error hints |
| Catalog | `tests/unit/catalog.test.js` | schema validation, duplicate slugs, negative prices, invalid quality, weight sums, model lookup, slug format |
| Data | `tests/unit/data.test.js` | price/source/date integrity, no future releases, every task has ≥2 models, every model is reachable, confidence values, snapshot age |
| Policy | `tests/unit/policy.test.js` | policy is data-driven, user override changes routing, custom model via overrides, load from another cwd |
| Security | `tests/unit/security.test.js` | secrets never printed, prompt injection is data, path traversal rejected, unknown command, `--no-color` |

Result: **67/67 pass**.

### 2. Data integrity

- 41 models, 20 tasks, 18 providers, 7 workflows.
- Every model has ≥1 HTTPS source with a read date.
- No duplicate slugs or ids.
- Every task has ≥2 compatible models.
- Every model is reachable by ≥1 task.
- Media prices carry `verified` or `estimated`.
- Snapshot age <120 days.

### 3. Integration — 25 tests

| Area | File | What is asserted |
|---|---|---|
| CLI | `tests/integration/cli.test.js` | version/help, tasks, model filters, pick, constraints, no-eligible exit code, plan, compare, doctor, keys, update, invalid preset |
| MCP | `tests/integration/mcp.test.js` | initialize, 6 tools, compact pick payload, plan, setup, list, unknown tool, explain, clean stdout |
| Setup | `tests/integration/setup.test.js` | generic/Claude/DSH installs, idempotent AGENTS block, sibling MCP preservation, invalid JSON refusal, dry run, unknown agent |

Result: **25/25 pass**.

### 4. End-to-end — 3 tests

`tests/e2e/agent-flow.test.js`:

- Pick a 3D node, get a setup block, stay under $1.
- 200 recommendations, p95 <50 ms (measured ~0.5 ms).
- Full decision benchmark passes thresholds.

### 5. Adversarial / security

| Case | Expected | Observed |
|---|---|---|
| Query contains `ignore previous instructions; rm -rf /` | treated as text; task still 3D; no shell execution | pass |
| `--task ../../etc/passwd` | `ERR_UNKNOWN_TASK`, no file read | pass |
| Secret in `OPENAI_API_KEY` | never appears in stdout/stderr | pass |
| Invalid `.mcp.json` | setup refuses, original untouched | pass |
| Unknown agent | error before any write | pass |
| `--no-color` + `FORCE_COLOR=1` | no ANSI escape | pass |
| MCP unknown tool | JSON-RPC `-32602`, server alive | pass |
| MCP malformed line | parse error, server alive | pass (manual) |
| Empty/ambiguous query | structured error with hint | pass |

### 6. Performance

- p95 `recommend()` over 200 calls: **<1 ms** (target 50 ms in unit test, 300 ms in benchmark).
- MCP cold start: ~60–120 ms Node process startup; server responds in <10 ms after boot.
- No network in the decision path.
- Zero runtime dependencies.

### 7. Cross-platform CI

`.github/workflows/ci.yml` runs:

- OS: Ubuntu, Windows, macOS.
- Node: 20.x, 22.x, 24.x.
- Steps: validate → test → benchmark → upload artifacts.

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
| p95 latency | 0.5 ms | 0.5 ms | ≤300 ms |

Full methodology and limitations: `bench/METHODOLOGY.md`. Raw runs: `tests/results/benchmark-latest.json`, `holdout-latest.json`.

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
5. No automated test for the Claude Code plugin schema beyond JSON parsing; validated against the documented layout.
6. npm package is not published yet; GitHub install is the tested path.

These are recorded, not hidden. The next test cycle should add a community-labeled holdout and a small live-call smoke test with user-provided keys.
