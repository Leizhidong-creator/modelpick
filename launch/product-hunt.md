# Product Hunt

**Name:** ModelPick

**Tagline (60 chars):** The model router for AI agents

**Description (260 chars):**

Your agent should not use one model for everything. ModelPick picks the best model at each node — coding, image, video, 3D, audio — and prices it in cost per solved task, not tokens. One CLI + MCP call. No keys stored, no proxy, no telemetry.

**Topics:** Developer Tools · Artificial Intelligence · Open Source · Productivity · Command Line

**Launch timing:** 00:01 PT / 16:01 CST, Tuesday–Thursday, self-hunted.

**First comment:**

Hi Product Hunt — I built ModelPick after watching a coding agent burn a frontier model on a 3D barrel prop.

The core idea: compare models by **cost per solved task**, not dollars per million tokens. That means price × expected attempts, with cache awareness. The second idea: modality is a filter. Asking for text inside an image should exclude models that cannot render type; asking for a 30-second film should exclude 8-second generators.

What you get in one call:
- a ranked model for the node,
- the cost per usable output,
- the hard constraints applied,
- the env var and key URL to connect.

It works as a zero-dependency CLI, an MCP server, and a portable skill for Claude Code, Codex, Cursor, DeepSeek Harness, and Copilot CLI. It is not a gateway — no keys, no proxying, no telemetry.

Honest limits: this is a decision benchmark, not a model-output benchmark. Media quality scores are priors. Expected attempts is a transparent model. The catalog is dated and refreshable.

I would love feedback on one thing: would a per-project spend ledger make this more trustworthy, or is the per-task estimate enough?

**Gallery (5):**

1. `assets/social-preview.png` — one-liner + install
2. `assets/terminal-pick.png` — 3D recommendation with cost per asset
3. `assets/terminal-plan.png` — launch-video plan, one model per step
4. `assets/benchmark.png` — 115-run decision benchmark
5. `assets/architecture.png` — data → engine → agent surfaces

**Maker comment (after launch):**

Thank you — the most useful question so far is "how do I know the quality number is right?" Short answer: you do not, yet. It is a prior from public benchmarks, and the repo labels the media scores as the weakest evidence. The next version adds a community-labeled holdout and a tiny live-call smoke test with your own key. If you have a counterexample, open an issue; counterexamples are the roadmap.
