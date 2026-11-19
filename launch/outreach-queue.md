# Outreach queue (public, value-first)

This is a **research queue**, not an email list. No email addresses are scraped. For each row, use the public route (issue, discussion, PR, contact page). If you send email, find a public contact route on the project's own site and personalize it; never BCC a list.

Target: **20–30 touches per week**, not 2,000 emails. One follow-up maximum.

## Tier 1 — routers and cost tools

| # | Project / issue | Why it matters | Route | Angle | Status |
|---:|---|---|---|---|---|
| 1 | `musistudio/claude-code-router` | 38k-star router/gateway audience | Discussion / issue, read contributing first | “Gateway routes traffic; ModelPick returns the decision + key. Complementary, not a replacement.” | todo |
| 2 | `ryoppippi/ccusage` | Token/cost tracking | Issue / discussion | “Raw spend vs cost per solved task; here is a free eval schema.” | todo |
| 3 | `AgentOps-AI/agentops` | Agent observability | Issue / integration PR | “Export a decision receipt into a trace; no key proxying.” | todo |
| 4 | `inferock/inferock-bench` | Inference benchmark | Issue / PR | “Compare routing regret, not only throughput.” | todo |
| 5 | `DigiBanks99/lopen#51` | Public issue: “Model routing” | Issue comment | Answer the design question; link only if asked. | **commented** |
| 6 | `michael-muir/software-factory#20` | Public issue: “E20 · Model router” | Issue comment | Concrete per-node schema, constraints before scoring. | **commented** |
| 7 | `jim-at-jibba/agent-os#4` | Public issue: “Model routing” | Issue comment | Small adapter sketch; no promo. | **commented** |
| 8 | `8gi-foundation/8gent-code#73` | Public issue: “Role-based model routing” | Issue comment | Role → task node mapping; cost denominator. | **commented** |
| 9 | `sillyash/FiiReFLY#3` | Public issue: models + routes | Issue comment | API/model-id mapping and fallback. | todo |

## Tier 2 — coding agents

| # | Project | Why it matters | Route | Angle | Status |
|---:|---|---|---|---|---|
| 10 | `openai/codex` | Codex users; config writer shipped | Discussion / docs PR | “Codex `config.toml` writer, backup + idempotent.” | todo |
| 11 | `anthropics/claude-code` | Claude Code plugin + MCP | Plugin marketplace / docs | “Plugin + skill + MCP, no key storage.” | todo |
| 12 | `sst/opencode` | Open coding agent | Issue / PR | “MCP/skill adapter; dry-run first.” | todo |
| 13 | `cline/cline` | VS Code agent | Issue / PR | “MCP server + VS Code `.vscode/mcp.json` adapter.” | todo |
| 14 | `continuedev/continue` | IDE agent | Issue / PR | “Project config + fallback when no key.” | todo |
| 15 | `block/goose` | Local agent | Issue / discussion | “stdio MCP + eval fixture.” | todo |
| 16 | `google-gemini/gemini-cli` | Gemini CLI users | Issue / PR | “Skill/MCP adapter; no gateway.” | todo |

## Tier 3 — discovery surfaces

| # | Surface | Why | Route | Angle | Status |
|---:|---|---|---|---|---|
| 17 | `punkpeye/awesome-mcp-servers` | 98k-star MCP directory | PR after README/license/install stable | One-line entry, no superlatives | hold |
| 18 | `modelcontextprotocol/servers` | Reference MCP servers | PR only if it fits the list criteria | stdio server, tests, no deps | hold |
| 19 | `jaw9c/awesome-remote-mcp-servers` | Remote MCP directory | PR after remote transport exists | Do not submit a stdio-only server | hold |
| 20 | Glama / MCP directories | Discovery | Submit form, read rules | Same one-liner | todo |

## Personalization fields

For every row, fill these before touching send:

- Name / maintainer:
- Specific issue or commit:
- One sentence showing you read it:
- The one thing ModelPick changes for them:
- The smallest ask (5-minute test, not “star us”):
- Public contact route:
- Follow-up date (max one):

## Email rules

- 20–30 per week, one recipient per email.
- No BCC, no tracking pixel, no attachment.
- One ask.
- Working unsubscribe line.
- Stop after one follow-up.
- If the project has no public contact route, use the issue/discussion; do not guess an address.

## What not to do

- Do not scrape GitHub commit emails.
- Do not email 200 people “anonymously”.
- Do not send the same paragraph with the name swapped.
- Do not ask for stars in the first email.
- Do not argue with a maintainer who says no.

## Log

| Date | Project | Route | Reply? | Next step |
|---|---|---|---|---|
| | | | | |
