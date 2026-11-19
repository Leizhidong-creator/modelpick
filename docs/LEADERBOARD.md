# ModelPick leaderboard

Catalog `2026.11.19` · generated 2026-11-19 · [methodology](../bench/METHODOLOGY.md)

Two tables per node: **quality-first** (what to use when the output matters) and **value** (what to use when it does not). Cost is **cost per solved task**, not list price. The full interactive tool is `modelpick pick`.

| Key | Meaning |
|---|---|
| quality | 0–100, derived from public benchmarks and capability fit |
| cost | USD per solved task (price × expected attempts) |
| attempts | expected attempts at this quality |
| ctx | context window for text models |

## Agentic coding

`coding-agent` · text

**Quality first**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Claude Fable 5.2 | 92.3 | $0.642 | 1.10 |
| 2 | GPT-6.2 Astra | 88.9 | $0.682 | 1.15 |
| 3 | Gemini 4 Carbon | 87.3 | $0.174 | 1.17 |
| 4 | Claude Opus 5.5 | 86.9 | $0.351 | 1.18 |
| 5 | GPT-6.2 Sol | 84.0 | $0.182 | 1.23 |
| 6 | Claude Sonnet 5.5 | 83.1 | $0.185 | 1.24 |
| 7 | Gemini 4 Hydrogen | 79.1 | $0.147 | 1.32 |
| 8 | Gemini 4 Argon | 78.8 | $0.197 | 1.32 |

**Value**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Gemini 4 Carbon | 87.3 | $0.174 | 1.17 |
| 2 | Claude Opus 5.5 | 86.9 | $0.351 | 1.18 |
| 3 | Claude Fable 5.2 | 92.3 | $0.642 | 1.10 |
| 4 | GPT-6.2 Astra | 88.9 | $0.682 | 1.15 |

## Code review

`code-review` · text

**Quality first**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Claude Fable 5.2 | 91.8 | $0.320 | 1.10 |
| 2 | GPT-6.2 Astra | 91.1 | $0.325 | 1.11 |
| 3 | GPT-6.2 Sol | 85.8 | $0.087 | 1.20 |
| 4 | Claude Opus 5.5 | 85.6 | $0.175 | 1.20 |
| 5 | Gemini 4 Carbon | 85.3 | $0.088 | 1.20 |
| 6 | Claude Sonnet 5.5 | 81.1 | $0.093 | 1.28 |
| 7 | Gemini 4 Argon | 78.3 | $0.097 | 1.33 |
| 8 | Gemini 4 Hydrogen | 78.3 | $0.073 | 1.33 |

**Value**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | GPT-6.2 Sol | 85.8 | $0.087 | 1.20 |
| 2 | Gemini 4 Carbon | 85.3 | $0.088 | 1.20 |
| 3 | Claude Sonnet 5.5 | 81.1 | $0.093 | 1.28 |
| 4 | Claude Opus 5.5 | 85.6 | $0.175 | 1.20 |
| 5 | Claude Fable 5.2 | 91.8 | $0.320 | 1.10 |
| 6 | GPT-6.2 Astra | 91.1 | $0.325 | 1.11 |

## Long-context analysis

`long-context` · text

**Quality first**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Claude Fable 5.2 | 93.3 | $3.14 | 1.08 |
| 2 | GPT-6.2 Astra | 91.7 | $3.22 | 1.10 |
| 3 | Gemini 4 Carbon | 91.4 | $0.808 | 1.11 |
| 4 | GPT-6.2 Sol | 87.5 | $0.851 | 1.17 |
| 5 | Claude Opus 5.5 | 87.4 | $1.70 | 1.17 |
| 6 | Gemini 4 Argon | 86.4 | $0.863 | 1.19 |
| 7 | Gemini 4 Hydrogen | 86.4 | $0.647 | 1.19 |
| 8 | Claude Sonnet 5.5 | 83.3 | $0.901 | 1.24 |

