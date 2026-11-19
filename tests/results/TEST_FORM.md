# Test form

Generated: 2026-11-19T11:06:27.411Z

This is the human-readable evidence sheet. Machine-readable results are in `tests/results/*.json`.

## 1. Automated test suite

- Node tests: **174** passing
- Line coverage: **90.02%**
- Branch coverage: **66.29%**
- Test files: unit, integration, e2e, adversarial
- Adversarial cases: **28/28**

| Layer | Command | Result |
|---|---|---|
| Unit + integration + e2e | `node --test "tests/**/*.test.js"` | all pass |
| Adversarial | `node tests/adversarial/run.js` | 28/28 |
| Coverage | `node --test --experimental-test-coverage "tests/**/*.test.js"` | 90.02% lines |
| Package install | `npm pack` + clean install + `verify` | 13/13 checks |
| Live smoke | `node scripts/live_smoke.js` | see section 5 |

## 2. Decision benchmark

- Dev runs: 115 (top-1 100%, top-3 100%)
- Held-out runs: 35 (top-1 100%, top-3 100%)
- Value simulation: quality parity 94% at 55% of frontier cost

## 3. Per-task matrix (20 rows)

| task | eligible | top model | quality | cost/task | value pick | value cost |
|---|---:|---|---:|---:|---|---:|
| coding-agent | 4 | gemini-4-carbon | 87.3000 | $0.1742 | gemini-4-carbon | $0.1742 |
| code-review | 6 | gemini-4-carbon | 85.2900 | $0.0878 | gpt-6.2-sol | $0.0871 |
| refactor | 6 | gemini-4-carbon | 86.3200 | $0.1935 | gemini-4-carbon | $0.1935 |
| debugging | 6 | gemini-4-carbon | 85.5300 | $0.1315 | gpt-6.2-sol | $0.1303 |
| planning | 6 | gemini-4-carbon | 86.7100 | $0.0686 | gpt-6.2-sol | $0.0670 |
| long-context | 10 | gemini-4-hydrogen | 86.4200 | $0.6470 | gpt-6.1-terra | $0.4725 |
| research | 11 | gpt-6.1-terra | 80.5700 | $0.1638 | gpt-6.1-terra | $0.1638 |
| writing | 9 | gpt-6.2-sol | 87.9200 | $0.0357 | gpt-6.1-terra | $0.0196 |
| translation | 12 | gpt-6.1-terra | 80.5500 | $0.0309 | gpt-6.1-terra | $0.0309 |
| extraction | 20 | claude-haiku-5.5 | 62.4100 | $0.0066 | claude-haiku-5.5 | $0.0066 |
| classification | 22 | claude-haiku-5.5 | 70.9100 | $0.0008 | claude-haiku-5.5 | $0.0008 |
| data-analysis | 6 | gemini-4-carbon | 85.7000 | $0.1454 | gpt-6.2-sol | $0.1441 |
| computer-use | 5 | gemini-4-carbon | 91.3100 | $0.0810 | gemini-4-carbon | $0.0810 |
| image-gen | 4 | nano-banana-2.1 | 93.6500 | $0.0363 | seedream-5.5 | $0.0336 |
| image-edit | 4 | nano-banana-2.1 | 93.8000 | $0.0362 | seedream-5.5 | $0.0334 |
| video-gen | 4 | veo-3.1-fast | 86.0000 | $0.5960 | veo-3.1-fast | $0.5960 |
| 3d-gen | 4 | tripo-h3.1 | 94.0000 | $0.2148 | tripo-h3.1 | $0.2148 |
| tts | 2 | voxtral-tts-3 | 88.0000 | $0.0151 | voxtral-tts-3 | $0.0151 |
| stt | 2 | voxtral-small-transcribe-3 | 90.0000 | $0.0452 | voxtral-small-transcribe-3 | $0.0452 |
| music | 2 | lyria-3.5 | 90.0000 | $0.0904 | lyria-3.5 | $0.0904 |

CSV: [`test-form.csv`](test-form.csv)

