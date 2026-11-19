# Generative Media Model APIs — Current Landscape Dossier (November 2026)

**Purpose:** model-routing catalogue for an AI app/agent product.
**Compiled:** 2026-11-19 (all read dates are 2026-11-19 unless noted; prices in USD, list, excluding tax/negotiated discounts).
**Scope:** image generation/editing, video generation, 3D asset generation, speech/TTS, music, transcription — the models a developer would actually call today, with exact API IDs, prices, docs, strengths, limits.

---

## 0. How to read this document

| Flag | Meaning |
|---|---|
| `verified: first-party` | Price/model-ID read directly off the model owner's pricing or model page on the read date. |
| `verified: fal` | Read off fal.ai's live per-endpoint `llms.txt` (machine-generated from the endpoint metadata). Authoritative **for fal's price**, which can differ from the owner's list price. |
| `verified: derived` | Arithmetic from a first-party token rate (e.g. tokens/sec → $/sec). Shown with the formula. |
| `verified: no` | Aggregator/secondary only, or inferred. Treat as a range, not a quote. |
| `CONFLICT` | Two sources disagree; both are shown inline. |

**Two important structural facts for a router (Nov 2026):**

1. **Model IDs are not portable across providers.** First-party IDs (`gemini-3-pro-image`) differ from reseller IDs (`fal-ai/nano-banana-pro`). The catalogue stores both: `first_party_id` and `route_id`.
2. **The "nano banana" family alone has 5 live SKUs** with wildly different unit economics (2.1 is *cheaper per image* than 2, despite being newer). Do not model price as a function of version number.

---

## 1. What changed in 2026 (delta briefing)

- **Google shipped Nano Banana 2.1** (`gemini-nano-banana-2.1`), an update to Nano Banana 2 (Gemini 3.1 Flash Image), explicitly marketed for *conversational editing, multi-turn character consistency, accurate text rendering, search-grounded generation* at 1K/2K/4K. At **$0.0336/1K image** it undercuts the older Nano Banana 2 (**$0.067/1K**) by 2×.
- **Google killed Imagen as a product line.** `imagen-4.0-generate` is listed as *Shut down* on the Gemini API model page.
- **Veo left the Gemini API.** There is no Veo section on the Gemini API pricing page any more; Veo is now sold through **Vertex AI Model Garden** (`veo-3.1-generate-001`, `-fast-`, `-lite-`) and resellers. There is **no Veo 4** — 3.1 plus a new *Lite* tier is the current generation.
- **Google's new video vector is "Gemini Omni"** (`gemini-omni-1.2-flash`): one multimodal model that emits video *with* native audio, 3–15 s, 360p→4K, plus `extend` and `upscale` endpoints. Priced per video token, ≈ **$0.07/s at 720p**.
- **Sora 2 is gone.** OpenAI shut down `sora-2`, `sora-2-pro` **and the whole Videos API on 2026-09-24**; the model page states *"There is no one-to-one replacement API."* Any router entry that still routes video to OpenAI is dead code.
- **`gpt-image-1` was shut down 2026-10-23**; the live image family is **GPT-Image-2.6 `sunburst`** (quality) and **`flare`** (fast), with 2.5 still callable.
- **Kling 4.0** is live with **native 30 s generation and multi-keyframe control** (`kling/v4`), plus **Kling 4.0 Flash** at ~40 % lower cost.
- **ByteDance**: **Seedream 5.5** (image, $0.03/img) and **Seedance 2.5** (video, 30 s, 4K, native audio) are current; Seedance 2.0 remains as fast/mini tiers.
- **MiniMax** moved past Hailuo 2.3 to **H3** ($0.05/s at 480p, 2K native, 5–15 s) and **H3 Max**; also **Music 3** (5-minute songs) and **Speech 2.8**.
- **Alibaba** shipped **Wan 3.0 / Wan 3.0 Prime** (audio support, $0.05–$0.28/s) and **Qwen-Image 3** ($0.04/1K).
- **3D**: **Hunyuan3D 3.1 Pro**, **Meshy 7.1**, **Tripo H3.1**, **TRELLIS 2**, **Hi3D 3.0** (up to $9.10/asset). PBR is now an *add-on line item* on most of them, not a default.
- **Speech**: **ElevenLabs Eleven v4** ($0.08/1k chars) + **Scribe v3** ($0.20/hr); **Mistral Voxtral TTS 3** at **$13/1M chars** (~$0.013/1k chars — ~6× cheaper than Eleven v4, released 2026-10-20, public preview); **Voxtral Small Transcribe 3** at **$0.004/min**.
- **Music**: **Lyria 3.5** at **$0.08/song** is the price floor for a full song; **MiniMax Music 3** at **$0.002/s** (~$0.12/min) and **Sonilo v1.1** ($0.0025/s, commercial-safe) are the volume options.

---

## 1.5 Watchlist resolution — every model you asked about

| Requested | Current status on 2026-11-19 | Where in this doc |
|---|---|---|
| Google Nano Banana 2.1 | **Live, first-party ID `gemini-nano-banana-2.1`** — $0.0336/1K, 4K capable | §2.1 |
| Google Nano Banana Pro | **Live as `gemini-3-pro-image`** — $0.134/1K-2K, $0.24/4K; still the text/fidelity tier | §2.1 |
| OpenAI GPT Image (current) | **GPT-Image-2.6 `sunburst` / `flare`** (2.5 also live; `gpt-image-1` shut down 2026-10-23) | §2.1 |
| ByteDance Seedream (current) | **Seedream 5.5** ($0.03/1K–1.5K); 5.0 Pro/Flash, 4.5 still routed | §2.1 |
| Kling (current, likely 4.0) | **Confirmed: Kling 4.0 + 4.0 Flash** — native 30 s, multi-keyframe; $0.157/s @720p | §3.1 |
| Google Veo 3.1 | **Current, but moved to Vertex AI** (`veo-3.1-generate-001`, `-fast-`, new `-lite-`). **No Veo 4 exists** | §3.1 |
| ByteDance Seedance 2.5 | **Live** — 30 s, 4K, native audio; $0.2205–$1.84/s; Flash tier at $0.1442/s | §3.1 |
| Sora 2 status | **DEAD — models + Videos API shut down 2026-09-24, no replacement API.** Historic $0.10/s | §3.1 |
| MiniMax Hailuo | **Superseded by MiniMax H3** ($0.05/s @480p, 2K native) and H3 Max; Hailuo 2.3 Pro still callable at $0.49/clip | §3.1 |
| Alibaba Wan | **Wan 3.0 and Wan 3.0 Prime** live with audio; $0.05–$0.28/s | §3.1 |
| Hunyuan3D (current) | **Hunyuan3D 3.1 Pro** — $0.375 + PBR add-on; v3 tiers from $0.225 | §4.1 |
| Tripo (current) | **Tripo H3.1** — $0.10–$0.30 + quad-mesh option | §4.1 |
| Meshy (current) | **Meshy 7.1** — $0.80/$1.20 + rig + animation | §4.1 |
| TRELLIS 2 | **Live** — $0.25–$0.35; open model, self-hostable | §4.1 |
| ElevenLabs Eleven v4 | **Live as `eleven_v4` / `eleven_v4_turbo`** — $0.08 / $0.04 per 1k chars | §5 |
| Gemini Lyria 3.5 | **Live as `lyria-3.5`** — $0.08 per full song | §6 |
| Voxtral TTS 3 / Transcribe 3 | **Live** — `voxtral-mini-tts-3-0` ($13/1M chars), `voxtral-small-transcribe-3-0` ($0.004/min), both released Oct 2026 | §5, §7 |
| "Any newer leaders" | **Gemini Omni 1.2 Flash** (video+audio+4K, ~$0.07/s), **Qwen-Image 3**, **FLUX 3**, **Ideogram 4.5**, **Hi3D 3.0**, **MiniMax Music 3**, **Sonilo 1.1**, **Mureka 9.5**, **Scribe v3**, **GPT-Transcribe** | §2–§7 |

