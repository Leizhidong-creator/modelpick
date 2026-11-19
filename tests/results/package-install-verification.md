# Package install verification

**Date:** 2026-11-19
**Artifact:** `modelpick-0.1.0.tgz` produced by `npm pack --ignore-scripts`
**Tarball SHA-256:** recorded on the release asset `.tgz.sha256`
**Environment:** Windows 11, Node 24.15.0, clean temp project

## Procedure

```text
$ npm pack --ignore-scripts --silent
modelpick-0.1.0.tgz

$ mkdir mp-pkg-test && cd mp-pkg-test
$ echo '{"name":"mp-test","private":true}' > package.json
$ npm install <repo>/modelpick-0.1.0.tgz

$ npx modelpick version
0.1.0

$ npx modelpick pick "3D sword for Unity" --json
{
  "schemaVersion": "1.0",
  "task": { "id": "3d-gen", ... },
  "recommendation": { "slug": "tripo-h3.1", "costPerTask": 0.2148, ... }
}
```

## What was checked

| Check | Result |
|---|---|
| `bin` link works after install | pass (`npx modelpick version` → `0.1.0`) |
| Catalog is packaged | pass (`catalog/models.json` present, 40 models) |
| Assets | PNG/SRT/ASS are packaged; the 7 MB video is deliberately **not** packaged and is served from the GitHub Release and the site |
| README-linked docs are packaged | pass (`launch/`, `tests/*.md`, `research/hf-evidence.json`) |
| `pick --json` works from the installed package | pass |
| `verify` works from the installed package | pass (13/13 checks, integrity hashes match) |

Installed-package verification:

```text
$ npx modelpick verify --no-color

  ModelPick verification · modelpick@0.1.0
  ✓ node                 Node 24.15.0
  ✓ package              modelpick@0.1.0
  ✓ dependencies         zero runtime dependencies
  ✓ catalog-schema       catalog + policy schema valid
  ✓ catalog-invariants   slugs, prices, evidence, weights, plans
  ✓ coverage             40 models · 20 tasks · 18 providers
  ✓ evidence             every model has an HTTPS source
  ✓ task-coverage        every task has at least two compatible models
  ✓ decision-benchmark   115 dev runs · top-1 100%
  ✓ held-out             held-out top-1 100%
  ✓ value-simulation     quality parity 95.4% · cost 41.6% of frontier
  ✓ hashes               catalog/policy hashes available
  ✓ integrity            catalog matches the shipped checksums
  OK
```

## Package size

- Tarball: **0.94 MB**
- Unpacked: **1.73 MB**
- The 93.5s intro video is a release/site asset, not an npm install cost. The CLI, catalog, docs, tests, poster, captions, and benchmark evidence fit under 1 MB packed.

The tarball is not published to npm; there is no npm auth on the build machine. This test proves the artifact is installable when the registry step is available.

## Adapter smoke test

`setup vscode --dry-run` in the installed package wrote a valid `.vscode/mcp.json` plan under `servers.modelpick` with `type: stdio`, without touching the project. `setup codex --global --dry-run --write` is covered by the integration suite.
