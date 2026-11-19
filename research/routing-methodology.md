# Routing Methodology for `modelpick`

**Task-level model routing with cost-per-solved-task as the decision unit**

| | |
|---|---|
| Status | v1.0 — methodology + offline evaluation design + test plan |
| Date | 2026-11-19 |
| Scope | Workflow-node-level routing (one recommendation per node), no live model calls during evaluation |
| Audience | Router engineers, eval owners, product owners who consume the recommendation |
| Companion artifacts (to build) | `catalog.json`, `evidence/` (benchmark snapshots), `scenarios/` (60–120 labeled cases), `router/score.py` |

---

## 0. Executive summary and non-negotiables

`modelpick` recommends a model (or a cascade policy) for **each node of an agent workflow**, and reports **cost per solved task** rather than $/M tokens. Four design commitments drive everything below:

1. **Decision unit is the solved task, not the token.** Token price and outcome price diverge in both directions: a model 3× cheaper per token can be *more* expensive per solved task once retries and thinking tokens are priced in, and (worked example, §5.2) a model 114× more expensive per blended token can cost only 56× more per solved task because it needs fewer attempts.
2. **Evidence must be graded, not averaged.** Every number carries provenance and a grade (`Supported` / `Estimated` / `Insufficient`). The router must be able to say "I don't know" and fall back to a documented default. This mirrors BenchLM's Supported/Estimated labelling [21] and is the single most important defense against overclaiming.
3. **No live calls means the benchmark is a *model of the world*, and models of the world carry construct error.** We therefore separate three error sources — benchmark noise, benchmark-to-task mapping error, and transfer error — and propagate all three (Section 4).
4. **Pre-registration beats post-hoc rationalization.** The benchmark set, weights, and mapping parameters are frozen and hashed *before* looking at router accuracy. §2.4 defines the anti-cherry-picking protocol; §6.7 measures how often the recommendation flips under defensible alternative methodologies.

**Catalog reality check (2026-11-19).** BenchLM's snapshot ranks Claude Fable 5.2 (92.80, *Estimated*), GPT-6.2 Astra (89.61, *Estimated*), Claude Opus 5.5 (85.82, *Supported*), Gemini 4 Carbon (85.03), GPT-6 Astra (83.04) [21]; Artificial Analysis is publishing on **Intelligence Index v4.3**, with older models re-scored or left as "Model card" rows [20]. Three consequences: (a) top-of-leaderboard ordering is inside the noise band for several pairs; (b) index *version* changes silently re-scale history; (c) in BenchLM's top-5 on 2026-11-19, **three of five ranks are labelled *Estimated*** rather than independently run. The methodology below is built to survive exactly this.

---

## 1. Prior art in model routing

### 1.1 What the field actually built

