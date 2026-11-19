# Competitive Landscape — `modelpick`
### Live-verified landscape of model routers, multimodal marketplaces, agent-native pickers, and benchmark sources

**Prepared:** 2026-11-19 (Asia/Shanghai) · **Product under study:** `modelpick` (CLI + MCP server + portable agent skill)
**Evidence cut-off:** all GitHub/npm/web figures below were read on **2026-11-19**. Anything not read today is labelled.
**Rule applied throughout:** numbers that come from the vendor's own marketing are marked **†self-reported**; numbers we measured from an API/registry are unmarked and reproducible from the appendix.

---

## 0. Method, evidence rules, and what "verified" means here

| Evidence class | How it was obtained | Used for |
|---|---|---|
| **Measured** | GitHub REST API `repos/{owner}/{repo}` and npm registry/download APIs, called 2026-11-19 | Stars, forks, last push, license, archive flag, 30-day downloads |
| **Measured (product API)** | `https://openrouter.ai/api/v1/models` → 480 records, counted locally | Real multimodality coverage of the largest router |
| **Read (vendor docs)** | Pricing pages, docs pages, READMEs fetched 2026-11-19 | Feature presence/absence, prices, mechanism |
| **†Self-reported** | Vendor claims we could not independently test (benchmark deltas, savings %) | Quoted *as claims*, never as fact |
| **Unverifiable** | Site blocked our fetcher (LMArena, HTTP 403) or product page returns 404 | Explicitly flagged, never asserted |

Two honesty notes that shape everything below:

1. **`modelpick` is not yet externally verifiable.** `https://github.com/Leizhidong-creator/modelpick` returns **HTTP 404** to an unauthenticated request today [S51], and `modelpick` is **not published on npm** (`registry.npmjs.org/modelpick` → 404) [S50]. So `modelpick` has **0 public stars and 0 downloads** as of 2026-11-19. Any competitor comparison that implies otherwise would be fabricated.
2. **`modelpick`'s own "cost per solved task" is currently a model, not a measurement.** `src/core/score.js` derives `costPerTask = unitCost × expectedAttempts`, where `attempts` comes from a quality→failure-probability heuristic and is documented in-code as *"This is a model, not a measurement"* [M1]. Competitors get to hold us to that. Sections 9 and 11 propose the fix (`modelpick verify` → measured attempts).

---

## 1. Market shape in one page

The 2026 model-selection market split into **four layers that do not compete with each other**, which is why every layer can be "the best" and still leave the actual decision unowned.

| Layer | What it sells | Representative products (verified today) | Structural blind spot |
|---|---|---|---|
| **L1 — Traffic gateways** | A base URL + one key, then route/observe/limit | OpenRouter, Requesty, LiteLLM, Portkey, new-api, claude-code-router, freellmapi, ClawRouter | They only see a request **after** you've chosen to send it. Business model = your traffic. |
| **L2 — Media marketplaces** | Model catalogue + per-output pricing for image/video/3D/audio | fal.ai, Replicate, WaveSpeed, PiAPI, Venice, Together, Lumenfall, AIReiter | Price lists, ranked by popularity — **no recommendation**, no notion of a solved task. |
| **L3 — Agent-native defaults** | A picker inside the IDE/CLI you already use | Cursor Router / Cursor models, Claude Code aliases + `opusplan`, Codex picker, Copilot Auto, DSH composer picker | Optimise for *their* catalogue and *their* margin; single-modality (code text). |
| **L4 — Benchmarks & data** | Scores you interpret yourself | Artificial Analysis, BenchLM, LMArena, Vals AI, SWE-bench, CursorBench | Score a **model on a suite**, not a **node in your workflow**. No retry/cost economics. |

**The 2026 consolidation is the single most important market fact for positioning.** In one year the "router" category lost or repurposed seven products: Roo Code Router shut down (2026-05-15), TensorZero stopped being maintained (2026-06-04), OpenPipe's inference retired (2026-07-30), Martian's router/pricing pages went 404 while the gateway still answers (2026-07-21), Unify's API stopped resolving (2026-10-07), Glama's gateway was open-sourced as a Portkey fork and pivoted to MCP (2026-04-27), and **Portkey itself was acquired by Palo Alto Networks (closed 2026-05-29)** [S22][S7]. Independent confirmation of the Portkey acquisition: `portkey.ai/pricing` now 308-redirects to `paloaltonetworks.com/ai-security/ai-gateway` [S8].

Consequence: **"pick a gateway and hope" is now a demonstrated dependency risk**, and no incumbent is positioned to say so, because each one is the dependency. That is the strategic opening — not "we route better".

---

## 2. Master feature matrix — 15 products

Legend: **✓** present · **partial** present but narrow/indirect · **✗ not found** in the product's own docs, pricing page, or README as read on 2026-11-19 · refs = source index in §12. All cells read 2026-11-19 unless marked †. "✗" is an evidence-scoped statement ("we could not find it"), not a metaphysical one.