**Value**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | GPT-6.1 Terra | 80.0 | $0.472 | 1.30 |
| 2 | Gemini 4 Hydrogen | 86.4 | $0.647 | 1.19 |
| 3 | Gemini 4 Carbon | 91.4 | $0.808 | 1.11 |
| 4 | GPT-6.2 Sol | 87.5 | $0.851 | 1.17 |
| 5 | Gemini 4 Argon | 86.4 | $0.863 | 1.19 |
| 6 | Claude Sonnet 5.5 | 83.3 | $0.901 | 1.24 |

## Image generation

`image-gen` · image

**Quality first**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Nano Banana Pro | 96.0 | $0.140 | 1.05 |
| 2 | GPT Image 2.6 | 94.0 | $0.057 | 1.07 |
| 3 | Nano Banana 2.1 | 93.7 | $0.036 | 1.08 |
| 4 | Seedream 5.5 | 90.7 | $0.034 | 1.12 |

**Value**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Seedream 5.5 | 90.7 | $0.034 | 1.12 |
| 2 | Nano Banana 2.1 | 93.7 | $0.036 | 1.08 |
| 3 | GPT Image 2.6 | 94.0 | $0.057 | 1.07 |
| 4 | Nano Banana Pro | 96.0 | $0.140 | 1.05 |

## Video generation

`video-gen` · video

**Quality first**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Veo 3.1 | 95.0 | $2.12 | 1.06 |
| 2 | Kling 4.0 | 94.0 | $0.843 | 1.07 |
| 3 | Seedance 2.5 | 93.0 | $2.57 | 1.09 |
| 4 | Veo 3.1 Fast | 86.0 | $0.596 | 1.19 |

**Value**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Veo 3.1 Fast | 86.0 | $0.596 | 1.19 |
| 2 | Kling 4.0 | 94.0 | $0.843 | 1.07 |
| 3 | Veo 3.1 | 95.0 | $2.12 | 1.06 |
| 4 | Seedance 2.5 | 93.0 | $2.57 | 1.09 |

## 3D asset generation

`3d-gen` · 3d

**Quality first**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Tripo H3.1 | 94.0 | $0.215 | 1.07 |
| 2 | Hunyuan3D 3.1 Pro | 91.0 | $0.585 | 1.11 |
| 3 | Meshy 7.1 | 91.0 | $1.34 | 1.11 |
| 4 | TRELLIS 2 | 82.0 | $0.378 | 1.26 |

**Value**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Tripo H3.1 | 94.0 | $0.215 | 1.07 |
| 2 | TRELLIS 2 | 82.0 | $0.378 | 1.26 |
| 3 | Hunyuan3D 3.1 Pro | 91.0 | $0.585 | 1.11 |
| 4 | Meshy 7.1 | 91.0 | $1.34 | 1.11 |

## Text to speech

`tts` · audio

**Quality first**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Eleven v4 | 95.0 | $0.085 | 1.06 |
| 2 | Voxtral TTS 3 | 88.0 | $0.015 | 1.16 |

**Value**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Voxtral TTS 3 | 88.0 | $0.015 | 1.16 |
| 2 | Eleven v4 | 95.0 | $0.085 | 1.06 |

## Speech to text

`stt` · audio

**Quality first**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | GPT Transcribe | 94.0 | $0.048 | 1.07 |
| 2 | Voxtral Small Transcribe 3 | 90.0 | $0.045 | 1.13 |

**Value**

| # | model | quality | cost / solved | attempts |
|---:|---|---:|---:|---:|
| 1 | Voxtral Small Transcribe 3 | 90.0 | $0.045 | 1.13 |
| 2 | GPT Transcribe | 94.0 | $0.048 | 1.07 |

## Notes

- Prices and model ids are a snapshot; run `modelpick update` or check the source link in the catalog.
- Media quality scores are priors, not independent measurements. See [DATA.md](DATA.md).
- The benchmark and raw failures are in [`tests/results/`](../tests/results/).