## 4. Per-model applicability (40 rows)

| model | modality | eligible nodes | top-1 | top-3 |
|---|---|---:|---:|---:|
| gemini-4-carbon | text | 13 | 7 | 10 |
| gpt-6.1-terra | text | 6 | 2 | 4 |
| claude-haiku-5.5 | text | 2 | 2 | 2 |
| nano-banana-2.1 | image | 2 | 2 | 2 |
| gpt-6.2-sol | text | 12 | 1 | 8 |
| gemini-4-hydrogen | text | 6 | 1 | 3 |
| lyria-3.5 | audio | 1 | 1 | 1 |
| tripo-h3.1 | 3d | 1 | 1 | 1 |
| veo-3.1-fast | video | 1 | 1 | 1 |
| voxtral-small-transcribe-3 | audio | 1 | 1 | 1 |
| voxtral-tts-3 | audio | 1 | 1 | 1 |
| claude-sonnet-5.5 | text | 11 | 0 | 5 |
| claude-opus-5.5 | text | 13 | 0 | 2 |
| deepseek-v4.1-flash | text | 2 | 0 | 2 |
| gpt-6-luna | text | 2 | 0 | 2 |
| gpt-image-2 | image | 2 | 0 | 2 |
| seedream-5.5 | image | 2 | 0 | 2 |
| eleven-v4 | audio | 1 | 0 | 1 |
| gpt-6.2-astra | text | 13 | 0 | 1 |
| gpt-transcribe | audio | 1 | 0 | 1 |
| kling-4.0 | video | 1 | 0 | 1 |
| meshy-7.1 | 3d | 1 | 0 | 1 |
| minimax-music-3 | audio | 1 | 0 | 1 |
| seedance-2.5 | video | 1 | 0 | 1 |
| trellis-2 | 3d | 1 | 0 | 1 |
| claude-fable-5.2 | text | 13 | 0 | 0 |
| deepseek-v4-pro | text | 2 | 0 | 0 |
| gemini-3.8-flash | text | 2 | 0 | 0 |
| gemini-4-argon | text | 6 | 0 | 0 |
| glm-5.3 | text | 2 | 0 | 0 |
| glm-5.3-flash | text | 1 | 0 | 0 |
| gpt-5.6-sol | text | 4 | 0 | 0 |
| grok-4.6 | text | 2 | 0 | 0 |
| hunyuan3d-3.1-pro | 3d | 1 | 0 | 0 |
| kimi-k3 | text | 3 | 0 | 0 |
| kimi-k3.1-pro | text | 5 | 0 | 0 |
| minimax-m3.1-flash | text | 1 | 0 | 0 |
| nano-banana-pro | image | 2 | 0 | 0 |
| qwen3.8-max | text | 2 | 0 | 0 |
| veo-3.1 | video | 1 | 0 | 0 |

Models with zero eligible nodes are a catalog bug; the matrix test fails on them.

## 5. Live smoke (free/public endpoints)

| endpoint | result | latency | evidence |
|---|---|---:|---|
| pollinations-text | pass | 1256 ms | 200 text/plain; charset=utf-8 |
| pollinations-image | pass | 749 ms | 200 image/jpeg |
| github-models | pass | 1087 ms | 200 text/plain |
| ollama-local | pass | 88 ms | 200  |

This is connectivity and response-format evidence, not a model-quality benchmark. No API keys are used.

## 6. Claims audit

| Claim | Evidence | Not proven |
|---|---|---|
| Best value per node | decision benchmark + held-out + value simulation | not a live output benchmark |
| Key-aware fallback | availability + setup tests | not a real provider call |
| Media costs | unit pricing + sources | media quality is an expert prior |
| Connects to agents | setup integration tests | not every client version |
| No key storage | security tests + code review | not a formal audit |

## 7. Missing evidence

- Live calls to paid catalog providers: blocked without keys.
- Independent output benchmark: not available.
- External users: none yet.
- npm registry install and GitHub Actions: blocked by account scopes.

