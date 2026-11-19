# Growth without spam

The goal is not “a lot of emails”. The goal is **qualified installs and retained users**. Mass unsolicited email is the fastest way to burn the domain, the X account, and the repo's reputation before the product has a chance.

This page is the operating plan for the channels that can actually work from a new account.

## The funnel

```
impression
  → profile / repo visit
  → README above the fold
  → install (npx github or tarball)
  → first correct pick
  → star / issue / eval file
```

Every asset should answer one of these:

1. **What is it?** A model router for coding agents.
2. **Why now?** One frontier model for every node is the expensive default.
3. **Proof?** 40 models, 20 nodes, cost per solved task, 150 tests, visible limits.
4. **Try?** One command, no key required to get a recommendation.
5. **Star?** If it saves one wrong model choice, star the repo.

## Copy teardown

Read [`COPY-TEARDOWN.md`](COPY-TEARDOWN.md) before writing another post. It has the hook patterns, thread skeleton, YouTube titles, and the phrases to delete.

## X: reply-first, not broadcast-first

A new account with 0 followers has no distribution. The first 100 impressions come from replies to people already discussing the problem.

### Profile

- Name: `Zhidong Lei · ModelPick`
- Bio: `Building ModelPick — the model router for coding agents. Best value at every node, priced per solved task. Open source.`
- Pinned: the 93s video, not a promo.
- Remove unrelated promo posts.

### Daily loop (30–45 min)

1. Find 5 posts about Claude Code / Codex costs, model routing, eval methodology, or agent benchmarks.
2. Reply with one concrete number or counterexample. No link.
3. Quote-post one post with a chart or the cost formula.
4. Post one build-in-public observation, not a feature announcement.

### Three post formats that travel

| Format | Hook | Why it works |
|---|---|---|
| Cost teardown | “The $0.64 support ticket” | A number people can quote |
| Methodology | “4/5 is not 80%” | Teaches something; invites disagreement |
| Build log | “I removed a model from the catalog” | Shows judgment, not just output |

Use the 15–30s vertical clips in `launch/shorts/` as native video. Do not post a bare link.

## YouTube

YouTube is a search engine, not a feed. The 93s video is a trailer; it is not a YouTube strategy by itself.

### Three formats

1. **Shorts (15–30s)** — one number, one visual, one CTA. Use the four clips in `launch/shorts/`.
2. **Demo (5–8 min)** — install, pick, fallback, `eval`, and a wrong recommendation corrected live.
3. **Build/benchmark (15–25 min)** — how the catalog, cost model, and adversarial tests work.

### Titles that match search intent

- `I stopped using one model for every coding task`
- `Cost per solved task: the metric most AI routers get wrong`
- `Claude Code + Codex + Cursor: one MCP router for all of them`
- `I tested 40 models on 20 agent tasks — here is what broke`

### First 30 seconds

1. Show the bad default: one frontier model for a thumbnail and a refactor.
2. Show the CLI output with a real cost.
3. Say what the viewer will learn, not “in this video I will”.

### Description

```
ModelPick is an open-source model router for coding agents.
It picks the best value at each node and prices it in cost per solved task.

Repo: https://github.com/Leizhidong-creator/modelpick
Demo: https://leizhidong-creator.github.io/modelpick/#video
No npm required: npx -y github:Leizhidong-creator/modelpick pick "your task"
```

## GitHub: the highest-intent channel

### Conversion

- README first screen: one-liner, install, real output, video, limits.
- Topics: `mcp`, `llm`, `model-routing`, `cost-optimization`, `coding-agents`, `claude-code`, `codex`, `deepseek`.
- Social preview: `assets/social-preview.png`.
- A star CTA after the value, not before it.
- `good first issue` labels for adapters, task nodes, and eval fixtures.
- Release notes that state what is *not* ready.

### Discovery, without spam

Use GitHub search and public issues to find **problems**, not email lists:

```text
"model routing" in:title,body is:issue is:open
"cost per task" in:title,body
"claude code router" in:name,description
"mcp" "model" in:name,description stars:>100
```

Reply only where you can add a design or a counterexample. Never paste the same promo into 20 issues.

### Targets (public projects, not harvested emails)

