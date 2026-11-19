# Live endpoint evidence

This is the difference between “the config looks right” and “the endpoint answered”.

## What has been executed

Run:

```bash
node scripts/live_smoke.js
```

Raw receipt: [`tests/results/live-smoke-latest.json`](../tests/results/live-smoke-latest.json).

| Endpoint | Request | Result | Latency |
|---|---|---|---|
| Pollinations text | `GET https://text.pollinations.ai/What%20is%202%2B2%3F` | `200`, body `4` | 0.8s |
| Pollinations image | `GET https://image.pollinations.ai/prompt/...` | `200 image/jpeg`, 1,876 bytes | 0.8s |
| GitHub Models | `POST https://models.github.ai/inference/chat/completions` | `200`, body `OK` | 1.2s |
| Ollama local | `GET http://127.0.0.1:11434/api/tags` → `POST /api/chat` | `200`, model `qwen-local:latest`, body contains `OK` | 0.09s warm (101s cold load) |

These are **connectivity and response-format checks**. They do not measure output quality, and they are not paid catalog providers.

## What this proves

- ModelPick's live-test harness can call a real text endpoint and a real image endpoint.
- The image response is a real JPEG, not an HTML error page.
- The smoke test does not read, print, or store API keys.
- The test is opt-in; `scripts/check.js` stays offline.

## What this does not prove

- That a paid provider key works. That requires the user's key.
- That the local 0.5B model is a quality proxy for a frontier model; it is a transport test.
- That the response quality matches the catalog prior.
- That every endpoint in `catalog/models.json` is correct.

## Adding a paid provider

Do not put keys in the repository.

```bash
export TRIPO_API_KEY=...
export OPENAI_API_KEY=...
node scripts/live_smoke.js
```

Extend `scripts/live_smoke.js` with a case that reads `process.env.<PROVIDER>_API_KEY`, sends one minimal request, and records only:

- endpoint name
- HTTP status
- latency
- response shape (not the full body if it can contain user data)

Never log the key or the Authorization header.

## Why the public endpoints

Pollinations and GitHub Models were reachable without a paid key, so they are useful as a **transport smoke test**. They are not candidates in the 40-model catalog and do not change any recommendation.

## Third provider

Three endpoints have now answered: Pollinations, GitHub Models, and a local Ollama server running `qwen-local:latest` (Qwen2.5-0.5B-Instruct, Q4_K_M, 491 MB).

Be precise about the count: **two external vendors plus one local runtime**. This is three real endpoints, not three independent external vendors. A paid provider key is still the missing test.