---

## 2. Image generation & editing

### 2.1 Model inventory

| Model (first-party API ID) | Provider | Price / image | verified | Key strengths | Known limitations | Official docs |
|---|---|---|---|---|---|---|
| **Nano Banana 2.1** — `gemini-nano-banana-2.1` | Google | **$0.0336** (1K) · **$0.0504** (2K) · **$0.113** (4K); batch $0.0168 / $0.0252 / $0.0567 | first-party | Best price/quality in the Gemini image line; multi-turn **character consistency**; accurate **text rendering**; **search-grounded** generation; conversational editing; 1K–4K | Token-billed (cost varies with thinking tokens); 4K price conflict (see 2.2); subject to Google usage policies | [ai.google.dev/…/gemini-nano-banana-2.1](https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1) |
| **Nano Banana Pro** — `gemini-3-pro-image` | Google | **$0.134** (1K/2K) · **$0.24** (4K); batch $0.067 / $0.12 | first-party | The "studio" tier: highest fidelity in the Gemini family, **4K**, best-in-class in-image text/labels, strong infographic & diagram work | ~4× the cost of 2.1 per 1K image; slower (thinking); no free tier | [ai.google.dev/…/gemini-3-pro-image](https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image) |
| **Nano Banana 2** — `gemini-3.1-flash-image` | Google | **$0.045** (0.5K) · **$0.067** (1K) · **$0.101** (2K) · **$0.151** (4K) | first-party | Speed/high-throughput SKU; interactive latency; cheap at 0.5K | Strictly dominated by 2.1 on price *and* marketed quality — keep only for pinned-SKU stability | [ai.google.dev/…/gemini-3.1-flash-image](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image) |
| **GPT-Image-2.6 Sunburst** — `gpt-image-2.6-sunburst` | OpenAI | **$8/1M** image input tokens, **$30/1M** image output; ≈ **$0.211** @1024² high, **$0.053** medium, **$0.006** low (derived from OpenAI's GPT-Image-2 cost table, same $30/1M rate) | first-party (token rates) / derived (per-image) | Consistently strong prompt adherence and edit consistency (community consensus; not independently benchmarked here); accurate text; `quality` dial gives a ~35× cost range low→high | No fixed per-image price (budget from tokens); high quality is ~6× Nano Banana 2.1; no 4K SKU published | [developers.openai.com/…/gpt-image-2.6-sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.6-sunburst) |
| **GPT-Image-2.6 Flare** — `gpt-image-2.6-flare` | OpenAI | Same token rates as Sunburst ($8/$30 per 1M) | first-party | "Fastest model for high-quality, everyday image generation" — same price, lower latency | Lower ceiling than Sunburst on complex scenes | [developers.openai.com/…/gpt-image-2.6-flare](https://developers.openai.com/api/docs/models/gpt-image-2.6-flare) |
| **Seedream 5.5** — `bytedance/seedream/v5.5` (fal) | ByteDance | **$0.03** (1K/1.5K) · **$0.0405** (2K); custom: $0.03 ≤2.61 MP, $0.0405 above | fal | Cheapest credible 2K image; configurable dimensions; batch; **transparent PNG**; `layerize` variant for layer separation (great for design tooling) | ByteDance ToS/data-residency review needed; no 4K tier on fal; "US-hosted" variants exist separately | [fal.ai/models/bytedance/seedream/v5.5](https://fal.ai/models/bytedance/seedream/v5.5/text-to-image) |
| **Kling Image 4.0** — `kling/v4/text-to-image` (fal) | Kling (Kuaishou) | **$0.063**/image, **2K default** | fal | 2K at $0.063; strong photoreal faces/skin; same account/keys as Kling video (one vendor for image+video) | Per-image price only on reseller; official Kling pricing is credit-based and unpublished in USD | [kling.ai/document-api](https://kling.ai/document-api/guides/get-started/overview) |
| **Qwen-Image 3** — `alibaba/qwen-image-3` (fal) | Alibaba | **$0.04** (1K) · **$0.075** (2K) | fal | Exceptional **Chinese + English text rendering**, posters/localisation; bilingual prompting; very cheap | Fewer English-market evals; Alibaba Cloud region/keys required for first-party | [modelstudio.alibabacloud.com](https://modelstudio.console.alibabacloud.com) |
| **FLUX 3 Image** — `blackforestlabs/flux-3/text-to-image` (fal) | Black Forest Labs | **$0.048** per 1 MP (1K) | fal | Native **2K/4K**, precise **layout control**, improved text; weights/self-host path (BFL lineage) | 1 MP unit pricing gets expensive at 4K; newness = fewer battle-tested prompts | [bfl.ai](https://bfl.ai) |
| **Ideogram 4.5** — `ideogram/v4.5` | Ideogram | **$0.03** low · **$0.06** medium · **$0.10** high (size-independent); edit: $0.008 very-low → $0.22 high | fal | Purpose-built for **typography/posters/logos**; size-independent pricing simplifies budgeting; edit endpoint with up to 4 references + mask | Weakest on hard photoreal; style range narrower than Gemini/OpenAI | [ideogram.ai/api](https://ideogram.ai/api) |

### 2.2 Price provenance & conflicts (image)

| Model | Published price | Source URL | Read | Note |
|---|---|---|---|---|
| Nano Banana 2.1 | $0.0336 / $0.0504 / $0.113 per 1K/2K/4K | https://ai.google.dev/gemini-api/docs/pricing | 2026-11-19 | Derived by Google from $30/1M image tokens: 1120 / 1680 / 3780 tokens per image |
| Nano Banana 2.1 (4K) | **CONFLICT:** $0.0756 per 4K image | https://benchlm.ai/media-pricing | 2026-11-19 (secondary) | Google's own token math gives $0.1134 (3780 tok × $30/1M). Trust Google; BenchLM likely assumed 2520 tokens (the older NB2 4K bucket) |
| Nano Banana Pro | $0.134 (1K/2K), $0.24 (4K) | https://ai.google.dev/gemini-api/docs/pricing | 2026-11-19 | Matches Vertex AI listing on the same date |
| GPT-Image-2.6 | $8/1M in, $30/1M out (image); $5/$10 (text) | https://developers.openai.com/api/docs/pricing | 2026-11-19 | Per-image equivalents from OpenAI's historical cost table (GPT-Image-2, same $30/1M): low $0.006 / med $0.053 / high $0.211 @1024² |
| Seedream 5.5 | $0.03 / $0.0405 | https://fal.ai/models/bytedance/seedream/v5.5/text-to-image/llms.txt | 2026-11-19 | Seedream 5.0 Pro is listed at "$0.0675 tentative … final pricing not yet confirmed" — do not hard-code |
| Kling Image 4.0 | $0.063 per image | https://fal.ai/models/kling/v4/text-to-image/llms.txt | 2026-11-19 | Kling's own billing is credit-based; no USD list price published |
| Ideogram 4.5 | $0.03/0.06/0.10 | https://fal.ai/models/ideogram/v4.5/llms.txt | 2026-11-19 | Size-independent |

### 2.3 Routing notes (image)

- **Cheapest acceptable:** Seedream 5.5 ($0.03) or Qwen-Image 3 1K ($0.04) → escalate to Nano Banana 2.1 for text-heavy or multi-turn-edit work.
- **Text-in-image:** route to Ideogram 4.5 High ($0.10) for *typography as the subject*; route to Nano Banana Pro ($0.134) when text must sit inside a photoreal scene; Qwen-Image 3 for CJK.
- **Editing with reference identity:** GPT-Image-2.6 (best instruction adherence) or Nano Banana 2.1 edit (cheapest multi-turn consistency).
- **Never** build a price ladder that assumes newer SKU = more expensive; NB2.1 < NB2.

---

## 3. Video generation

### 3.1 Model inventory

| Model (first-party API ID) | Provider | Price / video-second | verified | Key strengths | Known limitations | Official docs |
|---|---|---|---|---|---|---|
| **Veo 3.1** — `veo-3.1-generate-001` | Google (Vertex) | **$0.40/s** with audio @720p/1080p · **$0.60/s** 4K audio · **$0.20/s** silent · **$0.40/s** 4K silent | first-party | Reference-quality **native audio + dialogue**, 4K, image-to-video, strong physics; the safe "cinematic" default | **Not on the Gemini API any more** — Vertex project + billing required; 8 s clips; slow; most expensive mainstream tier | [Vertex Veo 3.1](https://cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate) |
| **Veo 3.1 Fast** — `veo-3.1-fast-generate-001` | Google (Vertex) | **$0.10/s** (720p audio) · **$0.12/s** (1080p audio) · **$0.30/s** (4K audio); silent $0.08 / $0.10 / $0.25 | first-party | 4× cheaper than full Veo with the same audio capability; best "Google look" per dollar | Quality drop on complex motion/text; 720p base | same |
| **Veo 3.1 Lite** — `veo-3.1-lite-generate-001` | Google (Vertex, preview) | **$0.05/s** (720p audio) · **$0.08/s** (1080p audio); silent $0.03 / $0.05 | first-party | Volume/social tier; cheapest Google video with audio | Preview status; short/simple shots only | same |
| **Gemini Omni 1.2 Flash** — `gemini-omni-1.2-flash` | Google (Vertex) | **$12/1M video output tokens** → ≈ **$0.07/s** @720p (5792 tok/s), ≈ **$0.104/s** @1080p (8688 tok/s); fal: $0.0273 (360p) / $0.0819 (720p) / $0.1229 (1080p) / **$0.2457** (4K) | first-party (token) / derived (per-s) | **Native audio**, 3–15 s, 360p→4K, 16:9 & 9:16, plus `extend` and `upscale` endpoints — one model for the whole pipeline | Newest/least battle-tested; token metering makes cost forecasting harder; 4K on fal is 9× the 360p rate | [Vertex Gemini Omni](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/omni-1-2-flash) |
| **Kling 4.0** — `kling/v4/text-to-video` (route) | Kling (Kuaishou) | **$0.157/s** @720p · **$0.235/s** @1080p (5 s @1080p = $1.175) | fal | **Native 30 s** generation, **multi-keyframe control**, per-shot prompts, 3–30 s; strong motion realism for the price | No 4K on `kling/v4`; **no `generate_audio` parameter on this endpoint** (Kling O3 Pro carries audio at $0.14/s); credit-based official pricing | [kling.ai/document-api](https://kling.ai/document-api/guides/get-started/overview) |
| **Kling 4.0 Flash** — `kling/v4/flash/text-to-video` | Kling | **$0.094/s** @720p | fal | Omni Reference, video editing, multilingual output; ~40 % cheaper than Kling 4.0 | 720p only; weaker fine detail | same |
| **Seedance 2.5** — `bytedance/seedance-2.5/us/text-to-video` | ByteDance | **$0.2205/s** 480p · **$0.473/s** 720p · **$1.164/s** 1080p · **$1.84/s** 4K | fal | **30 s**, **4K**, **synchronized audio**; strongest cinematic look among the >$0.20/s tier (vendor/community positioning — no independent benchmark captured in this pass) | Most expensive per second of any model here at 1080p+; US-hosted variant required for some customers | https://fal.ai/models/bytedance/seedance-2.5/us/text-to-video |
| **Seedance 2.5 Flash** — `bytedance/seedance-2.5/flash/text-to-video` | ByteDance | **$0.1442/s** 480p · **$0.3094/s** 720p | fal | Half the price of 2.5 at 720p; same family prompt behaviour | No 1080p/4K | https://fal.ai/models/bytedance/seedance-2.5/flash/text-to-video |
| **MiniMax H3** — `minimax/h3/text-to-video` | MiniMax | **$0.05/s** 480p · **$0.06/s** 768p · **$0.13/s** 2K · **$0.16/s** 4K | fal | **2K native**, 5–15 s, **7 aspect ratios**; aggressive price at 768p; 4K for $0.16/s is the cheapest 4K path | Semantic drift on long/complex prompts; audio quality behind Veo/Seedance | https://fal.ai/models/minimax/h3/text-to-video |
| **Wan 3.0** — `alibaba/wan-3.0/text-to-video` | Alibaba | **$0.05/s** 480p · **$0.10/s** 720p · **$0.20/s** 1080p (audio param supported) | fal | Strong price/perf at 720p; audio flag; good for batch/social volume; open-weights lineage (self-host path) | Motion coherence trails Kling/Veo; "pricing subject to change" per fal | https://fal.ai/models/alibaba/wan-3.0/text-to-video |
| **Wan 3.0 Prime** — `alibaba/wan-3.0-prime/text-to-video` | Alibaba | **$0.068/s** 480p · **$0.14/s** 720p · **$0.28/s** 1080p | fal | Quality tier of Wan 3.0 (1.4× price) | Still below Seedance on fine detail | https://fal.ai/models/alibaba/wan-3.0-prime/text-to-video |
| **Hailuo 2.3 Pro** — `fal-ai/minimax/hailuo-2.3/pro/text-to-video` | MiniMax | **$0.49 per video** (1080p) | fal | Per-clip pricing (not per second) → trivially predictable cost; characteristic "Hailuo" motion style; 1080p | Superseded by H3 on both price and spec; short clips | https://fal.ai/models/fal-ai/minimax/hailuo-2.3/pro/text-to-video |
| **Grok Imagine Video 1.5** — `xai/grok-imagine-video/v1.5` | xAI | **$0.08/s** 480p · **$0.14/s** 720p · **$0.25/s** 1080p | fal | Cheap 480p tier; text/image/reference-to-video; no per-image reference charges | Short durations; fewer controls; content-policy variance | https://fal.ai/models/xai/grok-imagine-video/v1.5/text-to-video |
| **Luma Ray 3.2** — `luma/agent/ray/v3.2` | Luma | **$0.50**/5 s @540p · **$1.00**/5 s @720p · **$2.00**/5 s @1080p (=$0.10/$0.20/$0.40 per s) | fal | Seamless **looping**, reference images for subject/style lock, cinematic look | Priciest per second at 1080p; 5/10 s only | https://lumalabs.ai/dream-machine/api |
| **LTX-2.5** — `lightricks/ltx-2.5` | Lightricks | Not captured verbatim (pro/fast, t2v/i2v, audio-to-video, upscale, HDR, alpha) | **no** | Only mainstream model with **alpha-channel** video, HDR, and audio-to-video; self-hostable | Price not verified in this pass — fetch `fal.ai/models/lightricks/ltx-2.5/text-to-video/pro/llms.txt` before quoting | https://fal.ai/models/lightricks/ltx-2.5/text-to-video/pro |
| **Sora 2 / Sora 2 Pro** — `sora-2`, `sora-2-pro` | OpenAI | **DISCONTINUED.** Historic: $0.10/s (Sora 2); Sora 2 Pro $0.30 (720p) / $0.50 (1024p) / $0.70 (1080p) | first-party | — | **Models and the Videos API were shut down 2026-09-24. "There is no one-to-one replacement API."** Remove from routing table | [models/sora-2](https://developers.openai.com/api/docs/models/sora-2) |

### 3.2 Price provenance & conflicts (video)

| Model | Published price | Source URL | Read | Note |
|---|---|---|---|---|
| Veo 3.1 family | $0.40 / $0.60 / $0.20 / $0.40 per s; Fast $0.10–$0.30; Lite $0.05–$0.08 | https://cloud.google.com/vertex-ai/generative-ai/pricing | 2026-11-19 | Vertex table bills per "1 count" = 1 second; fal independently charges the identical $0.20/$0.40/$0.60 per second — two sources agree |
| Veo 3.1 (fal) | $0.20/s silent, $0.40/s audio (720p/1080p); $0.40/$0.60 at 4K | https://fal.ai/models/fal-ai/veo3.1/llms.txt | 2026-11-19 | Exact match to Vertex → high confidence |
| Gemini Omni 1.2 Flash | $12/1M video output tokens; 5792 tok/s @720p, 8688 @1080p, 17376 @4K, 1931 @360p | https://cloud.google.com/vertex-ai/generative-ai/pricing | 2026-11-19 | Derived $/s above; fal's per-second numbers ($0.0819 @720p) are ~18 % higher than the derived $0.0695 — reseller margin, not a conflict in the strict sense |
| Kling 4.0 | $0.157/s (720p) / $0.235/s (1080p) | https://fal.ai/models/kling/v4/text-to-video/llms.txt | 2026-11-19 | Also corroborated by an independent price comparison dated 2026-11-14 |
| Seedance 2.5 | $0.2205 / $0.473 / $1.164 / $1.84 per s | https://fal.ai/models/bytedance/seedance-2.5/us/text-to-video/llms.txt | 2026-11-19 | Token formula: (H×W×(in_dur+out_dur)×24)/1024 tokens; $0.0214/1k tokens @480–720p |
| MiniMax H3 | $0.05 / $0.06 / $0.13 / $0.16 per s | https://fal.ai/models/minimax/h3/text-to-video/llms.txt | 2026-11-19 | H3 Max runs a promo ladder ($0.0325→$0.035 at 480p) — **do not cache promo prices as list** |
| Wan 3.0 / Prime | $0.05–$0.20 / $0.068–$0.28 per s | https://fal.ai/models/alibaba/wan-3.0/text-to-video/llms.txt | 2026-11-19 | fal flags "pricing is subject to change" |
| Sora 2 | Historic $0.10/s; Pro $0.30/$0.50/$0.70 | https://developers.openai.com/api/docs/models/sora-2 | 2026-11-19 | Model page confirms shutdown date 2026-09-24 |

### 3.3 Routing notes (video)

- **Default cinematic:** Veo 3.1 (audio) → fall back to Veo 3.1 Fast at ~¼ price for drafts.
- **Best quality ceiling:** Seedance 2.5 at 1080p/4K, but $1.16–$1.84/s means a 10 s clip costs $11.64–$18.40 — gate behind an explicit "premium" flag.
- **Best cost/quality:** MiniMax H3 @768p ($0.06/s) and Wan 3.0 @720p ($0.10/s); Kling 4.0 when you need **30 s single-shot** or multi-keyframe control.
- **Image-to-video:** Kling 4.0 (reference/omni), Seedance 2.5 (image-to-video), Veo 3.1 (image + audio).
- **Do not** assume all "per second" prices include audio — Veo's silent rate is half; Seedance's audio is included; Kling 4.0 audio is limited.

---

## 4. 3D asset generation

### 4.1 Model inventory

| Model (route ID) | Provider | Price / 3D asset | verified | Key strengths | Known limitations | Official docs |
|---|---|---|---|---|---|---|
| **Hunyuan3D 3.1 Pro** — `fal-ai/hunyuan-3d/v3.1/pro/image-to-3d` | Tencent | **$0.375**/generation; **+$0.15** PBR, **+$0.15** multi-view, **+$0.15** custom face count | fal | Strong geometry at a mid price; PBR add-on; custom topology (face count) control; text-to-3D and image-to-3D | Add-ons can double the price; no native rigging | [Tencent Cloud Hunyuan3D](https://cloud.tencent.com/document/product/1729) |
| **Hunyuan3D 3** — `fal-ai/hunyuan3d-v3/text-to-3d` | Tencent | **$0.225** geometry · **$0.375** normal · **$0.45** low-poly (+$0.15 PBR/multi-view/faces) | fal | Sketch→textured model; **low-poly tier** is genuinely game-ready | Low-poly tier trades silhouette fidelity | same |
| **Meshy 7.1** — `meshy/v7.1/text-to-3d` | Meshy | **$0.80** untextured · **$1.20** textured · **+$0.20** auto-rig · **+$0.12** animation → **$1.52** full | fal | The only mainstream pipeline with **texture + auto-rig + animation** in one call; production pipeline (retexture, rigging, multi-animation, relief) | Most expensive per asset; topology control weaker than Tripo/Hunyuan | [meshy.ai/api](https://www.meshy.ai/api) |
| **Tripo H3.1** — `tripo3d/h3.1/text-to-3d` | Tripo | **$0.10** untextured · **$0.20** standard tex · **$0.30** HD tex; **+$0.20** detailed geometry · **+$0.05** quad mesh | fal | Cheapest usable asset ($0.10); **quad/retopo mesh** option is the differentiator for DCC→game pipelines; multiview-to-3D | HD texture + detailed geometry = $0.50; rigging separate | [platform.tripo3d.ai](https://platform.tripo3d.ai/docs/introduction) |
| **TRELLIS 2** — `fal-ai/trellis-2` | Microsoft Research (open) | **$0.25** (512p) · **$0.30** (1024p) · **$0.35** (1536p) | fal | Open model → **self-hostable** (no vendor lock-in, no per-asset fee at scale); good geometry from a single image | Weaker textures/PBR than commercial tiers; research licence terms | https://fal.ai/models/fal-ai/trellis-2 |
| **Hi3D 3.0** — `hitem3d/hi3d/v3.0/image-to-3d` | Hi3D | **$2.10** (2048³ quality) · **$9.10** (2048³ master) | fal | Highest-resolution geometry available (2048³); "master" tier for hero assets/3D printing | 7–30× the price of alternatives; overkill for real-time/game LODs | https://fal.ai/models/hitem3d/hi3d/v3.0/image-to-3d |
| **Hyper3D Rodin rigging** — `hyper3d/rigging` | Hyper3D (Rodin) | **$0.20**/request (+ animations variant) | fal | Cheap **auto-rigging on an existing mesh** — pair with any generator above | Rig quality varies by mesh topology; humanoid-centric | https://fal.ai/models/hyper3d/rigging |

### 4.2 Price provenance (3D)

| Model | Published price | Source URL | Read |
|---|---|---|---|
| Hunyuan3D 3.1 Pro | $0.375 + $0.15 per add-on | https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/image-to-3d/llms.txt | 2026-11-19 |
| Meshy 7.1 | $0.80 / $1.20 / +$0.20 rig / +$0.12 anim | https://fal.ai/models/meshy/v7.1/text-to-3d/llms.txt | 2026-11-19 |
| Tripo H3.1 | $0.10 / $0.20 / $0.30 (+$0.20 geometry, +$0.05 quad) | https://fal.ai/models/tripo3d/h3.1/text-to-3d/llms.txt | 2026-11-19 |
| TRELLIS 2 | $0.25 / $0.30 / $0.35 by resolution | https://fal.ai/models/fal-ai/trellis-2/llms.txt | 2026-11-19 |
| Hi3D 3.0 | $2.10 quality / $9.10 master | https://fal.ai/models/hitem3d/hi3d/v3.0/image-to-3d/llms.txt | 2026-11-19 |
| Hyper3D rigging | $0.20 / request | https://fal.ai/models/hyper3d/rigging/llms.txt | 2026-11-19 |

### 4.3 Routing notes (3D)

- **Game prop, hard budget:** Tripo H3.1 untextured/standard ($0.10–$0.20) → Hunyuan3D 3 low-poly ($0.45) if silhouette matters.
- **Game prop with PBR:** Hunyuan3D 3.1 Pro + PBR = **$0.525**; Meshy 7.1 textured = $1.20 (but includes better UVs/normals).
- **Rigged character:** Meshy 7.1 full pipeline ($1.52) is one call; or Tripo H3.1 ($0.30) + Hyper3D rigging ($0.20) = **$0.50** — 3× cheaper, two calls, more control.
- **Hero/print asset:** Hi3D 3.0 master ($9.10).
- **At scale / on-prem:** TRELLIS 2 (open weights) — the only line item here that can drop to $0 marginal cost.

---

## 5. Speech / TTS

| Model (first-party ID) | Provider | Price | Normalised | verified | Strengths | Limitations | Docs |
|---|---|---|---|---|---|---|---|
| **Eleven v4** — `eleven_v4` | ElevenLabs | **$0.08 / 1k chars** | ~$0.08/min | first-party | Best expressiveness/emotion control: **audio tags**, stability/similarity dials, **IPA pronunciation**; 70+ languages; huge voice library | Most expensive mainstream TTS; character billing penalises verbose text | [elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api) |
| **Eleven v4 Turbo** — `eleven_v4_turbo` | ElevenLabs | **$0.04 / 1k chars** | ~$0.04/min | first-party | Half price, low latency, keeps v4 tags | Slightly flatter prosody | same |
| **Voxtral TTS 3** — `voxtral-mini-tts-3-0` | Mistral | **$13 / 1M chars** = **$0.013 / 1k chars** | ~$0.013/min | first-party | **~6× cheaper than Eleven v4**; zero-shot + professional voice cloning; 35+ languages / 50+ dialects; **34 emotion tags**; streaming with ~90 ms TTFA; 5 output formats | **Public Preview** (released 2026-10-20) — no SLA; smaller voice library | [docs.mistral.ai/…/voxtral-mini-tts-3-0](https://docs.mistral.ai/models/voxtral-mini-tts-3-0) |
| **Gemini 3.8 Flash TTS** — `gemini-3.8-flash-tts` | Google | $0.50/1M text in + $9.00/1M audio out → **$0.00225 / 10 s** | ~$0.0135/min | first-party | "Studio-grade voice fidelity, expressive acting, long-form stability"; prompt-steerable style; **promo pricing through 2026-12-31** (doubles 2027-01-01) | Price doubles in 2027 — model it; no voice cloning on this SKU | [ai.google.dev/…/gemini-3.8-flash-tts](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts) |
| **MiniMax Speech 2.8 HD** — `fal-ai/minimax/speech-2.8-hd` | MiniMax | **$0.10 / 1k chars** | ~$0.10/min | fal | Strong multilingual + emotion; voice cloning endpoint; HD audio | Pricier than Eleven v4 on fal; latency higher than turbo SKUs | https://fal.ai/models/fal-ai/minimax/speech-2.8-hd/llms.txt |
| **xAI TTS v1** — `xai/tts/v1` | xAI | **$0.015 / 1k chars** | ~$0.015/min | fal | Very cheap; expressive voices; same key as Grok models | Small voice catalogue; fewer languages | https://fal.ai/models/xai/tts/v1/llms.txt |
| **ElevenLabs Scribe v3** (STT, listed here for the shared account) | ElevenLabs | **$0.20 / hour** | ~$0.0033/min | first-party | "27 % fewer errors than Scribe v2"; 90+ languages; word timestamps | Hour-block billing | [elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api) |

**TTS routing:** default `voxtral-mini-tts-3-0` for volume/synthesis at ~$0.013/min; escalate to `eleven_v4` when *acting* or brand voice matters; use `gemini-3.8-flash-tts` when you need long-form stability and already pay Google; keep `eleven_v4_turbo` for realtime conversational.

---

## 6. Music generation

| Model (first-party ID) | Provider | Price | verified | Strengths | Limitations | Docs |
|---|---|---|---|---|---|---|
| **Lyria 3.5** — `lyria-3.5` | Google | **$0.08 per song** (full song) | first-party | Cheapest full-song generation; "almost any type of music"; clean licensing story for Google Cloud customers | No stems/editing controls documented; vocal quality behind Suno-class models | [ai.google.dev/…/lyria-3.5](https://ai.google.dev/gemini-api/docs/models/lyria-3.5) |
| **Lyria 3 Clip / Pro** — `lyria-3-clip-preview`, `lyria-3-pro-preview` | Google | **$0.04** (30 s clip) · **$0.08** (full song) | first-party | Cheap 30 s beds for ads/social | Preview status; superseded by 3.5 | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| **ElevenLabs Music** — `elevenlabs/music/v2.5` | ElevenLabs | **$0.15 / min** (first-party) · **$0.60 / min** (fal) — **CONFLICT** | first-party + fal | Studio-grade music from prompts, **44.1 kHz**, commercial licensing on Starter+; 5-min limit | 4× reseller markup on fal; no stem export at this SKU | [elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api) |
| **MiniMax Music 3** — `minimax/music-3` | MiniMax | **$0.002 / second** (≈ **$0.12 / min**) | fal | Complete songs up to **5 minutes**; very cheap per minute | Vocal intelligibility inconsistent; fewer style controls | https://fal.ai/models/minimax/music-3/llms.txt |
| **Mureka 9.5** — `mureka/v9.5/generate/song` | Mureka (Skywork) | **$0.15 / song** (with your lyrics) · **$0.50 / song** (prompt only) | fal | Lyrics→song, reference-audio and melody control, multiple variations, stem separation, song extension | Prompt-only mode is 3× the lyrics price; API is a large surface (25 endpoints) | [platform.mureka.ai](https://platform.mureka.ai) |
| **Sonilo 1.1** — `sonilo/v1.1/text-to-music` | Sonilo | **$0.0025 / second** (≈ **$0.15 / min**) | fal | **Licensed, commercial-use-safe** output; exact-duration control; video-to-music and video-to-SFX variants | Smaller model; less "radio-ready" than Eleven/Mureka | https://fal.ai/models/sonilo/v1.1/text-to-music/llms.txt |

**Music routing:** $0.08/song (Lyria 3.5) is the floor for a *complete song*; Mureka 9.5 when the user brings lyrics; ElevenLabs Music when audio quality/licensing clarity dominates; Sonilo when you must prove training-data provenance.

---

## 7. Transcription (STT)

| Model (first-party ID) | Provider | Price | Normalised | verified | Strengths | Limitations | Docs |
|---|---|---|---|---|---|---|---|
| **Voxtral Small Transcribe 3** — `voxtral-small-transcribe-3-0` | Mistral | **$0.004 / min** | $0.24/hr | first-party | Flagship accuracy + **diarization**, translation, speech Q&A, summarization, function calling; claims to beat Whisper large-v3, GPT-Transcribe, Scribe v2 & Gemini 3.5 Transcribe | Newest (2026); smaller ecosystem | [docs.mistral.ai/…/voxtral-small-transcribe-3-0](https://docs.mistral.ai/models/voxtral-small-transcribe-3-0) |
| **Voxtral Mini Transcribe 3** — `voxtral-mini-transcribe-3-0` | Mistral | **$0.0035 / min** | $0.21/hr | first-party | 3rd on FLEURS multilingual + English diarization; deployable on constrained hardware | Less accurate than Small on hard audio | [docs.mistral.ai/…/voxtral-mini-transcribe-3-0](https://docs.mistral.ai/models/voxtral-mini-transcribe-3-0) |
| **Voxtral Mini Transcribe Realtime 3** — `voxtral-mini-transcribe-realtime-3-0` | Mistral | **$0.008 / min** | $0.48/hr | first-party | Configurable latency + turn detection for voice agents | 2.3× the batch price | [docs.mistral.ai](https://docs.mistral.ai/models/voxtral-mini-transcribe-realtime-3-0) |
| **Scribe v3** — ElevenLabs | ElevenLabs | **$0.20 / hour** | $0.0033/min | first-party | "27 % fewer errors than Scribe v2"; 90+ languages; word timestamps; medical variant | Hour blocks; audio upload limits | [elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api) |
| **Scribe v2** — `fal-ai/elevenlabs/speech-to-text/scribe-v2` | ElevenLabs (via fal) | **$0.008 / min** (+30 % with keyterm prompting) | $0.48/hr | fal | Keyterm biasing for domain jargon | 2.4× the direct Scribe v3 per-minute rate — use direct API | https://fal.ai/models/fal-ai/elevenlabs/speech-to-text/scribe-v2/llms.txt |
| **GPT-Transcribe** — `gpt-transcribe` | OpenAI | **$0.0045 / min** | $0.27/hr | first-party | Context/keyword/language hints; handles code-switching; Realtime transcription sessions | File/batch + committed turns only (no chat/responses endpoints) | [developers.openai.com/…/gpt-transcribe](https://developers.openai.com/api/docs/models/gpt-transcribe) |
| **GPT-Live-Transcribe** — `gpt-live-transcribe` | OpenAI | **$0.017 / min** | $1.02/hr | first-party | Streaming live transcription | 3.8× batch price | [pricing](https://developers.openai.com/api/docs/pricing) |
| **Gemini 3.5 Transcribe** — `gemini-3.5-transcribe` | Google | ≈ **$0.005 / min** (est., 25 audio tok/s; Google labels it "estimated") | ~$0.30/hr | first-party (estimate) | Long-audio, multilingual, cheap; `-live` variant ≈ $0.009/min | Google explicitly marks the per-minute numbers as estimates | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |

**STT routing:** cheapest credible = **Scribe v3 at $0.0033/min** or **Voxtral Mini 3 at $0.0035/min**; best accuracy + diarization = **Voxtral Small 3** ($0.004/min); already-in-Mistral-stack = Voxtral; OpenAI-native = `gpt-transcribe`.

---

## 8. Recommended default by use case

| Use case | Default model | Route ID | Why | Cost per unit | Fallback |
|---|---|---|---|---|---|
| **Concept art** | Nano Banana 2.1 | `gemini-nano-banana-2.1` | Best quality/$ at 1K–2K, conversational iteration | $0.0336–$0.0504/img | Seedream 5.5 ($0.03) |
| **Precise text-in-image** | Nano Banana Pro | `gemini-3-pro-image` | Most reliable in-scene typography at 4K | $0.134 (1K/2K) / $0.24 (4K) | Ideogram 4.5 High ($0.10, pure typography) |
| **Product shot** | GPT-Image-2.6 Sunburst | `gpt-image-2.6-sunburst` | Best instruction adherence + edit consistency on product geometry | ≈$0.211 @1024² high | Nano Banana 2.1 ($0.0504 @2K) |
| **Image edit (instruction)** | Nano Banana 2.1 edit | `google/nano-banana-2.1/edit` | Multi-turn character consistency at the lowest price | $0.0336+ | GPT-Image-2.6 edit |
| **Image-to-video** | Kling 4.0 | `kling/v4/image-to-video` | Multi-keyframe control, 3–30 s, strong motion | $0.157/s (720p) | Seedance 2.5 ($0.2205/s @480p) |
| **Cinematic 4K** | Veo 3.1 | `veo-3.1-generate-001` | Native audio + 4K + best physics | $0.60/s (4K, audio) | Seedance 2.5 ($1.84/s @4K) |
| **Social ad (volume)** | MiniMax H3 @768p | `minimax/h3/text-to-video` | $0.06/s with 7 aspect ratios; cheap iteration | $0.06/s | Wan 3.0 ($0.10/s @720p) |
| **3D game prop** | Tripo H3.1 | `tripo3d/h3.1/image-to-3d` | $0.20 with textures; quad-mesh option | $0.10–$0.30 | Hunyuan3D 3 low-poly ($0.45) |
| **3D character (rigged)** | Meshy 7.1 full | `meshy/v7.1/image-to-3d` | Texture + auto-rig + animation in one call | $1.52 | Tripo ($0.30) + Hyper3D rig ($0.20) = $0.50 |
| **TTS** | Voxtral TTS 3 | `voxtral-mini-tts-3-0` | ~6× cheaper than Eleven v4, cloning + 34 emotion tags | $0.013/1k chars | Eleven v4 ($0.08/1k) |
| **STT** | Scribe v3 / Voxtral Small 3 | — | $0.0033–$0.004/min with diarization | $0.20/hr · $0.004/min | `gpt-transcribe` ($0.0045/min) |
| **Music** | Lyria 3.5 | `lyria-3.5` | $0.08 for a full song, clean licensing | $0.08/song | Mureka 9.5 ($0.15/song with lyrics) |

---

## 9. Provider access: API key + docs

| Provider | Get an API key | Docs / model reference | Notes for routing |
|---|---|---|---|
| **Google (Gemini API)** | https://aistudio.google.com/apikey | https://ai.google.dev/gemini-api/docs/models | Images, Lyria, TTS, Transcribe. **Veo is NOT here** |
| **Google (Vertex AI)** | https://console.cloud.google.com/apis/credentials (service account) | https://cloud.google.com/vertex-ai/generative-ai/docs/models | Veo 3.1 + Gemini Omni; requires project, region, IAM |
| **OpenAI** | https://platform.openai.com/api-keys | https://developers.openai.com/api/docs/models | Images + TTS/STT only; **no video** since 2026-09-24 |
| **fal.ai** | https://fal.ai/dashboard/keys | https://fal.ai/models (per-endpoint `llms.txt`) | One key for Kling, ByteDance, Alibaba, MiniMax, Meshy, Tripo, Trellis, ElevenLabs, xAI, Luma…; queue API + webhooks |
| **Replicate** | https://replicate.com/account/api-tokens | https://replicate.com/pricing | Alternate aggregator; useful for open-weights fallbacks |
| **Kling** | https://kling.ai/dev/api-key | https://kling.ai/document-api/guides/get-started/overview | Kling 4.0 / 4.0 Flash; credit-based billing |
| **ByteDance (BytePlus ModelArk)** | https://console.byteplus.com/ark | https://docs.byteplus.com/en/docs/ModelArk/ | Seedream 5.5 / Seedance 2.5 first-party; US-hosted variants |
| **MiniMax** | https://platform.minimax.io | https://platform.minimax.io/docs | H3, Music 3, Speech 2.8, Hailuo 2.3 |
| **Alibaba (Model Studio)** | https://modelstudio.console.alibabacloud.com | https://www.alibabacloud.com/help/en/model-studio | Wan 3.0, Qwen-Image 3 |
| **ElevenLabs** | https://elevenlabs.io/app/settings/api-keys | https://elevenlabs.io/docs/models | Eleven v4 (`eleven_v4`), Scribe v3, Music |
| **Mistral** | https://console.mistral.ai | https://docs.mistral.ai/models | Voxtral TTS 3 / Transcribe 3; markdown docs at `<page>.md` |
| **Meshy** | https://www.meshy.ai/api | https://docs.meshy.ai | 3D + rigging + animation |
| **Tripo** | https://platform.tripo3d.ai | https://platform.tripo3d.ai/docs/introduction | H3.1; quad mesh option |
| **Tencent (Hunyuan3D)** | https://console.cloud.tencent.com | https://cloud.tencent.com/document/product/1729 | Or call via fal to skip Tencent account setup |
| **xAI** | https://console.x.ai | https://docs.x.ai | Grok Imagine Video 1.5, xAI TTS |
| **Luma** | https://lumalabs.ai/dream-machine/api | https://docs.lumalabs.ai | Ray 3.2 |
| **Lightricks** | — | https://fal.ai/models/lightricks/ltx-2.5 | LTX-2.5 (alpha/HDR); price pending verification |
| **Mureka** | https://platform.mureka.ai | https://platform.mureka.ai/docs | Music 9.5 |
| **Black Forest Labs** | https://bfl.ai | https://docs.bfl.ai | FLUX 3 (self-host option) |
| **Ideogram** | https://ideogram.ai/api | https://developer.ideogram.ai | Typography-led image |
| **Hi3D** | — | https://fal.ai/models/hitem3d/hi3d | High-res 3D via fal |

---

## 10. Caveats, conflicts and what is *not* verified

1. **Reseller vs first-party pricing.** fal's numbers are fal's. Where both exist we show both; where only fal exists (`verified: fal`) the router should re-check before publishing a public price.
2. **Nano Banana 2.1 4K:** Google says $0.113, BenchLM says $0.0756. Google's own token arithmetic ($30/1M × 3780 tok) supports $0.113. **Use $0.113.**
3. **ElevenLabs Music:** $0.15/min direct vs $0.60/min on fal. Route music direct if cost matters.
4. **Veo 3.1 "1 count":** Vertex's table bills per count; independent fal per-second rates match exactly at 1 s = 1 count, so the per-second reading is sound. Still, Vertex bills in 1-second increments — verify on the invoice for the first production month.
5. **Promo pricing pollutes list prices.** MiniMax H3 Max and Gemini 3.8 Flash TTS are both running dated promotions (H3 Max through 2026-11-15+, TTS through 2026-12-31). Store `list_price` and `promo_price` + `promo_ends` separately.
6. **Seedream 5.0 Pro is explicitly "tentative pricing … not yet confirmed"** on fal — do not surface it as a quote.
7. **LTX-2.5 pricing was not captured** in this pass (`verified: no`). Its capability set (alpha channel, HDR, audio-to-video) is distinctive enough to justify a follow-up.
8. **Suno is absent** from every first-party pricing page reachable in this pass; no Suno price is asserted here.
9. **No benchmark Elo data was retrievable** (Artificial Analysis leaderboards did not render for this pass). Quality claims above are therefore either (a) the vendor's own marketing language, quoted as such, or (b) price/spec facts. They are **not** independent quality rankings.
10. **Model IDs drift monthly.** Every ID in this document was read on 2026-11-19; treat them as cache entries with a TTL, and re-resolve via each provider's `llms.txt`/model index before a call.

---

## 11. Source index (all read 2026-11-19)

**First-party pricing/docs**
- https://ai.google.dev/gemini-api/docs/pricing — Nano Banana 2.1 / 2 / Pro, Lyria, TTS, Transcribe rates
- https://ai.google.dev/gemini-api/docs/models — confirms Imagen 4 shutdown, Lyria 3.5, NB family IDs
- https://cloud.google.com/vertex-ai/generative-ai/pricing — Veo 3.1 family, Gemini Omni token rates, Lyria
- https://cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate — `veo-3.1-generate-001` etc.
- https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/omni-1-2-flash — `gemini-omni-1.2-flash`
- https://developers.openai.com/api/docs/pricing — GPT-Image-2.6 token rates, gpt-live-transcribe
- https://developers.openai.com/api/docs/models/sora-2 — **Sora 2 shutdown notice (2026-09-24)**
- https://developers.openai.com/api/docs/models/gpt-image-2.6-sunburst — model ID + rates
- https://developers.openai.com/api/docs/models/gpt-transcribe — $0.0045/min
- https://developers.openai.com/api/docs/guides/image-generation — per-image cost table (GPT-Image-2 basis)
- https://elevenlabs.io/pricing/api — Eleven v4/Turbo, Scribe v3, Music, Voice Isolator
- https://docs.mistral.ai/inference/pricing — Voxtral TTS 3 / Transcribe 3 rates
- https://docs.mistral.ai/models/voxtral-mini-tts-3-0 — $13/1M chars, released 2026-10-20
- https://kling.ai/document-api/guides/get-started/overview — Kling 4.0 (30 s, multi-keyframe), 4.0 Flash

**Reseller (fal.ai live endpoint metadata)**
- https://fal.ai/models/google/nano-banana-2.1/llms.txt · …/nano-banana-2.1/edit · …/fal-ai/nano-banana-pro
- https://fal.ai/models/openai/gpt-image-2.6/sunburst/text-to-image/llms.txt
- https://fal.ai/models/bytedance/seedream/v5.5/text-to-image/llms.txt
- https://fal.ai/models/kling/v4/text-to-image/llms.txt · …/kling/v4/text-to-video/llms.txt · …/kling/v4/flash/text-to-video
- https://fal.ai/models/alibaba/qwen-image-3/text-to-image/llms.txt · …/alibaba/wan-3.0/text-to-video · …/alibaba/wan-3.0-prime/text-to-video
- https://fal.ai/models/blackforestlabs/flux-3/text-to-image/llms.txt · …/ideogram/v4.5/llms.txt
- https://fal.ai/models/fal-ai/veo3.1/llms.txt · …/google/gemini-omni-flash/v1.2/text-to-video
- https://fal.ai/models/bytedance/seedance-2.5/us/text-to-video/llms.txt · …/flash/text-to-video
- https://fal.ai/models/minimax/h3/text-to-video/llms.txt · …/minimax/h3-max/text-to-video · …/fal-ai/minimax/hailuo-2.3/pro/text-to-video
- https://fal.ai/models/xai/grok-imagine-video/v1.5/text-to-video/llms.txt · …/luma/agent/ray/v3.2/text-to-video
- https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/image-to-3d/llms.txt · …/fal-ai/hunyuan3d-v3/text-to-3d
- https://fal.ai/models/meshy/v7.1/text-to-3d/llms.txt · …/tripo3d/h3.1/text-to-3d · …/fal-ai/trellis-2 · …/hitem3d/hi3d/v3.0/image-to-3d · …/hyper3d/rigging
- https://fal.ai/models/elevenlabs/tts/eleven-v4/llms.txt · …/eleven-v4-turbo · …/elevenlabs/music/v2.5 · …/fal-ai/elevenlabs/speech-to-text/scribe-v2
- https://fal.ai/models/google/lyria-3.5/llms.txt · …/minimax/music-3 · …/mureka/v9.5/generate/song · …/sonilo/v1.1/text-to-music
- https://fal.ai/models/fal-ai/minimax/speech-2.8-hd/llms.txt · …/xai/tts/v1
- https://fal.ai/pricing.md — billing model (per-output credits, no charge on server errors)

**Secondary (cross-check only)**
- https://benchlm.ai/media-pricing — used to cross-check Google/OpenAI/Sora/Eleven v4 rates; one conflict noted (§10.2)

---

### Appendix A — quick cost sanity table (what a "typical" unit costs)

| Unit | Cheapest credible | Mainstream default | Premium |
|---|---|---|---|
| 1 image @1K | $0.03 (Seedream 5.5) | $0.0336 (NB 2.1) | $0.134–$0.211 (NB Pro / GPT-Image-2.6 high) |
| 1 video second @720p w/ audio | $0.05 (Veo 3.1 Lite) | $0.10 (Wan 3.0) – $0.157 (Kling 4.0) | $0.40 (Veo 3.1) – $0.473 (Seedance 2.5) |
| 1 3D asset, textured | $0.20 (Tripo H3.1) | $0.375–$0.525 (Hunyuan3D 3.1 Pro + PBR) | $1.20–$1.52 (Meshy 7.1 full) |
| 1k TTS characters | $0.013 (Voxtral TTS 3) | $0.04 (Eleven v4 Turbo) | $0.08 (Eleven v4) |
| 1 song | $0.08 (Lyria 3.5) | $0.15 (Mureka 9.5) | ~$0.45–$0.75 (ElevenLabs Music, 3–5 min) |
| 1 audio minute transcribed | $0.0033 (Scribe v3) | $0.004 (Voxtral Small 3) | $0.008 (Scribe v2 via fal) |

*Written 2026-11-19. Prices and model IDs are a point-in-time snapshot; re-verify before publishing externally.*
