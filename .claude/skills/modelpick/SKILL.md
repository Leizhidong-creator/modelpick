---
name: modelpick
description: Pick the most cost-effective model at every workflow node (coding, image, video, 3D, audio), with cost per solved task and the exact API key setup.
whenToUse: Before choosing a model, generating media, starting a long coding task, quoting a model price, or wiring up a provider key.
metadata:
  version: 0.1.0
  homepage: https://github.com/Leizhidong-creator/modelpick
---

# ModelPick

You are working with an agent that can call many models. The expensive mistake is not picking a bad model once — it is picking a frontier model for every node.

## When to use this skill

Call `pick_model` **once per node**, before you commit to a model:

- the user asks for an image, video, 3D asset, voiceover, music, or transcription;
- you are about to start a long coding, refactor, review, or debugging task;
- the user asks "which model should I use?", "what will this cost?", or "is there a cheaper way?";
- a task needs a capability the current model may not have (vision, 1M context, tool use, image output).

Do **not** call it on every turn or for trivial edits. One call per node is the contract.

## Workflow

1. Call `pick_model` with the node in natural language and any constraints:

```json
{ "query": "generate a stylized 3D sword for a Unity game", "optimize": "balanced", "max_cost": 0.5 }
```

2. Read `recommendation.slug`, `recommendation.costPerTask`, `recommendation.why`, and `recommendation.setup.direct.env`.

3. If the deliverable has multiple stages, call `plan_workflow` instead of guessing the pipeline:

```json
{ "goal": "30-second product launch video for a coffee brand", "optimize": "cost" }
```

4. Before calling the provider, call `get_setup` for the exact env var, key URL, docs, and API model id. Never print or store the key value.

5. In your final answer, state the model and the **cost per solved task**, not the token price. Example: `Tripo 3.0 — $0.21 per usable asset (1.07 expected attempts)`.

## Rules

- Never invent prices, context windows, or model ids. Quote the tool output.
- If `recommendation.priceConfidence` is `estimated`, say so.
- If `catalog.stale` is true, mention it and suggest `modelpick update`.
- Prefer `optimize: "cost"` for drafts, bulk work, and internal tools; `"quality"` for customer-facing hero assets; `"balanced"` when unsure.
- Use `open_weights: true` when the user needs self-hosting, data residency, or no vendor lock-in.
- Do not call a provider you have no key for. Show the setup block and ask the user to add the key.

## Fallback (no MCP)

```bash
npx -y modelpick@latest pick "generate a 3D game asset" --json
npx -y modelpick@latest plan "product launch video" --json
```

The JSON has the same shape as the MCP tool.
