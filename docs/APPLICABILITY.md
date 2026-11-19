# Model applicability

Catalog 2026.11.19 · 40 models · 20 task nodes.

Every model must be eligible for at least one node. A model with no top-3 finish is kept only because a task’s hard constraints need it; that is recorded, not hidden.

| Model | Provider | Eligible nodes | Top-1 | Top-3 | Best node | Best quality |
|---|---|---:|---:|---:|---|---:|
| Gemini 4 Carbon | Google | 13 | 7 | 10 | computer-use | 91.3 |
| GPT-6.1 Terra | OpenAI | 6 | 2 | 4 | writing | 81.2 |
| Claude Haiku 5.5 | Anthropic | 2 | 2 | 2 | classification | 70.9 |
| Nano Banana 2.1 | Google | 2 | 2 | 2 | image-edit | 93.8 |
| GPT-6.2 Sol | OpenAI | 12 | 1 | 8 | code-review | 85.8 |
| Gemini 4 Hydrogen | Google | 6 | 1 | 3 | long-context | 86.4 |
| Lyria 3.5 | Google | 1 | 1 | 1 | music | 90 |
| Tripo H3.1 | Tripo | 1 | 1 | 1 | 3d-gen | 94 |
| Veo 3.1 Fast | Google Vertex AI | 1 | 1 | 1 | video-gen | 86 |
| Voxtral Small Transcribe 3 | Mistral AI | 1 | 1 | 1 | stt | 90 |
| Voxtral TTS 3 | Mistral AI | 1 | 1 | 1 | tts | 88 |
| Claude Sonnet 5.5 | Anthropic | 11 | 0 | 5 | code-review | 81.1 |
| Claude Opus 5.5 | Anthropic | 13 | 0 | 2 | code-review | 85.6 |
| DeepSeek V4.1 Flash 1017 | DeepSeek | 2 | 0 | 2 | classification | 74.2 |
| GPT Image 2.6 | OpenAI | 2 | 0 | 2 | image-gen | 94 |
| GPT-6 Luna | OpenAI | 2 | 0 | 2 | classification | 68.9 |
| Seedream 5.5 | fal.ai (ByteDance) | 2 | 0 | 2 | image-edit | 91.2 |
| GPT-6.2 Astra | OpenAI | 13 | 0 | 1 | writing | 91.6 |
| Eleven v4 | ElevenLabs | 1 | 0 | 1 | tts | 95 |
| GPT Transcribe | OpenAI | 1 | 0 | 1 | stt | 94 |
| Kling 4.0 | fal.ai (Kling) | 1 | 0 | 1 | video-gen | 94 |
| Meshy 7.1 | Meshy | 1 | 0 | 1 | 3d-gen | 91 |
| MiniMax Music 3 | MiniMax | 1 | 0 | 1 | music | 84 |
| TRELLIS 2 | fal.ai (Microsoft Research) | 1 | 0 | 1 | 3d-gen | 82 |
| Veo 3.1 | Google Vertex AI | 1 | 0 | 1 | video-gen | 95 |
| Claude Fable 5.2 | Anthropic | 13 | 0 | 0 | writing | 94.7 |
| Gemini 4 Argon | Google | 6 | 0 | 0 | writing | 80.9 |
| Kimi K3.1 Pro | Moonshot AI | 5 | 0 | 0 | long-context | 81.6 |
| GPT-5.6 Sol | OpenAI | 4 | 0 | 0 | research | 76.3 |
| Kimi K3 | Moonshot AI | 3 | 0 | 0 | translation | 70.4 |
| DeepSeek V4 Pro | DeepSeek | 2 | 0 | 0 | extraction | 66.9 |
| Gemini 3.8 Flash | Google | 2 | 0 | 0 | extraction | 62.9 |
| GLM-5.3 | Z.ai | 2 | 0 | 0 | extraction | 61.1 |
| Grok 4.6 | xAI | 2 | 0 | 0 | extraction | 65.9 |
| Nano Banana Pro | Google | 2 | 0 | 0 | image-edit | 96.8 |
| Qwen3.8 Max | Alibaba Cloud | 2 | 0 | 0 | extraction | 63.5 |
| GLM-5.3-Flash | Z.ai | 1 | 0 | 0 | classification | 65.8 |
| Hunyuan3D 3.1 Pro | fal.ai (Tencent Hunyuan) | 1 | 0 | 0 | 3d-gen | 91 |
| MiniMax-M3.1-Flash | MiniMax | 1 | 0 | 0 | classification | 67.6 |
| Seedance 2.5 | fal.ai (ByteDance) | 1 | 0 | 0 | video-gen | 93 |

