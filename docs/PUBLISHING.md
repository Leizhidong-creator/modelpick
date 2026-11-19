# Publishing and launch runbook

The repository is live. This is the remaining sequence to make it installable everywhere and launch it without improvising.

## What is already live

| Surface | URL / state |
|---|---|
| GitHub repository | https://github.com/Leizhidong-creator/modelpick |
| Landing page (GitHub Pages, `/docs`) | https://leizhidong-creator.github.io/modelpick/ |
| Release `v0.1.0` | https://github.com/Leizhidong-creator/modelpick/releases/tag/v0.1.0 |
| GitHub install | `npx -y github:Leizhidong-creator/modelpick pick "..."` — verified |
| Claude plugin manifest | `claude plugin validate .` — passed |
| Codex MCP | `codex mcp add ...` — verified, `enabled` |

## 1. npm (name is free)

`modelpick` returned **404 / not found** on the npm registry on 2026-11-19. The name is available, but this machine has no npm auth (`npm whoami` → `ENEEDAUTH`).

```bash
npm login
npm publish --access public
npm view modelpick version
npx -y github:Leizhidong-creator/modelpick pick "refactor this repo"
```

After publish, update the install commands in `README.md`, `docs/ECOSYSTEM.md`, and the site from GitHub npx to:

```bash
npx -y github:Leizhidong-creator/modelpick pick "refactor this repo"
```

## 2. MCP Registry and directories

Only after npm is live:

```bash
# Official MCP Registry (requires the published npm package)
mcp-publisher publish

# Directories: submit the same server.json + install command
# Glama, mcp.so, Smithery, PulseMCP, Awesome MCP Servers
```

Add a `server.json` with:

- `name`: `io.github.Leizhidong-creator/modelpick`
- `packages[0].registryType`: `npm`
- `packages[0].identifier`: `modelpick`
- `transport`: `stdio`

## 3. GitHub Actions (blocked by token scope)

The publishing token has `repo`, `gist`, `read:org` — **no `workflow`**. The real workflows are in `docs/ci/`:

```bash
mkdir -p .github/workflows
cp docs/ci/ci.yml docs/ci/pages.yml docs/ci/release.yml .github/workflows/
git add .github/workflows && git commit -m "ci: enable" && git push
```

If rejected:

```bash
gh auth refresh -h github.com -s workflow
```

## 4. Launch sequence

| Day | Action | Asset |
|---|---|---|
| D-3 | npm publish, verify `npx modelpick` | this runbook |
| D-2 | Enable CI, tag release, refresh site | `docs/ci/` |
| D-1 | Post teaser + 20s cut on X | `assets/modelpick-intro.mp4` |
| D0 08:00 PT | Show HN | `launch/show-hn.md` |
| D0 09:00 PT | X thread + demo video | `launch/x-thread-en.md`, `.cn.md` |
| D0 10:00 PT | Product Hunt | `launch/product-hunt.md` |
| D0 + 2h | Reddit r/LocalLLaMA, r/ClaudeAI, r/cursor (staggered) | `launch/reddit.md` |
| D1 | Chinese channels: 即刻、V2EX、知乎 | `launch/x-thread-cn.md` |
| D2–D7 | MCP directories, newsletters, podcasts | `launch/partner-onepager.md` |
| D14 | Retro: stars, installs, issues, npm downloads | `launch/14-day-plan.md` |

Rules:

- One Show HN, ever. No vote rings.
- Every claim links to `docs/VALUE.md`, `docs/QUALITY.md`, `tests/ADVERSARIAL_REVIEW.md`, or the raw benchmark JSON.
- Do not claim independent benchmark authority; the labels are expert-authored and the docs say so.

## 5. After launch: the only metrics that matter

| Metric | Source | Target (30 days) |
|---|---|---|
| GitHub stars | repo | 500+ |
| npm weekly downloads | npm | 1,000+ |
| MCP installs (unique) | optional telemetry: **none**; use GitHub release downloads + npm | 300+ |
| Issues with a model/price source | GitHub | ≥10 (ecosystem signal) |
| Decision benchmark contributions | PRs | ≥3 new scenarios |

No telemetry is collected by the product. These are external, aggregate signals.

## Hard blockers

1. **npm auth** — cannot publish from this machine.
2. **GitHub `workflow` scope** — cannot push Actions workflows.
3. **No social accounts** — cannot post the launch on the user's behalf.
4. **No API keys** — cannot run a live judge calibration or a live output benchmark.

Everything else is ready.
