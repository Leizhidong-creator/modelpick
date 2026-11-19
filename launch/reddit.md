# Reddit posts

Rules: disclose that you are the author, do not cross-post the same text, answer every technical question, and never ask for upvotes. Stagger by at least 48 hours.

## r/ClaudeAI (Day 3)

**Title:** I built a model picker for Claude Code that prices work per solved task, not per token

**Body:**

Claude Code is great at choosing *how* to do a task. It is not great at knowing when a frontier model is overkill.

I built ModelPick as an MCP server + skill. Before a node runs, it returns the best model for that node, the cost per **solved** task (price × expected attempts), the hard constraints, and the env var to connect.

```
npx -y github:Leizhidong-creator/modelpick setup claude-code
```

Then ask Claude: "pick a model for a rigged 3D character" or "plan a 30-second product video".

It is not a proxy and stores no keys. It also covers image, video, 3D, and audio nodes, which is where most of the wasted spend is.

Honest limitations: decision benchmark, not output benchmark; media quality is a prior; catalog is dated. The methodology and raw failures are in the repo.

Repo: https://github.com/Leizhidong-creator/modelpick

I would like counterexamples more than compliments: which node does it get wrong for you?

## r/LocalLLaMA (Day 5)

**Title:** ModelPick: an offline, zero-dependency model router that treats open weights as a hard constraint

**Body:**

I wanted a router that can answer "what is the best open-weight model for this node, and what does it cost per solved task?" without sending my prompt anywhere.

ModelPick runs entirely offline for the decision. `--open-weights` filters to self-hostable models; the catalog includes DeepSeek V4.1 Flash/Pro, Kimi K3/K3.1, GLM-5.3, and TRELLIS 2 for 3D. It computes a cache-aware cost per solved task and shows the expected-attempts model.

```
npx -y github:Leizhidong-creator/modelpick pick "refactor this repo" --open-weights
```

No API key needed. No telemetry. The catalog is JSON and the scoring policy is JSON, so you can add your own vLLM endpoint as a model override.

What I am unsure about: whether self-host cost should be modeled as GPU-hour amortization instead of API list price. If you have a good formula, I will implement it.

Repo: https://github.com/Leizhidong-creator/modelpick

## r/mcp (Day 7)

**Title:** ModelPick MCP server: 7 tools for model selection across text, image, video, 3D, audio

**Body:**

A small MCP server that gives an agent a model-selection layer:

- `pick_model` — ranked model for one node, with cost per solved task
- `plan_workflow` — multi-step deliverable, one model per step
- `compare_models` — cost/quality side by side
- `get_setup` — env var, key URL, docs, API model id
- `list_models` — filter by modality/task/open weights
- `explain_task` — map a request to a node

Stdio, no dependencies, no keys required for recommendations, compact payloads (<12 KB). It works with Claude Code, Codex, Cursor, DSH, and Copilot CLI.

```
npx -y github:Leizhidong-creator/modelpick mcp
```

Feedback welcome on the tool schema — especially whether `pick_model` should return a full candidate list or just the top pick plus one alternative.

Repo: https://github.com/Leizhidong-creator/modelpick