## Task winners

| Node | Eligible | Top-1 | Quality | Cost | Top-3 |
|---|---:|---|---:|---:|---|
| coding-agent | 4 | gemini-4-carbon | 87.3 | $0.1742 | gemini-4-carbon, claude-opus-5.5, gpt-6.2-astra |
| code-review | 6 | gemini-4-carbon | 85.3 | $0.0878 | gemini-4-carbon, gpt-6.2-sol, claude-sonnet-5.5 |
| refactor | 6 | gemini-4-carbon | 86.3 | $0.1935 | gemini-4-carbon, gpt-6.2-sol, claude-sonnet-5.5 |
| debugging | 6 | gemini-4-carbon | 85.5 | $0.1315 | gemini-4-carbon, gpt-6.2-sol, claude-sonnet-5.5 |
| planning | 6 | gemini-4-carbon | 86.7 | $0.0686 | gemini-4-carbon, gpt-6.2-sol, claude-sonnet-5.5 |
| long-context | 10 | gemini-4-hydrogen | 86.4 | $0.6470 | gemini-4-hydrogen, gemini-4-carbon, gpt-6.1-terra |
| research | 11 | gpt-6.1-terra | 80.6 | $0.1638 | gpt-6.1-terra, gemini-4-hydrogen, gemini-4-carbon |
| writing | 9 | gpt-6.2-sol | 87.9 | $0.0357 | gpt-6.2-sol, gemini-4-carbon, gpt-6.1-terra |
| translation | 12 | gpt-6.1-terra | 80.6 | $0.0309 | gpt-6.1-terra, gemini-4-hydrogen, gpt-6.2-sol |
| extraction | 20 | claude-haiku-5.5 | 62.4 | $0.0066 | claude-haiku-5.5, gpt-6-luna, deepseek-v4.1-flash |
| classification | 22 | claude-haiku-5.5 | 70.9 | $0.0008 | claude-haiku-5.5, gpt-6-luna, deepseek-v4.1-flash |
| data-analysis | 6 | gemini-4-carbon | 85.7 | $0.1454 | gemini-4-carbon, gpt-6.2-sol, claude-sonnet-5.5 |
| computer-use | 5 | gemini-4-carbon | 91.3 | $0.0810 | gemini-4-carbon, gpt-6.2-sol, claude-opus-5.5 |
| image-gen | 4 | nano-banana-2.1 | 93.7 | $0.0363 | nano-banana-2.1, seedream-5.5, gpt-image-2 |
| image-edit | 4 | nano-banana-2.1 | 93.8 | $0.0362 | nano-banana-2.1, seedream-5.5, gpt-image-2 |
| video-gen | 4 | veo-3.1-fast | 86 | $0.5960 | veo-3.1-fast, kling-4.0, veo-3.1 |
| 3d-gen | 4 | tripo-h3.1 | 94 | $0.2148 | tripo-h3.1, trellis-2, meshy-7.1 |
| tts | 2 | voxtral-tts-3 | 88 | $0.0151 | voxtral-tts-3, eleven-v4 |
| stt | 2 | voxtral-small-transcribe-3 | 90 | $0.0452 | voxtral-small-transcribe-3, gpt-transcribe |
| music | 2 | lyria-3.5 | 90 | $0.0904 | lyria-3.5, minimax-music-3 |

## Gaps

- Models never in a top-3: **15/40** (claude-fable-5.2, gemini-4-argon, kimi-k3.1-pro, gpt-5.6-sol, kimi-k3, deepseek-v4-pro, gemini-3.8-flash, glm-5.3, grok-4.6, nano-banana-pro, qwen3.8-max, glm-5.3-flash, hunyuan3d-3.1-pro, minimax-m3.1-flash, seedance-2.5)
- Models never top-1: **29/40**
- Tasks without a top-1: **0**
- Tasks with fewer than two eligible models: **0**