| Project | Why relevant | Contribution angle |
|---|---|---|
| `musistudio/claude-code-router` | Large router/gateway audience | Complementary: gateway routes traffic; ModelPick returns the decision and the key |
| `ryoppippi/ccusage` | Token/cost tracking | Cost per solved task vs raw spend |
| `AgentOps-AI/agentops` | Agent observability/evals | Export a ModelPick decision receipt into a trace |
| `inferock/inferock-bench` | Inference benchmarking | Compare routing regret, not only latency |
| `sst/opencode` | Coding agent | MCP/skill adapter |
| `openai/codex` | Coding agent | Codex config writer already shipped |
| `anthropics/claude-code` | Coding agent | Claude plugin + MCP |
| `cline/cline`, `continuedev/continue`, `block/goose` | Agent clients | Adapter/issue with a reproducible setup |
| `punkpeye/awesome-mcp-servers` | Discovery | Submit only after the README, license, and install are stable |
| `modelcontextprotocol/servers` | MCP ecosystem | Reference-quality stdio server + tests |

The right first move is a **small integration PR or a reproducible bug report**, not a “please try my product” comment.

## Hacker News

Use `launch/show-hn.md`. Rules:

- Title: concrete, no superlatives.
- First comment: what it is, what is measured, what is not.
- Answer every technical objection with a number or a file.
- Do not ask for upvotes.
- Post on a weekday morning US time; be present for 4 hours.

## Reddit

- `r/LocalLLaMA`: open weights, self-host, GPU-hour cost.
- `r/ClaudeAI`: Claude Code cost and fallback.
- `r/codex` / `r/ChatGPTCoding`: workflow, not promotion.
- Read each subreddit's self-promotion rules; ask mods when unsure.

## Product Hunt

Use `launch/product-hunt.md`. The first comment should be the honest limits, not a feature list. Ask for a counterexample, not a five-star review.

## Email: targeted, permission-based, capped

Do **not** scrape GitHub emails and blast them. That is spam, it violates GitHub's terms and privacy law in many jurisdictions, and it destroys deliverability.

If you have a legitimate reason to email:

- one person per email, researched;
- a specific sentence about their repo or post;
- one ask, no attachment, no tracking pixel;
- a working unsubscribe line;
- maximum 20–30 per week;
- stop after one follow-up.

Template:

```text
Subject: cost per solved task for <their project>

Hi <name> — I saw <specific issue/post> about routing <task>.
I built an open-source router that returns one model with cost per solved task
and the exact key/env setup, plus a key-aware fallback.

Would a 5-minute test on one of your tasks be useful? If not, no follow-up.

— Zhidong
https://github.com/Leizhidong-creator/modelpick
```

No mass BCC. No “Dear developer”. No fake “I loved your project”.

## 30-day cadence

| Week | X | YouTube | GitHub | Community |
|---|---|---|---|---|
| 1 | 10 replies/day; profile fix; 2 build posts | Publish 4 Shorts | Topics, social preview, 3 good first issues | 3 design-partner conversations |
| 2 | Cost teardown + eval thread | 6–8 min demo | 2 integration PRs | Show HN draft; 2 subreddits |
| 3 | Launch thread; quote-post users | Benchmark video | Release notes; eval fixture from a user | Product Hunt prep |
| 4 | Recap + counterexamples | Short from best reply | Merge one community PR | PH launch; newsletter pitches |

## Metrics

- profile → repo click-through
- repo → install command copy / release download
- first successful `pick` (issue or reply)
- eval files submitted
- issues with a reproducible task
- stars (lagging, not the goal)

Kill criteria for a channel: 20 qualified touches, 0 replies, 0 installs → change the hook, not the volume.

## What is not allowed

- buying followers, stars, upvotes, or reviews
- mass DMs or mass email
- scraping personal emails from GitHub
- fake benchmark claims or fake users
- posting the same copy across communities
- asking for stars before showing the output

## Sources worth reading

- [Cogentrex launch playbook: 0 → 10K stars](https://github.com/levalencia/cogentrex/blob/main/docs/history/LAUNCH-PLAYBOOK.md)
- [Open-source launch marketing system](https://github.com/Gingiris-1031/gingiris-opensource)
- [How to launch on Hacker News](https://s2p.dev/blog/how-to-launch-on-hacker-news)
- [Launch-day diffusion: HN impact on GitHub stars](https://arxiv.org/abs/2511.04453)
- [Announcing a launch on X with a small following](https://shipx.live/blog/announce-your-launch-on-x-2026)