| # | Product (layer) | Multimodal coverage (img/vid/3D/audio) | Cost **per solved task** | Per-**node** recommendation | MCP | Agent plugin / skill | Setup & key guidance | Offline catalog | Benchmark transparency | Open source | Price |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **OpenRouter** (L1) | **partial** — 480 models live, but only **19** emit non-text (10 image+text, 4 text+audio, 3 text+image, 2 text+video) [S2] | ✗ (per-token list price + platform fee) [S1] | ✗ (per-request `openrouter/auto`) [S3] | ✗ | ✗ | ✓ single key, 600+ models† [S1] | ✗ (hosted routing) | **partial** — model metadata public via API; no outcome data [S2] | ✗ | **5.5%** on credit purchases (Standard), **8%** Business; BYOK $25k/mo free then 5% [S1] |
| 2 | **Requesty** (L1) | **partial** — LLM gateway (600+ models†); page shows text/LLM routing, no media-generation catalogue [S4] | ✗ | ✗ (routing policies, latency/fallback) [S4] | ✓ "MCP gateway" is a listed feature on all three plans [S4] | ✗ | ✓ BYO keys, 600+ models† [S4] | ✗ | ✗ | ✗ | **5%** on top of model cost; free tier 200 req/day [S4] |
| 3 | **LiteLLM** (L1) | **partial** — proxy passes image/audio payloads; no recommendation layer [S5] | ✗ (cost *tracking* per key/team, not per solved task) [S5] | ✗ (routing strategies: cost/latency/fallback) [S5] | **partial** — MCP **bridge/client** ("connect MCP servers to any LLM"), not an MCP server [S5] | ✗ | **partial** — YAML config, self-hosted | **partial** — model price map shipped in repo | ✗ | ✓ MIT core (repo `NOASSERTION` because of `enterprise/`) [S5] | Free self-host; enterprise tier |
| 4 | **Portkey** (L1) | **partial** — gateway, multimodal passthrough [S6] | ✗ | ✗ | ✓ | ✗ | ✓ virtual keys, spend tracking | ✗ | ✗ | ✓ MIT gateway repo, **last push 2026-05-25** [S6] | Now **Palo Alto Networks Prisma AIRS AI Gateway** — pricing page redirects [S8][S7] |
| 5 | **claude-code-router** (L1) | ✗ (adds *Fusion vision* to text models; not media generation) [S9] | ✗ (logs "cost estimates" per request) [S9] | **partial** — routing rules per scenario/agent, not per workflow node [S9] | ✓ MCP tools / ToolHub [S9] | **partial** — desktop app manages 10+ agents; no per-agent plugin | ✓ strongest in class: one local endpoint, credential pools | ✗ | ✗ | ✓ MIT, 38,226★ [S9] | Free (MIT) |
| 6 | **freellmapi** (L1) | ✗ grid of **1,313 free endpoints** across 87 providers, mostly text [S11] | ✗ | ✗ ("best available model", failover) [S11] | ✓ (MCP referenced across its README) [S11] | ✗ | ✓ desktop apps (macOS, MS Store, Play, App Store) [S11] | **✓ signed catalog feed**, 30-day delay on free installs [S11] | ✗ | ✓ MIT, 54,830★ [S11] | Free; **$19/yr** live-catalog premium† [S11] |
| 7 | **new-api** (L1) | **partial** — multi-provider relay incl. media channels [S12] | ✗ (quota/billing, not outcome) [S12] | ✗ | ✗ | ✗ | ✓ web console, channels, tokens | ✗ | ✗ | ✓ AGPL-3.0, 52,204★ [S12] | Free self-host |
| 8 | **ClawRouter** (L1) | **partial** — has `docs/image-generation.md` + vision, but routing is text-agent-first [S13] | **partial** — "**6.4% lower cost per successful task**" vs prior rules router on its own 3-arm agent benchmark† [S13] | **partial** — routes **per request** across 15 dimensions, <1 ms local [S13] | ✗ | **✓** `dsh-clawrouter` plugin for DeepSeek Harness [S14] | ✓ one wallet, x402 USDC, no per-call fee [S13] | ✓ inlined live catalog at build [S13] | **partial** — publishes frozen benchmark + routing profiles [S13] | ✓ MIT, 6,666★ [S13] | Pay-per-request in USDC; no markup claim† [S13] |
| 9 | **Switchyard** (NVIDIA NeMo) (L1) | ✗ (text/LLM routing) [S15] | **partial** — explicitly frames *"a cheaper model call does not guarantee a cheaper successfully completed task"* and ships a tuning loop vs a single-model baseline [S15] | **partial** — algorithm sees request **or agent's recent tool activity** [S15] | ✗ | **partial** — gateway integrations + `pi` harness recipes [S15] | ✓ `libsy` embed / demo server | ✗ | **partial** — `docs/benchmarks.md`, decision-protocol docs [S15] | ✓ Apache-2.0, 3,651★ [S15] | Free (Apache-2.0) |
| 10 | **EchoBird** (L1) | ✗ (adds voice input; routing is text) [S17] | ✗ | ✗ (auto-failover + quota mgmt) [S17] | ✗ | **partial** — one-click install for Claude Code / Codex / DSH [S17] | **✓ strongest desktop onboarding** in class [S17] | ✗ | ✗ | ✓ MIT, 3,572★ [S17] | Free |
| 11 | **routesmith** (L1, closest concept) | ✗ (text/coding only — zero image/video/3D/audio mentions) [S19] | ✗ (`routing_preference = cost\|quality\|balanced`; reports token estimates, not solved-task cost) [S19] | **✓** decomposes one prompt into typed subtasks → routes **each step** [S19] | ✓ MCP stdio server with `routesmith.performance` [S19] | **✓** writes host configs for Claude Code, Codex, Gemini CLI, Copilot, Cursor, Aider [S19] | ✓ `routesmith install claude`, `doctor` [S19] | ✗ | ✗ (telemetry stats only) [S19] | ✓ MIT, **4★** [S19] | Free (PyPI) |
| 12 | **fal.ai** (L2) | **✓** image, video, 3D, audio — **1,342 model doc URLs** in our crawl [S24] | ✗ (per-output price per model) [S24] | ✗ | **partial** — MCP servers exist in ecosystem, not first-party core | ✗ | ✓ `llms.txt` per model with exact price [S24] | ✗ | ✗ | ✗ (client SDKs OSS) | Per-output/per-model; GPU per-second (H100 $4.50/h) [S24] |
| 13 | **Replicate** (L2) | **✓** image, video, audio, 3D-ish via community models [S27] | ✗ | ✗ ("Compare models in the Playground" only) [S27] | ✗ | ✗ | **partial** — API token, no key guidance for agents | ✗ | ✗ | ✗ (SDK OSS) | Billed by hardware-second or per input/output [S26] |
| 14 | **PiAPI** (L2) | **✓** Midjourney/Kling/Sora/Veo/Luma/Hailuo/Wan/Seedance/Trellis [S29] | ✗ | ✗ | **✓ first-party MCP server** (76★) [S30] | ✗ | ✓ "CLI" + API docs in nav [S29] | ✗ | ✗ | ✗ | Subscriptions $0/$15/$60/$100 + PAYG credits; $0.50 free [S29] |
| 15 | **BenchLM** (L4) | ✗ (LLM leaderboard; 214 models ranked) [S42] | **partial** — cost calculator; no attempts/retry economics [S42] | ✗ | ✗ | ✗ | n/a | ✗ | **✓** — 214 models, coding/agent/decision splits, history feed [S42] | ✗ (site, not repo) | Free public; plan page in nav [S42] |

**Matrix read-out (the four empty columns).** Across all 15 products: **cost-per-solved-task = 0 full ✓**, **per-node recommendation = 0 full ✓** (only routesmith, and only for text coding), **offline catalog = 2** (freellmapi ✓, LiteLLM partial), **3D coverage = 2** (fal, Replicate). No product combines the four.

