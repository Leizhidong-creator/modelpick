# ModelPick intro film — script and storyboard

**Master:** `assets/modelpick-intro.mp4` · 93.5s · 1920×1080 · 24fps · H.264 + AAC
**Captions:** `assets/modelpick-intro.srt` (English, not burned in)
**Poster:** `assets/modelpick-intro-thumb.png`
**Voice:** local Kokoro neural TTS, `am_michael`, speed 0.93 — measured, low, keynote pace. No cloud voice, no key.
**Music:** generated A-minor synth pad, ducked under the voice, no percussion.
**Direction:** one idea per scene, slow fades, no whooshes, no stock footage. Product truth is shown in monospace; emotion is carried by the voice and the cut.

## Why this cut

Apple/Google product films earn attention by **removing** things: no feature list, no logo sting every five seconds, no "excited to announce." This film has eight scenes and one argument:

> Your agent picks one model for everything. That is a decision problem. ModelPick makes the decision at each node, prices it per solved task, and picks the best value — not the cheapest.

The product appears at 30s, after the problem is felt. The benchmark appears at 74s, after the use cases. The CTA is 10 seconds and says the tagline once.

## Script

| # | Time | Voiceover | On-screen |
|---|---|---|---|
| 1 | 00:00–00:07.5 | Your agent can build almost anything. But it still picks one model for everything. | "Your agent can build almost anything." / "But it still picks **one model for everything.**" |
| 2 | 00:07.5–00:18.0 | A frontier model to classify a support ticket. To generate a barrel prop. To draft a thumbnail. Most of that spend is wasted. | Three cards: classify $0.64, prop $1.34, thumbnail $0.14. "Most of that spend is wasted." |
| 3 | 00:18.0–00:30.2 | This is ModelPick. A decision layer that picks the best value at every node — not the cheapest, the best price-performance — and prices it in cost per solved task. | **MODELPICK** / "Not the cheapest. The best value." / "5.5 quality points below the best, at 27% of the cost." |
| 4 | 00:30.2–00:47.5 | Inside Claude Code, ask for a game-ready 3D asset. ModelPick compares Tripo, Hunyuan, and Meshy, applies the constraints, and returns one recommendation with the real cost. Twenty-one cents per usable asset. | Terminal: `modelpick pick "3D sword for a Unity game"` → Tripo H3.1, 94 quality, $0.21. Side panel: quality / cost / attempts / `TRIPO_API_KEY`. |
| 5 | 00:47.5–01:00.5 | For a launch video, it plans the whole pipeline. Script, keyframes, clips, voice, music. Five models, one budget, before a single frame renders. | Five nodes: script $0.03, keyframes $0.04, clips $0.60, voice $0.02, music $0.09. Total $0.77. |
| 6 | 01:00.5–01:13.5 | One command installs it into Codex, Cursor, DeepSeek Harness, or Copilot. A CLI, an MCP server, and a skill. No gateway. No keys stored. | Three columns: CLI / MCP / SKILL. Agent chips. "No gateway · no keys stored." |
| 7 | 01:13.5–01:23.5 | Every price has a source. Every decision is benchmarked. And the entire catalog is a JSON file you can change. | 100% top-1, 0.5ms p95, 41 models. Four 100% bars. |
| 8 | 01:23.5–01:33.5 | ModelPick. Stop paying frontier prices for non-frontier work. Open source. MIT. On GitHub. | Logo, tagline, `github.com/Leizhidong-creator/modelpick`, install command. |

Full text is in `assets/modelpick-intro.srt`.

## Storyboard

| Scene | Picture | Camera / motion | Transition | Sound |
|---|---|---|---|---|
| 1. Cold open | Near-black field, one soft teal glow top-right. Three lines of type, left-aligned at 180px. The last line is red. | Slow 2% push; lines fade up 0.8s apart. | 0.45s fade to black. | VO only; pad enters at 0:04. |
| 2. The waste | Three dark cards slide up, 570px apart. Each has an uppercase task label, a model archetype, a large yellow price. | Cards stagger 0.4s; 24px rise. | 0.45s fade. | Pad warms; no hits. |
| 3. Introducing | Centered cyan square with "MP", then the wordmark. Tagline in cyan, proof line in green monospace. | Logo scales 0.96→1; text fades. | 0.55s fade. | Pad opens up; VO lands on "best value". |
| 4. Claude Code | Left: a terminal with traffic lights, typed command, line-by-line output. Right: a decision card with four rows. | Terminal lines appear at reading speed; card fades 1.2s later. | Cut on the word "asset". | VO; pad low. |
| 5. Pipeline | Five connected cards across 1920px, each a step + model + price. Total at lower left. | Arrows draw left-to-right; cards fade in sequence. | 0.45s fade. | Pad pulses once at "one budget". |
| 6. Install | Three columns (CLI, MCP, SKILL), then a row of five agent chips. | Columns rise; chips pop 0.12s apart. | 0.45s fade. | VO; pad steady. |
| 7. Evidence | Three big numbers, then four full-width bars. | Numbers fade up; bars fill 0.8s. | 0.45s fade. | Pad resolves. |
| 8. CTA | Logo, tagline, URL, install command. | Slow fade; hold 2s. | Fade to black. | Pad resolves to a single note; VO ends. |

## Delivery notes

- **Voice:** do not smile. Land "best value" and "cost per solved task" slightly slower. Pause 250ms after "everything" in scene 1.
- **Pronunciation:** "ModelPick" as two words, equal stress. "Hunyuan" → hoon-yoo-en. "Tripo" → tree-po. "Meshy" → mesh-ee. "Voxtral" → voks-tral.
- **Captions:** sentence case, max 58 characters per line, no speaker labels. The SRT is generated from the VO timing.
- **Music:** if replacing the pad, keep it below -24 LUFS under the voice and avoid a downbeat on the CTA; the tagline should feel like a conclusion, not a drop.
- **Do not add:** a "screen recording" of a fake UI, a countdown, a whoosh, a stock handshake, or a second tagline.

## Regenerate

```bash
python -m pip install -r scripts/requirements-video.txt
# One-time model download (~354 MB):
#   assets/_tts/kokoro-v1.0.onnx
#   assets/_tts/voices-v1.0.bin
python scripts/make_video.py
```

Outputs: `assets/modelpick-intro.mp4`, `.srt`, `-thumb.png`.

The voice is **local** Kokoro `am_michael` at 0.93 speed. No cloud TTS, no API key, no per-render cost. The model files are not committed; the rendered film is.

## Alternate cuts

| Cut | How |
|---|---|
| 60s social | Keep scenes 1, 2, 3, 4, 8. Re-record scene 3 shorter; drop 5–7. |
| 9:16 vertical | Re-render at 1080×1920; stack terminal above the decision card; keep type at 72px minimum. |
| 1:1 Product Hunt | Crop the center 1080×1080 of scenes 3, 4, 8; keep the terminal card fully visible. |
| Silent autoplay | Burn the SRT in at 28px, bottom-center, with a 24px shadow. Never autoplay with sound. |
