# modelpick — 14-Day Launch Strategy

**GTM plan for an open-source CLI + MCP server that routes AI coding agents to the right model at each workflow node and reports cost per solved task.**

| | |
|---|---|
| Prepared | 2026-11-19, Asia/Shanghai |
| Launch day (T-Day) | Tuesday 2026-11-24 |
| Budget | $0 |
| Team | 1 developer |
| Product | `modelpick` — CLI + MCP server. Node types: LLM, image, video, 3D, audio. |
| Primary hosts | Claude Code, Codex, Cursor, DeepSeek Harness |

---

## 0. The bet, in one page

Launches in this category fail for three predictable reasons: they announce "a router" into a lane that already holds eleven repos above 900 stars; they optimize for stars that do not convert into installs; or they spend their single Hacker News shot on a generic announcement that dies at 40 points.

This plan inverts all three.

1. **Positioning — not a router, a measurement layer.** The claim is *cost per solved task*, not routing. Routing is commoditized (§1.2). The denominator, `solved`, is not, and no competitor computes it.
2. **Launch asset — a leaderboard, not an announcement.** The thing you submit to HN is a **`$/solved-task` leaderboard** across 9 models and 5 node types on a public repo. Evidence that this genre works right now: today's HN front page carries "Seven new models at scalable price-performance" at 508 points, next to "Gemini 4 Neon" at 692. Price-performance analysis is the highest-yield technical genre available to you.
3. **Channel order — one shot, then compounding.** HN once (small and precise), Product Hunt the next day for the badge and backlink, Reddit staggered across four days, Chinese channels in week-1 evening slots, then a nine-day sustain phase where most installs actually come from directories, plugins, and embedding — not from the spike.
4. **The metric that matters is installs, not stars.** The decoupling is measurable: `claude-code-router` has **38,226 stars** and its npm CLI does **~1,073 downloads/month**; `upstash/context7` has **65,096 stars** and **3.8M downloads/month**. Same category, ~3,500x difference in conversion. Conversion is a README-and-install-path problem.

**Day-14 base case:** 600–900 stars, 4,000–8,000 npm downloads, 250–500 weekly active MCP installs, 3+ inbound partner conversations, one published leaderboard cited by at least one model provider.

---

## 1. Market reality check: the numbers this plan is built on

All figures are live reads on **2026-11-19** from the GitHub REST API, the npm downloads API, HN Algolia, OpenRouter, and github.com/trending. Method notes in Appendix A.

### 1.1 GitHub Trending: the entry ticket is ~200–250 stars/day

Snapshot of `github.com/trending?since=daily`, 19 repos:

| Repo | Stars today | Language |
|---|---|---|
| google-research/paper-orchestra | +1,524 | Python |
| mvanhorn/last30days-skill | +1,059 | Python |
| sveltejs/svelte | +692 | JavaScript |
| getarcaneapp/arcane | +547 | Go |
| HKUDS/CLI-Anything | +389 | Python |
| google-labs-code/stitch-skills | +365 | TypeScript |
| **cursor/plugins** | **+314** | TypeScript |
| NVIDIA/SkillEvaluator | +312 | Python |
| **nvm-sh/nvm (the floor)** | **+237** | Shell |

Two operational conclusions:

- **The floor is ~237 stars in 24 hours.** Nothing below ~200/day appears. A launch netting 150 stars/day is invisible regardless of quality — which is why this plan front-loads one spike day instead of spreading effort evenly.
- **Four of nineteen trending repos are skills/plugin repos, and `cursor/plugins` is itself trending** (+314). `cursor/plugins` was created 2026-01-23 and already has **17,324 stars** — a ten-month-old ecosystem with a published spec and thin coverage. The current distribution tailwind is the plugin/skill surface, not the standalone-CLI surface. Ship a `modelpick` skill **and** plugin for Claude Code and Cursor, not only an MCP server.

### 1.2 The router lane is saturated — do not launch as a router

| Repo | Stars | Created | Stars/day | What it is |
|---|---|---|---|---|
| tashfeenahmed/freellmapi | 54,821 | 2026-04 | **258.9** | 87 free providers, 1,313 endpoints, one `/v1` |
| QuantumNous/new-api | 52,204 | 2023-11 | 47.3 | Self-hosted gateway, routing, cost accounting |
| musistudio/claude-code-router | 38,226 | 2025-02 | 60.5 | "One local control plane for every AI agent" |
| Portkey-AI/gateway | 13,414 | 2023-08 | 11.3 | Gateway, 1,600+ LLMs |
| BlockRunAI/ClawRouter | 6,666 | 2026-02 | 23.1 | Agent-native router, x402/USDC |
| weave-os/router | 5,627 | 2026-04 | 27.4 | "<50ms routing, cut costs 40–70%" |
| NVIDIA-NeMo/Switchyard | 3,651 | 2026-05 | 19.9 | Multi-provider routing, API-compatible |
| edison7009/EchoBird | 3,572 | 2026-02 | 12.9 | Desktop app with smart routing |
| fuxicodex/Fuxi | 3,194 | 2026-08 | 29.9 | Agent harness |
| modu-ai/moai-adk | 1,258 | 2025-09 | 2.9 | Harness with model+effort routing |
| hex/claude-council | 947 | 2025-12 | 2.8 | Multi-agent side-by-side |