---

## 3. Incumbent defaults — what the agents themselves do

The hardest competition is not another CLI; it is the picker already on screen.

| Surface | Mechanism (verified today) | What it optimises | What it structurally cannot do |
|---|---|---|---|
| **Cursor** | Cursor is now sold inside "**The X Subscription**"; paid plans carry one weekly usage pool for Grok/Cursor models, and third-party models bill at API list price from prepaid credit. **Cursor Router** "picks among Cursor models and third-party models for each Balance or Intelligence request based on your optimization mode" on Teams/Enterprise; a **$0.25/M Cursor Token Rate** applies to eligible third-party requests on Teams/Enterprise. **Plus has no Auto** [S35] | Their catalogue mix + plan margin, per request | Price into the user's own budget; media nodes; cross-agent portability; show why one model beat another |
| **Claude Code** | `/model` aliases `default`/`best`/`fable`/`sonnet`/`opus`/`haiku`/`sonnet[1m]`/`opus[1m]`/`opusplan`; **`opusplan` = opus during plan mode, then sonnet for execution**; fallback model chains + automatic fallback; org allowlists [S36] | Anthropic-only cost/quality trade at one boundary | Two hard-coded nodes only; no media; no cross-vendor; no cost per task |
| **Codex CLI** | Model picker + a bundled `model-selection.md` skill reference that instructs the agent to **fetch official OpenAI docs** and "match the documented model to the user's requested modality, quality, latency, cost, context" — explicitly *prose guidance, not a router* [S37] | Freshness of docs | No computation, no budget, no attempt economics, no media generation models |
| **GitHub Copilot** | "**Auto**" in the model picker, all plans, marketed as "more than just a model picker… one less decision to make"; docs carry a section titled *Discount for using auto model selection* (value not captured in our extraction); a separate **Copilot Fusion** entry can appear instead of Auto [S38] | Default quality + premium-request economics | Opaque choice; no per-node control; no media; no cost-per-outcome reporting |
| **DeepSeek Harness (DSH)** | Composer model picker (provider/model + reasoning effort) with a **plugin-first** architecture — repo tagline "Everything is a Plugin", **283,840★** [S39]. The community has already shipped *picker-UX* plugins (`dsh-model-folders`, `dsh-quick-model-switch`, `dsh-model-block-picker`) — all **0★, created Oct–Nov 2026** [S40] | Manual control + extensibility | Best-in-class *extensibility* with **no recommendation engine**; pickers reorganise the list, they don't choose from it |

**Implication:** the agents have solved *"let me pick"*. Nobody has solved *"tell me what to pick, for this node, at this budget, and prove it later."* DSH's plugin model (and its 283k★ distribution) is simultaneously the biggest opportunity and the biggest risk — `ClawRouter` already shipped a DSH plugin [S14].

---

## 4. Data sources — coverage and the per-node gap

| Source | Coverage verified today | Cost dimension | Gap for per-node decisions |
|---|---|---|---|
| **Artificial Analysis** | Intelligence Index **v5.0.1** = 9 evals (AA-Briefcase v1.1, AutomationBench-AA, Terminal-Bench 4.0, FrontierCode-AA 2.0, AA-Omniscience, GDP.pdf, HLE-Diamond, CritPt v2, Terminal-Bench-Science 0.1); separate **Language / Image / Video / Speech** leaderboards; custom benchmarks; API; **$417/mo per seat** [S41] | **"Cost per Task"** — weighted average USD per Intelligence Index task [S41] | Task ≠ your node; no image/video/3D *per-node* economics joined to text; API is expensive; still no retry/attempt model |
| **BenchLM** | **214 models ranked**, coding / agent / decision / small-model / regional splits, leaderboard history, deprecation feed, cost calculator, `LLM Selector` + `Model Finder` in nav [S42] | Calculator only [S42] | Text-only; selection UI is filter-based; no media; no workflow graph |
| **LMArena** | **Not verifiable today** — `lmarena.ai` returns **HTTP 403** to our fetcher and redirects to `arena.ai/leaderboard/chat/text`, also 403 [S43] | ✗ | Human preference ≠ task success; known style/verbosity biases (widely argued); we make **no** numeric claim about it |
| **Vals AI** | Independent evals on "economically valuable tasks" (finance, legal, science, software); publishes **$ per test** — e.g. Gemini 4 Neon "68.32%, **$4.88/test**" finance, "78.36%, **$6.10/test**" legal, "62.63% at **$8.26/test**" science† [S44] | **$/test** — closest public analogue to $/solved-task | Text/domain benchmarks only; no media; no node mapping; enterprise framing |
| **SWE-bench** | Leaderboards for Verified / Multilingual / Multimodal / Lite / family [S45] | ✗ | Bug-fix shaped; Cursor's own critique: contamination, narrow grading, "not aligned with the coding work developers ask agents to do" [S46] |
| **CursorBench** | Internal eval from real Cursor sessions via **Cursor Blame**; measures correctness, code quality, efficiency, interaction; **CursorBench 3.1**; plots correctness vs median completion tokens [S46] | **Tokens as cost proxy** [S46] | Closed, Cursor-only, no media, no per-node output, no budget model |

**Conclusion for §4:** the market has *quality data* (L4) and *price data* (L1/L2), but the two are never joined at the granularity a workflow actually spends money at. Artificial Analysis is the only source that even names "cost per task", and it is bound to a fixed benchmark suite behind a paid API.

---

## 5. Category deep dives

### 5.1 Routers & gateways — verified metrics (2026-11-19)

