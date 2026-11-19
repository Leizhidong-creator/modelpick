# Media evidence

Media quality is the weakest part of the catalog. This page records the first independent output comparison and the calibration it forced.

## Text-to-image

Source: [Artificial Analysis text-to-image leaderboard](https://artificialanalysis.ai/image/leaderboard/text-to-image), scraped 2026-11-18. Human-preference Elo from blind A/B comparisons.

| Rank | Model | Elo | Gap to #1 |
|---:|---|---:|---:|
| 1 | GPT Image 2.6 Sunburst (max) | 1261 | Leader |
| 6 | GPT Image 2 (high) | 1192 | −69 |
| 8 | Nano Banana 2.1 | 1176 | −85 |
| 14 | Seedream 5.5 | 1134 | −127 |
| 18 | Nano Banana Pro (Gemini 3 Pro Image) | 1119 | −142 |

### What this changed

`nano-banana-pro` was previously rated **96** overall, the highest image score in the catalog. The independent arena ranked it **#18**, below Nano Banana 2.1 (#8) and GPT Image 2 high (#6).

The score was lowered to:

| Capability | Before | After |
|---|---:|---:|
| overall | 96 | 91 |
| imageGen | 96 | 91 |
| imageEdit | 97 | 92 |
| textInImage | 97 | 96 |

Text rendering and 4K are still a real strength, so `textInImage` stays high. But the default hero-image recommendation should not be the model that loses the blind arena to a cheaper sibling.

This is exactly the kind of correction the product needed: the prior was expensive and wrong.

### What this does not change

- `seedream-5.5` stays at 90; the arena puts it at #14, consistent with a mid-tier cheap model.
- `gpt-image-2` stays at 94; the arena puts its high variant at #6.
- `nano-banana-2.1` stays at 93; #8 is consistent.
- The score is still a **task-weighted prior**, not a per-prompt measurement.


## Text-to-video

Source: [Artificial Analysis AA-Video-T2V v2.1](https://artificialanalysis.ai/video/leaderboard/text-to-video), updated 2026-11-18. Human pairwise Elo.

| Rank | Model | Elo | Catalog prior before | After |
|---:|---|---:|---:|---:|
| 4 | Dreamina Seedance 2.5 | 1156 | 93 | 93 |
| 22 | Kling 3.0 Omni 1080p (Pro) | 1016 | — | — |
| 26 | Veo 3.1 | 963 | 95 | **89** |
| 27 | Veo 3.1 Fast | 954 | 86 | 86 |

Veo 3.1 was rated 95, above Seedance 2.5 (93), but the arena puts it **#26**, 193 Elo below Seedance. It keeps its real strengths — native audio/dialogue and 4K — but it is no longer the default hero video. The catalog now says: use it for audio/dialogue, not as the default.

`qualityConfidence` is `mixed` for video as well.

## Media confidence

`recommend` now returns:

```json
"qualityConfidence": {
  "level": "mixed",
  "label": "arena + prior",
  "note": "Image ranking is informed by a public arena; other media dimensions remain expert priors."
}
```

- text: `benchmark`
- image: `mixed` (public arena + prior)
- video: `mixed` (public arena + prior)
- 3D / audio: `prior`

This is deliberate. Calling a single arena scrape a full “independent benchmark” would be the same mistake in the other direction.

## Reproduce

The source data is public. To re-check:

1. Open the Artificial Analysis leaderboard.
2. Compare the four models above.
3. If the rank order changes, open a model-update issue with the date and the score.
4. Run `node scripts/checksums.js` after a catalog edit, then `node scripts/validate.js`.

## Remaining media gaps

- No independent human comparison for video, 3D, or audio.
- No per-prompt evaluation set.
- No inter-rater agreement data.
- Arena aggregate Elo is not a cost-per-solved-task measure.

Do not turn this page into a claim that media quality is solved. It is the first correction, not the last.
