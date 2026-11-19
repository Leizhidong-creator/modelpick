Role-based routing is the right instinct, but I would split the three jobs into three **nodes** with different constraints:

| Node | Constraint that matters | Cost metric |
|---|---|---|
| compact / summarize | context window, cheap output | per 1M summarized tokens |
| work | codingAgent quality, tools | cost per solved task |
| fallback | credential availability, same capability | cost per solved task |

Two implementation notes:

- Do not route compaction by price per token alone; a model that loses the middle of a long transcript creates a more expensive work turn.
- Credential fallback is a **hard filter**, not a retry. If the preferred key is missing, resolve to the best model that can actually be called; never silently downgrade a context/tool requirement.

I built ModelPick around this node/constraint split; the eval format is here: https://github.com/Leizhidong-creator/modelpick/blob/main/docs/EVALS.md. The useful part is the policy shape, not the specific model list.
