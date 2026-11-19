# Quality evidence

Every recommendation carries a `qualityConfidence` block. Text models are `benchmark-backed` (public leaderboard scores, still not a live output benchmark). Image and video models are `mixed` (public arena + prior). 3D and audio models are `expert prior` — the score is a curated prior, not an independent measurement. The field is additive in `schemaVersion: 1.0`. and confidence

ModelPick does not have a proprietary eval lab. It has a **source hierarchy**, a dated catalog, and an explicit confidence level. This page records what each score is based on and where it is weak.

## Evidence hierarchy

| Tier | Example | Weight |
|---|---|---|
| 1. Independent, current, task-matched benchmark | CursorBench 4.0 for agentic coding; BenchLM BenchAlign | highest |
| 2. Provider-run benchmark with published methodology | SWE-bench Pro from a lab | medium-high |
| 3. Human preference / arena | LMArena-style pairwise votes | medium, preference ≠ correctness |
| 4. Vendor claim or spec sheet | "best text rendering", context window | low; used for capability, not score |
| 5. Inference from an adjacent benchmark | overall score used for writing | low; marked estimated |

Every score is dated. A score is not a fact about the model; it is a fact about the evidence on 2026-11-19.

## Capability map

| Capability | Primary evidence | Sample / scope | Known bias | Confidence |
|---|---|---|---|---|
| `overall` | BenchLM BenchAlign (214 models) | mixed public benchmarks, category-weighted | composite; sensitive to category weights | high |
| `coding` | BenchLM coding board (SWE-bench Pro, DeepSWE, CursorBench, SciCode, LiveCodeBench, …) | 91 supported + 69 estimated models | benchmark contamination, language bias | high |
| `codingAgent` | CursorBench 4.0 (21 models) | private tasks from real Cursor sessions | Cursor-specific harness; 21 models | medium-high |
| `reasoning` | BenchLM reasoning category | mixed | saturation at the frontier | medium |
| `longContext` | BenchLM + context window | 128K–1M windows | "needle" tasks ≠ real long-context work | medium |
| `writing` | BenchLM overall + provider positioning | weak | no task-specific writing benchmark | low-medium |
| `multimodal` | BenchLM multimodal + MMMU-family | MMMU/MMMU-Pro | image understanding ≠ image generation | medium |
| `imageGen` | vendor specs, arena-style comparisons, feature fit | 4 models | no independent current leaderboard retrieved | low-medium |
| `imageEdit` | vendor specs, edit consistency reports | 4 models | identity preservation is under-measured | low |
| `textInImage` | vendor claims + examples | 4 models | language/script coverage varies | low |
| `videoGen` | vendor specs, public comparisons | 4 models | no independent VBench run for closed models | low-medium |
| `threeD` | vendor specs, topology/rigging features | 4 models | no independent geometry benchmark retrieved | low |
| `tts` | vendor specs + price/quality positioning | 2 models | voice/style coverage not measured | low-medium |
| `stt` | vendor specs + price | 3 models | noisy-audio WER not independently measured | low-medium |
| `music` | vendor specs | 2 models | no independent music quality metric | low |

The **media scores are the weakest part of the catalog**. They are priors, not measurements. The README, video, and benchmark methodology all say this; the UI prefixes estimated prices with `~`.

## Hugging Face evidence registry

These datasets are the public substrate for the benchmark families. We record their metadata (not re-run closed models) in [`research/hf-evidence.json`](../research/hf-evidence.json):

| Dataset | Role | Rows | Downloads |
|---|---|---:|---:|
| `SWE-bench/SWE-bench_Verified` | agentic coding, verified subset | 500 | 115,563 |
| `ScaleAI/SWE-bench_Pro` | harder coding subset | 1,424 | 40,712 |
| `SWE-bench/SWE-bench_Multilingual` | multilingual coding | 300 | 39,506 |
| `MMMU/MMMU` | multimodal reasoning | 11,550 | 93,177 |
| `lmarena-ai/arena-human-preference-55k` | human preference | 57,477 | 5,952 |
| `open-llm-leaderboard/results` | open-weight results | 0 rows via API | 30,332 |
| `Vchitect/VBench_sampled_video` | video quality | — | 2,236 |

**Why not ingest rows and recompute?** Closed frontier models cannot be re-run from this repository, and a partial re-run would be a different benchmark. The catalog uses published results from these families and labels the confidence. If you have a live eval, contribute it as a scenario or a model override.

## Mapping to 0–100

- Text scores are taken from BenchLM's calibrated 0–100 scale where available.
- `codingAgent` is normalized from CursorBench to 0–100 and blended with the coding score.
- Media scores are anchored to a 0–100 editorial scale: 90+ = best in class, 80–89 = strong, 70–79 = usable, <70 = avoid for customer-facing work.
- A score is rounded to one decimal in output; internal math uses the stored value.

The mapping is monotonic and documented, but it is not a physical measurement. Do not compare a 91 and a 92 as if the difference were statistically meaningful; the benchmark reports quality regret and rank stability for that reason.

## Confidence labels

| Label | Meaning |
|---|---|
| `high` | Top-tier model with a current, independent benchmark and a matching task |
| `medium` | Benchmark exists but is adjacent, old, or provider-run |
| `low` | Vendor claim, spec inference, or no independent benchmark |

`priceConfidence` is separate: `verified` means a first-party or marketplace page was read; `estimated` means the number was derived.

## How to challenge a score

Open a `Model or price update` issue with:

1. The model and capability.
2. A first-party or independent URL.
3. The date you read it.
4. The sample size / task set if it is a benchmark.
5. Whether it changes the top-1 for a benchmark scenario.

A score change without a benchmark before/after will not be merged. That is deliberate: the product's credibility is the only moat it has.
