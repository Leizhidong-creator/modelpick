# Copy teardown: what travels on X and YouTube

The product is not the hard part now. The hard part is making a stranger stop for 1.5 seconds, understand the problem, and click.

This is a teardown of patterns that consistently work for developer tools — and the patterns that make a launch read like AI-generated sludge.

## The one sentence test

A good post survives this test:

> Remove the product name. Is the sentence still interesting?

Bad:

> Introducing ModelPick, the ultimate AI model router for the agent era.

Good:

> Your agent uses a $15/M-token model to make a $0.14 thumbnail.

The second sentence is interesting without the name. That is the hook.

## X: eight hook patterns

| Pattern | Template | ModelPick version |
|---|---|---|
| Specific waste | `You are using <expensive thing> for <cheap task>.` | Your agent uses a frontier model to draft a $0.14 thumbnail. |
| Number shock | `<cheap> is <N>x cheaper — and <M> points worse.` | The cheap model is 53× cheaper and 23.5 quality points worse. The interesting row is the one in between. |
| Contrarian | `Everyone optimizes <wrong metric>. The bill lives in <right metric>.` | Everyone optimizes price per token. The bill lives in attempts-to-pass. |
| Build log | `I removed <thing> from <product>. Here is what broke.` | I removed Mistral Large 4 from the catalog. It had zero eligible tasks. |
| Before/after | `Before: <ugly default>. After: <one command>.` | Before: one model for everything. After: one pick per node, with the key. |
| Receipt | `I measured <N> runs. <uncomfortable result>.` | I measured 115 dev runs. A 4/5 pass rate is not 80% reliable — here is the interval. |
| Demo | `"<natural user request>" → <one output>.` | "3D sword for a Unity game" → Tripo H3.1, quality 94, $0.21 per usable asset. |
| Honest limit | `This does not do <thing>. Here is what it does.` | It is not a gateway. It does not proxy traffic. It returns a decision and the key. |

### Thread skeleton

1. **Hook + media** — one sentence, one number or screenshot.
2. **The wrong default** — why the obvious approach costs too much.
3. **The mechanism** — cost = tokens × price × attempts; one formula.
4. **Proof** — a table, a real cost, a failure.
5. **Demo** — one command, one output.
6. **Limits** — the thing you did not measure.
7. **CTA** — one link, one question.

Do not put a link in post 1. Do not use 12 posts when 7 will do.

### The first line is 80% of the post

Bad first lines:

- “I’m excited to announce…”
- “Introducing…”
- “In today’s fast-moving AI landscape…”
- “We’re thrilled to share…”
- “After months of hard work…”

Good first lines:

- “Your agent uses a $15/M-token model to make a $0.14 thumbnail.”
- “The cheapest model was 53× cheaper and 23.5 points worse.”
- “I removed a model from my catalog today. It had zero eligible tasks.”
- “A 4/5 pass rate is not 80% reliable.”

### Quote-post strategy

Do not quote-post your own thread immediately. Quote-post a **user complaint** and add the number:

> “This is why my Claude bill exploded.”
>
> The token price did not change. The attempts did.
>
> One model, 1.8 attempts, is more expensive per finished task than a 40% pricier model at 1.05.

Then link the thread in a reply, not the quote itself.

## YouTube: title, thumbnail, first 30 seconds

### Titles that match search intent

- `I stopped using one model for every coding task`
- `The AI routing metric nobody shows you`
- `I tested 40 models on 20 agent tasks`
- `Claude Code + Codex + Cursor: one MCP server`
- `Cost per solved task, explained with real numbers`

Avoid:

- `Introducing ModelPick — The Future of AI`
- `Revolutionary AI Model Router 2026`
- `You Won't Believe What This AI Does`

### Thumbnail

- 3–5 words maximum.
- One number, large: `$0.64` or `53×`.
- One UI screenshot, not a stock robot.
- No face unless the face is the brand.
- High contrast; readable at 320px wide.

### First 30 seconds

1. **0–3s:** the bad default, on screen. “This is a $15 model making a $0.14 thumbnail.”
2. **3–10s:** the number that proves it. “The token price is not the bill.”
3. **10–20s:** what the viewer will learn. “I’ll show you the metric, the fallback, and where it breaks.”
4. **20–30s:** the demo, not the logo.

Do not open with a 10-second logo animation.

### Description template

```
<One sentence: what this is.>

<One sentence: what the viewer will learn.>

Repo: https://github.com/Leizhidong-creator/modelpick
Demo: https://leizhidong-creator.github.io/modelpick/
No npm: npx -y github:Leizhidong-creator/modelpick pick "your task"

Chapters:
00:00 The expensive default
00:45 The metric
02:10 The demo
05:30 Where it breaks
```

## What not to write

- “game-changer”, “revolutionary”, “seamless”, “unlock”, “supercharge”
- a feature list without a number
- “AI-powered” as a benefit
- fake urgency (“only 24 hours”)
- “we’re humbled”
- engagement bait (“comment YES”)
- a link with no context
- the same copy on X, LinkedIn, Reddit, and HN

## Rewrite drill

Take any sentence and cut it by 30%. Then replace one adjective with a number.

Before:

> ModelPick is a powerful and flexible solution that helps developers seamlessly optimize their AI model selection across a wide range of tasks.

After:

> ModelPick returns one model per node, with cost per solved task and the env var to call it.

Before:

> We are excited to announce our open-source launch.

After:

> 40 models, 20 nodes, 150 tests. One command.

## Sources

- [Launch playbook: 0 → 10K stars](https://github.com/levalencia/cogentrex/blob/main/docs/history/LAUNCH-PLAYBOOK.md)
- [Open-source launch marketing](https://github.com/Gingiris-1031/gingiris-opensource)
- [How to launch on Hacker News](https://s2p.dev/blog/how-to-launch-on-hacker-news)
- [Announcing a launch on X with a small following](https://shipx.live/blog/announce-your-launch-on-x-2026)