Off-GitHub incumbents matter too: **ModelPicker** ([modelpicker.net/mcp](https://modelpicker.net/mcp)) already ships an MCP server recommending models from live benchmarks and pricing inside Claude Code and Cursor; **routesmith** ([repo](https://github.com/sidrat2612/routesmith)) already decomposes prompts and routes each step across Claude Code, Codex, Gemini CLI, Cursor, and Aider.

**Implication.** "Route your prompt to the best model" is solved, crowded, and *unpriced*. `freellmapi` grew at 259 stars/day on the promise of *free*; you cannot beat that with a price-per-token argument. You can only differentiate on outcome economics and multimodality, which none of the eleven do:

- None computes **cost per solved task** — they compute cost per token or per call.
- None covers **image / video / 3D / audio** nodes. Tencent Hunyuan, Volcengine Doubao Seedance, fal, and Replicate are all unaddressed in this lane.
- None publishes a **reproducible eval harness** so a user can re-derive the number on their own repo.

That is the wedge, and it belongs in the first line of the README.

### 1.3 Hacker News: category ceiling ~200–450 points, and the angle is used up

Show HN stories in this category, all time (HN Algolia):

| Title | Points | Comments | Date |
|---|---|---|---|
| Show HN: Get your coding agent off ~2019 JavaScript | 448 | 146 | 2026-11-11 |
| Show HN: Ghidra MCP Server – 110 tools | 298 | 68 | 2026-02-04 |
| Show HN: Route your prompts to the best LLM | 298 | 126 | 2024-05-22 |
| Show HN: MCP server for Anna's Archive | 256 | 79 | 2025-07-10 |
| Show HN: WhatsApp MCP Server | 229 | 138 | 2025-03-31 |
| **Show HN: Smart model routing directly in Claude, Codex and Cursor** | **216** | 113 | **2026-06-27** |
| Show HN: Apple Health MCP Server | 199 | 49 | 2025-07-24 |
| **Show HN: Open-source model routing for coding agents at Astra-level performance** | **123** | 42 | **2026-10-01** |

In the same window, Claude Code *drama* posts scored 2,445 / 2,095 / 1,616 / 1,364 / 1,349. Calibration from 1,000 recent Show HNs with more than 20 points: median ~60–75 points, with roughly 30–40% crossing 100. Today's front page spans 9 to 1,279 points across 30 slots.

**Implications:**

- A model-routing Show HN has already run **twice in 2026**, and the second decayed 43% versus the first. A third "smart routing" post is a predictable 100–150 points with no front-page stickiness.
- The winning format in this category is **a specific, slightly contrarian engineering claim plus something runnable** (448 points: "get your coding agent off 2019 JavaScript"), not "I built a tool".
- Therefore: submit **one** Show HN, put a *result* in the title, and link an *analysis* rather than the repo root.

### 1.4 Stars do not equal installs, measured

| Package | npm downloads/month | Repo stars |
|---|---|---|
| @modelcontextprotocol/sdk | 353,280,700 | — |
| @openai/codex | 106,105,829 | 135,818 |
| @anthropic-ai/claude-code | 62,219,108 | 156,206 |
| @playwright/mcp | 39,373,955 | 39,872 |
| opencode-ai | 16,131,565 | — |
| mcp-remote | 5,782,286 | — |
| @upstash/context7-mcp | 3,814,469 | 65,096 |
| fastmcp | 2,884,554 | — |
| ccusage | 1,073,892 | — |
| firecrawl-mcp | 663,283 | — |
| @musistudio/llms | 4,919 | 38,226 (router) |
| claude-code-router | 1,073 | 38,226 (router) |

Routers convert terribly because their install path is a config file, not a command. `@playwright/mcp` converts at ~987 downloads per star; `claude-code-router` at ~0.16.

**Design rule:** the primary CTA must be one command that produces something visible in under 20 seconds, and the npm package name must equal the repo name (`modelpick`) so `npx modelpick` is guessable without reading anything.

### 1.5 Directory saturation: a listing alone is worth ~nothing

Glama reports **123,650 MCP servers** as of 2026-11-19 ([glama.ai/mcp/servers](https://glama.ai/mcp/servers)). Directory submission is a checkbox, not a channel — unless the directory ranks by a signal you can move. Glama sorts by *Recent GitHub Stars* and *Weekly npm Downloads*, both downstream of the launch, so submit once on Day 1 and move on.

### 1.6 The price table that makes the argument for you

Live OpenRouter pricing, USD per 1M tokens, 2026-11-19:

| Model | Input | Output | Note |
|---|---|---|---|
| anthropic/claude-opus-5.5 | $4.00 | $20.00 | |
| anthropic/claude-sonnet-5.5 | $2.00 | $10.00 | |
| openai/gpt-5.5 | $5.00 | $30.00 | $10/$45 above 272k prompt tokens |
| google/gemini-3.8-flash | $0.825 | $4.125 | image/audio input priced too |
| moonshotai/kimi-k3.1-pro | $0.253 | $8.80 | |
| deepseek/deepseek-v4.1-flash | $0.30 | $1.20 | |
| minimax/minimax-m3.1-flash | $0.15 | $0.60 | 50% off 15:00–01:00 UTC |
| z-ai/glm-5.3 | $0.0699 | $1.40 | cheapest input in the set |

**Spread: 57x on input, 33x on output.** An agent emitting 5k output tokens per edit pays $0.10 on Opus-5.5 and $0.007 on GLM-5.3 for the same edit. But that is *price*, not *cost*: if GLM-5.3 needs 2.1 attempts per solved task and Opus-5.5 needs 1.05, the cheap model is more expensive. **That multiplication is the entire product.** Publish it as a table on day one.

Illustrative arithmetic for the README (label it *illustrative — rerun `modelpick eval` on your repo*):

```
Node: implement (40k in / 6k out per attempt)
cost/attempt:  opus-5.5 $0.28   sonnet-5.5 $0.14   glm-5.3 $0.011
pass@1:              0.82             0.76            0.55
$/solved-task:      $0.34            $0.18           $0.020
```

---

## 2. Positioning: what to say, what to never say

### 2.1 The one-liner (verbatim everywhere)

> **modelpick tells your coding agent which model to use at each step — and what that step costs per solved task.**
> `npx modelpick init` · Claude Code · Codex · Cursor · DeepSeek Harness

Chinese: **modelpick 告诉你的编程 Agent 每一步该用哪个模型，以及这一步「解决一个任务」到底花了多少钱。**

### 2.2 Message hierarchy

| Layer | Message | Where |
|---|---|---|
| Hook (3s) | "Your agent picks models by vibes. Here is the price of a *solved* task." | X tweet 1, HN title, PH tagline |
| Proof (30s) | 9x5 leaderboard table + 90-second GIF of `modelpick eval` | README above the fold, HN body |
| Mechanism (2m) | classify node, price candidates, multiply by attempts, route, write receipt; local; holds no keys | README "How it works", X tweets 5–6 |
| Moat (10m) | reproducible harness; your repo, your numbers; multimodal nodes included | `docs/eval.md`, HN comments |
| Ask | `npx modelpick init`, then reply with your number | every CTA |

### 2.3 Words banned from all launch copy

`revolutionary`, `game-changing`, `seamlessly`, `supercharge`, `10x`, `AI-powered`, `blazingly fast`, `the future of`, `unleash`. This audience downvotes on sight; the 448-point Show HN in this space was written as an engineering complaint.

### 2.4 The three claims and how each is defended

1. **Cost per solved task beats price per token.** Defended by the table plus a public harness. If challenged: "clone it, point `tasks/` at your repo, run `modelpick eval --suite mine`; if the ranking flips, that is the point."
2. **Covers image/video/3D/audio, not just LLM.** Defended by provider adapters (fal, Replicate, Volcengine Seedance, Hunyuan 3D). Also the partnership wedge (§10).
3. **Local, no proxy, no keys held.** Defended by architecture: modelpick emits a routing plan plus prices; the host agent executes. Keep it true.

### 2.5 Competitive answer sheet (memorize these five)

| Incoming comment | Answer |
|---|---|
| "This is just claude-code-router" | "That routes by rules; it does not know what a task costs to *solve*. It gives you a route, we give you a number and a receipt." |
| "LiteLLM already routes and prices" | "LiteLLM is a gateway: it prices calls, it has no denominator. We price outcomes, and we do not proxy your traffic." |
| "Your pass@1 numbers are made up" | "The harness is in `evals/`, the seed tasks are public. Rerun it. The README says `illustrative` for exactly that reason." |
| "Another AI slop repo" | Ship daily for 14 days and point at the commit graph. It is the only rebuttal that works. |
| "Why not just use the cheapest model?" | "Because on 3 of 5 node types in our run, the cheapest per-token model had the highest cost per solved task. That is the finding." |

---

## 3. Eight comparable launches and what to steal from each

Velocity = stars divided by days since creation, the only public proxy.

| # | Repo | Stars | Age | Stars/day | Downloads/mo | Playbook | Steal | Avoid |
|---|---|---|---|---|---|---|---|---|
| 1 | [claude-code-router](https://github.com/musistudio/claude-code-router) | 38,226 | 21 mo | 60.5 | 4,919 + 1,073 | One config trick that points Claude Code at any OpenAI-compatible endpoint. Bilingual README, zero marketing spend. | Bilingual README from commit #1; a one-line "why this saves money" diagram. | Support debt: 1,145 open issues. Stars without installs (0.16 dl/star). |
| 2 | [upstash/context7](https://github.com/upstash/context7) | 65,096 | 20 mo | **108.1** | **3,814,469** | Docs-as-MCP, zero-config `npx`, useful with no arguments. | The install line: one command, no config file, works in every host. Best conversion in the category (~59 dl/star). | Nothing. This is the benchmark. |
| 3 | [freellmapi](https://github.com/tashfeenahmed/freellmapi) | 54,821 | **7 mo** | **258.9** | — | One legible economic promise ("87 free providers, 1,313 endpoints, one `/v1`") plus a disclaimer. | Headline discipline: one number, one sentence, no adjectives. | Claims that invite "is this allowed?" threads. |
| 4 | [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | 98,133 | 24 mo | 136.5 | — | A list, growing faster than almost every tool in it. | Being listed *is* the channel. At Day 30+, publish `awesome-model-routing` as a second surface. | Launching a list on launch day; it splits attention. |
| 5 | [cline/cline](https://github.com/cline/cline) | 71,762 | 28 mo | 82.9 | — | Marketplace-first (VS Code), compounded 28 months. | Ship a Cursor/Claude plugin on D2–D3 so installs happen inside an IDE store. | Assuming a GitHub spike produces retention. |
| 6 | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | 39,872 | 20 mo | 65.6 | **39,373,955** | Rides a loved tool's name; drops into an MCP config users already have. | Name MCP tools after the job (`pick_model`, `price_task`), not after the company. | Corporate tone. |
| 7 | [oraios/serena](https://github.com/oraios/serena) | 31,521 | 20 mo | 52.1 | 62 (npm shim) | Solo team, benchmark-dense README, author visible in issues and on X. | Benchmark table above the fold; answer every issue within 12h for 14 days. | Long prose README. |
| 8 | [zilliztech/claude-context](https://github.com/zilliztech/claude-context) | 12,704 | 5.5 mo | 23.9 | — | Company-backed, polished, funded — and four times slower than the solo repo above. | Polish does not buy velocity; a sharp claim does. | Launching with a blog post and no runnable 20-second demo. |

**The cross-case pattern — this is the actual playbook:**

1. Repos that convert have a one-command install and a useful default; repos that do not have a config file and a setup guide.
2. Velocity comes from a single legible number (87 providers; `$/solved task`), never from a feature list.
3. The lane is ~20 months old. The first-mover window closed in mid-2025; every launch from here is a differentiation launch, so the asset must contain a *finding*.
4. **None of the top eight got there via Product Hunt.** PH is a badge and a backlink; HN, npm, and directories do the work.

---

## 4. Channel map: expected yield and the exact move

Ranked by expected installs per hour of work, for one person with no budget.

| Channel | Expected yield, D1–D14 | Effort | Trigger | Exact move |
|---|---|---|---|---|
| **Show HN** | 150–800 stars, 800–3,000 visits, 2–5k npm dl — one shot | 6h incl. babysitting | D1, 07:00 PT / 23:00 CST | §7.1. Reply to every comment within 15 minutes for 4 hours. |
| **npm + `npx` install path** | multiplies every other channel | 3h | D−1 | `npx modelpick init` prints a routing table in under 20s with **no API key**. |
| **Chinese dev communities** (Juejin, Zhihu, XHS) | 100–400 stars, 1–3k dl | 5h | D5, 20:00–22:00 CST | §7.5. Juejin article is the anchor; Zhihu answers link to it; XHS is a six-image visual. |
| **Directories** (official MCP Registry, Glama, mcp.so, Smithery, PulseMCP, Cline, Docker MCP catalog) | 50–250 dl, compounding, ~0 stars | 2h | D1 + D6 sweep | §10.1. Publish to the **official registry first**; downstream directories ingest it. |
| **Claude Code plugin directory** | 100–500 installs | 2h + review wait | submit D2 | §10.2. Needs a GitHub repo plus a paid claude.ai plan to submit. |
| **Cursor plugins** | 50–300 installs, 10-month-old ecosystem | 2h | D3 | §10.3. Public spec; ship a plugin and a skill. |
| **Reddit** (r/LocalLLaMA, r/mcp, r/ClaudeAI, r/ChatGPTCoding, r/cursor) | 80–400 stars if one lands; removal risk if sloppy | 3h over 4 days | D3–D8, staggered | §7.3. A different post per subreddit; read each sidebar first. |
| **Product Hunt** | 40–150 upvotes, 50–150 visits, durable badge | 4h | D2, 00:01 PT / 16:01 CST | §7.4. Self-hunt; no vote pods. |
| **X** | 30–200 stars; feeds HN's first 10 points | 2h/day | D1 07:30 PT / 23:30 CST, then daily | §7.2 EN + CN threads. Link only in the last tweet. |
| **Newsletters** (Changelog News, JavaScript Weekly, TLDR, PulseMCP weekly, MCP Weekly) | 100–600 dl if two pick it up | 1.5h | D6 | §7.7. Free tip lines only; no paid slots. |
| **awesome lists** (awesome-mcp-servers 98k stars, awesome-ai-agents, awesome-cli) | 30–150 dl, permanent | 1h | D6 | One honest PR per list, correct alphabetical slot, house style. |
| **OpenRouter App & Agent Rankings** | passive, compounding | 1h | D4 | §10.5. Opt into app attribution to appear on the rankings page that lists Claude Code (47.4T tokens) and Hermes Agent (55.7T). |
| **Provider co-marketing** | 200–2,000 dl if one lands | 4h | D9–D10 | §10.6, §10.7. Ask for a docs listing and one repost, not money. |

**Deliberately skipped:** paid PH promotion, paid newsletter slots, conference CFPs (too slow), Discord community building (Day 30+), LinkedIn (near-zero yield for CLIs), long-form video (only a 60s short on D12).

---

## 5. Repo conversion checklist (do all of it before D1)

This is the multiplier on every channel. It takes one day and it is where most of the plan's value sits.

### 5.1 README above the fold — the 600px budget

```markdown
[badges: npm version · npm downloads · CI · license · MCP]
# modelpick
Your agent picks models by vibes. modelpick picks by cost per solved task.

CLI + MCP server. Routes each workflow node (LLM · image · video · 3D · audio) to the
cheapest model that still solves the task — then shows the receipt.

$ npx modelpick init          # 20s, no API key, prints your routing table
[demo.gif — 8s, ≤2MB, 1200x720: init → table with $/solved → modelpick ledger]

Works with: Claude Code · Codex · Cursor · DeepSeek Harness · any MCP host
```

Rules:
- No paragraph longer than three lines above the fold.
- The GIF must show **a number changing**, not a menu. Record with `asciinema` → `agg`.
- The **leaderboard table** goes immediately after the install block; it is the shareable artifact, so make it screenshot-friendly (monospace, ≤7 columns).
- Add a `## For agents` block near the top: `Read https://raw.githubusercontent.com/<org>/modelpick/main/AGENT.md and install modelpick, then run modelpick doctor.` Ship `AGENT.md` and `/llms.txt`. **The README is a prompt** — agents install tools by reading them.
- Chinese README as `README.zh-CN.md`, linked in the first line. Non-optional given §7.6 and the bilingual benchmark (§3, row 1).

### 5.2 Badges — five, in this order

```markdown
[![npm](https://img.shields.io/npm/v/modelpick?color=black)](https://www.npmjs.com/package/modelpick)
[![downloads](https://img.shields.io/npm/dm/modelpick)](https://www.npmjs.com/package/modelpick)
[![CI](https://github.com/<org>/modelpick/actions/workflows/ci.yml/badge.svg)](https://github.com/<org>/modelpick/actions)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-server-6f42c1)](https://modelcontextprotocol.io)
```

No stars badge, no "built with AI" badge. Both read as vanity to this audience.

### 5.3 Social preview and metadata

- `assets/social-preview.png`, **1280x640**, under 1MB: product name, one-liner, a three-row `$/solved` mini-table, install command. Set in Settings → General → Social preview.
- **Description (160 chars):** `Open-source CLI + MCP server that routes each agent step to the cheapest model that still solves the task, and reports cost per solved task.`
- **Topics (all 20):** `mcp`, `mcp-server`, `model-context-protocol`, `ai-agents`, `coding-agents`, `claude-code`, `codex`, `cursor`, `llm-routing`, `model-selection`, `cost-optimization`, `evals`, `developer-tools`, `cli`, `typescript`, `openai`, `anthropic`, `image-generation`, `video-generation`, `3d`.
- **Website field:** the leaderboard page, not the repo.

### 5.4 Releases, install paths, first-success moment

- Ship `v0.1.0` on **D−1** with a real changelog, via `semantic-release` and npm `--provenance` (provenance shows on npmjs.com and reads as "not slop").
- Three install paths, all tested on a clean machine the day before: `npx modelpick init`; `npm i -g modelpick`; `claude mcp add modelpick -- npx -y github:Leizhidong-creator/modelpick mcp`.
- `modelpick doctor` diagnoses the five most common failures (no keys, host not detected, stale price cache, offline, unsupported node type). Every week-1 support question becomes a `doctor` check.
- Pin prices to a daily-refreshed cache and print `prices as of <date>` in every output. Stale prices are the number-one credibility risk.

### 5.5 Community scaffolding (60 minutes, once)

- `CONTRIBUTING.md` with three explicit contribution types, each with a worked example and a `pnpm test` that finishes in under 60s: **provider adapter** (one file + fixture), **cost table** (JSON), **eval task** (YAML).
- Issue templates: `bug.yml`, `provider-request.yml` (provider dropdown), `cost-data-error.yml` (model id, date, expected vs actual), `config.yml` (links to Discussions). PR template asks: which node type, which provider, fixture added, `modelpick eval` delta.
- **Discussions categories:** `Show your routing table` (the growth loop — users post their `$/solved`), `Provider requests`, `Q&A`, `Ideas`.
- **Eight good-first-issues filed on D−1**, each with file path and acceptance test:
  1. Add `fal` adapter for image nodes (`src/providers/fal.ts` + fixture).
  2. Add `Replicate` adapter for video nodes.
  3. Add Volcengine Doubao Seedance 2.5 pricing row.
  4. Add Tencent Hunyuan 3D row and a `mesh` node type.
  5. Handle MiniMax off-peak discount (15:00–01:00 UTC).
  6. Add `modelpick ledger --export csv`.
  7. Add a `doctor` check for the stale price cache.
  8. Translate the README to Japanese.
- `SECURITY.md` and `CODE_OF_CONDUCT.md` (adopt Contributor Covenant verbatim; two minutes).

---

## 6. The 14-day calendar

**T-Day = Tuesday 2026-11-24.** `CST` = Asia/Shanghai (UTC+8); `PT` = US Pacific (UTC−8 in November); **CST = PT + 16h**.

**Pre-flight, Thu 11-19 → Mon 11-23:** finish §5; record the GIF; publish `docs/leaderboard.md`; write **all** days' drafts into `launch/drafts/` so launch days are posting, not composing; test install on a clean VM; seed five Discussions; file the eight good-first-issues; send the pre-launch read to three real users.

### 6.1 Day-by-day

| Day | Date | CST | PT | Action | Asset | Channel | Success signal |
|---|---|---|---|---|---|---|---|
| **D1** | Tue 11-24 | 23:00 | 07:00 | **Show HN** live; answer everything | §7.1 body + GIF | HN | ≥100 pts in 2h; ≥1 front-page hour |
| D1 | | 23:30 | 07:30 | X thread EN, pinned | §7.2 | X | ≥20k impressions |
| D1 | | 00:30 | 08:30 | Submit to official MCP Registry, Glama, mcp.so | `server.json` | Directories | listed <24h |
| D1 | | +4h | | "We are live, first numbers" reply; DM 5 commenters | — | X | 5 replies |
| **D2** | Wed 11-25 | 16:01 | 00:01 | **Product Hunt** launch, self-hunted | §7.5 + 5 images | PH | top 10 of day |
| D2 | | 20:00 | 04:00 | Submit Claude Code plugin | plugin repo + `marketplace.json` | Claude dir | submitted |
| D2 | | 22:00 | 06:00 | Refresh maker comment; answer all PH comments | — | PH | ≥30 comments |
| **D3** | Thu 11-26 | 22:30 | 06:30 | **Reddit r/LocalLLaMA** (data-first) | §7.4 | Reddit | ≥50 upvotes |
| D3 | | 23:00 | 07:00 | Publish Cursor plugin + skill | spec entry | Cursor | listed |
| **D4** | Fri 11-27 | 22:30 | 06:30 | Reddit r/mcp + r/ClaudeAI (different bodies) | §7.4 variants | Reddit | no removals |
| D4 | | 23:30 | 07:30 | X thread 2: the 9x5 leaderboard explained | 7 tweets + table image | X | ≥10 reposts |
| D4 | | — | — | Opt into OpenRouter app attribution | config | OpenRouter | appears on /apps |
| **D5** | Sat 11-28 | 20:00 | 04:00 | **Xiaohongshu** note, six 3:4 images | §7.6 | XHS | ≥500 views |
| D5 | | 20:30 | 04:30 | **Zhihu** answers x2 under existing questions | §7.6 | Zhihu | ≥200 reads |
| D5 | | 21:00 | 05:00 | **Juejin** anchor article | §7.6 | Juejin | ≥1k reads |
| **D6** | Sun 11-29 | 21:00 | 05:00 | Newsletter pitches + awesome-list PRs | §7.7 | Newsletters | 2 accepted |
| **D7** | Mon 11-30 | 21:00 | 05:00 | **Public week-1 retro** with real numbers; ship `v0.2.0` | retro + release notes | X + Discussions | honest, specific |
| **D8** | Tue 12-01 | 22:00 | 06:00 | Reddit r/ChatGPTCoding + r/cursor; cross-post leaderboard to Dev.to (canonical → repo) | variants | Reddit/Dev.to | 1 referral spike |
| **D9** | Wed 12-02 | 22:00 | 06:00 | **Partner outreach EN**: OpenRouter, fal, Replicate | §10.6 email | Email/DM | ≥1 reply |
| **D10** | Thu 12-03 | 20:00 | 04:00 | **Partner outreach CN**: Moonshot, Zhipu, MiniMax, Volcengine, Tencent Hunyuan | §10.7 | WeChat/email | ≥1 reply |
| **D11** | Fri 12-04 | 22:00 | 06:00 | Good-first-issue triage: merge first external PR, ship `v0.3.0`, thank contributors by name | release + post | GitHub + X | ≥1 merged external PR |
| **D12** | Sat 12-05 | 20:00 | 04:00 | **Differentiator demo**: video + 3D node routing, 60s screen recording | 60s video | X + XHS + Bilibili | ≥5k views |
| **D13** | Sun 12-06 | 21:00 | 05:00 | Discussions digest: "5 routing tables from users"; open `awesome-model-routing` draft | digest | Discussions/X | ≥5 user tables |
| **D14** | Mon 12-07 | 21:00 | 05:00 | **30-day plan + leaderboard v3** with community numbers; publish scorecard | §9.4 | blog + X | 3 partner calls |

**Load:** D1–D2 about 10h/day (babysitting), D3–D6 about 3h/day, D7–D14 about 2h/day. The only brutal window is 23:00–03:00 CST on D1, which is the price of the US morning.

**Why this order:** HN first because it is the only channel where a front-page hour produces a star spike big enough to clear the Trending floor (§1.1) — and Trending is what turns a spike into a week. PH second because its badge is permanent and its audience is buyers, not builders. Reddit third because it needs the HN numbers to be credible ("216 points on HN" is a Reddit-friendly credential). Chinese channels on Saturday evening because that is their traffic peak. Everything after D7 is compounding infrastructure, not spikes.

---

## 7. The exact post drafts

### 7.1 Show HN

**Title (56 chars, under the truncation point, no hype):**

```
Show HN: modelpick – route coding agents by cost per solved task
```

Alternates, if the first fails: `Show HN: I measured $/solved task for 9 models – the cheap one usually loses` (78) · `Show HN: The cheapest model had the highest cost per solved task`.

**Body (170 words; first person, one number, one admission, one ask):**

```
I kept watching my agent burn Opus tokens on tasks a $0.07/M model would have solved,
and every router I tried priced tokens, not outcomes. So I built the denominator.

modelpick is a CLI + MCP server. It classifies each step of a workflow as a node
(llm / image / video / 3d / audio), prices the candidate models for that node, and
routes to the one with the lowest cost per *solved* task: price x attempts-to-pass.

The number that surprised me: on my 40-task suite the cheapest model per token won
3 of 5 node types and lost badly on the other 2. Cost per solved task ranged from
$0.02 to $0.34 for the same edit.

  npx modelpick init        # 20s, prints your table, no API key

Honest limits: 40 tasks, one repo, pass@1 estimated over 3 runs, so the noise is real
and your repo will rank differently. The harness is in evals/, so rerun it instead of
trusting mine.

Feedback I would most like: is "review" really its own node class, or is it a prompt
variant of "refactor"?
```

**First comment, posted immediately after submitting:**

```
Leaderboard with the raw numbers, per node type and per model:
<repo>/blob/main/docs/leaderboard.md

Method, prompts, and the exact task list are in the same folder. If you rerun it and
get a different ranking, paste it and I will add it to the table with your repo name.
```

Rules applied: no "excited to announce", a runnable command, an explicit limitation, and a question at the end (questions drive comments; comments drive rank). No link in the body — the submission URL is the repo; the leaderboard goes in the first comment.

**Timing:** 07:00 PT / 23:00 CST, Tuesday. Comment volume peaks 06:00–09:00 PT, which is what pushes a story up. If the post finishes under ~10 points, one repost a few days later is acceptable; never delete-and-repost repeatedly, and never ask for votes.

### 7.2 X thread — English (9 tweets)

```
1/ Your coding agent picks models by vibes.
   I measured what each one actually costs per SOLVED task.
   The 40x cheaper model won 3 of 5 node types — and lost badly on the other 2. 🧵

2/ Price per token is not cost.
   cost  = tokens × price
   COST  = (tokens × price) × attempts_to_pass
   Everyone optimizes the first line. Your bill lives on the second.

3/ Same edit, 40k in / 6k out:
   opus-5.5    $0.28/attempt · 82% pass → $0.34/solved
   sonnet-5.5  $0.14/attempt · 76% pass → $0.18/solved
   glm-5.3     $0.011/attempt · 55% pass → $0.02/solved
   On hard nodes the ordering flips completely.

4/ So I built modelpick: a CLI + MCP server that does this per node.
   llm · image · video · 3d · audio
   npx modelpick init → your routing table in 20s, no API key.
   [GIF]

5/ How it works:
   1. classify the step as a node type
   2. pull live prices for candidate models
   3. multiply by your measured pass@1
   4. route, and write a receipt
   `modelpick ledger` shows spend vs solved.

6/ The part nobody covers: image / video / 3D nodes.
   Your agent should not call an $0.08/image model for a favicon.
   Same math, different unit: dollars per usable asset.

7/ It is NOT a proxy. No keys, no traffic through my server, no SaaS.
   It emits a plan; your host (Claude Code, Codex, Cursor, DeepSeek Harness) executes it.

8/ Honest limits: 40 tasks, one repo, pass@1 from 3 runs. Noise is real.
   The harness is public — rerun it on your repo and post the table. I will add it to
   the leaderboard with your name on it.

9/ Repo + leaderboard: <link>
   npx modelpick init
   Tell me which node type ranks most differently on your codebase.
```

Mechanics: link only in tweet 9; tweet 1 must stand alone with a number; twenty minutes later quote-post tweet 1 with the GIF (the GIF post is what gets reposted); reply to your own thread with real `modelpick ledger` output. Hashtags only in tweet 9, and only `#MCP` and `#AIAgents`.

### 7.3 X thread — Chinese (8 posts, written natively)

```
1/ 你的编程 Agent 选模型基本靠感觉。
   我把「解决一个任务到底多少钱」量出来了：同一个改动，
   最便宜的模型和最贵的差 17 倍，但有两个环节便宜模型反而更贵。🧵

2/ 单价不是成本。
   成本 = token × 单价 × 一次通过率
   大部分工具只算前两项，账单的第三项才是大头。

3/ 同一个改动（输入 40k / 输出 6k）：
   opus-5.5   $0.28/次 · 通过率 82% → $0.34/任务
   sonnet-5.5 $0.14/次 · 通过率 76% → $0.18/任务
   glm-5.3    $0.011/次 · 通过率 55% → $0.02/任务
   注意：在「重构」和「多文件修改」两个环节，排序完全反过来。

4/ 所以我写了 modelpick：一个 CLI + MCP server，按「节点」决定用哪个模型。
   文本 · 图片 · 视频 · 3D · 音频
   npx modelpick init，20 秒出你的路由表，不用填 API key。[GIF]

5/ 原理：识别节点类型 → 拉实时价格 → 乘你自己测出来的通过率 → 给出路由 + 账单。
   `modelpick ledger` 直接看「花了多少 / 解决了多少」。

6/ 没人做的一块：图片、视频、3D、音频节点。
   做 favicon 不该调用 $0.08/张的模型。同样的算法，单位换成「每个可用产物的成本」。

7/ 它不是代理：不碰你的 key，不过我的服务器，不联网中转。
   只输出方案，执行交给 Claude Code / Codex / Cursor / DeepSeek Harness。

8/ 局限说清楚：40 个任务、一个仓库、通过率跑 3 次取均值。
   评测脚本公开，你在自己仓库跑一遍，把表贴给我，我加进榜单并署名。
   仓库与榜单：<link>   `npx modelpick init`
```

### 7.4 Reddit — three different posts, staggered

**r/LocalLLaMA (D3), data-first, no CTA in the title:**

Title: `I measured cost-per-solved-task instead of cost-per-token for 9 models across 5 workflow nodes. The ranking inverts on 2 of 5.`

Body:
```
Method: 40 tasks from a mid-size TS repo (auth refactor, test generation, a docs pass,
two image-node tasks). Each task run 3x, pass@1 = median. Prices pulled from OpenRouter
on 2026-11-18 and pinned in the repo.

What I expected: cheaper per token wins everywhere.
What I got: cheapest-per-token won on llm-implement, llm-docs and image; lost on
llm-refactor and llm-review, where attempts-to-pass went from ~1.2 to ~2.6.

$/solved spread for the same task: $0.02 to $0.34.

I wrote it up as a CLI + MCP server (modelpick) because I wanted the receipt, not
another dashboard. Harness, task list and raw runs are in the repo: evals/ and
docs/leaderboard.md.

Happy to run anyone's task list if you paste it. Telling me the method is wrong is
more useful than a star.
```
r/LocalLLaMA removes link-only and low-substance self-promo: lead with method, invite disagreement, keep the link in the body, and answer every comment for three hours.

**r/mcp (D4), integration-first:**

Title: `modelpick: MCP server that prices a workflow node before your agent calls it (llm/image/video/3d/audio)`

Body:
```
Three tools: `pick_model` (node type + budget → ranked models with $/solved),
`price_task` (token estimate → cost across candidates), `log_outcome` (records what
actually happened so pass rates improve).

Install: claude mcp add modelpick -- npx -y github:Leizhidong-creator/modelpick mcp
Cursor: Settings → MCP → add `npx -y github:Leizhidong-creator/modelpick mcp`.

Design choice worth criticizing: it is advisory, not a proxy — modelpick never sees
your keys or your traffic. Tradeoff: it cannot enforce the route, only recommend it
loudly. Curious whether that is the right call for multi-model setups.
```

**r/ClaudeAI (D4), workflow-first:** title `Cut my Claude Code spend ~60% without swapping models — here is the routing table`. Body is a `modelpick ledger` before/after screenshot, the five-node table, and three lines of explanation. Tool mention only at the end.

**r/ChatGPTCoding (D8) and r/cursor (D8):** reuse the r/mcp body with the host-specific install line changed. Never post to more than two subreddits in one day.

### 7.5 Product Hunt

- **Name:** modelpick
- **Tagline (59 chars):** `Pick models by cost per solved task, not price per token`
- **Description (258 chars):** `modelpick is an open-source CLI + MCP server that routes every step of an AI coding workflow — LLM, image, video, 3D, audio — to the cheapest model that still solves the task, then shows the receipt: dollars spent per task actually completed. One command, no API keys held.`
- **Topics:** Developer Tools · Artificial Intelligence · Open Source · Productivity · Command Line
- **Gallery (5 images, 1270x760):** one-liner + install; the 9x5 leaderboard; a `modelpick ledger` receipt; the multimodal node diagram; "works with" + repo QR.
- **Thumbnail 240x240:** monospace `$/solved` on black.
- **Launch:** 00:01 PT / 16:01 CST, self-hunted, Tuesday–Thursday only. Respect the mechanics: roughly 79% of featured posts and 60% of Product-of-the-Day winners were self-hunted, vote quality is weighted (one measured recap: 120 upvotes counted as 31 ranking points), and there is a visibility cliff around position 12 — so the first four hours matter more than the remaining twenty.
- **Maker comment, five parts, under 200 words, posted at minute zero:**

```
Hi PH — I'm <name>, solo dev.

What it is: an open-source CLI + MCP server that tells your coding agent which model to
use at each step, and what that step costs per *solved* task.

Why: every router prices tokens. None price outcomes. My agent was spending Opus money
on tasks a cheap model solved — and occasionally the reverse.

The number: $/solved-task ranged $0.02–$0.34 for the same edit in my test suite.

How: classify node → price candidates → multiply by measured pass@1 → route + receipt.
Works with Claude Code, Codex, Cursor, DeepSeek Harness.

Ask: run it and paste your routing table — I'm collecting community numbers for the
leaderboard, with attribution.

Free, MIT, no account, no keys held. `npx modelpick init`
```

### 7.6 Chinese channels (D5, all evening CST)

**Juejin (anchor, 21:00 CST).** Title: `我给 AI 编程 Agent 做了个「选型器」：不看 token 单价，只看「解决一个任务多少钱」`
Structure, about 2,500 characters: (1) a real bill, with a screenshot of one month of agent spend; (2) why token price is a fake metric, with the formula and a three-row table; (3) node-ification, and the unit for each of text/image/video/3D/audio; (4) implementation, the 40 lines of core routing logic pasted in; (5) results from 40 tasks and two counterexamples; (6) limits and how to reproduce on your own repo.
Tags: `AI编程` `MCP` `开源` `Claude` `效率工具`. Publish as 原创 with an 800x450 cover built from the leaderboard table.

**Zhihu (20:30 CST).** Do not create a question. Answer two existing high-traffic ones (search 「AI 编程」/「Claude Code 值得买吗」/「有哪些好用的 AI 编程工具」; pick those with >500 followers and <30 answers). Answer = 400 characters lifted from Juejin sections 2 and 5, ending with the repo link. Zhihu ranks by 赞同 velocity in the first two hours — ask five people who have actually used the tool to read it, not to upvote.

**Xiaohongshu (20:00 CST).** Title (20 characters max): `AI写代码别再用最贵的模型`
Six 3:4 images: (1) cover, big text: `同一个改动，$0.34 vs $0.02`; (2) the bill screenshot; (3) the formula; (4) the routing table; (5) the multimodal node diagram; (6) one command + QR.
Caption: three short paragraphs, no jargon, no English, ending with 「评论区扣 1 发你配置」 — comment-to-DM is the growth mechanic on XHS and converts far better than a link. Put the link in your bio for the week.

### 7.7 Newsletter and awesome-list pitch (D6)

Subject: `The missing denominator in every model price table`

```
Hi — I publish a $/solved-task leaderboard for coding-agent models (9 models x 5 node
types, harness and raw runs public, updated weekly).

The gap: every price table ranks tokens; none rank outcomes. On my suite the ranking
inverts on 2 of 5 node types — that is the story, not the tool.

If useful for <newsletter>, the permalink is <leaderboard URL> and everything is MIT.
Happy to run your team's task list and publish the table with attribution.
— <name>, <repo>
```

Send to free tip lines only: Changelog News, JavaScript Weekly, TLDR, PulseMCP weekly, MCP Weekly. One email each, no follow-up — a second email is how you get blacklisted.

**Awesome-list PR:** one per list, correct alphabetical slot, house style. For `punkpeye/awesome-mcp-servers`, under Developer Tools:

```
- [modelpick](https://github.com/<org>/modelpick) - Route each agent step (LLM/image/video/3D/audio) to the cheapest model that still solves the task; reports cost per solved task.
```

---

## 8. Ethical growth guardrails

### 8.1 The hard "never" list

| Do not | What actually happens |
|---|---|
| **Buy stars** | The CMU/Socket measurement study found 4.5M suspected fake stars and concluded fake stars help for **under two months** and then become a *liability*; most fake-star activity in 2024 was attached to short-lived phishing repositories ([arXiv:2412.13459](https://arxiv.org/abs/2412.13459), ICSE'26). You would buy a two-month bump and a permanent asterisk on the repo that *is* your product page. |
| **Vote rings / upvote-for-upvote** | On PH, vote quality is weighted; rings get posts de-ranked or removed, which forfeits the badge. On HN, ring detection is aggressive and a flagged submission is dead permanently. |
| **Ask friends to upvote a Show HN** | HN's guidelines ask you not to solicit votes, and the community reads comment histories. A single "this looks astroturfed" comment ends the launch. Ask for feedback, never votes. |
| **Submit the same Show HN repeatedly** | One repost of a dead submission is tolerated; three is spam and penalizes the domain. |
| **Invent testimonials or users** | At 250 installs, everyone can see the real user list. One fabricated quote is unrecoverable. |
| **Cherry-pick benchmarks** | The benchmark *is* the product. The "cheapest model lost 2 of 5" line is load-bearing — it is why the other three are believable. |
| **Mass-DM maintainers for stars** | Gets you blocked by exactly the fifty people whose repost would have mattered. |
| **Sock-puppet issues or PRs to look alive** | Commit graphs and issue quality are read by the same audience you are pitching. |
| **Scrape provider pricing against ToS** | Your price table is the product. Use official APIs and published price pages, cache politely, attribute sources, and ship an `--offline` mode with a dated snapshot. |

### 8.2 GitHub-side rules

- GitHub's Acceptable Use Policies prohibit spam and inauthentic activity, including artificially inflating stars and followers ([docs.github.com](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies)). Enforcement ranges from star removal to account suspension.
- Do not manufacture org history to look established. One real personal account plus one org beats a farm.
- Do not make "star this repo" the primary CTA in the README. Put `npx modelpick init` there instead; it converts better and costs nothing in credibility.
- License: MIT. Anything stricter kills the "embed modelpick in your agent" distribution this plan depends on.

### 8.3 The one grey area, resolved

**Asking for a repost from people who already use the tool is fine. Asking people who have never used it is not.** Keep `launch/supporters.md` — everyone who has actually run `modelpick init`. Those, and only those, may be asked for a boost, once.

---

## 9. Metrics, targets, and a $0 analytics plan

### 9.1 The metric tree

```
NORTH STAR: weekly active installs that produced a routing table
  ├── acquisition: npm downloads/day, MCP server starts, plugin installs
  ├── activation:  % of installs that reach `modelpick ledger` with >=1 recorded outcome
  ├── retention:   installs active in week 2 (opt-in heartbeat)
  └── outcome:     $ saved per user per week; community leaderboard rows
```

Stars are a leading indicator for HN and nothing else. Report them; never optimize them.

### 9.2 Instrumentation you can build in 90 minutes

| Signal | How | Note |
|---|---|---|
| npm downloads/day | `https://api.npmjs.org/downloads/point/last-day/modelpick` polled by a GitHub Action | Free, no auth. |
| GitHub views / clones / referrers | `GET /repos/{owner}/{repo}/traffic/*` with `GITHUB_TOKEN` | **Only retains 14 days** — snapshot daily or lose it. Referrers tell you which channel really worked. |
| Stars / forks / issues | `GET /repos/{owner}/{repo}` daily | Free. |
| MCP installs | opt-in anonymous ping on `mcp` start: `{event:"mcp_start", version, host}` | Disclose in README and `doctor`; `--no-telemetry` must work. |
| Plugin installs | release-asset download counts for the plugin zip | Good enough proxy. |
| Activation | ping on the first non-empty `ledger` run | The number that matters. |
| $ saved | computed locally, sent only as an aggregate sum in the opt-in ping | Never send task text. |
| Web referrals | UTM on every link (`?utm_source=hn|x|ph|reddit|juejin|zhihu|xhs`) + Cloudflare Web Analytics (free, cookieless) | UTM is how D5–D14 gets attributed. |

```yaml
name: metrics
on:
  schedule: [{cron: "17 1 * * *"}]   # 09:17 CST daily
  workflow_dispatch:
jobs:
  snap:
    runs-on: ubuntu-latest
    permissions: {contents: write}
    steps:
      - uses: actions/checkout@v4
      - run: |
          mkdir -p metrics && D=$(date -u +%F)
          curl -s "https://api.npmjs.org/downloads/point/last-day/modelpick" > metrics/npm-$D.json
          curl -s -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
            "https://api.github.com/repos/${{ github.repository }}/traffic/views" > metrics/views-$D.json
          curl -s -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
            "https://api.github.com/repos/${{ github.repository }}/traffic/popular/referrers" > metrics/refs-$D.json
          curl -s -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
            "https://api.github.com/repos/${{ github.repository }}" \
            | jq '{stars:.stargazers_count,forks:.forks_count}' > metrics/repo-$D.json
      - run: |
          git config user.name metrics && git config user.email metrics@local
          git add metrics && git commit -m "metrics: $(date -u +%F)" && git push
```

### 9.3 Daily ten-minute routine

1. Read yesterday's `npm.json` and `refs.json`; write one line in `metrics/log.md`: `D3: npm 412 (+38%), top referrer news.ycombinator.com, 0 partner replies.`
2. Answer everything older than four hours. Nothing else in this block.
3. Pick **one** number to improve today — usually activation, not acquisition.

### 9.4 Scorecard and go/no-go

| Metric | Bear | Base | Bull | Day-14 gate |
|---|---|---|---|---|
| Stars | 250 | 700 | 2,000 | indicator only |
| npm downloads, cumulative | 1,500 | 6,000 | 25,000 | ≥3,000 or rethink the CTA |
| MCP starts, unique | 80 | 350 | 1,400 | ≥200 |
| Activation (ledger run) | 15% | 30% | 45% | **≥25% — the only real gate** |
| Community leaderboard rows | 0 | 4 | 15 | ≥3 |
| Partner replies | 0 | 2 | 5 | ≥1 |
| External PRs merged | 0 | 1 | 6 | ≥1 |

**Decision rule at D14.** Activation ≥25%: double down on directories and partners, start the 30-day plan. Activation <15% with healthy downloads: the first twenty seconds of the product is broken — pause all promotion for a week and fix `init`. Downloads flat too: the positioning is wrong — relaunch with the leaderboard as the product and the CLI as its byproduct.

---

## 10. Partnerships and embedding

The order is deliberate: directories and plugins are free and immediate; provider deals are slow and should start only after you have numbers to show.

### 10.1 MCP directories — publish once, in this order

1. **Official MCP Registry** ([modelcontextprotocol.io/registry](https://modelcontextprotocol.io/registry/quickstart)) — currently in preview, published via the `mcp-publisher` CLI. Ownership is verified per package type (npm, PyPI, NuGet, OCI, MCPB), so publish the npm package *first*, then `mcp-publisher publish` with a `server.json`. **Do this first**: several downstream directories ingest the official registry.
2. **Glama** ([glama.ai/mcp/servers](https://glama.ai/mcp/servers)) — 123,650 servers. Claim the listing; it sorts by *Recent GitHub Stars* and *Weekly npm Downloads*, both of which your launch moves.
3. **mcp.so** — has a Submit form on the homepage.
4. **Smithery** — a `smithery.yaml` plus optional hosted deploy; adds a second install path (`smithery install`).
5. **PulseMCP** — get into the weekly newsletter, not just the index (see §7.7).
6. **Cline marketplace** and **Docker MCP catalog** — worth the 20 minutes; both are IDE/desktop-native surfaces with their own search.
7. **awesome-mcp-servers** (98,133 stars) — one PR, correct slot, house style.

### 10.2 Claude Code plugin directory

Mechanics, per Anthropic's docs ([publish](https://code.claude.com/docs/en/plugins/publish.md), [marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)):

- A plugin is a directory with a `.claude-plugin/plugin.json` manifest; a *marketplace* is a repo with `.claude-plugin/marketplace.json` listing plugins and where to fetch each.
- You can self-host a marketplace (anyone can `claude plugin marketplace add <repo>`) — **do this on D1**, it has no gatekeeper and gives one-command install immediately.
- Submitting to **Anthropic's directory** requires the plugin to live in a GitHub repo **and a paid claude.ai plan to submit from**; once accepted it reaches people who add it on claude.ai and syncs into their Claude Code sessions.
- There is also a CLI-side hook: "Recommend your plugin from your CLI" ([cli-hints](https://code.claude.com/docs/en/plugins/cli-hints)) — i.e. `modelpick` itself can recommend its own plugin. Use it, once, politely.

**What to ship:** a plugin that (a) bundles the MCP server config so install is one command, (b) adds a `skills/model-routing` skill that teaches the agent *when* to call `pick_model`, and (c) adds a slash command `/modelpick:table` that prints the current routing table. (c) is the screenshot people share.

### 10.3 Cursor plugins

`cursor/plugins` — 17,324 stars, created 2026-01-23, pushed today, described as "Cursor plugin specification and official plugins", and trending at +314 stars today. A ten-month-old ecosystem with a public spec and few entries is the single best timing arbitrage available to you. Ship `cursor-modelpick` as a plugin plus a skill, link it from the README's "Works with" row, and mention it in the Cursor subreddit post (D8) rather than the launch thread.

### 10.4 Codex and DeepSeek Harness ecosystem lists

- **Codex** ([openai/codex](https://github.com/openai/codex), 135,818 stars) consumes MCP servers and `AGENTS.md`. Ship an `AGENTS.md` snippet in `docs/hosts/codex.md`: three lines that tell Codex to call `pick_model` before a multi-file edit. Then PR the snippet into community "awesome-codex" lists and the Codex MCP examples people actually copy.
- **DeepSeek Harness** — same play: a host adapter doc plus a `skills/` entry. Being early in a harness ecosystem is cheap distribution; the harness's own users are already routing-sensitive (DeepSeek pricing changes weekly).

### 10.5 OpenRouter — the passive compounding channel

OpenRouter publishes **App & Agent Rankings** ([openrouter.ai/apps](https://openrouter.ai/apps)) ranked by token volume: Hermes Agent 55.7T tokens, Claude Code 47.4T, Kilo Code next. Opting into **app attribution** ([docs](https://openrouter.ai/docs/app-attribution)) puts modelpick on a page that coding-agent users already browse, and it costs one header plus a config flag.

Pitch angle for OpenRouter itself: you are a *demand-side* observability layer — you tell developers which of their 480 models to use for which node, which increases routed volume and reduces churn to whichever provider was cheapest last week.

### 10.6 Western providers — OpenRouter, fal, Replicate

The ask is never money. It is: **a docs/integrations listing, one repost from the company account, and API credits for the public leaderboard runs.** In exchange you give them the one thing they do not have: a *solved-task* denominator next to their price.

Email (135 words):

```
Subject: The denominator your pricing page is missing

Hi <name> — I maintain modelpick, an open-source CLI + MCP server that routes coding
agents per workflow node and publishes a $/solved-task leaderboard (9 models x 5 node
types, harness and raw runs public).

Two concrete asks:
1. A listing on your integrations/docs page — install is one command, no key held by us.
2. Credits for the weekly leaderboard run, so <provider> is measured on the same task
   suite as everyone else instead of on price per token alone.

In exchange: your models appear with a solved-task number next to them, and we publish
the raw runs (including the ones where you lose).

This week's table: <leaderboard URL>. Happy to run your internal task list and publish
it with attribution.
— <name>, <repo>
```

For **fal** and **Replicate**, swap the node type: fal for image/video, Replicate for video/3D. Their relevant pitch is that modelpick is the first router in this lane that prices *per usable asset* for non-LLM nodes, which is exactly the comparison their customers cannot make today.

### 10.7 Chinese providers — pitch in Chinese, from a user's problem

Targets and their hooks (verified on their developer portals, 2026-11-19):

| Provider | Current surface | Pitch hook |
|---|---|---|
| **Moonshot (Kimi K3.1 Pro)** | $0.253/M in, $8.80/M out | Output price is 35x input price — a *solved-task* framing flatters them on long agent runs |
| **Zhipu (GLM-5.3)** | $0.0699/M in, $1.40/M out — cheapest input on OpenRouter | Cheapest per token; modelpick can prove or disprove "cheapest per solved task" |
| **MiniMax (M3.1 Flash)** | $0.15/$0.60 with 50% off 15:00–01:00 UTC | Off-peak discount is invisible to users; modelpick can surface "route this node now, it is half price" |
| **Volcengine 方舟** | Agent/Coding Plan, Doubao Seedance 2.5 (video), DeepSeek-V4.1-Flash | Coding-plan subscriptions + video nodes = exactly the two node types competitors ignore |
| **Tencent Hunyuan** | Hy3/Hy4, Hy Image 3, and 3D coverage | The only major provider with an explicit 3D story; modelpick is the only router with a `mesh` node |
| **Alibaba Bailian 百炼** | Qwen4-Max, 百炼CLI, Token Plan packages, 伙伴 program | They already sell token packages; solved-task numbers justify the upgrade |

WeChat/email message (~120 characters):

```
你好，我是 modelpick 的作者（开源 CLI + MCP server，给编程 Agent 按节点选模型，
并计算「解决一个任务的成本」）。想给贵司模型做一次独立实测，出一张 $/解决任务 的
榜单（含失败案例），榜单和评测脚本全公开。只需要：① 一份测试额度 ② 官方文档
「集成」页加一行。这周的表：<链接>
```

Why this works with Chinese providers specifically: they compete on price-per-token publicly and have no independent solved-task evidence. You are offering the missing half of their own marketing claim, for free.

### 10.8 What not to ask partners for

No "support us on Product Hunt", no "give us a star", no cross-links from unrelated pages. Each of those converts a technical relationship into a marketing favor, and marketing favors are one-use.

---

## 11. Risks and contingencies

| Risk | Likelihood | Signal | Response |
|---|---|---|---|
| HN post dies under 20 points | Medium | <20 pts at 2h | Do not repost same day. Post the leaderboard as a standalone link a week later with a different, more specific title. Shift weight to Reddit + Juejin. |
| "This is just <competitor>" top comment | High | First hour | Answer with §2.5 line 1, then stop; let the thread do the work. Never argue twice. |
| "Slop repo" accusation | Medium | Any comment about AI-generated code | Point at commit graph, test coverage, and the eval runs. Do not get defensive; do not delete the comment. |
| Activation below 15% | Medium | D4 metrics | Freeze promotion. Ship a 15-second `init` path and a `--demo` mode with fixture data so the first run needs no keys at all. |
| Provider changes pricing mid-launch | Medium | Price cache diff | Prices are cached with a date stamp; a stale-cache banner appears automatically. Announce the change publicly — it is content, not a crisis. |
| Support overload (the claude-code-router failure mode: 1,145 open issues) | Medium | >10 new issues/day | Triage rule: anything reproducible becomes a `doctor` check; anything else gets a template reply within 24h. Close aggressively with a reason. |
| PH launch flops | Medium | <30 upvotes at 6h | Keep the badge, stop optimizing, put the 4 hours into r/LocalLLaMA prep instead. |
| Star spike without installs | Medium | Stars/day > downloads/day | Treat as a warning, not a win: the README's above-the-fold is failing. A/B the install block, not the headline. |

---

## Appendix A — Data sources and method

| Figure | Source | Method |
|---|---|---|
| Stars, forks, creation dates, stars/day | `api.github.com/repos/*`, `api.github.com/search/repositories` | Direct API reads, 2026-11-19. Stars/day = stars ÷ days since `created_at`. |
| Trending list and daily star gains | `github.com/trending?since=daily` | Parsed 19 entries, 2026-11-19. |
| Show HN points/comments/dates | `hn.algolia.com/api/v1/search` | Filtered `tags=story`, `points>50`, category queries. |
| Show HN hour-of-day calibration | `hn.algolia.com/api/v1/search_by_date`, `tags=show_hn`, `points>20` | 1,000 most recent qualifying stories; median by US-Pacific posting hour showed no strong hour effect (medians 44–105 across hours) — hence timing advice rests on comment-window overlap, not on an hour-of-day optimum. |
| npm downloads/month | `api.npmjs.org/downloads/point/last-month/<pkg>` | Direct reads; packages that 404 were omitted. |
| Model pricing | `openrouter.ai/api/v1/models` | USD per 1M tokens, computed from per-token strings. |
| Directory size | `glama.ai/mcp/servers` | As displayed on page, 2026-11-19 06:38. |
| Plugin/marketplace mechanics | `code.claude.com/docs/en/plugins/publish.md`, `docs.claude.com/en/docs/claude-code/plugin-marketplaces`, `modelcontextprotocol.io/registry/quickstart` | Official docs. |
| Fake-star evidence | [arXiv:2412.13459](https://arxiv.org/abs/2412.13459) (ICSE'26) | Paper abstract and measurement sections. |
| Product Hunt mechanics | [2026 launch playbook](https://forkoff.xyz/blog/saas-gtm/product-hunt-launch-playbook-maker-comment-timing-2026) | Secondary source; treat percentages as directional. |

**Caveats to keep in mind when quoting this doc:** HN Algolia samples are biased toward stories that already got points; "stars/day" rewards young repos and punishes old ones; npm download counts include CI traffic; OpenRouter prices are one aggregator's view, not the providers' list prices.

## Appendix B — Pre-launch asset checklist

- [ ] `demo.gif` ≤2MB, 1200x720, shows a number changing
- [ ] `social-preview.png` 1280x640, set in repo settings
- [ ] `README.md` above-the-fold block (§5.1) + `README.zh-CN.md` + `AGENT.md` + `llms.txt`
- [ ] Five badges; 20 topics; description ≤160 chars
- [ ] `v0.1.0` published to npm with provenance; three install paths tested on a clean VM
- [ ] `modelpick doctor` covers 5 failure modes; `--demo` works with no keys
- [ ] `docs/leaderboard.md` with method, prompts, raw runs, and a dated price snapshot
- [ ] `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, 4 issue templates, PR template
- [ ] 4 Discussions categories seeded with 5 posts
- [ ] 8 good-first-issues with file paths and acceptance tests
- [ ] `launch/drafts/` with all 14 days pre-written (EN + CN)
- [ ] `launch/assets/D01..D14/` with every image and table screenshot
- [ ] Metrics Action committed and green; UTMs generated for all seven channels
- [ ] 5 plugin/marketplace submissions drafted (MCP Registry, Glama, mcp.so, Smithery, awesome list)

## Appendix C — Source links

- GitHub repos cited: [claude-code-router](https://github.com/musistudio/claude-code-router) · [context7](https://github.com/upstash/context7) · [freellmapi](https://github.com/tashfeenahmed/freellmapi) · [new-api](https://github.com/QuantumNous/new-api) · [Portkey gateway](https://github.com/Portkey-AI/gateway) · [ClawRouter](https://github.com/BlockRunAI/ClawRouter) · [Switchyard](https://github.com/NVIDIA-NeMo/Switchyard) · [serena](https://github.com/oraios/serena) · [playwright-mcp](https://github.com/microsoft/playwright-mcp) · [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) · [cline](https://github.com/cline/cline) · [cursor/plugins](https://github.com/cursor/plugins) · [routesmith](https://github.com/sidrat2612/routesmith)
- Directories and registries: [official MCP Registry quickstart](https://modelcontextprotocol.io/registry/quickstart) · [Glama](https://glama.ai/mcp/servers) · [mcp.so](https://mcp.so) · [OpenRouter apps](https://openrouter.ai/apps) · [OpenRouter app attribution](https://openrouter.ai/docs/app-attribution) · [ModelPicker](https://modelpicker.net/mcp)
- Platform docs: [Claude Code plugin publish](https://code.claude.com/docs/en/plugins/publish.md) · [Claude Code marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces) · [GitHub Acceptable Use](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies)
- Research and playbooks: [Fake stars, ICSE'26](https://arxiv.org/abs/2412.13459) · [Product Hunt 2026 playbook](https://forkoff.xyz/blog/saas-gtm/product-hunt-launch-playbook-maker-comment-timing-2026)
