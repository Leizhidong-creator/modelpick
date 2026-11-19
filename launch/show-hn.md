# Show HN

**Title:** Show HN: ModelPick – cost per solved task for AI agents

**URL:** https://github.com/Leizhidong-creator/modelpick

**Body:**

Your agent can write code, call tools, and ship a feature. Then it picks one model for everything: a frontier model to classify a support ticket, to generate a barrel prop, to draft a thumbnail.

I built ModelPick because the number everyone compares — dollars per million tokens — is not the number that decides whether a workflow is affordable. A model that is 53× cheaper per token can be 23 quality points worse, and a model that is 2× cheaper per solved task can be 10 points better at the node you actually care about.

ModelPick is a zero-dependency CLI + stdio MCP server. Before a node runs, it returns:

- the best model for that node (20 nodes across text, image, video, 3D, audio),
- cost per **solved** task (cache-aware price × expected attempts),
- the hard constraints it applied (context, text-in-image, rigging, lip-sync, clip length, budget, open weights),
- why, the trade-offs, and the exact env var + key URL to connect.

Try it without a key:

```
npx -y github:Leizhidong-creator/modelpick pick "create a stylized 3D sword for a Unity game"
```

Install into an agent:

```
npx -y github:Leizhidong-creator/modelpick setup claude-code
```

It writes the MCP config and skill for Claude Code, Codex CLI, Cursor, DeepSeek Harness, or Copilot CLI. It is not a proxy: no keys are stored, no traffic goes through a server, and the host agent executes the plan.

What is in the repo:

- 41 models, 18 providers, 20 task nodes. Catalog dated 2026-11-19 with a source and read date per model.
- 95 tests, CI on Ubuntu/Windows/macOS × Node 20/22/24.
- A 39-scenario decision benchmark (115 runs) and a 12-scenario held-out set (35 runs), with raw JSON and failures in `tests/results/`.
- Claude Code plugin, portable `.agents/skills` skill, MCP server with 6 tools.

What it does **not** do: it does not call providers, so this is a decision benchmark, not a model-output benchmark. Media quality scores are priors from vendor/spec evidence, not independent measurements. Expected attempts is a transparent model, not measured pass@1. The catalog is a dated snapshot. All of that is stated in the README and `bench/METHODOLOGY.md`.

The part I would most like feedback on: is "cost per solved task" the right abstraction, or does it need a per-project ledger before developers trust it? And which node is most overpaid in your stack — coding, image, video, 3D, or audio?

**First comment (post immediately):**

Raw benchmark, including failures and the held-out set: https://github.com/Leizhidong-creator/modelpick/tree/main/tests/results

Method and limitations: https://github.com/Leizhidong-creator/modelpick/blob/main/bench/METHODOLOGY.md

If you rerun the benchmark and get a different ranking, open an issue with the table and I will add it with your name on it. I am particularly interested in counterexamples where a cheaper model is the correct pick at a node the benchmark marks as quality-first.

**Timing:** Tuesday 07:00 PT / 23:00 CST. One post. No repost unless it fails to get any traction; do not ask for votes.
