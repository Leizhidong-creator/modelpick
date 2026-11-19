For E20, the useful split is **hint → constraints → resolver**, not hint → hard-coded model.

- `strong` means a quality floor, not “Opus”.
- `any` means no family restriction.
- `different-from` is a **hard filter against the executor's family**, not a scoring bonus. If it is a bonus, the optimizer can still pick the same family when the price is right.

Resolver order:

1. Hard filters: family, modality, context, tools, region.
2. Cost per **solved** task (unit price × expected attempts).
3. Quality band: cheapest model within N points of the best eligible candidate.
4. Receipt: model, env, cost per task, fallback.

I built an open-source version of that resolver (ModelPick) with a public schema and decision benchmark: https://github.com/Leizhidong-creator/modelpick/blob/main/docs/ARCHITECTURE.md. No need to adopt it; the important part is that changing a model should be a policy edit, not a code edit.