| Product | Repo | Stars | License | Last push | Distribution | Note |
|---|---|---|---|---|---|---|
| LiteLLM | `BerriAI/litellm` | **63,518** | MIT core (`NOASSERTION`) | **2026-11-19** | PyPI; npm shim 21,556 dl/mo [S5][S10] | Most mature OSS gateway; cost tracking per key |
| new-api | `QuantumNous/new-api` | **52,204** | AGPL-3.0 | 2026-11-18 | Docker | Billing/quota console; **not** a recommender [S12] |
| claude-code-router | `musistudio/claude-code-router` | **38,226** | MIT | 2026-11-16 | npm **255,377 dl/mo**, v3.1.5 [S9][S10] | Multi-agent control plane; strongest *local* gateway |
| freellmapi | `tashfeenahmed/freellmapi` | **54,830** | MIT | 2026-11-17 | Desktop + Docker + stores [S11] | Free-tier aggregator; signed catalog |
| Portkey | `Portkey-AI/gateway` | 13,414 | MIT | **2026-05-25** | — | Acquired by PANW 2026-05-29 [S6][S7] |
| ClawRouter | `BlockRunAI/ClawRouter` | 6,666 | MIT | 2026-11-18 | Wallet/x402 | Agent-native, benchmarked, DSH plugin [S13][S14] |
| RouteLLM | `lm-sys/RouteLLM` | 5,718 | Apache-2.0 | **2024-08-10** | — | Research artifact; ~2 yrs stale [S20] |
| Switchyard | `NVIDIA-NeMo/Switchyard` | 3,651 | Apache-2.0 | 2026-11-18 | PyPI `nemo-switchyard` | NVIDIA-backed routing *library* [S15] |
| EchoBird | `edison7009/EchoBird` | 3,572 | MIT | 2026-11-19 | Desktop | Onboarding/quota UX [S17] |
| Fuxi | `fuxicodex/Fuxi` | 3,194 | `NOASSERTION` | 2026-10-20 | Binary | Terminal **coding agent** with cost-aware routing — adjacent, not a router product [S18] |
| routesmith | `sidrat2612/routesmith` | **4** | MIT | 2026-05-09 | PyPI | Conceptually closest; negligible adoption [S19] |
| Martian | — | n/a | n/a | n/a | API still answers | Router + pricing pages **404**; home page now a research lab [S22] |
| Not Diamond | `Not-Diamond/notdiamond-python` | 91 | none | **archived** | — | SDK repo archived 2025-12-11 [S21] |
| Standard Compute | — | n/a | n/a | n/a | Hosted | New entrant: **flat from $19/mo**, Claude Code/Codex/Gemini CLI on one key† [S22][S23] |

**Also-ran / name-collision noted honestly:** `ModelPicker` has **no verifiable product** — GitHub search returns only AR/Swift demo apps and a 1★ "curated AI models" page; npm `modelpicker` is unclaimed and `model-picker` is a **44 dl/mo** terminal price/speed/context comparator [S53]. `Fuxi` is a coding agent, not a router. `Lumenfall` and `AIReiter` are real media aggregators (§5.2), not routers.

**What the layer gets right:** keys, failover, spend caps, observability, and (in freellmapi/ClawRouter) catalog freshness as a product. **What it cannot do:** decide *before* the request, price a *node*, or cover media with the same rigour.

### 5.2 Multimodal generation routers/marketplaces

| Product | Catalogue scale (verified) | Model-selection UX | Pricing shape | Gap that matters to us |
|---|---|---|---|---|
| **fal.ai** | **1,342 model doc URLs** crawled; 49 provider namespaces [S24] | `fal.ai/explore`: search by model/task/category, "popular with developers right now", "newly added", Image/Video/World-Models tabs [S25] | Per-output per model + GPU/second; **machine-readable `llms.txt` per model with exact price** [S24] | Trending ≠ right-for-your-brief; no quality-per-dollar ranking, no attempts, no cross-modality budget |
| **Replicate** | "Official models" + collections + community models [S27] | Explore + "**Compare models in the Playground**" [S27] | Hardware-second (A100/H100/L40S…) or per input/output [S26] | Comparison is manual A/B; cost depends on cold-start/idle time; no recommendation |
| **PiAPI** | Midjourney, Flux, Kling 2.5–3.0, Sora 2, Veo 3/3.1, Luma, Hailuo, Wan 2.1–2.6, Seedance, Trellis [S29] | Model list + per-version price expansion | Subscriptions $0/$15/$60/$100 + PAYG credits; $0.50 free [S29] | **Ships a first-party MCP server** (76★) — good integration target, still zero recommendation [S30] |
| **WaveSpeed** | Image + video + LLM endpoints | Price table with discount % per model | $0.019–$0.126/image, $0.02–$0.162/second, LLM $/M tokens [S28] | Pure price surface; no quality or task-fit signal |
| **Venice** | Private/uncensored text + image + video + music | Subscription bundles | $18/mo Pro (annual $216), $68/mo Pro+ with 7,500 credits [S31] | Privacy positioning; selection = "all models", no per-task guidance |
| **Together** | Open-weight inference + "**Together Link**: run open models inside the harness you already use" [S32] | Catalogue + harness integration | Serverless per-token; clusters [S32] | Moving *into* the harness — a distribution competitor, not a decision layer |
| **Lumenfall** | "Unified API for AI image and video generation", OpenAI-compatible base URL [S33] | Model list | Advertises **zero markup / zero fees**, $1 free credit [S33] | Markup-free resale is a commodity; no recommendation |
| **AIReiter** | 80+ models: 42 LLM / 22 image / 18 video / 3 audio (as displayed) [S34] | Browse-by-type catalogue with prices | Early-bird **$10/mo** (normally $20), Plus **$30/mo** (normally $50) [S34] | Subscription resale; no quality data at all |

**The pattern:** media marketplaces are *priced per output and ranked by popularity*. None of them answers "which model for this node, given my brief, my budget, and a 30% retry rate?" — and none publishes solved-task economics. That is a genuine, unfilled column, and it is where `modelpick`'s multimodal catalog (39 models across 5 modalities locally [M2]) actually differentiates.

### 5.3 Agent-native selection — summarised
See §3. The short version: Cursor optimises its pool, Claude Code optimises Anthropic's ladder (with a two-node `opusplan` heuristic), Codex delegates to docs, Copilot abstracts the choice away, DSH exposes a plugin surface. **All five are single-modality (code text) and none reports cost per solved task.**

### 5.4 Benchmark sources — summarised
See §4. Artificial Analysis is the only credible "cost per task" publisher and the only one spanning text/image/video/speech; Vals is the only one publishing `$/test`; CursorBench is the only one built from real agent sessions (and is closed). **None maps a benchmark to a workflow node.**

---

## 6. Top 8 competitors — do well / do not solve / verdict

> Verdict vocabulary: **INTEGRATE** = consume them, don't fight them · **DIFFERENTIATE** = overlap is real, win on the axis they can't copy · **IGNORE** = not a competitive threat in the next 2 quarters.

