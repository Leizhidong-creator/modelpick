# Launch kit

Everything needed to launch ModelPick without inventing claims. The full research and channel analysis is in [`../research/launch-strategy.md`](../research/launch-strategy.md).

## The one-sentence pitch

**ModelPick is the model router for AI agents: one MCP call picks the best model for each workflow node — coding, image, video, 3D, audio — and prices it in cost per solved task, not tokens.**

## The three proof points

1. **A real number, not a vibe.** A coding task can be 48× cheaper per token and 27 quality points worse. ModelPick shows both sides and the cost per *solved* task.
2. **Multimodal.** No other router in this lane covers image, video, 3D, and audio with capability filters (text-in-image, rigging, 30s takes, lip sync).
3. **Installs where the agent lives.** Zero-dependency CLI, stdio MCP, portable `SKILL.md`, Claude Code plugin, setup for Codex/Cursor/DSH/Copilot.

## Assets

| Asset | Path |
|---|---|
| Social preview 1280×640 | `../assets/social-preview.png` |
| Terminal: 3D pick | `../assets/terminal-pick.png` |
| Terminal: launch-video plan | `../assets/terminal-plan.png` |
| Benchmark chart | `../assets/benchmark.png` |
| Quality vs cost | `../assets/cost-quality.png` |
| Architecture | `../assets/architecture.png` |
| Intro film (93s, English VO) | `../assets/modelpick-intro.mp4` |
| Film poster | `../assets/modelpick-intro-thumb.png` |
| Film captions | `../assets/modelpick-intro.srt` |
| Film script & storyboard | [`video-storyboard.md`](video-storyboard.md) |
| Landing page | `../docs/index.html` |

## Drafts

- [`x-thread-en.md`](x-thread-en.md)
- [`x-thread-cn.md`](x-thread-cn.md)
- [`show-hn.md`](show-hn.md)
- [`product-hunt.md`](product-hunt.md)
- [`reddit.md`](reddit.md)
- [`14-day-plan.md`](14-day-plan.md)
- [`partner-onepager.md`](partner-onepager.md)

## Guardrails

- Do **not** claim measured pass@1 or live model-output results. The benchmark is a decision benchmark; say so.
- Do **not** claim npm availability. Install is from GitHub until the package is published.
- Do **not** buy stars, join vote rings, or ask for upvotes. GitHub's Acceptable Use Policies prohibit it; the ICSE'26 study on fake stars finds a short-term bump followed by a credibility penalty.
- Do **not** post the same link to five subreddits on the same day. Stagger, disclose that you are the author, and answer every technical question.
- Do **not** use "excited to announce". Lead with the number or the result.

## Success metrics

Stars are a lagging indicator. Track:

| Metric | Target (14 days) |
|---|---|
| GitHub stars | 500+ (stretch 1,500) |
| `npx` / clone installs | 300+ |
| Weekly active installs producing a recommendation | 100+ |
| MCP setup completions (`setup` output) | 150+ |
| Qualified issues / discussions | 20+ |
| Directory listings live | 4+ |

If stars grow but installs do not, fix onboarding, not promotion.