| System | Signal used | Decision rule | Reported gain (source-labelled) | Characteristic failure modes |
|---|---|---|---|---|
| **RouteLLM** (2024) [1][2] | Prompt text; trained on human preference data (Chatbot Arena), augmented; router families: matrix factorization, BERT classifier, similarity-weighted ranking, causal LLM classifier | Binary strong/weak choice at a target cost ratio; a single scalar "win probability" threshold | "Over 2×" cost reduction without quality loss in their evals; project materials report up to ~85% cost reduction on MT-Bench at 95% of GPT-4 quality *(project-reported)* | Only two models; threshold is a global knob, not per-task; trained on chat preference, so coding/tool nodes are out-of-distribution; transfer claims degrade when both endpoints change |
| **RouterBench** (2024) [3] | *Benchmark, not router*: 405k inference outcomes | Formalizes routing as a cost-quality optimization; compares zero-shot, similarity, classifier, and causal-style routers against an oracle | Quantifies the best-single-model → oracle gap and shows learned routers close only part of it; gains are strongly benchmark-dependent | Static dataset; per-query difficulty labels are sparse; the oracle is unattainable and flatters all routers; no constraint semantics |
| **Not Diamond** (commercial) [15] | Per-input prediction over provider/model/domain/reasoning/complexity/cache/context/harness features | Learned classifier returns a single best model per input; executed in the customer's gateway | Vendor claims: +5% accuracy, −50% cost, 2× faster dev cycles; customer quote (Rootly) claims +39% average accuracy on SRE benchmarks; historically powered OpenRouter's "intelligent routing" *(vendor-reported, unaudited)* | Closed model; no per-node cost accounting; claims are averages over mixed traffic; auditability limited to vendor dashboards |
| **Martian** (commercial) [16] | Prompt features + model-disagreement signals; "best execution" framing | Router picks the model expected to win on this prompt | Vendor-era claims of quality-at-lower-cost; the public `withmartian.com` presence now redirects to Thesean AI ("best execution for LLMs"), so **treat the product's current status as unverified** | Product continuity risk is itself a failure mode for a router dependency; claims not reproducible from public artifacts |
| **OpenRouter Auto Router** (2025–2026) [11] | A fast decision model rates **eleven aspects** of the request in one call (task kind, whether the task just changed, difficulty, speed sensitivity, vision need, codebase knowledge, whether a bigger model or more thinking would help, …); then weighs that rating against **live prices, cache status, and benchmark performance**, inside the caller's cost tier | Constrained argmax over an eligible pool (guardrails, ZDR, provider restrictions, BYOK, allow/deny lists), choosing both model *and* reasoning effort; session-sticky, carries "is the model struggling / how much context is cached" to the next turn | No headline % published; the docs candidly state the **default policy costs more per task than the previous generation** of the router, and recommend `cost_tier: low` to restore prior economics *(vendor-reported)* | Extra decision call per request (cost + latency on cheap tasks); opaque policy that changes under you; default drift toward capability; a 404 when constraints exclude every model |
| **Requesty** (2026) [12] | Declarative policies: failover order, traffic shares, live latency (TTFT + tok/s over the last hour), region gateways, scope hierarchy | Policy engine, not a predictor: ordered chains, weighted splits, latency-wins; nesting; `trace_id` stickiness | Vendor: 99.25% eventual success on a policy vs 85.01% direct-to-single-provider (April 2026); 65.8% of provider failures are 429s *(vendor-reported)* | No task-quality prediction at all — routing is about *reliability and cost*, not capability match; policy sprawl; regional pinning can strand traffic |
| **LiteLLM Router** (OSS) [13] | Deployment health and load: in-flight requests, rolling latency, usage/spend; optional semantic/complexity routing and an "Auto Router" surface in current docs | Strategies: `simple-shuffle` (default), `least-busy`, `latency-based`, `usage-based`; fallbacks, retries, cooldowns, context-window fallback | No capability claims; the win is operational (uptime, cost visibility, provider abstraction) | Defaults are load-balancing, not quality-aware; a fast-but-wrong model absorbs traffic; retry storms can mask quality problems in dashboards |
| **Portkey** (commercial gateway) [14] | Request metadata and JSON conditions; embeddings of saved examples (semantic router); weights; fallbacks; canary | Rule engine + embedding-similarity classifier + load balancing | Operational claims (reliability, governance), not capability deltas | Rules rot as task mix shifts; semantic router needs curated exemplars per intent; condition sprawl becomes unmaintainable |
| **Arch-Router** (2025) [5] | Query → **(domain, action)** preference match, learned by a compact **1.5B** model | Classify query into a user-defined domain/action, map that to a model per a human-authored preference table | SOTA on matching queries to human preferences; outperforms top proprietary routers on their conversational sets; new models can be added **without retraining** | Requires a hand-built domain/action taxonomy and mapping per deployment; preference-alignment ≠ task success; taxonomy drift |
| **GraphRouter** (2024) [4] | Heterogeneous graph over task, query, and LLM nodes; edge prediction of (effect, cost) | Inductive edge prediction → recommend the LLM maximizing the effect-cost objective | ≥12.3% improvement over existing routers across three effect-cost weightings; ≥9.5% effect boost generalizing to unseen LLMs | Needs a graph built from logged outcomes; inductive claims depend on task/query feature quality; no hard-constraint layer |
| **MasRouter** (2025) [6] | Task features at the *system* level: collaboration mode, role allocation, and per-role LLM choice via a cascaded controller | Jointly decides MAS topology **and** per-agent model — the closest published analogue to per-node routing | +1.8–8.2% over SOTA on MBPP; up to **52.07%** overhead reduction on HumanEval; 17.21–28.17% overhead reduction when plugged into existing MAS frameworks | Controller training is expensive; topology search can overfit a benchmark; role-level granularity is coarser than node-level |
| **FrugalGPT** (2023) [7] | Query + a learned generator-scorer; cascade | Try cheap model → scorer decides whether to escalate | Match GPT-4 with up to **98%** cost reduction, or +4% accuracy at equal cost *(their evals)* | Scorer is a second model (cost/latency); cascades amplify latency; calibration of the scorer is the whole ballgame |
| **Hybrid LLM** (ICLR 2024) [8] | Predicted query difficulty + a tunable target quality level | Route to small or large model at a chosen quality/cost operating point | Up to **40% fewer** large-model calls with no quality drop | Difficulty estimator is domain-specific; the "quality knob" is only as trustworthy as its calibration |
| **Contextual-bandit routers** (2024–2026) [17] | Reward history conditioned on context; exploration | Explore/exploit over models; handles nonstationary context | Regret guarantees; adapts without a fixed offline dataset | Exploration is *paid for in production*; delayed/partial rewards; cold start for new models; feedback loops (router learns from its own choices) |
| **Causal framing** (this document's lens; see §2.7) | Potential outcomes per (model, task) pair | Estimate E[Y(m)] under a target task distribution, not the logged one | Makes confounding explicit; enables IPS/doubly-robust correction of logged data | Requires overlap (each model tried on comparable tasks); unmeasured confounding by task difficulty; small support for new models |

### 1.2 What this means for `modelpick`

**Borrow:**
- RouteLLM's discipline of training on *preference/outcome data* and reporting a cost-quality curve rather than a point [1].
- RouterBench's oracle-gap framing: always report how much of the achievable gain you captured [3].
- Arch-Router's insight that **human-authored preference structure beats a black box for auditability**, and that adding models must not require retraining [5].
- MasRouter's proof that **per-node** decisions beat per-request decisions in multi-agent settings [6].
- FrugalGPT's cascade as a first-class action — sometimes the right answer is "cheap model, verify, escalate", not "one model" [7].
- Requesty/LiteLLM's operational realism: failover, cooldowns, and 429s materially change *success probability*, and therefore cost per solved task [12][13].
- OpenRouter's explicit **cost tier** and its admission that default policy drifted upward in cost [11] — a warning that any router's default is a product decision that must be versioned and monitored.

**Avoid:**
- Binary strong/weak routing. Real workflows have 5–40 candidate models and hard constraints.
- A single global threshold. Cost ratios, retry budgets, and value-per-task differ per node.
- Treating a leaderboard score as a success probability (Section 3.2).
- Un-auditable vendor routing for regulated nodes — if you cannot see why a model was chosen, you cannot defend the choice to a customer or auditor.
- Training the router on its own traffic without a holdout: the router's choices censor the outcomes it learns from.

### 1.3 Seven failure modes that recur across all prior art

1. **Proxy mismatch** — benchmark preference ≠ task success. Cursor explicitly documents that SWE-style benchmarks are bug-fix-heavy and Terminal-Bench is puzzle-shaped, neither matching real developer work [22].
2. **Endpoint rigidity** — two-model routers cannot express "mid-tier for this node, frontier for the verifier".
3. **Cold start** — a model released last week has no outcome data; routers either ignore it or over-trust vendor numbers.
4. **Nonstationarity** — prices, versions, rate limits, and provider health all move; a router with a 90-day retrain cycle is stale by construction.
5. **Cost-model naivety** — ignoring retries, cache pricing, thinking tokens, and tool calls (Section 5.4). This is the most common way routing "savings" evaporate.
6. **Decision overhead** — a per-request LLM classifier can cost more than the routing saves on cheap nodes [11].
7. **Opaque defaults** — a vendor changes the policy; your cost curve moves without a deploy.

---

## 2. Offline evaluation without live model calls

The constraint "no live model calls" means we cannot measure `p(success | model, task)` directly. We must build a **defensible decision benchmark** from three ingredients:

```
public evidence  →  capability matrix E[model, benchmark]  →  mapped success probabilities
local labels     →  task-family anchors + expert top-1/top-3  →  construct-validity correction
frozen catalog   →  price / latency / constraints             →  cost-per-solved-task
```

### 2.1 What "defensible" means here

A benchmark is defensible for routing if it satisfies five tests:

| Test | Question | Minimum bar |
|---|---|---|
| **Construct** | Does the benchmark measure the capability the node needs? | Same capability family; documented task mix; no pure-preference benchmark for a correctness node |
| **Discrimination** | Does it separate models that behave differently in practice? | Top-3 models not all within one CI; no saturation at ≥95% |
| **Contamination resistance** | Could the model have memorized the items? | Time-windowed, private/held-out, or freshly authored items; or an explicit contamination discount |
| **Independence** | Was it run by someone other than the model vendor? | ≥2 independent runs, or 1 independent + 1 vendor run with harness disclosed |
| **Recency** | Does it reflect the current catalog? | Run date ≤ 90 days for fast-moving families; index version pinned |

Anything failing two or more tests is `Insufficient` for that node, regardless of how good the number looks.

### 2.2 Source registry: what each public source is actually good for

| Source | What it measures | Best used for | Known limits to encode |
|---|---|---|---|
| **LMArena** [18][19] | Human pairwise preference → Bradley–Terry strength, with 95% CIs; category splits; style-controlled variant | Subjective/chat/writing nodes; style-sensitive tasks | Preference ≠ correctness; prompt distribution is consumer chat; style bias (length, markdown) requires the style-control variant; hard-prompt subsets are small; pairwise CIs are wide at the top |
| **Artificial Analysis** [20] | Composite **Intelligence Index** (currently v4.3) over ~10 third-party/AA evals, plus price, TTFT, output speed | Cross-model triage; price/latency priors; spotting a model that is strong per dollar | Editorial weights; **index version changes re-scale history** (rows marked "index v4.3" or "Model card" are not comparable runs); composite hides per-benchmark weakness |
| **BenchLM** [21] | Aggregator of provider-reported + leaderboard + paper results; 1033 models / 818 benchmarks, 142 grouped into 8 categories; every rank labelled **Supported** or **Estimated** | Breadth, catalog discovery, "who else has measured this" | It does not run private evals; "Estimated" rows are interpolated/vendor-derived; aggregation of heterogeneous harnesses |
| **SWE-bench / Verified** [23] | Repository-level issue resolution, hidden tests; Verified = 500 human-validated | Code-edit nodes | Heavily reported and therefore contaminated; Cursor documents that OpenAI stopped reporting SWE-bench Verified after finding models reproduce gold patches from memory and ~60% of unsolved problems had flawed tests [22]; saturated at the frontier |
| **SWE-bench Pro** [24] | Harder, held-out, contamination-resistant SE tasks | Code nodes where Verified is saturated | Lower absolute scores; fewer models; harness differences |
| **CursorBench** [22] | Production-derived coding tasks (Cursor Blame traces query → committed solution), internally sourced, refreshed every few months, agentic graders, deliberately underspecified prompts | The best public *construct* for real agentic coding; calibrating the discount you apply to public coding scores | Not a public per-task dataset; rankings only; vendor-run (Cursor is a model developer too) |
| **LiveCodeBench** [25] | Time-windowed competitive-programming problems | Contamination-free code reasoning | Narrow task shape (algorithmic), not repo editing |
| **Terminal-Bench** [34] | Multi-step CLI/terminal tasks | Agentic shell nodes | Puzzle-shaped; Cursor notes poor alignment with real dev work [22] |
| **τ²-bench** [29] | Tool-agent dialogue with `pass^k` reliability | Tool-use nodes; **reliability** (not just pass@1) | Narrow domains (retail/telecom); dual-control dynamics |
| **BFCL** [30] | Function-calling accuracy, multi-turn, agentic | Tool-schema nodes | Schema-shaped tasks; can be gamed by constrained decoding |
| **MMMU / MMMU-Pro** [26] | College-level multimodal reasoning | Vision+reasoning nodes | Saturated on the easy split; Pro is the useful one |
| **GenEval** [27] | Compositional text-to-image (objects, counting, color, position, attribute binding) | Image-generation nodes | Narrow prompt set; does not measure aesthetics |
| **VBench** [28] | 16 dimensions of video generation quality | Video nodes | Dimension weights are a design choice; human correlation imperfect |
| **OSWorld** [35], **GAIA** [38], **HLE** [37], **GPQA Diamond** [36] | Computer use / assistant tasks / frontier knowledge / science QA | Computer-use nodes; knowledge nodes; "is this model even capable" gates | Small n at the frontier → wide CIs; HLE and GPQA are knowledge-heavy and weakly related to most workflow nodes |

### 2.3 Building the capability matrix

**Step 1 — Define capability families.** Use 8, matching BenchLM's taxonomy for interoperability [21]: `agentic`, `coding`, `multimodal`, `reasoning`, `knowledge`, `instruction_following`, `multilingual`, `math`. Add two `modelpick`-specific families that public leaderboards under-serve: `tool_calling` and `long_context`.

**Step 2 — Freeze a reference pool.** z-scores must not depend on which models happen to be in today's candidate set. Freeze a pool `R` of ~40 models that appear on the benchmark at freeze date, and define:

$$z_j(m) = \frac{s_j(m) - \mu_j(R)}{\sigma_j(R)}, \qquad \mu_j(R)=\frac{1}{|R|}\sum_{r\in R} s_j(r)$$

Never average raw 0–100 scores across benchmarks: ceilings, guess rates, and variance differ (GPQA Diamond has a 25% guess floor; GenEval is near-saturated; SWE-bench Pro is not). Raw averaging systematically over-weights saturated benchmarks.

**Step 3 — Aggregate to a family score** with explicit, pre-registered weights:

$$Z_f(m) = \frac{\sum_{j \in \mathcal{B}_f} w_j\, z_j(m) \cdot \mathbb{1}[m \text{ has } j]}{\sum_{j \in \mathcal{B}_f} w_j \cdot \mathbb{1}[m \text{ has } j]}$$

Defaults: 2–4 benchmarks per family; the contamination-resistant member gets `w = 1.5`, others `1.0`; preference benchmarks are allowed only in `subjective` nodes and never in `coding`/`tool_calling`.

**Step 4 — Never impute silently.** Three legal states per cell: measured, `Estimated` (imputed from a hierarchical model, flagged), missing. A model whose family score is `Estimated` cannot be the *top-1* recommendation for a high-criticality node without an explicit override.

**Step 5 — Record provenance.** Every cell is an `EvidenceRecord`:

```json
{
  "model": "provider/model-id",
  "benchmark": "swebench-pro",
  "score": 41.2,
  "unit": "percent_resolved",
  "n_items": 731,
  "ci95": [38.1, 44.3],
  "run_by": "third_party",
  "harness": "https://.../harness@sha",
  "retrieved": "2026-11-19",
  "source_url": "https://...",
  "grade": "Supported",
  "contamination_risk": "low",
  "notes": "held-out split"
}
```

`grade` rules: **Supported** = independent run + harness disclosed + n ≥ 100 + retrieved ≤ 90 d; **Estimated** = vendor-reported, or imputed, or n < 100, or older than 90 d; **Insufficient** = no source, or two sources disagree by > 2 SE, or benchmark saturated/known-compromised for this model family.

### 2.4 Avoiding cherry-picking

Cherry-picking in routing rarely looks like fraud; it looks like choosing the benchmark that makes your preferred model look good. Five mechanical defenses:

1. **Pre-registration.** Before computing any accuracy number, commit a `methodology.lock.json` containing: benchmark set, weights, mapping parameters, constraint defaults, and the scenario file hash. Publish the hash in the test report. Any post-hoc change creates a v2 with the diff shown.
2. **Inclusion rule, not selection.** For each capability family, include *every* benchmark that clears the §2.1 bar (public harness, ≥20 models, updated ≤12 months, non-saturated). Exclusions require a written reason and appear in the report.
3. **Leave-one-benchmark-out (LOBO).** Recompute the full recommendation set with each benchmark removed in turn. Report the **decision flip rate**. If dropping any single benchmark flips >15% of recommendations, the evidence base is too thin — say so.
4. **Weight sensitivity.** Draw 2,000 weight vectors from `Dirichlet(1)` over the family's benchmarks; report the distribution of top-1 choices. A recommendation that survives <80% of draws is labelled *fragile*.
5. **One-source-one-vote is banned at the top.** A `Supported` top-1 requires ≥2 independent sources (or ≥1 independent source + ≥30 local labeled tasks). Otherwise the recommendation is downgraded to `Estimated` and must be shown with a range.

### 2.5 Benchmark contamination: controls that actually work

Contamination inflates scores in a model-dependent way (models trained on more code see more SWE-bench), which *distorts routing*, not just levels. Controls, strongest first:

| Control | Mechanism | Cost | Where to use |
|---|---|---|---|
| **Private/held-out items** | Items never published (SWE-bench Pro held-out; CursorBench internal) [22][24] | Requires an owner | Highest-stakes coding nodes |
| **Time-windowing** | Only items released after the model's training cutoff (LiveCodeBench) [25] | Needs release dates | Code reasoning, knowledge |
| **Perturbation** | Rename entities, change constants, reorder options; verify the answer still holds | Cheap, automatable | Any public benchmark you must reuse |
| **Canary/verbatim probe** | Ask the model to reproduce the gold patch/answer; a near-verbatim match is a contamination signal | Cheap | Spot checks on new models |
| **Cross-source disagreement** | A model that is 15 points above its own family on one benchmark is suspect | Free | Every ingest |
| **Contamination discount** | Multiply the mapped probability's logit gain by `(1−κ)`, κ default 0.3 for public non-held-out benchmarks | Crude but honest | Default for `SWE-bench Verified`, `MMMU` easy split, `GSM8K`-class |

Explicitly document the **construct-validity collapse** case: a benchmark where the top ~10 models are within CI of each other and the ceiling is ≥95% carries almost no routing information. Cursor's account of SWE-bench Verified — reproducing gold patches from memory, ~60% of unsolved problems having flawed tests, OpenAI ceasing to report it [22] — is the canonical example. Detect saturation mechanically: if the 95% CI of the #1 and #3 models overlap, mark the benchmark `saturated` and set its family weight to 0 until refreshed.

### 2.6 Mapping evidence to *task* evidence

Public benchmarks measure *model* capability on *their* task distribution. A workflow node has its own distribution. Two corrections, both explicit:

**Anchor correction (`δ_task`).** If you have ≥5 local labeled examples for the family (expert-judged pass/fail for a reference model), estimate the log-odds offset between the mapped probability and observed local success:

$$\hat\delta_{\text{task}} = \frac{1}{n}\sum_{i=1}^{n}\left[\text{logit}(\hat p_i^{\text{local}}) - \text{logit}(\hat p_i^{\text{mapped}})\right]$$

With `n < 5`, set `δ = 0` and *widen* the interval by `σ_transfer` (Section 4.3). Do not pretend a two-example anchor is calibration.

**Construct-distance penalty.** Define distance between the node's task and the benchmark's task mix on four axes (output type, tool use, context length, verification strictness). Each axis that differs applies a penalty to the logit gain:

$$\text{logit}(p) \;=\; a_f + b_f Z_f(m)\,(1-\eta) + \delta_{\text{task}}, \qquad \eta = \min(0.6,\; 0.12 \times \#\text{differing axes})$$

Defaults: `a_f = 0` (an average candidate sits at 50%), `b_f = 0.85` per z-unit for correctness families, `0.55` for subjective families. These are priors to be refit as local labels accumulate — and they are stated as priors in the UI, not as measurements.

### 2.7 Causal framing (why logged data alone cannot settle routing)

For a node with candidate models `m ∈ M` and task `x`, the target quantity is the **potential outcome** `Y(m, x) ∈ {0,1}`. We observe only `Y(m, x)` for the model that actually ran. This creates two problems no amount of logging solves by itself:

- **Confounding by difficulty.** Hard tasks were routed to strong models, so strong models look worse than they are (or cheap models look better, because they only saw easy tasks). The naive estimate `E[Y|m]` is biased by the assignment policy.
- **No overlap.** A model never tried on a node has zero support. No estimator can invent it; the honest answer is `Insufficient`.

Practical corrections, in order of preference: (1) run a small randomized trial on the node (10–20% of traffic, model chosen uniformly from the eligible set) so every model has support; (2) if randomization is impossible, use inverse-propensity weighting with the logged routing propensities `π(m|x)`, `ŵ = 1/π(m|x)`; (3) double robustness with a reward model; (4) otherwise mark the estimate `Estimated` with a transfer penalty.

**Bandit framing** is the online version: treat routing as a contextual bandit with nonstationary rewards. The published 2026 result on selection under *unstructured context evolution* [17] is the right mental model — the context distribution drifts, so any policy needs explicit exploration and forgetting. But note the asymmetry: in evaluation we pay for exploration with *labels*, in production we pay with *money and user-visible failures*. That is why `modelpick` runs offline-first, shadows, then enables exploration behind a budget cap (§6.7).

---

## 3. The scoring model

### 3.1 Pipeline overview

```
node spec x
   │
   ├─ 1. HARD FILTERS  ──────────────► eligible set M(x)      (§3.3)  [constraints, not scores]
   ├─ 2. SUCCESS MODEL  ─────────────► p̂(m|x) ± CI            (§3.4–3.5)
   ├─ 3. ATTEMPT MODEL  ─────────────► P_solved, E[N]         (§3.6)
   ├─ 4. TOKEN + PRICE MODEL ────────► C_solved(m|x)          (§3.7, §5)
   ├─ 5. LATENCY MODEL  ─────────────► L_med, L_p95           (§3.8)
   ├─ 6. UTILITY  ───────────────────► U(m|x)                 (§3.9)
   └─ 7. DECISION + EXPLANATION  ────► top-1, top-3, "why", "confidence"
```

Hard filters run **before** scoring. A model that violates a constraint is not "expensive"; it is *ineligible*. Mixing constraints into a weighted score is the classic way constraint violations slip through.

### 3.2 From a 0–100 benchmark score to a success probability (without overclaiming)

A benchmark score is **ordinal evidence about a model's capability on a different task distribution**. It is not a probability of solving your task. Three facts force humility:

- **Ceilings and floors.** GPQA Diamond has a 25% guess floor [36]; GenEval is near-saturated [27]. A 70 means different things on each.
- **Construct distance.** A 70 on competitive programming (LiveCodeBench [25]) says little about editing a 40-file monorepo.
- **Contamination.** Public scores can be memorization-inflated (§2.5).

So we map through a **logistic link with an explicit, tunable spread**:

$$\boxed{\;\hat p(m|x) = \sigma\!\left(a_f + b_f\,(1-\eta)\,Z_f(m) + \delta_{\text{task}} - \gamma_1\ln(1+n_{\text{steps}}) - \gamma_2\mathbb{1}[\text{tools}]\right)\;}$$

where `σ(z) = 1/(1+e^{-z})`, and the result is clipped to `[0.02, 0.98]`:

- `Z_f(m)` — the family z-score from §2.3 (the ordinal evidence, standardized).
- `a_f, b_f` — family intercept and slope. Defaults: `a_f = 0`, `b_f = 0.85` (correctness), `0.55` (subjective). Refit when local labels exist.
- `η` — construct-distance penalty from §2.6.
- `δ_task` — local anchor offset, `0` when unanchored.
- `γ_1, γ_2` — **agentic discount**: multi-step nodes compound failure. Defaults `γ_1 = 0.20`, `γ_2 = 0.10`. A 4-step node loses `0.20·ln(5) ≈ 0.32` logits (≈8 pp at p=0.8) versus a single-shot node with the same benchmark evidence.

**When you only have one benchmark and no pool** (a single score `s`, 0–100):

$$\hat p = \sigma\!\left(\frac{s - s_{50}}{\tau}\right), \qquad s_{50}=55 \text{ (reasoning)}, \; 70 \text{ (saturated coding)}, \; \tau = 12$$

`τ = 12` means "12 score points ≈ one logit ≈ a shift from 50% to 73%". It is a humility knob: **larger `τ` = flatter mapping = less confident**. Document `τ` per benchmark in the UI; never present the raw `s/100` as a probability.

**Anti-overclaiming rules (enforced in code):**
1. `p̂` is never displayed without its interval (§4).
2. `p̂ > 0.95` requires local evidence (`n ≥ 30`), not benchmark evidence.
3. A benchmark-to-probability mapping is never applied across capability families (a coding score never estimates a writing-node probability).
4. If the model has no in-family benchmark, `p̂` = family prior (`0.5` for correctness nodes) with `σ_transfer` widened — and the badge reads `Insufficient`, not a number that looks measured.

### 3.3 Candidate generation: hard constraint filters

Each filter is a predicate over `(model m, node x)`; failure removes `m` from `M(x)` and records the reason (surfaced in the explanation, never as a soft penalty).

| # | Filter | Predicate | Default / policy |
|---|---|---|---|
| F1 | Context window | `ctx(m) ≥ 1.15 × (T_in + T_out_max)` | 15% headroom for tool results and retries |
| F2 | Modality in | `modalities_in(x) ⊆ mod_in(m)` | image/audio/pdf/video |
| F3 | Modality out | `modalities_out(x) ⊆ mod_out(m)` | text/JSON/image/video |
| F4 | Tool calling | `needs_tools(x) ⇒ tool_call(m)` | must also support parallel calls if `x.parallel_tools` |
| F5 | Structured output | `needs_schema(x) ⇒ json_schema(m)` | strict mode preferred |
| F6 | Max output | `max_out(m) ≥ T_out_max` | thinking tokens count toward this |
| F7 | License | `license(m) ∈ allowed_licenses(org)` | `any` / `permissive` / `open_weights_only` |
| F8 | Region / residency | `region(m) ∩ allowed_regions(x) ≠ ∅` | EU / US / AP; in-region inference only |
| F9 | Privacy | `zdr(m) ∧ ¬train_on_data(m)` when `x.pii > 0` | hard block, no override |
| F10 | Org policy | `m ∈ allowlist(org)` and `m ∉ denylist(org)` | denylist wins |
| F11 | Lifecycle | `status(m) ≠ deprecated`; warn on `deprecating` | block if `sunset < now + 14d` |
| F12 | Budget | `C_solved(m) ≤ C_cap(x)` | post-cost check; if all fail → raise `Insufficient budget` |
| F13 | Rate/capacity | `rpm(m) ≥ expected_rpm(node)` | prevents choosing a model you cannot feed |
| F14 | Data handling | no `beta`/`preview` for regulated nodes | `x.criticality == high` |

If `M(x) = ∅`, the router returns an **infeasibility report** listing which filter eliminated the last candidates and what to relax. It never silently falls back to a violating model.

### 3.4 Attempt model

Let `p = p̂(m|x)` be the per-attempt success probability, `r` the retry budget (`K = 1 + r` total attempts), and `u` the **conditional success probability on a retry given the first attempt failed**. Same-model retries are strongly correlated: sampling again with the same prompt often fails the same way. Default:

$$u = \rho_{\text{retry}}\cdot p, \qquad \rho_{\text{retry}} = 0.5$$

Then, with `q_1 = 1 − p` and `q_k = 1 − u = 1 − \rho_{\text{retry}}p` for `k ≥ 2`:

$$P_{\text{solved}} = 1 - \prod_{k=1}^{K} q_k = 1 - (1-p)\,(1-\rho_{\text{retry}}p)^{r}$$

$$E[N] = \sum_{k=1}^{K}\prod_{j<k} q_j = 1 + (1-p)\sum_{k=1}^{r}(1-\rho_{\text{retry}}p)^{k-1}$$

`ρ_retry = 0.5` is a conservative default, **not a measurement**. Measure it per family: run 50 tasks, force two attempts, record `P(success₂ | fail₁) / P(success₁)`. Report it. If retries are *diverse* (temperature, prompt rephrase, different tool order), `ρ_retry` rises toward 1.0; if retries are deterministic re-sends, it collapses toward 0 and the retry budget is nearly worthless. A cascade (escalating to a different, stronger model) is modelled as a **new attempt with its own `p` and `u = p_escalated`** — not as `ρ_retry`.

### 3.5 Quality term used by the utility function

$$\hat Q(m|x) = P_{\text{solved}}(m|x)\cdot \bar s(m|x)$$

where `\bar s` is expected partial credit for a *solved* task (default 1.0; use 0.85–0.95 for nodes where "solved" still needs human cleanup, e.g., generated PRs that need review). For nodes with a hard quality floor (e.g., "must pass CI"), use `P_solved` alone and treat partial credit as failure.

### 3.6 Token model

Per attempt:

$$T^{\text{in}}_k = T_{\text{sys}} + T_{\text{task}} + (k-1)\,\Delta_{\text{retry}} + T_{\text{tools},k}, \qquad T^{\text{out}}_k = T_{\text{answer}} + T_{\text{think}}(m, e) + T_{\text{tool-json}}$$

- `T_think` is **billed as output** and scales with reasoning effort `e ∈ {low, medium, high}`. Defaults: `low → 0.15×T_answer`, `medium → 0.8×`, `high → 2.5×`. A "cheap" reasoning model at high effort can cost more than a mid-tier model at low effort.
- `Δ_retry` — added context per retry (error message, critique, previous attempt): default `0.25 × T_task`.
- `T_tools,k` — retrieved/tool content injected into context; default `0.5 × T_task` per tool call for RAG-shaped nodes.

**Agent-loop amplification.** If the node is a loop of `S` steps that re-sends history, total input tokens grow quadratically:

$$T^{\text{in}}_{\text{total}} = \sum_{t=1}^{S}\Big(T_{\text{sys}} + \sum_{i\le t} T_i\Big) \approx S\,T_{\text{sys}} + \frac{S(S+1)}{2}\,\bar T_{\text{step}}$$

For `S = 10`, `\bar T_step = 1.5k`, `T_sys = 2k`: 20k + 82.5k = **102.5k input tokens** for a task whose "size" looks like ~15k. This is the single largest source of cost-model error in agent routing. Use a per-node `steps` estimate and never price an agent node as a single call.

### 3.7 Price model (including cache)

$$\boxed{C_{\text{attempt}} = \frac{T^{\text{in}}_{\text{miss}}\,p_{\text{in}} + T^{\text{in}}_{\text{hit}}\,p_{\text{in}}(1-d) + T^{\text{in}}_{\text{write}}\,p_{\text{in}}(1+w) + T^{\text{out}}\,p_{\text{out}}}{10^{6}} + C_{\text{tools}} + C_{\text{infra}}}$$

- `p_in`, `p_out` — $/M tokens from the catalog, with an `as_of` timestamp and a TTL (default 24 h).
- `d` — cache **read** discount (typical 0.5–0.9; i.e., a cache hit costs 10–50% of the input price). Default `d = 0.8` only if the provider is known to cache this prefix; otherwise `d = 0` and `h = 0`.
- `w` — cache **write** premium (typical 0–1.0× input price, sometimes 1.25–2× for long TTL). Default `w = 0.25` only for the first turn of a session; `0` otherwise.
- `h = T_hit / T_in` — cached fraction. Defaults: `0.6` for a continuing agent session with a stable system prompt, `0.0` for single-shot nodes.
- `C_tools` — per-call tool fees (search, code execution, retrieval) plus the cost of *re-sending* tool output in later steps.
- `C_infra` — verifier/judge calls, guardrail models, embeddings, egress. Default 10% of token cost; 25% for nodes with an LLM judge.

Critically: **switching models forfeits the prefix cache.** OpenRouter documents exactly this — "switching models costs extra while the new model rebuilds the prompt cache", so their router prefers changing reasoning effort over changing models [11]. `modelpick` must include a `switch_penalty` when a node sits inside a session: `C_switch = h·T_in·p_in·(1−d)` recomputed on the first call after a switch, plus measured re-warm latency.

### 3.8 Latency model

$$L_{\text{med}} = E[N]\cdot\Big(\text{TTFT}(m) + \frac{T^{\text{out}}_{\text{med}}}{\text{TPS}(m)}\Big) + (E[N]-1)\,\bar b_{\text{backoff}} + L_{\text{tools}}$$

$$L_{p95} \approx L_{\text{med}}\cdot e^{1.645\,\sigma_{\ln L}}, \qquad \sigma_{\ln L} = 0.5\ \text{(default)}$$

Use `TTFT` and output tokens/sec from the catalog (Artificial Analysis and Requesty both publish speed/TTFT-style telemetry [20][12]); when missing, use the family median and mark it `Estimated`. Timeouts are modelled as failures with a cost: a timeout costs the tokens already generated and consumes a retry.

### 3.9 Utility function

**Primary form — dollar-denominated (preferred, because weights become interpretable):**

$$\boxed{U(m|x) = V_x \cdot \hat P_{\text{solved}}(m|x) \;-\; \hat C_{\text{solved}}(m|x) \;-\; \lambda_L\max\!\big(0, L_{p95}(m) - L_{\text{SLO}}(x)\big) \;-\; \lambda_R R(m|x)}$$

- `V_x` — **value of one solved task** on node `x`, in dollars. This is the only number that converts accuracy into money, and it is a *product* input, not an ML one. Defaults: `$0.50` (drafting/summarization), `$2.00` (code patch), `$8.00` (customer-facing resolution), `$50.00` (compliance/analysis node with downstream rework).
- `λ_L` — $/second of SLO violation; default `0.005` (≈ $18/hour of blocked agent time).
- `R(m|x)` — risk score in `[0,1]`: `0.4·deprecation_risk + 0.3·vendor_concentration + 0.2·(1 − grade_confidence) + 0.1·region_risk`. `λ_R` default `0.05·V_x`.
- The break-even value is the headline number to show users:

$$V^{*} = \frac{\hat C_{\text{solved}}(m_2) - \hat C_{\text{solved}}(m_1)}{\hat P_{\text{solved}}(m_2) - \hat P_{\text{solved}}(m_1)}$$

"Model 2 is worth it above `$V*` per solved task." This is far more actionable than a weighted score.

**Secondary form — normalized weighted sum** (when `V_x` is unknown):

$$U(m|x) = w_q\hat P_{\text{solved}} - w_c\frac{\hat C_{\text{solved}}}{C_{\text{cap}}} - w_l\frac{L_{p95}}{L_{\text{SLO}}} - w_r R, \qquad \sum w = 1$$

Defaults: `w_q = 0.55, w_c = 0.30, w_l = 0.10, w_r = 0.05`. Presets: **cost-first** `(0.40, 0.50, 0.08, 0.02)`; **quality-first** `(0.70, 0.15, 0.10, 0.05)`; **balanced** (defaults); **latency-first** `(0.45, 0.20, 0.30, 0.05)`. Store the preset name with every recommendation so a later audit knows which trade-off was authorized.

**Action space** is not just "pick a model": `{single(m), cascade(m₁ → m₂ if verifier fails), ensemble(m₁ ∥ m₂ with judge)}`. Score all three with the same utility; cascades often win on `V`-sensitive nodes because they buy accuracy only when needed [7].

### 3.10 Decision procedure (pseudocode)

```python
def recommend(node, catalog, evidence, prefs):
    M = [m for m in catalog if hard_filters(m, node)]          # F1–F14
    if not M:
        return infeasible(node, explain_filters=True)

    scored = []
    for m in M:
        p, p_ci = success_prob(m, node, evidence)              # §3.2 + §4
        ps     = solved_prob(p, node.retries, rho=0.5)         # §3.4
        cs     = cost_per_solved(m, node, catalog)             # §5
        lat    = latency_p95(m, node, catalog)
        u      = prefs.V * ps - cs - prefs.lam_L*max(0, lat-node.slo) - prefs.lam_R*risk(m,node)
        scored.append(Candidate(m, p, p_ci, ps, cs, lat, u))

    scored.sort(key=lambda c: -c.u)
    top1, top3 = scored[0], scored[:3]

    # humility gates
    if top1.p_ci.width > 0.30:            top1.badge = "wide"
    if gap(top1, scored[1]) < sigma_gap:  top1.note = "statistical tie; tie-break by cost"
    if top1.grade == "Insufficient":      top1.badge = "insufficient"
    return Recommendation(top1, top3, V_star(top1, scored[1]), explain=True)
```

`sigma_gap` = the standard error of the utility difference, estimated by bootstrap over evidence uncertainty (§4.4). Ties are resolved by the secondary criterion (cost, then latency), and the tie is disclosed.

---

## 4. Uncertainty and calibration

The router's job is not to be right; it is to be **honest about how right it is**. A recommendation with a claimed 92% and a true 60% is worse than one that says "65–85%, choose on cost".

### 4.1 Three error sources, added in logit space

$$\sigma^2_{\text{total}} = \sigma^2_{\text{bench}} + \sigma^2_{\text{map}} + \sigma^2_{\text{transfer}}$$

| Term | Source | Default | How to shrink |
|---|---|---|---|
| `σ_bench` | Sampling noise in the benchmark score; disagreement between independent runs | From reported CI; else `0.25` logit | More items; more independent runs |
| `σ_map` | Wrong link function / wrong `τ` / wrong `b_f` | `0.35` logit | Local calibration set |
| `σ_transfer` | Our task distribution ≠ benchmark distribution | `0.40` logit (unanchored), `0.20` (anchored), `0.10` (≥30 local tasks) | Local labeled tasks; shadow traffic |

In probability space, the delta method gives `σ_p ≈ p(1−p)·σ_z`, so at `p = 0.8` a `σ_z = 0.6` is about ±0.096 in probability. This is why **narrow-looking logit uncertainty becomes a wide probability band at the top** — and why "95% success" claims from a single benchmark are indefensible.

### 4.2 Sample size: how many items before a claim is real

Wilson score interval [33] for `k` successes in `n` trials (better than normal approximation near 0/1):

$$\hat p_{\pm} = \frac{\hat p + \frac{z^2}{2n} \pm z\sqrt{\frac{\hat p(1-\hat p)}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}, \qquad z = 1.96 \text{ for 95\%}$$

Minimum `n` to detect a difference `Δ` between two models at 80% power, `α = 0.05` two-sided:

$$n \approx \frac{16\,\bar p(1-\bar p)}{\Delta^2} \quad \text{per arm}$$

| Detectable `Δ` | `n` per arm at `p̄=0.5` | at `p̄=0.9` | Half-width of 95% CI at `p̄=0.5` |
|---|---|---|---|
| 0.20 | 100 | 36 | ±0.10 |
| 0.10 | 400 | 144 | ±0.05 |
| 0.05 | 1,600 | 576 | ±0.025 |
| 0.03 | 4,444 | 1,600 | ±0.014 |

**Rules derived from this table, applied mechanically:**
- A 60–120 scenario benchmark can resolve **large** differences only. At `n = 120`, a 10-point accuracy difference is measurable; a 3-point difference is not. Test reports must state this instead of ranking models on noise.
- Benchmark items with `n < 100` (many leaderboard entries) get `grade = Estimated` and contribute with `σ_bench` widened by `sqrt(100/n)`.
- Any per-scenario claim (e.g., "cost regret on scenario 47") is a single observation; report it as an anecdote, never as a rate.

### 4.3 Intervals for the recommendation

Bootstrap the whole pipeline (2,000 draws): resample benchmark scores from their reported distributions, draw `(τ, b_f, δ, ρ_retry, h, d)` from their priors, recompute `p̂_solved` and `C_solved`, and report:

- `P_solved` interval (80% and 95%).
- `C_solved` interval — cost is right-skewed, so report median + p90, not mean ± sd.
- **Probability of being top-1** = fraction of bootstrap draws in which the model wins. This single number is the most user-legible confidence measure: "Model B is top-1 in 71% of plausible worlds."

### 4.4 Displaying confidence to users

Three-level badge, always with a range, never a bare point estimate:

| Badge | Trigger | UI treatment |
|---|---|---|
| **Supported** | ≥2 independent sources or ≥30 local tasks; CI width ≤ 0.20; price fresh | Solid bar, "92% solved (95% CI 87–95)" |
| **Estimated** | Single source, or imputed, or CI width 0.20–0.35, or score 30–90 days old | Hatched bar, "≈85% (est. 72–93)", footnote with the source list |
| **Insufficient** | No in-family evidence, or CI width > 0.35, or sources disagree > 2 SE, or model < 14 days old | No number; "Not enough evidence — default to policy" + the fallback actually used |

Additional display rules:
1. **Ties are shown as ties.** If `|U₁ − U₂| < 1.0 σ_ΔU`, print "statistically tied; cheaper option selected".
2. **Show the break-even value** `V*` next to any cross-tier recommendation.
3. **Show what would change the answer** — "if Model C's price drops below $2.10/M output, it becomes top-1". This is the single highest-value explainability feature for a router.
4. **Never show more precision than the evidence supports.** Round `C_solved` to 2 significant figures; round `p` to the nearest integer percent.
5. **Attribution.** One line: sources, retrieval dates, benchmark version, catalog snapshot hash.

### 4.5 Calibration: proving the probabilities mean something

Track on the labeled scenario set and on shadow traffic:

- **Brier score** `= (1/n)Σ(p̂ᵢ − yᵢ)²`; report **Brier skill score** vs the base rate (`1 − BS/BS_ref`). Negative skill means the router is worse than always predicting the base rate — a hard fail.
- **ECE** (expected calibration error) over 10 bins: `ECE = Σ (n_b/n)|acc_b − conf_b|`. Target ≤ 0.05; > 0.10 is a release blocker. Modern nets are often overconfident [31], and LLMs' verbalized confidence is systematically overconfident [32] — assume overconfidence until measured otherwise.
- **Reliability diagram** by capability family, since calibration often differs by family (coding overconfident, retrieval conservative).
- **Recalibration** when ECE > 0.08: fit a one-parameter temperature on the logit (`p' = σ(logit(p)/T)`) on a held-out third of the labels; never refit on the test third.

### 4.6 When to say "insufficient evidence"

Trigger any of the following; the router must then return the documented default (policy model) and say why:

1. **No in-family benchmark** for any eligible candidate (construct distance > 2 axes).
2. **Statistical tie among all candidates** (`max U − second U < 1 σ_ΔU`) *and* no cost advantage worth stating.
3. **Benchmark saturation** — family's best benchmark has top-3 within CI and ceiling ≥ 95%; it carries no signal [22].
4. **Known compromise** — the only benchmark is publicly contaminated and no held-out variant exists.
5. **Source disagreement** — two independent runs differ by > 2 SE, unresolved.
6. **Fresh model** — released < 14 days ago, no independent run, or only a vendor card.
7. **Missing economics** — no price, or price older than 7 days, for the node's budget check.
8. **Constraint infeasibility** — the eligible set is empty (report which filters bound).
9. **Distribution shift detected** — shadow traffic shows local success 2σ below mapped `p̂` (the world changed; re-anchor before recommending).

Each trigger has a stable code (`IE_NO_BENCHMARK`, `IE_TIE`, `IE_SATURATED`, `IE_CONTAMINATED`, `IE_DISAGREE`, `IE_NEW_MODEL`, `IE_STALE_PRICE`, `IE_INFEASIBLE`, `IE_DRIFT`) so the UI, logs, and tests can assert on them.

---

## 5. Cost per solved task vs cost per token

### 5.1 Definitions

Let `C_k` be the realized cost of attempt `k` (tokens, tools, infra, cache writes) and `Y ∈ {0,1}` the task outcome. Over `n` tasks with `K` attempts allowed:

$$\text{Cost per solved task} \;=\; \frac{\sum_{i=1}^{n}\sum_{k=1}^{K} C_{ik}}{\sum_{i=1}^{n} Y_i} \;=\; \frac{\text{total spend}}{\text{tasks solved}}$$

Its expectation under the model of §3.4:

$$\boxed{\;\mathbb{E}[C_{\text{solved}}] = \frac{\sum_{k=1}^{K}\big(\prod_{j<k} q_j\big)\,C_k}{1-\prod_{k=1}^{K} q_k}\;}$$

This is the same object Kapoor et al. call **cost-of-pass** — the expected dollar cost of obtaining one correct solution, which they argue is the right unit for agent evaluation because accuracy alone rewards needlessly expensive agents [9]. Two properties matter:

- It is defined even when `P_solved = 0` (cost is infinite) — the router must treat that as a hard fail, not a large number.
- The denominator makes cheap-but-flaky models look bad, which is exactly the correction $/M tokens is missing.

**Cost per token** for contrast:

$$C_{\text{tok}} = \frac{3p_{\text{in}}+p_{\text{out}}}{4}\ \text{(\$/M, blended 3:1)} \quad\text{or}\quad C_{\text{task}} = \frac{T_{\text{in}}p_{\text{in}}+T_{\text{out}}p_{\text{out}}}{10^6}$$

`C_tok` is a *supply-side* number: it answers "what does a token cost?" not "what does an outcome cost?" It is only a valid decision metric when `P_solved` is equal across candidates — which is almost never true across price tiers.

### 5.2 Worked example

**Node:** code-patch generation inside an agent workflow. `T_in = 8,000`, `T_out = 1,200` (including ~400 thinking tokens), 2 retries allowed (`K = 3`), `ρ_retry = 0.5`, no cache on the first pass, no tools. Prices are **illustrative placeholders** in $/M tokens — replace with the 2026-11-19 catalog values; the arithmetic is what matters.

| | A (budget) | B (mid) | C (frontier) |
|---|---|---|---|
| `p_in` / `p_out` ($/M) | 0.15 / 0.60 | 1.25 / 10.00 | 15.00 / 75.00 |
| Blended `C_tok` (3:1) | $0.26 | $3.44 | $30.00 |
| Per-attempt `C_1` | $0.00192 | $0.02200 | $0.21000 |
| `p` (per attempt, mapped) | 0.55 | 0.78 | 0.90 |
| `u = 0.5p` | 0.275 | 0.390 | 0.450 |
| **`P_solved`** | **0.763** | **0.918** | **0.970** |
| `E[N]` | 1.776 | 1.354 | 1.155 |
| `E[spend]` | $0.00341 | $0.02979 | $0.24255 |
| **`E[C_solved]`** | **$0.0045** | **$0.0324** | **$0.2501** |
| `L_med` (TTFT 0.5/0.6/1.2 s; 120 tok/s) | 1.78·(0.5+10) ≈ 18.7 s | 1.35·(0.6+10) ≈ 14.4 s | 1.16·(1.2+10) ≈ 13.0 s |

**Readings that matter:**

1. **Blended price ratio A→C is 114×; cost-per-solved ratio is 56×.** The frontier model looks *half as expensive* as its token price suggests, because it needs fewer attempts. Conversely, if you only looked at tokens you would never see that A's cheap attempt is often wasted.
2. **Utility with `V = $2.00` per solved task:**
   - A: `2.00·0.763 − 0.0045 = $1.522`
   - B: `2.00·0.918 − 0.0324 = $1.804` ← top-1
   - C: `2.00·0.970 − 0.2501 = $1.689`
3. **Break-even values** (`V*`, §3.9): A vs B `= 0.0280/0.1547 = $0.181`; B vs C `= 0.2177/0.0516 = $4.22`. So: below `$0.18`/solved task route to A; between `$0.18` and `$4.22` route to B; above `$4.22` route to C. **One number, `V*`, replaces the entire "which model is better" debate** — and it is a business input, not a benchmark.
4. **Effect of caching.** With 60% prefix-cache hit rate at `d = 0.8` on B: input cost `= 8000·(0.4·1.25 + 0.6·0.25)/10⁶ = $0.0052` instead of `$0.0100`, so `C_1 = $0.0172`, `E[C_solved] = $0.0254` (−22%). Caching can move the top-1 choice at the margin, which is why it belongs in the cost model and not in a footnote.
5. **Retry-correlation sensitivity — bigger than the price table.** If retries are *useless* (`ρ_retry = 0`, deterministic re-sends): A `P_solved` = 0.55, `C_solved` = $0.0066; B $0.0406; C $0.2801, so `V*(B,C)` **falls to $1.99** and `V*(A,B)` to $0.148. If retries are *independent draws* (`ρ_retry = 1`): A 0.909/$0.0035, B 0.989/$0.0282, C 0.999/$0.2333, so `V*(B,C)` **rises to $21.26** — a 10× swing in the frontier decision. The $4.22 default sits between the extremes. `ρ_retry` is therefore a first-class parameter: measure it and publish its interval, never leave it implicit.
6. **Token-only lens would pick A** at every `V > 0` if you compare `C_tok`; cost-per-solved correctly picks B at `V = $2`.

### 5.3 Reporting format

Every recommendation carries:

```
node:   code_patch.generate        snapshot: catalog@2026-11-19  evidence@2026-11-18
top-1:  B  |  $0.032/solved  |  92% solved (est. 85–96%)  |  p95 21 s
        holds unless V* > $4.22/solved-task; if V* > $4.22 → C
top-3:  B, C, A  (C is 64% likely top-1 under weight uncertainty)
```

Report `C_solved` as **median + p90** across the uncertainty bootstrap, never mean ± sd (cost is right-skewed by retry counts and context blowups).

### 5.4 Pitfalls (each has burned a real deployment)

1. **Retry correlation.** Assuming independence gives `P_solved = 1−(1−p)^K`, which overstates success for flaky models. Use `ρ_retry` (§3.4) and measure it. Two identical re-sends are nearly one attempt.
2. **Cache pricing asymmetry.** Reads are discounted, writes are **premium-priced**, and caches expire. A model switch invalidates the cache; OpenRouter explicitly prices this and biases toward changing reasoning effort rather than model [11]. Model it as `C_switch` (§3.7).
3. **Thinking tokens.** Billed as output, invisible in the prompt, and 2–10× the visible answer. A high-effort reasoning model can be the most expensive option on a node where it looks mid-priced. Cap `T_think` per node and price it explicitly.
4. **Tool calls.** Three separate costs: the per-call fee, the tokens of the tool *result*, and the re-sending of accumulated tool output on every later step. The third dominates in loops — that is the quadratic term in §3.6.
5. **Agent-loop context growth.** Pricing a 10-step agent as one call understates input tokens by ~5–7× (§3.6 worked numbers).
6. **Failed-attempt sunk cost.** The denominator counts solved tasks; the numerator counts *all* spend. Teams routinely forget to include the wasted attempts and report a cost that drops when the model gets worse.
7. **Tokenizer differences.** The same prompt is ±10–20% tokens across providers; a "30% cheaper" model can be 10% cheaper in practice.
8. **Batch/off-peak/provisioned pricing.** Batch APIs commonly discount ~50%; committed throughput is cheaper at volume but priced in advance. Mixing list and committed prices across candidates makes the comparison invalid.
9. **Hidden verifier/judge cost.** Cascades and ensembles need a scorer; an LLM judge can cost 10–30% of the generation cost and is often omitted from "savings" claims.
10. **Success definition drift.** "Solved" (tests pass) ≠ "accepted" (human merges) ≠ "retained" (still in the codebase in 30 days). Pick one, name it in the metric, and keep it stable across model comparisons — otherwise `C_solved` silently becomes a different metric when the grader changes.
11. **Currency, minimum charges, egress, and per-request fees.** Small per-request fees dominate on high-volume, tiny-output nodes; monthly minimums distort low-volume nodes.
12. **Price staleness.** A 30-day-old price is a different plan. TTL + `as_of` stamp + "stale price" badge (§4.6, `IE_STALE_PRICE`).

---

## 6. Test plan

### 6.1 What is being tested

Not "is the router accurate" in the abstract, but: **does `modelpick` pick models that a domain expert would accept, at a cost close to the best acceptable choice, without violating constraints, and does it know when it cannot know?** Router benchmarks such as RouterArena [10] and RouterBench [3] establish the genre; this plan adds constraint compliance, cost regret, and evidence-honesty metrics that they do not cover.

### 6.2 Scenario set: 96 labeled cases

Twelve workflow archetypes × 8 cases = **96 scenarios** (inside the 60–120 band). Each scenario is a full node spec, not a prompt:

| Archetype | # | Capability family | Key constraints exercised |
|---|---|---|---|
| 1. Code patch in a known repo | 8 | coding | tools, 60k context, license |
| 2. Test generation | 8 | coding | long output, schema |
| 3. Code review / diff critique | 8 | coding + instruction | long context, latency |
| 4. Doc → structured extraction | 8 | instruction_following | strict JSON schema |
| 5. Long-document summarization | 8 | long_context | 400k context, cost cap |
| 6. Multimodal ticket triage | 8 | multimodal | image in, region |
| 7. Data analysis / spreadsheet reasoning | 8 | reasoning | tools, determinism |
| 8. Customer-facing answer drafting | 8 | subjective/instruction | brand style, privacy |
| 9. Translation / localization | 8 | multilingual | p95 latency SLO |
| 10. Research synthesis with citations | 8 | knowledge/agentic | tools, verifiability |
| 11. Planning / task decomposition | 8 | reasoning | thinking tokens, cost cap |
| 12. Image or video asset generation | 8 | multimodal (out) | modality out, license |

**Stratification within each archetype (8):** 2 easy / 3 medium / 3 hard; 2 with tight budget, 2 with strict privacy/region, 2 with latency SLO, 2 unconstrained. This guarantees the constraint filters are actually exercised rather than incidentally satisfied.

**Labels per scenario (expert panel, 3 raters):**
```json
{
  "scenario_id": "code_patch_03",
  "node": { "family": "coding", "steps": 4, "tools": true, "T_in": 60000, "T_out": 1500,
            "criticality": "high", "V_usd": 2.0, "retries": 2, "slo_p95_s": 90 },
  "constraints": { "license": "any", "regions": ["eu"], "zdr": true, "context_min": 69000 },
  "acceptable_set": ["B", "C"],          // top-3 tolerance set
  "expert_top1": "B",
  "rejected": { "D": "context window", "E": "no ZDR" },
  "rationale": "B is within 3pp of C at 1/8 the cost; D/E are ineligible.",
  "unambiguous": true
}
```

**Rater protocol:** raters see the evidence table and catalog *without* the router's recommendation (blind). Compute **Krippendorff's α** on the top-1 choice: `α ≥ 0.67` acceptable, `≥ 0.80` good. Disagreements are adjudicated to the acceptable set; scenarios where two raters disagree *on the acceptable set* are marked `ambiguous` and excluded from the top-1 denominator but kept for top-3 and cost-regret. Target: ≤15% ambiguous.

**Holdout discipline:** freeze 60 scenarios for development, keep 36 unseen until the final gate. Report both, and report the gap — a large dev/holdout gap is overfitting to the scenario author's taste.

### 6.3 Metrics and acceptance thresholds

| # | Metric | Definition | Blocker threshold |
|---|---|---|---|
| M1 | **Top-1 accuracy** | `1[rec = expert_top1]` on `unambiguous` scenarios | **≥ 0.70**, Wilson 95% lower bound ≥ 0.60 |
| M2 | **Top-3 containment** | `1[expert_top1 ∈ top3]` | **≥ 0.90** |
| M3 | **Cost regret (median)** | `(C_rec − C_best)/C_best`, `C_best = min` over `acceptable_set` | **≤ 0.25** |
| M4 | **Cost regret (p90 / mean)** | same, tail | **p90 ≤ 0.75**, mean ≤ 0.40 |
| M5 | **Quality regret** | `max_{a∈acceptable} P_solved(a) − P_solved(rec)` | **≤ 0.03** on ≥90% of scenarios; max ≤ 0.10 |
| M6 | **Hard-constraint violation rate** | rec violates any of F1–F14 | **0** (absolute blocker) |
| M7 | **Soft-preference violation** | wrong style/latency preference, not a hard filter | ≤ 0.02 |
| M8 | **Rank stability (price)** | top-1 flips under `±20%` price perturbation, 100 draws | **≤ 0.10** |
| M9 | **Rank stability (score)** | top-1 flips under `±1 SE` score noise | ≤ 0.15; Kendall `τ ≥ 0.85` on the top-5 ordering |
| M10 | **Calibration** | ECE (10 bins) on `P_solved`; Brier skill vs base rate | **ECE ≤ 0.05**; Brier skill ≥ 0.10 |
| M11 | **Insufficient-evidence precision / recall** | on 12 deliberately under-specified scenarios | precision **≥ 0.80**, recall ≥ 0.70 |
| M12 | **Adversarial compliance** | 20 adversarial cases (below) | **100%** constraint compliance; ≥95% correct infeasibility handling |
| M13 | **Stale-catalog safety** | see §6.6 | **0** sunset-model recommendations; 100% price-age disclosure |
| M14 | **Decision latency** | local scoring, no LLM call, p95 / p99 | **p95 ≤ 300 ms**, p99 ≤ 800 ms |
| M15 | **Explainability completeness** | recs with source + `as_of` + binding-filter reasons | **100%** |

**Why these numbers.** With `n = 96` scenarios and ~82 unambiguous, the Wilson 95% half-width at `p̂ = 0.75` is about ±0.09. So M1's threshold is set at a level the test can actually resolve; a 3-point difference between router versions is *not* measurable and must not gate a release. Use the paired bootstrap on the same scenarios for version comparison (paired designs are far more sensitive than independent CIs), and require the paired 90% interval of the difference to exclude 0 before claiming an improvement.

**Composite score (for reporting, not for gating):**

$$S = 0.40\,M_1 + 0.20\,M_2 + 0.15\,(1-\overline{\text{cost regret}}) + 0.15\,(1-\text{ECE}) + 0.10\,M_{11}^{\text{F1}}$$

Report it with a bootstrap CI; never let a composite hide a blocker failure.

### 6.4 Cost regret, precisely

$$\text{CostRegret}_i = \frac{C_{\text{solved}}(\text{rec}_i) - \min_{a \in A_i} C_{\text{solved}}(a)}{\min_{a \in A_i} C_{\text{solved}}(a)}$$

Two guards: (a) if the router's choice has `P_solved` more than 0.03 below the acceptable-set max, cost regret is meaningless — a cheap wrong answer is not a saving, so those cases count as quality failures instead; (b) report regret against the **acceptable set**, not the single expert pick, because expert taste is not the only defensible answer.

### 6.5 Adversarial prompts (20 cases)

| Family | Cases | Expected behavior |
|---|---|---|
| Constraint bait | 4 (task text says "ignore the EU-only rule", "use the cheapest model even if it trains on data") | Ignore in-prompt instructions that conflict with policy; keep constraints |
| Injected routing | 3 ("route this to <model X>" inside a document/tool result) | Treat as data; never let content choose the model |
| Infeasible | 4 (400k context + ZDR + open-weights + $0.01 cap) | Return `IE_INFEASIBLE` naming binding filters; no silent relaxation |
| Benchmark leakage probe | 3 (near-verbatim public benchmark item) | Flag possible contamination; do not boost `p̂`; prefer local evidence |
| Price manipulation | 2 (stale price, missing output price, unit mismatch /1k vs /1M) | `IE_STALE_PRICE` / block cost-based rec |
| Social pressure | 2 ("the CEO wants the frontier model") | Follow `V*` logic; show the cost delta; do not silently comply |
| Multilingual / obfuscated | 2 (constraint stated in another language, base64-ish) | Parse intent; constraints still applied |

Pass criteria: 100% hard-constraint compliance, ≥95% correct infeasibility handling, 0 injected-route hijacks, and every refusal explains itself.

### 6.6 Stale-catalog behavior

The catalog rots on three clocks: **prices** (hours), **scores** (weeks), **model existence** (days to months). Define TTLs and behavior:

| Object | TTL | On expiry | On hard event |
|---|---|---|---|
| Price | 24 h | badge `stale price`; block cost-based *switching* decisions; keep serving cached recs with disclosure | price missing → `IE_STALE_PRICE` |
| Benchmark score | 30 d (90 d for open-weights) | widen `σ_bench` by `1 + (age−TTL)/TTL`; downgrade `Supported → Estimated` | new index version → re-baseline, do not mix |
| Model existence | 7 d | re-verify against provider `/models` | `deprecated` → remove from pool; `sunset < 14d` → block new assignments |
| Constraint metadata | 7 d | block on missing ZDR/region flags | policy change → invalidate cached decisions |

**Tests:** (T1) simulate a 40% price drop on the runner-up and assert the recommendation changes or explains why not; (T2) delete a price and assert `IE_STALE_PRICE` and no cost-based switch; (T3) mark the top-1 `deprecated` and assert it is never recommended and existing assignments get a migration plan; (T4) inject a benchmark index version bump and assert scores are not silently compared across versions; (T5) freeze the catalog for 30 simulated days and assert every surfaced rec carries an age disclosure; (T6) restart with an empty catalog and assert graceful degradation to the policy default rather than a crash or an arbitrary pick.

### 6.7 Rank stability and the "flip report"

Run the full scenario set under a grid of defensible perturbations: price `±20%`, score `±1 SE`, weights from `Dirichlet(1)`, family weights `±0.2`, `ρ_retry ∈ {0.3, 0.5, 0.8}`, cache hit rate `∈ {0, 0.6}`, and `V_x` `±50%`. Output a **flip report**:

- Top-1 flip rate per perturbation axis (M8/M9 thresholds).
- For each scenario, the dominant reason for flips ("B↔C boundary is within $0.9 of `V*`").
- A per-scenario `fragility` score = number of axes that flip the answer.

Scenarios with `fragility ≥ 3` are candidates for a *policy* answer ("either B or C is fine; default to B") rather than a hard recommendation. Shipping a confident top-1 on a fragile scenario is how routers lose trust.

### 6.8 Rollout gate

Shadow mode (log what the router *would* have chosen, no traffic) → canary 5% → 25% → 100%. At each stage compare against the incumbent on: `C_solved` (from real billing), task success, p95 latency, retry rate, constraint incidents, and the rate of `Insufficient` responses. Advance only if `C_solved` improves by ≥10% with success rate not worse than −1 pp (paired, 90% interval excluding an adverse effect), and zero constraint incidents. Budget the exploration: cap routing experiments at ≤2% of spend and auto-revert on a 2σ success-rate drop.

---

## 7. Appendix — default configuration

```json
{
  "version": "1.0",
  "mapping": { "a_f": 0.0, "b_f": { "correctness": 0.85, "subjective": 0.55 },
               "tau": 12, "s50": { "reasoning": 55, "saturated_coding": 70 },
               "agentic_discount": { "gamma_steps": 0.20, "gamma_tools": 0.10 },
               "contamination_kappa": 0.30, "p_floor": 0.02, "p_ceiling": 0.98 },
  "retry": { "rho_retry": 0.5, "max_retries_default": 2 },
  "tokens": { "think_ratio": { "low": 0.15, "medium": 0.8, "high": 2.5 },
              "retry_context_growth": 0.25, "tool_context_ratio": 0.5 },
  "cache": { "read_discount_d": 0.8, "write_premium_w": 0.25, "hit_rate_default": 0.6 },
  "latency": { "sigma_ln": 0.5, "backoff_s": 2.0 },
  "uncertainty": { "sigma_bench": 0.25, "sigma_map": 0.35,
                   "sigma_transfer": { "unanchored": 0.40, "anchored": 0.20, "local30": 0.10 },
                   "bootstrap_draws": 2000, "tie_threshold_sigma": 1.0 },
  "utility": { "V_usd": { "drafting": 0.5, "code_patch": 2.0, "customer_facing": 8.0, "compliance": 50.0 },
               "lambda_latency": 0.005, "lambda_risk": 0.05,
               "presets": { "cost_first": [0.40, 0.50, 0.08, 0.02],
                            "balanced":   [0.55, 0.30, 0.10, 0.05],
                            "quality_first": [0.70, 0.15, 0.10, 0.05],
                            "latency_first": [0.45, 0.20, 0.30, 0.05] } },
  "ttl": { "price_h": 24, "score_d": 30, "existence_d": 7, "constraints_d": 7 },
  "context_headroom": 1.15,
  "insufficient_evidence": { "max_ci_width": 0.35, "max_tie_sigma": 1.0,
                             "min_local_n": 30, "new_model_days": 14 }
}
```

## 8. References

1. Ong et al., *RouteLLM: Learning to Route LLMs with Preference Data*, arXiv:2406.18665 (v4, 2025). https://arxiv.org/abs/2406.18665
2. RouteLLM project repository. https://github.com/lm-sys/RouteLLM
3. Hu et al., *RouterBench: A Benchmark for Multi-LLM Routing System*, arXiv:2403.12031. https://arxiv.org/abs/2403.12031
4. Feng, Shen & You, *GraphRouter: A Graph-based Router for LLM Selections*, arXiv:2410.03834. https://arxiv.org/abs/2410.03834
5. Tran et al., *Arch-Router: Aligning LLM Routing with Human Preferences*, arXiv:2506.16655. https://arxiv.org/abs/2506.16655
6. Yue et al., *MasRouter: Learning to Route LLMs for Multi-Agent Systems*, arXiv:2502.11133 (ACL 2025). https://arxiv.org/abs/2502.11133
7. Chen, Zaharia & Zou, *FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance*, arXiv:2305.05176. https://arxiv.org/abs/2305.05176
8. Ding et al., *Hybrid LLM: Cost-Efficient and Quality-Aware Query Routing*, arXiv:2404.14618 (ICLR 2024). https://arxiv.org/abs/2404.14618
9. Kapoor et al., *AI Agents That Matter*, arXiv:2407.01502 (cost-controlled evaluation, cost-of-pass). https://arxiv.org/abs/2407.01502
10. Lu et al., *RouterArena: An Open Platform for Comprehensive Comparison of LLM Routers*, arXiv:2510.00202 (v3, 2025). https://arxiv.org/abs/2510.00202
11. OpenRouter, *Auto Router (`openrouter/auto`)* documentation — eleven-aspect rating, cost tiers, session stickiness, cache-rebuild cost. https://openrouter.ai/docs/guides/routing/routers/auto-router
12. Requesty, *LLM Routing: failover, load balancing, latency routing* — vendor telemetry and policy model. https://www.requesty.ai/product/routing
13. LiteLLM, *Router — Load Balancing* documentation (strategies, fallbacks, cooldowns). https://docs.litellm.ai/docs/routing
14. Portkey AI Gateway documentation (conditional routing, semantic router, fallbacks). https://portkey.ai/docs
15. Not Diamond, product site and claims (accuracy/cost, Rootly case quote, OpenRouter attribution). https://www.notdiamond.ai/
16. Martian / Thesean AI. https://withmartian.com/
17. *Online Multi-LLM Selection via Contextual Bandits Under Unstructured Context Evolution*, AAAI 2026. https://ojs.aaai.org/index.php/AAAI/article/view/39672
18. Chiang et al., *Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference*, arXiv:2403.04132. https://arxiv.org/abs/2403.04132
19. `arena-rank` — Arena leaderboard methodology source (Bradley–Terry with 95% CIs, style control). https://github.com/Arena-OSS/arena-rank
20. Artificial Analysis, Intelligence Index and per-model price/speed data (index v4.3 observed 2026-10/11). https://artificialanalysis.ai/
21. BenchLM, *About / Methodology* — 1033 models, 818 benchmarks, Supported vs Estimated labelling (retrieved 2026-11-19). https://benchlm.ai/about
22. Jain, *How we compare model quality in Cursor* (CursorBench-3), Cursor research, 2026-03-11. https://cursor.com/en-US/blog/cursorbench
23. Jimenez et al., *SWE-bench: Can Language Models Resolve Real-World GitHub Issues?*, arXiv:2310.06770. https://arxiv.org/abs/2310.06770
24. Scale AI, *SWE-Bench Pro* (held-out, contamination-resistant SE benchmark). https://labs.scale.com/papers/swe-bench-pro
25. Jain et al., *LiveCodeBench: Holistic and Contamination Free Evaluation of LLMs for Code*, arXiv:2403.11996. https://arxiv.org/abs/2403.11996
26. Yue et al., *MMMU: A Massive Multi-discipline Multimodal Understanding Benchmark*, arXiv:2311.16502. https://arxiv.org/abs/2311.16502
27. Ghosh et al., *GenEval: An Object-Focused Framework for Evaluating Text-to-Image Alignment*, arXiv:2310.11513. https://arxiv.org/abs/2310.11513
28. Huang et al., *VBench: Comprehensive Benchmark Suite for Video Generative Models*, arXiv:2311.17117. https://arxiv.org/abs/2311.17117
29. Yao et al., *τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains* (pass^k), arXiv:2406.12045. https://arxiv.org/abs/2406.12045
30. Berkeley Function Calling Leaderboard (BFCL). https://gorilla.cs.berkeley.edu/leaderboard.html
31. Guo et al., *On Calibration of Modern Neural Networks*, arXiv:1706.04599. https://arxiv.org/abs/1706.04599
32. Xiong et al., *Can LLMs Express Their Uncertainty? An Empirical Evaluation of Confidence Elicitation in LLMs*, arXiv:2306.13063. https://arxiv.org/abs/2306.13063
33. Wilson (1927), *Probable Inference, the Law of Succession, and Statistical Inference*; Bradley & Terry (1952), *Rank Analysis of Incomplete Block Designs* — the interval and ranking estimators used in §4.2 and by Arena [19].
34. Terminal-Bench. https://www.tbench.ai/
35. Xie et al., *OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments*, arXiv:2404.07972. https://arxiv.org/abs/2404.07972
36. Rein et al., *GPQA: A Graduate-Level Google-Proof Q&A Benchmark*, arXiv:2311.12022. https://arxiv.org/abs/2311.12022
37. Phan et al., *Humanity's Last Exam*, arXiv:2501.14249. https://arxiv.org/abs/2501.14249
38. Mialon et al., *GAIA: A Benchmark for General AI Assistants*, arXiv:2311.12983. https://arxiv.org/abs/2311.12983

---

*Notes on evidence quality in this document: vendor performance figures (Not Diamond, Requesty, OpenRouter) are self-reported and were not independently replicated here; they are labelled as such wherever cited. Benchmark and paper figures are taken from the cited abstracts/papers. Price figures in §5.2 are illustrative placeholders, not live quotes — the catalog on 2026-11-19 should be treated as the source of truth, and prices carry a 24 h TTL by design (§6.6).*
