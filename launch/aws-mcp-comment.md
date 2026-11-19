This RFC is directionally right, but `estimate_run_cost` and `compare_models_for_task` need an **expected-attempts** term, not only token pricing.

Cost per successful task is:

`unit_cost(workload) × expected_attempts(quality, acceptance)`

If quality drops, attempts rise, and the cheapest-per-call model can lose per solved task. A schema that only prices one call will systematically over-recommend cheap models.

Concrete fields worth adding to the proposal:
- `expected_attempts` (or a quality/acceptance prior)
- `quality_floor` / hard constraints
- `cost_per_solved_task` separate from `cost_per_call`
- returned `confidence` and source date for every price

We built an open reference model for this across 40 models and 20 task nodes; the method and failure cases are here if useful:
https://github.com/Leizhidong-creator/modelpick/blob/main/docs/VALUE.md

No AWS account required; it is a pricing-snapshot model, same as the RFC's self-contained constraint.
