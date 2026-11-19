# Distribution channels

The product is ready; the next bottleneck is distribution. This is the channel map, not a promise that every submission was accepted.

## Done

| Channel | Action | Evidence |
|---|---|---|
| GitHub | Topics, README, release, Pages, test form | https://github.com/Leizhidong-creator/modelpick |
| X | Pinned product post, calibration post, 3 replies under GPT-6.2 / Gemini 4 Neon / Claude Fable launch posts | `launch/metrics.md` |
| npm | Static registry install path | `npm install modelpick --registry=https://leizhidong-creator.github.io/modelpick/npm/` |
| GitHub issues | 4 value-first replies on model-routing issues | `launch/metrics.md` |
| Awesome MCP Servers | PR opened with agent fast-track marker | https://github.com/punkpeye/awesome-mcp-servers/pull/20045 |

## Next — directories that accept GitHub projects

| Channel | Requirement | Action |
|---|---|---|
| Glama MCP | Public GitHub repo; usually auto-indexes from awesome list | Claim/verify the server after the awesome PR merges: https://glama.ai/mcp/servers |
| Smithery | CLI + account auth; can publish a stdio server | `npx @smithery/cli` after npm or GitHub install is stable |
| PulseMCP | Submit form; no paid placement | https://www.pulsemcp.com/submit |
| mcp.so | Submit form | https://mcp.so/submit |
| mcpservers.org | Submit form | https://mcpservers.org/submit |
| MCP Market | Submit listing | https://mcpmarket.com |
| Official MCP Registry | Requires npm package or OCI image | Blocked on npm 2FA; use `server.json` after publish |
| Awesome Remote MCP | Remote-only servers | Not applicable: ModelPick is local stdio |

## Next — human channels

| Channel | Requirement | Action |
|---|---|---|
| Hacker News | Account; Show HN on a weekday morning US time | Use `launch/show-hn.md`; post only after one external user |
| Reddit r/LocalLLaMA | Account; read self-promo rules | Self-host + open weights angle, not a link drop |
| Reddit r/ClaudeAI / r/codex | Account; read rules | Claude Code cost teardown |
| Product Hunt | Account + hunter | Use `launch/product-hunt.md`; first comment = limits |
| YouTube | Google account; Shorts + demo | 4 vertical clips are in `launch/shorts/` |
| Dev.to / Hashnode | Account | “The metric AI routers don’t show” article |
| Newsletters | Editor email/submission | One paragraph + test form link, no attachment |
| Podcasts | Booking email | Offer a 10-minute routing benchmark segment |

## Rules

- One channel at a time; tailor the entry to its rules.
- No paid placement, fake reviews, or mass DMs.
- Do not submit to 10 directories in one day. A rejected listing is worse than a late one.
- Track the submission URL and the date in `launch/metrics.md`.
- A directory listing is distribution, not validation. Only `modelpick eval` runs count as design-partner evidence.

## Current blocker

- Official npm publish: needs a live OTP or a granular token with publish permission. The static registry works.
- Five design partners: 0/5. PRs and replies are not users.
