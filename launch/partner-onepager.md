# Partner one-pager

## What ModelPick is

An open-source decision layer for AI agents. It recommends the best model/API at each workflow node and computes **cost per solved task** across text, image, video, 3D, and audio. It does not proxy traffic and does not store keys.

- GitHub: https://github.com/Leizhidong-creator/modelpick
- Catalog: 40 models, 18 providers, 20 nodes, dated 2026-11-19
- Surfaces: CLI, MCP server, portable skill, Claude Code plugin
- License: MIT

## Why a provider should care

ModelPick is an **intent-qualified referral surface**. A developer arrives with a concrete task ("rigged 3D character", "5-second product clip") and receives a model + the exact key URL. That is a higher-intent placement than a generic leaderboard.

It is also a **correction channel**. If your price, model id, or capability is wrong, the catalog is a JSON file with a source URL — a one-line PR fixes it for every user.

## What we ask for

Pick one:

1. **Catalog correction** — send the current model ids, prices, and capability limits. We will cite your page and read date.
2. **Credits for a live smoke test** — $20–50 of API credit to validate the recommended call path and publish a real output sample. No strings, no review.
3. **Listing / co-marketing** — a line in your docs or changelog: "Use ModelPick to choose between X and Y for this node."
4. **Co-authored benchmark** — we bring the 20-node harness and the decision benchmark; you bring the eval set and review the labels.

We will not ask for payment for placement. Ranking is computed from the catalog and the published policy; providers cannot buy a top slot.

## Integration fit

| Provider type | Fit |
|---|---|
| Aggregator (OpenRouter, fal, Replicate) | A single key already covers many models; ModelPick can recommend the aggregator as the setup path and show the per-model id. |
| Frontier lab (Anthropic, OpenAI, Google) | Show the node where your model is the correct premium pick, and the nodes where a cheaper model wins. |
| Chinese providers (Moonshot, Zhipu, MiniMax, Volcengine, Tencent, Alibaba) | High-value coverage in the catalog and the Chinese launch; current prices and ids are often missing from Western trackers. |
| 3D / video specialist (Tripo, Meshy, Kling, Luma, Runway) | Category-defining nodes where developers have no default; a concrete cost-per-asset comparison. |

## Honest constraints

- The catalog is a snapshot, not a live price feed.
- Media quality is a prior, not an independent measurement.
- The benchmark is a decision benchmark; it does not call your API.
- The project has no telemetry, so we cannot report per-provider click-through. We can report GitHub referral traffic if you use a UTM link.

## Contact

Open an issue: https://github.com/Leizhidong-creator/modelpick/issues
Or email the maintainer listed on the GitHub profile.