### 6.1 OpenRouter — the default answer to "which model?"
- **Does well:** 480 live models with modality metadata via a public API [S2]; one key; `openrouter/auto` with no routing fee [S1][S3]; transparent fee model (5.5%/8% on credits, BYOK allowance) [S1]; enormous SDK distribution (**5,732,182 npm dl/mo** for `@openrouter/sdk`) [S10].
- **Does NOT solve:** 96% of its catalogue is text-output (461/480) [S2]; no cost-per-solved-task; no per-node model; no offline catalog; routing is per request and opaque.
- **Verdict: INTEGRATE.** Use `/api/v1/models` as a live price/modality feed (we already cite OpenRouter per-model sources in our catalog [M2]) and deep-link "execute this pick via OpenRouter". Do **not** build a competing gateway — their fee is their business model, ours isn't.
- **Watch:** the pricing page claims "600+ models" while the API returns 480 [S1][S2] — a reminder to timestamp every count we publish.

### 6.2 LiteLLM — the OSS gateway everyone already runs
- **Does well:** 63,518★, MIT core, pushed today [S5]; retry/fallback/load-balance; per-key and per-team cost tracking; the de-facto standard for self-hosted gateways.
- **Does NOT solve:** it tracks *spend*, not *success*; routing strategies are cost/latency/weight-based, not quality-per-node; no media recommendation; config-heavy for a solo dev.
- **Verdict: INTEGRATE (execution target) + DIFFERENTIATE (decision layer).** Ship a documented "modelpick decides → LiteLLM executes" recipe; it makes us credible to platform teams without competing for traffic.

### 6.3 claude-code-router — the local control plane for coding agents
- **Does well:** 38,226★, **255,377 npm dl/mo** [S9][S10]; one local endpoint for 10+ agents (Claude Code, Codex, Grok CLI, Kimi CLI, Kilo Code, OpenCode, Pi, ZCode, WorkBuddy…); credential pools, key rotation, ordered fallbacks, request logs with cost estimates, Fusion vision, MCP tools/ToolHub [S9].
- **Does NOT solve:** routing rules are scenario/agent-level, not workflow-node-level; no per-solved-task economics; no media generation; requires proxying traffic.
- **Verdict: DIFFERENTIATE.** This is the product we will most often be mistaken for. Our counter must be structural, not rhetorical: **no proxy, no key custody, decision artifact + audit trail** (§9).

### 6.4 freellmapi — the free-tier aggregator with the best catalog plumbing
- **Does well:** 54,830★ [S11]; 87 providers / 1,313 free endpoints behind one `/v1`; **signed catalog feed** with a deliberate 30-day freshness tier for free installs and same-day for the $19/yr tier† [S11]; desktop apps on four stores [S11].
- **Does NOT solve:** optimises for *free*, not for *fit*; zero quality signal; no per-node logic; no media recommendation.
- **Verdict: DIFFERENTIATE + partially IGNORE.** Do not compete on free inventory (we would lose and it would corrupt our recommendations). **Steal the mechanism**: a signed, versioned, offline catalog with an explicit staleness contract is exactly what W3 needs — and it validates that users pay for catalog freshness.

