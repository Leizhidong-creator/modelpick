# X cold start — @DurgaraoGa51557

The account in the screenshot is new: 0 followers, one promo post. A launch thread alone will not reach anyone. The first week is **reply-first**, not broadcast-first.

I cannot post from this machine because there is no X login or API token. Below is the exact material to paste, plus a cadence that does not depend on buying followers or engagement.

## 1. Fix the profile before posting

**Display name:** `Zhidong Lei · ModelPick`

**Bio:**

> Building ModelPick — the model router for coding agents. Pick the best value at every node, price it per solved task. Open source.

**Location:** `Remote`

**Website:** `https://leizhidong-creator.github.io/modelpick/`

**Pinned post** (after the first thread):

> Your agent does not need one frontier model for everything.
>
> ModelPick picks the best value at each node — coding, image, video, 3D, audio — and shows the real cost per solved task.
>
> 93s demo, English + 中文 captions:
> https://leizhidong-creator.github.io/modelpick/#video

**Banner:** `assets/social-preview.png` (1280×640). Do not use a stock AI image.

Remove or unpin the `veryessentials.com` promo before launch. It signals a different account and costs trust.

## 2. First 3 days: replies, not posts

Do **10 substantive replies/day** to people already talking about:

- Claude Code / Codex costs
- model routing and gateways
- “which model should I use for X?”
- context-window pricing surprises
- agent benchmarks and evals

Rules:

- Reply to the argument, not the product.
- No link in the first reply.
- Add a concrete number or a counterexample.
- Only link ModelPick when someone asks what you are building.

**Reply template A — cost:**

> The token price is the wrong denominator. A model that needs 1.8 attempts can be cheaper per token and more expensive per finished task. I price routing in cost per solved task, including retry probability.

**Reply template B — routing:**

> Most “routers” only look at the prompt. The expensive decisions are per node: a 3D asset, a thumbnail, a 200k-token refactor, and a TTS line do not share a quality/cost frontier.

**Reply template C — benchmarks:**

> A 4/5 pass rate is not 80% reliable. At n=5 the Wilson interval is roughly 38–96%. I report intervals and held-out runs so a five-run difference does not become a ranking claim.

**Reply template D — keys:**

> The best model you cannot call is not a recommendation. Key-aware fallback is part of the router, not an error state.

Do not reply with the same text repeatedly. Vary it or it reads as spam.

## 3. Day 1 thread — build in public

Post one thread, not a link dump. Attach the 93s video to the first post.

**1/**

> I kept watching coding agents use the same frontier model for a $0.02 thumbnail and a 200k-token refactor.
>
> So I built ModelPick: pick the best value at each node, price it in cost per solved task.
>
> 93s demo:

**2/**

> “Cheapest” is not the goal. The value pick is the cheapest model within 8 quality points of the best eligible model. In simulation it keeps 95.4% of frontier first-pass quality at 41.6% of the cost.

**3/**

> Cost per solved task = raw cost × expected attempts.
>
> A model that fails 20% of the time is not 20% cheaper. It is 1/(1−0.2) = 1.25 attempts, before retry caps.

**4/**

> It is not a leaderboard. It returns:
> - one model
> - expected attempts
> - cost per solved task
> - the exact env var and endpoint
> - the best model you already have a key for
>
> 40 models, 20 nodes, 5 modalities.

**5/**

> Works with Claude Code, Codex, Cursor, DeepSeek Harness, Copilot, and VS Code.
>
> One command writes the MCP config, backs up the existing file, and keeps sibling servers.
>
> No gateway. No key storage. MIT.

**6/**

> Try it without npm:
>
> `npx -y github:Leizhidong-creator/modelpick pick "3D sword for Unity"`
>
> Repo: https://github.com/Leizhidong-creator/modelpick
>
> If the pick is wrong for your workload, `modelpick eval` takes your own pass/fail runs and reports Wilson intervals. Tell me what it gets wrong.

## 4. Day 2–7 cadence

| Day | Post | Goal |
|---|---|---|
| 1 | Build thread + video | Explain the problem, not the feature list |
| 2 | “The $0.64 ticket” cost teardown | One concrete number people can quote |
| 3 | “4/5 is not 80%” eval thread | Teach, don’t sell |
| 4 | Launch thread + pinned | Ask for a counterexample |
| 5 | Reply-only day | 15 replies, no posts |
| 6 | “What I got wrong” post | Show a failed benchmark case |
| 7 | Recap + ask for one design partner | Convert attention into a conversation |

Post between **09:00–11:00** or **20:00–22:00** Asia/Shanghai. Do not post the same thread twice in a day.

## 5. Launch thread (day 4)

Use `launch/x-thread-en.md` and `launch/x-thread-cn.md`. Add one line at the end:

> I am looking for 5 coding-agent teams to run `modelpick eval` on their own tasks. If the router is wrong, I will publish the counterexample.

That is a stronger ask than “please star”.

## 6. What not to do

- Do not buy followers, reposts, or replies.
- Do not mass-DM the same text.
- Do not reply with a link on the first touch.
- Do not claim “independent benchmark”; the current labels are expert-authored.
- Do not claim the npm package exists.
- Do not post from an account whose pinned post is an unrelated promo.

## 7. Metrics that matter

- replies that contain a real counterexample
- profile clicks → repo clicks
- `npx` installs from GitHub (GitHub traffic)
- issues opened with a task and a model
- eval files submitted

Followers are a lagging indicator. Counterexamples are the leading one.
