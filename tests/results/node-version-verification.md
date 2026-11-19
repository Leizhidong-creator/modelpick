# Node runtime verification

**Date:** 2026-11-19
**Package engine:** `>=20.11`

The project claims Node 20/22/24 support. This is the actual matrix run on the build machine (Windows 11, x64).

| Runtime | Command | Tests | Benchmark | Value simulation |
|---|---|---:|---|---|
| Node 24.15.0 | `node --test "tests/**/*.test.js"` | **141/141** | 115 runs, 0 failures | pass |
| Node 22.x | `npx -y -p node@22 node --test "tests/**/*.test.js"` | **141/141** | not re-run | not re-run |
| Node 20.20.2 | `npx -y -p node@20 node --test tests/unit tests/integration tests/e2e` | **141/141** | 115 runs, 0 failures | pass |

Node 20 does not expand the quoted `tests/**/*.test.js` glob on Windows; the directory form is the portable invocation. CI uses the glob on Ubuntu/macOS and the directory form as a fallback.

## Commands

```bash
# Node 20
npx -y -p node@20 node --test tests/unit tests/integration tests/e2e
npx -y -p node@20 node bench/run.js
npx -y -p node@20 node bench/value.js

# Node 22
npx -y -p node@22 node --test "tests/**/*.test.js"
```

## What this proves

- No Node 24-only syntax in the shipped code or tests.
- The benchmark and value simulation are deterministic across the three runtimes (same result files, same 115 runs).
- The declared engine range is real, not aspirational.

## What it does not prove

- Linux/macOS path behavior. The CI matrix covers those once the workflows are enabled; `docs/ci/ci.yml` is ready.
- Node 20 on ARM64.