### 6.5 ClawRouter — the most dangerous direct competitor
- **Does well:** 6,666★ MIT in 9 months [S13]; Router Core **V3.5**, 15-dimension classifier, <1 ms **local** decisions with an inlined live catalog [S13]; benchmark discipline (frozen 3-arm agent benchmark: 57% vs 49% completion, "**6.4% lower cost per successful task**", 8.9% of a flagship's tokens† ) [S13]; **already shipped `dsh-clawrouter` for DeepSeek Harness** [S14]; x402/USDC payments with no per-call fee† [S13].
- **Does NOT solve:** text-agent-first (image generation is a side doc, no 3D/audio selection economics) [S13]; cost-per-successful-task is a *routing-policy artefact on their own benchmark*, not a user-facing budget tool; crypto wallet is an adoption filter for enterprises; no offline human-readable catalog.
- **Verdict: DIFFERENTIATE, and do it fast.** They own "agent-native router". We must not contest that phrase. We contest **"decision before the request, across five modalities, with a portable catalog"** — and we should assume they will add media next.

### 6.6 Switchyard (NVIDIA NeMo) — the methodological competitor
- **Does well:** Apache-2.0, 3,651★, NVIDIA-backed [S15]; `libsy` Rust core embeddable in a harness, decision protocols documented, gateway integrations, local evaluation demo, tuning loop; and the single best sentence in the market: *"A cheaper model call does not guarantee a cheaper successfully completed task"* — with a documented loop to evaluate the whole agent against a single-model baseline [S15].
- **Does NOT solve:** text/LLM only; no media; no user-facing cost-per-solved-task number; no catalog product; no agent plugin/skill distribution.
- **Verdict: INTEGRATE (method) + DIFFERENTIATE (surface).** Cite their framing, adopt an equivalent baseline-vs-routed evaluation in `modelpick verify`, and be the product that *shows the number* rather than shipping a library to compute it.

### 6.7 fal.ai — the multimodal catalogue with the best machine-readable pricing
- **Does well:** the broadest real coverage we measured (image, video, 3D, audio; 1,342 model doc URLs) [S24]; **exact price per model via `llms.txt`** [S24]; task/category search and trending [S25]; developer trust.
- **Does NOT solve:** no recommendation, no quality-per-dollar, no solved-task economics, no agent-native decision surface; discovery is popularity-driven.
- **Verdict: INTEGRATE.** Our highest-value data partnership: exact, structured, per-model prices we can ingest and cite. "modelpick picks the fal model" is also a co-marketing story fal has no reason to refuse — they monetise any model we recommend.

### 6.8 routesmith — the closest idea, the smallest footprint
- **Does well:** exactly the right instinct — **host-aware**, decomposes one prompt into typed subtasks, routes each step to a capability class, uses host-native model switching, exposes an MCP stdio server (`routesmith.performance`), writes host configs, ships `doctor` [S19].
- **Does NOT solve:** **4★** [S19]; text/coding only; `routing_preference = cost` is a bias knob, not a cost model; no media; no benchmark transparency; no offline catalog.
- **Verdict: DIFFERENTIATE, and study closely.** Their existence proves the thesis and their adoption proves the packaging is wrong. If we ship "host-aware per-step routing" without media and without a cost-per-solved-task number, **we are routesmith with better marketing** — see §9.

**Next tier (not top-8, still monitored):** Requesty (5% fee, MCP gateway, EU residency — enterprise wedge) [S4]; EchoBird (best desktop onboarding) [S17]; Standard Compute ($19 flat, "smart routing + best provider rates", savings calculator claiming $300→$89† ) [S23]; Artificial Analysis ($417/mo seat — data partner, not rival) [S41]; BenchLM (214 models + selection UI — content competitor for "which model" SEO) [S42].

---

## 7. Positioning statement

> **`modelpick` is the model-decision layer for agent workflows.**
> Before you spend, it tells you which model to use at each node — text/coding, image, video, 3D, audio — with the expected **cost per solved task**, not the price per token. It runs as a CLI, an MCP server, and a portable skill, sets up in one command for Claude Code, Codex CLI, Cursor, DeepSeek Harness and Copilot CLI, and **never proxies your traffic or holds your keys**.
> Routers move requests. Marketplaces list models. Benchmarks score suites. `modelpick` answers the question all three leave open: *"for this step, at this budget, what should I run — and what will it cost me per thing that actually works?"*

**Positioning guardrails**
- Say **decision**, never **router** (that word is ClawRouter's and claude-code-router's).
- Say **cost per solved task**, never **cheaper** (cheaper invites the Switchyard rebuttal we agree with).
- Say **five modalities**, never **all models** (OpenRouter owns "all models", and it is 96% text anyway [S2]).
- Say **no proxy**, never **gateway** (gateways are the dependency risk the market just proved [S22]).

---

## 8. Three wedges (defensible because no competitor covers them)

### W1 — "Cost per **solved** task, across **media**."
**Claim:** the only tool that prices an image, a video shot, a 3D asset and a code edit in the same unit — expected dollars per *accepted output*, including retries.
**Why nobody covers it:** the only published "cost per task" is Artificial Analysis's, and it is bound to a fixed text benchmark suite behind a $417/mo API [S41]; the only "cost per successful task" in routing is ClawRouter's own benchmark delta† [S13]; Vals publishes `$/test` on text domains only [S44]; fal/Replicate/WaveSpeed/PiAPI publish `$/image`, `$/second`, `$/run` [S24][S26][S28][S29]. **Zero products price a solved image or a solved 3D asset.**
**Defensibility:** requires a per-modality outcome model (accept rate, retry cost, upscale/regen loops) that gateways don't have and marketplaces are disincentivised to build (they want you to buy more outputs).

### W2 — "Recommend at the **node**, not the request."
**Claim:** a workflow is a graph — plan → code → review, or brief → hero image → variants → video → 3D — and the right model changes per node. `modelpick` recommends per node, with the expected attempt count and a budget check.
**Why nobody covers it:** routers are per-request by construction (they only exist once a request arrives) [S3][S13][S15]; agents are per-session (Cursor Router per request within their pool [S35]; `opusplan` covers exactly two nodes [S36]); marketplaces are per-model [S25][S27]. The closest is routesmith — text-only, 4★ [S19].
**Defensibility:** the node taxonomy + attempt economics. It is a data asset, not a feature flag; copying it requires building the same eval corpus.

### W3 — "Portable, offline, auditable — no proxy, no key custody, five agents, one command."
**Claim:** one command wires `modelpick` into Claude Code, Codex CLI, Cursor, DSH and Copilot CLI; the catalog is versioned and works offline (`catalogVersion 2026.11.19`, `updatedAt 2026-11-19T00:00:00Z` [M2]); every price carries a source URL and read-date; the decision is a file you can diff and audit.
**Why nobody covers it:** every monetised competitor needs your traffic (OpenRouter 5.5–8% [S1], Requesty 5% [S4], ClawRouter per-request [S13]) or your subscription (AIReiter $10–30/mo [S34], Venice $18–68/mo [S31], fal/Replicate per-output [S24][S26]). freellmapi and LiteLLM are the only offline-ish catalogs, and neither recommends [S11][S5]. And the fear is now evidence-backed: seven routers died or pivoted in 2026, including Portkey's acquisition [S22][S7].
**Defensibility:** an incumbent cannot copy this without cannibalising the fee. That is the strongest moat available to us, and the only one that stays true as gateways churn.

---

## 9. "What would make us look like a clone" — and how to avoid it

| Clone signal (what a skeptical dev sees) | Who we'd look like | Why it's fatal | Counter-move (concrete) |
|---|---|---|---|
| We ship a local proxy / "one endpoint for all providers" | claude-code-router, LiteLLM | We lose on maturity (38k★/63k★) and inherit the dependency risk we criticise | **Never** ask for a base-URL swap. `modelpick` emits a decision + snippet; the user's existing client keeps calling providers directly |
| We lead with a leaderboard / "best model" ranking | BenchLM, Artificial Analysis | Commodity; we'd be a worse-funded data site | Rankings are *inputs*, shown only inside a node recommendation with a budget and an attempt estimate |
| Our headline is "free models" or "save X%" | freellmapi, Standard Compute | Race to the bottom; corrupts the quality signal | Lead with **expected cost per solved output**, including the cost of retries — the number that can go *up* |
| We are a cost calculator | Dozens | Calculator = feature, not product | Output must be a **plan**: node → model → expected attempts → budget → fallback, plus a `verify` step that measures reality |
| We say "auto-routing" / "smart routing" | Cursor Router, Copilot Auto, ClawRouter | We'd be claiming a mechanism we deliberately don't implement | Claim **"decide before you spend"**, and show the decision artifact |
| We are a thin skill wrapper around host model switching | routesmith | Proves the space, not the product | Non-negotiable differentiators: **media nodes**, **cost-per-solved-task**, **benchmark transparency**, **offline catalog** — all four, visibly, on the first screen |
| Our catalog has no sources or dates | Everyone vague | Kills trust with the exact audience that checks | Every row carries `sources[]` + `readAt` (already in `catalog/models.json` [M2]); publish a staleness SLA |
| Our demo shows a text-only coding pick | 4 of the 5 layers | We'd look like another coding router | Demo opens with **one brief → image + video + 3D** and their per-solved costs, then the code node |

**Test to run before every launch asset:** if the screenshot could be relabelled "claude-code-router", "BenchLM", or "freellmapi" without looking wrong, it is a clone asset. Rewrite it around a node + a solved-task cost.

---

## 10. Integration & partnership opportunities (concrete, ranked)

### 10.1 Data (make the catalog defensible)
| Partner | What we take | Evidence it exists today | Effort |
|---|---|---|---|
| **fal.ai** | Exact per-model prices + modality from `https://fal.ai/models/<endpoint-id>/llms.txt` [S24] | Explicitly documented pricing method [S24] | Low — already have 1,342 URLs crawled |
| **OpenRouter** | Live 480-model catalog with `architecture.output_modalities` [S2] | Public, no auth [S2] | Low — already a cited source [M2] |
| **models.dev** | Base model metadata/price map | Already cited per-entry in our catalog [M2][S52] | Done |
| **Artificial Analysis** | Cost-per-task + image/video/speech leaderboards; API | API exists, **$417/mo/seat** [S41] | Medium — budget decision; start with public pages + citation |
| **PiAPI** | Media model prices; they already ship MCP [S30] | `apinetwork/piapi-mcp-server` 76★ [S30] | Low |
| **WaveSpeed / Lumenfall / AIReiter** | Price grids ($/image, $/second) [S28][S33][S34] | Public pages | Low |
| **Vals AI** | `$/test` as an external solved-task anchor [S44] | Public | Low |
| **BenchLM** | 214-model ranking + deprecation feed [S42] | Public pages | Low |

### 10.2 Distribution (MCP directories & agent marketplaces)
| Channel | Verified fact | Action |
|---|---|---|
| **Glama MCP registry** | **123,651 servers**, updated 2026-11-19 07:00 [S47] | Submit `modelpick mcp`; largest index and the one users search |
| **Smithery** | Live registry at `smithery.ai` (200 OK) [S48] | Submit; add a one-line install snippet |
| **Claude Code plugins** | Official docs cover publishing + running a marketplace [S49] | Ship the existing `.claude-plugin` [M3] as a published plugin |
| **DeepSeek Harness** | "Everything is a Plugin", **283,840★** [S39]; picker plugins already exist with 0★ [S40] | **Highest-leverage single move**: publish a DSH plugin row now — `ClawRouter` already did [S14] |
| **npm** | `modelpick` is **unpublished** (404) [S50] | Publish before launch; `npx modelpick` is the setup promise |
| **Cursor rules/skills, Codex skills, Copilot CLI plugins** | Hosts already support these surfaces [S35][S37][S38] | Ship the portable skill (already written [M3]) into each |

### 10.3 Commercial / co-marketing
- **fal.ai** — "which fal model for this brief" joint content; they monetise every model we recommend, so incentives align.
- **Together Link** — they are explicitly putting open models "inside the harness you already use" [S32]; a `modelpick` recommendation that lands on Together is complementary, not competing.
- **LiteLLM / claude-code-router** — publish "decide with modelpick, execute with X" recipes. Cheapest credibility available: their users are exactly our users.
- **DSH ecosystem** — plugin + skill + a `dsh-clawrouter`-style integration, racing a competitor that already shipped [S14].
- **Do not** partner with OpenRouter/Requesty/ClawRouter on *routing*; partner on *data ingestion* only.

---

## 11. Threats & watchlist (next 2 quarters)

| Threat | Evidence | Mitigation |
|---|---|---|
| **ClawRouter adds media + a public cost-per-solved-task UI** | Already has image docs, benchmark discipline, DSH plugin, 6.7k★ in 9 months [S13][S14] | Ship W1 (media $/solved) before they do; make it the headline, not a feature |
| **Cursor/Copilot absorb "Auto" into the platform** | Cursor Router per-request with optimisation modes [S35]; Copilot Auto on all plans [S38] | Stay cross-agent; the moment we are one IDE's feature we are dead |
| **Another gateway dies and takes trust with it** | 7 products in 2026 [S22] | W3 ("no proxy") converts their churn into our narrative — but only with an explicit catalog staleness/uptime contract |
| **BenchLM / AA launch per-task selection products** | BenchLM already has `LLM Selector` + `Model Finder` + cost calculator [S42]; AA advertises "personalized model recommendations" [S41] | They will stay text-first and suite-bound; keep media + node + attempts |
| **Our own credibility gap** | 0★, unpublished on npm, repo 404, cost model is modelled not measured [S50][S51][M1] | Publish repo + npm; ship `modelpick verify` so the number becomes measured; publish the methodology and the misses |

---

## 12. Source index (all read 2026-11-19 unless stated)

**Vendor / product**
- [S1] OpenRouter pricing — https://openrouter.ai/pricing
- [S2] OpenRouter models API (480 records counted) — https://openrouter.ai/api/v1/models
- [S3] OpenRouter auto router docs — https://openrouter.ai/docs/guides/routing/routers/auto-router
- [S4] Requesty pricing (5%, 600+, MCP gateway) — https://www.requesty.ai/pricing-new
- [S5] LiteLLM repo (63,518★, MIT core, MCP bridge) — https://github.com/BerriAI/litellm
- [S6] Portkey gateway repo (13,414★, last push 2026-05-25) — https://github.com/Portkey-AI/gateway
- [S7] Palo Alto Networks completes acquisition of Portkey — https://investors.paloaltonetworks.com/news-releases/news-release-details/palo-alto-networks-completes-acquisition-portkey-secure-ai
- [S8] portkey.ai/pricing → 308 → paloaltonetworks.com/ai-security/ai-gateway (observed) — https://portkey.ai/pricing
- [S9] claude-code-router repo (38,226★, MIT) — https://github.com/musistudio/claude-code-router
- [S10] npm download/registry data (measured via api.npmjs.org, 2026-10-19→2026-11-17): `@musistudio/claude-code-router` 255,377; `@openrouter/sdk` 5,732,182; `portkey-ai` 1,163,148; `litellm` 21,556; `model-picker` 44 — https://www.npmjs.com/package/@musistudio/claude-code-router
- [S11] freellmapi repo (54,830★, MIT, 87 providers/1,313 endpoints, $19/yr†) — https://github.com/tashfeenahmed/freellmapi
- [S12] new-api repo (52,204★, AGPL-3.0) — https://github.com/QuantumNous/new-api
- [S13] ClawRouter repo (6,666★, MIT, Router Core V3.5, 15 dimensions, 6.4% claim†) — https://github.com/BlockRunAI/ClawRouter
- [S14] dsh-clawrouter (DSH plugin) — https://github.com/BlockRunAI/dsh-clawrouter
- [S15] Switchyard repo (3,651★, Apache-2.0, libsy, tuning loop) — https://github.com/NVIDIA-NeMo/Switchyard
- [S17] EchoBird repo (3,572★, MIT) — https://github.com/edison7009/EchoBird
- [S18] Fuxi repo (3,194★, coding agent with cost-aware routing) — https://github.com/fuxicodex/Fuxi
- [S19] routesmith repo (4★, MIT, MCP stdio, host-aware) — https://github.com/sidrat2612/routesmith
- [S20] RouteLLM repo (5,718★, Apache-2.0, last push 2024-08-10) — https://github.com/lm-sys/RouteLLM
- [S21] Not Diamond SDK repo — archived — https://github.com/Not-Diamond/notdiamond-python
- [S22] "Discontinued AI Gateways 2026" (Roo/OpenPipe/Unify/TensorZero/Glama/Martian dates; Portkey close 2026-05-29) — https://standardcompute.com/alternatives/discontinued-ai-gateways
- [S23] Standard Compute (flat $19†, savings calculator) — https://standardcompute.com/
- [S24] fal pricing + per-model `llms.txt` (1,342 model doc URLs crawled) — https://fal.ai/pricing
- [S25] fal explore / model gallery UX — https://fal.ai/explore
- [S26] Replicate pricing (hardware-second vs input/output) — https://replicate.com/pricing
- [S27] Replicate explore ("Compare models in the Playground") — https://replicate.com/explore
- [S28] WaveSpeed pricing ($/image, $/second, $/M tokens) — https://wavespeed.ai/pricing
- [S29] PiAPI pricing (subscriptions + PAYG credits) — https://piapi.ai/pricing
- [S30] PiAPI MCP server (76★) — https://github.com/apinetwork/piapi-mcp-server
- [S31] Venice pricing ($18/$68 per month) — https://venice.ai/pricing
- [S32] Together Link ("run open models inside the harness you already use") — https://www.together.ai/link
- [S33] Lumenfall (unified image/video API, zero-markup claim†, $1 credit) — https://lumenfall.ai/pricing
- [S34] AIReiter (80+ models; $10/$30 early-bird†) — https://aireiter.com
- [S35] Cursor models & pricing (X Subscription, Cursor Router, $0.25/M token rate) — https://cursor.com/docs/models-and-pricing
- [S36] Claude Code model configuration (aliases, `opusplan`, fallback chains) — https://code.claude.com/docs/en/model-config
- [S37] Codex model-selection reference (fetch official docs; no router) — https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/openai-docs/references/model-selection.md
- [S38] GitHub Copilot auto model selection (Auto in picker; discount section; Fusion) — https://docs.github.com/en/copilot/concepts/auto-model-selection
- [S39] DeepSeek Harness repo (283,840★, "Everything is a Plugin") — https://github.com/deepseek-ai/deepseek-harness
- [S40] DSH picker plugins (all 0★, Oct–Nov 2026) — https://github.com/peter9130/dsh-model-folders · https://github.com/caidows/dsh-quick-model-switch · https://github.com/liu19666/dsh-model-block-picker

**Data / benchmarks**
- [S41] Artificial Analysis (Intelligence Index v5.0.1; Cost per Task; Language/Image/Video/Speech; $417/mo/seat) — https://artificialanalysis.ai/ · https://artificialanalysis.ai/pricing
- [S42] BenchLM (214 models; coding/agent/decision; cost calculator; LLM Selector/Model Finder) — https://benchlm.ai/
- [S43] LMArena — **HTTP 403 to our fetcher**, redirects to arena.ai/leaderboard/chat/text (also 403); no coverage claim made — https://lmarena.ai/leaderboard/text
- [S44] Vals AI ($/test figures†) — https://www.vals.ai/
- [S45] SWE-bench leaderboards — https://www.swebench.com/
- [S46] CursorBench (real sessions via Cursor Blame; CursorBench 3.1; correctness vs tokens; critique of public benchmarks) — https://cursor.com/blog/cursorbench

**Distribution**
- [S47] Glama MCP registry — 123,651 servers, updated 2026-11-19 07:00 — https://glama.ai/mcp/servers
- [S48] Smithery (200 OK) — https://www.smithery.ai/
- [S49] Claude Code plugins overview (publish / run a marketplace) — https://code.claude.com/docs/en/plugins
- [S50] npm registry `modelpick` → 404 (measured) — https://registry.npmjs.org/modelpick
- [S51] GitHub `Leizhidong-creator/modelpick` → 404 unauthenticated (measured) — https://github.com/Leizhidong-creator/modelpick
- [S52] models.dev API (catalog source) — https://models.dev/api.json
- [S53] npm `model-picker` v0.1.1, 44 dl/mo (name collision) — https://www.npmjs.com/package/model-picker

**Local artifacts (this workspace)**
- [M1] `modelpick/src/core/score.js` — `costPerTask = unitCost × attempts`; in-code comment "This is a model, not a measurement"
- [M2] `modelpick/catalog/models.json` — `catalogVersion 2026.11.19`, `updatedAt 2026-11-19T00:00:00Z`, 39 models across text(23)/audio(5)/image(4)/3d(3)/video(4), per-entry `sources[]` with `readAt`
- [M3] `modelpick/src/integrations/index.js` — claude-code (plugin + MCP), codex (MCP + skill), cursor (MCP + rules + skill), dsh (skill + MCP plugin row), copilot (MCP + skill), generic (AGENTS.md); `.claude-plugin/` present in repo

---

## 13. Claims we could not verify (stated so nobody repeats them as fact)

| Claim | Status |
|---|---|
| LMArena's current category coverage (text/vision/image/video/webdev) | **Blocked** (HTTP 403 on 2026-11-19). Do not assert specifics |
| Martian's current product state beyond "gateway answers, router/pricing pages 404" | Only the third-party audit [S22] plus the 404s; no first-party notice |
| Not Diamond's company status | Only signal: SDK repo archived 2025-12-11 [S21]; no first-party statement found |
| Copilot Auto's discount percentage | Docs contain the section; value not captured in extraction [S38] |
| LiteLLM enterprise pricing | Not published on the pages read [S5] |
| "`modelpick` has N stars / downloads" | **0 / 0** — repo 404, npm 404 [S50][S51]. Do not cite any other number |
| Any router's savings percentage | All are †self-reported on vendor benchmarks; none reproduce on a neutral workload |

**Recommended refresh cadence:** re-run §5.1's table weekly (stars/pushes move fast — freellmapi went from 0 to 54.8k★ in 7 months); re-run pricing monthly; re-check the discontinuity list [S22] monthly, because gateways dying is now a routine event rather than an exception.
