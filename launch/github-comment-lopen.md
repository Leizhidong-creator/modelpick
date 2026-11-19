The clean split is: the workflow declares a **node** (plan/edit/review/classify), the policy declares **constraints**, and a resolver returns a ranked candidate plus a fallback. Don't put a model id in the agent; put a selector there.

A minimal shape:

```yaml
node: review
requires:
  tools: true
  context: 100000
optimize: balanced
max_cost_per_task: 0.25
allow_providers: [anthropic, openai]
```

Resolution order:

1. Hard filters: modality, context, tools, region, open-weights.
2. Cost per **solved** task: unit price × expected attempts, not token price.
3. Quality band: keep the cheapest model within N points of the best eligible one.
4. Key-aware fallback: the best model the user can actually call, without silently downgrading a hard constraint.

Two traps I would call out for this factory:

- **Plan-limit pressure is not cost.** Track subscription quota separately from dollar cost; don't compare a token budget to an API price.
- **A verifier from a different family is a constraint**, not a routing score. Encode it as `verifier.family != executor.family`; otherwise the optimizer will happily pick the same model twice.

I built an open-source resolver with this shape (ModelPick); the schema and the decision benchmark are public here: https://github.com/Leizhidong-creator/modelpick/blob/main/docs/ARCHITECTURE.md. No need to adopt it — the important part is separating node, constraints, and resolver, so changing a model does not require touching the workflow.
