# 14-day launch plan

**D1 = Tuesday 2026-11-24.** Full channel plan: [`GROWTH.md`](GROWTH.md). Times are dual: Asia/Shanghai (CST) / US Pacific (PT). One person, zero budget. The goal is not a spike; it is 100+ weekly active installs that produce a recommendation.

## Before D1 (D-3 → D-1)

- [ ] Repo public, description + 20 topics set, social preview uploaded.
- [ ] README above the fold: one-liner, install, terminal image, benchmark, agents.
- [ ] `npx -y github:Leizhidong-creator/modelpick` tested on a clean Windows + macOS + Linux shell.
- [ ] GitHub release `v0.1.0` with the changelog.
- [ ] 4 issue templates, 4 discussion categories, 8 good-first-issues.
- [ ] Landing page deployed to GitHub Pages.
- [ ] X profile + cold-start checklist done (`launch/x-cold-start.md`); Product Hunt draft saved.
- [ ] 20 developers in a DM list (not for vote asks — for feedback).

## Week 1

### D1 — Tuesday: GitHub + X + Show HN
- 08:00 CST / 16:00 PT Mon: publish release, pin repo.
- 23:00 CST / 07:00 PT: **Show HN** (`launch/show-hn.md`). Post the first comment immediately.
- 23:20 CST / 07:20 PT: **X thread EN** (`launch/x-thread-en.md`), quote-post post 1 with `terminal-pick.png`.
- 00:00 CST / 08:00 PT: **X thread CN** (`launch/x-thread-cn.md`).
- 09:00–12:00 PT: reply to every HN comment with a concrete number or a repo link.
- Success signal: HN front page (top 30) or 100+ repo visits from HN.

### D2 — Wednesday: Product Hunt
- 00:01 PT / 16:01 CST: launch (`launch/product-hunt.md`), self-hunted.
- 06:00–10:00 PT: maker comments every 90 minutes; answer with data, not thanks.
- Cross-post the PH link in the X thread as a reply, not a new thread.
- Success signal: top 10 of the day; 100+ PH visits.

### D3 — Thursday: Claude Code + Cursor surfaces
- Publish the Claude plugin marketplace install in the README and in a short X post:
  `/plugin marketplace add Leizhidong-creator/modelpick`.
- Add a Cursor deeplink to the landing page.
- Post in r/ClaudeAI (`launch/reddit.md`), disclose authorship.
- Success signal: 50+ `setup claude-code` runs (ask users to paste `modelpick doctor` in an issue).

### D4 — Friday: the counterexample post
- Publish a blog/X post: "Three cases where the cheaper model was wrong."
- Include real benchmark failures or a user counterexample.
- This is the trust-building post; it is more shareable than another launch announcement.
- Success signal: 20+ reposts, 5+ substantive replies.

### D5 — Saturday: open-weight audience
- r/LocalLLaMA post (`launch/reddit.md`), focused on `--open-weights` and self-host cost.
- Publish [`docs/SELF_HOST.md`](../docs/SELF_HOST.md); ask for a GPU-hour cost formula in the thread.
- Success signal: 30+ open-weight runs.

### D6 — Sunday: rest + reply backlog
- No new posts. Answer every issue and DM.
- Merge one community PR if it is safe.
- Write the week-1 numbers into `launch/metrics.md` (stars, clones, installs, issues).

### D7 — Monday: directory day
- Submit to MCP Registry (if npm published), Glama, mcp.so, Smithery, PulseMCP, awesome-mcp-servers, awesome-claude-code.
- Each listing: one-liner + install command + benchmark image.
- Success signal: 4+ listings live.

## Week 2

### D8 — Tuesday: Chinese developer channels
- Juejin article (Chinese, technical): "为什么 token 单价不是成本".
- Zhihu answer to "AI Agent 如何选择模型".
- Xiaohongshu: 6-slide visual, not a link dump.
- Success signal: 500+ reads, 20+ repo visits.

### D9 — Wednesday: provider outreach
- Send the partner one-pager (`launch/partner-onepager.md`) to fal, OpenRouter, Tripo, Tencent Hunyuan, Moonshot, Zhipu, MiniMax.
- Ask for: catalog correction, a credit grant for a live smoke test, a listing, or a co-authored benchmark.
- Success signal: 2 replies, 1 catalog correction.

### D10 — Thursday: integration week
- Ship one adapter requested by users (Windsurf/Devin, Cline, Zed, or VS Code).
- Publish a 60-second screen recording: install → ask agent → recommendation.
- Success signal: 20+ new `setup` runs.

### D11 — Friday: benchmark v2
- Add 10 community-submitted scenarios.
- Publish the new table with the old one side by side.
- Success signal: 5+ external scenarios.

### D12 — Saturday: user stories
- Ask 3 users for a one-paragraph workflow + number.
- Publish "what people route" with permission; no fake testimonials.
- Success signal: 3 stories.

### D13 — Sunday: newsletter pitches
- Pitch 5 newsletters (TLDR AI, Ben's Bites, Import AI, Console, Latent Space).
- Subject: "The 53× token gap is a 23-point quality gap — here is the per-task math".
- Success signal: 1 opens.

### D14 — Monday: retro + next release
- Publish `launch/metrics.md` and a public retro.
- Ship v0.1.1 with the top 3 fixes.
- Decide: continue the current wedge or pivot to the strongest pull channel.

## What not to do

- Do not buy stars, join vote rings, or ask for upvotes. It violates GitHub's AUP and the ICSE'26 fake-star study finds the effect decays in under two months.
- Do not post the same link to five subreddits in one day.
- Do not claim measured pass@1 or "beats GPT" without a live benchmark.
- Do not launch on a US holiday or a Friday afternoon.
- Do not optimize for stars if installs are flat; fix the first-run experience instead.

## Metrics to record daily

| Metric | Source |
|---|---|
| Stars / forks / watchers | GitHub API |
| Clones / views (14-day window) | GitHub traffic API |
| `npx` installs | npm downloads (once published) or GitHub release asset counts |
| `setup` completions | issue template + user reports |
| MCP tool calls | none (no telemetry); ask via discussion |
| Issues / discussions | GitHub |
| Referrers | GitHub traffic |

The only north-star metric: **weekly active installs that produce at least one recommendation**. Everything else is a proxy.
