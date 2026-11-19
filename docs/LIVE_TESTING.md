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
| Ollama local | `GET http://127.0.0.1:11434/api/tags` | not running on the build machine | — |

These are **connectivity and response-format checks**. They do not measure output quality, and they are not paid catalog providers.

## What this proves

- ModelPick's live-test harness can call a real text endpoint and a real image endpoint.
- The image response is a real JPEG, not an HTML error page.
- The smoke test does not read, print, or store API keys.
- The test is opt-in; `scripts/check.js` stays offline.

## What this does not prove

- That a paid provider key works. That requires the user's key.
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

The target is at least three independent providers. The current two are Pollinations and GitHub Models. The third slot is intentionally left open until a real key or a local Ollama server is available; do not fake it with a second model behind the same gateway.
