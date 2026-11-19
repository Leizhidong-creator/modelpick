# Vertical shorts

Four 9:16 cuts for X, YouTube Shorts, TikTok, and Reels. Each has burned-in English + 中文 captions, a hook, and the repo URL.

| File | Length | Hook | Best use |
|---|---:|---|---|
| `short-cost.mp4` | 15s | The cheapest token is not the cheapest task. | X reply / Shorts / Reels |
| `short-3d.mp4` | 30s | 40 models. One command. The right one. | X quote-post / Shorts |
| `short-pipeline.mp4` | 25s | Five models. One budget. | Shorts / product video |
| `short-proof.mp4` | 20s | Every pick has a test. | Trust-building reply / Shorts |

## Posting copy

### short-cost.mp4

```
The cheapest token is not the cheapest task.

A model that needs 1.8 attempts can be cheaper per token and more expensive per finished task.

ModelPick prices routing in cost per solved task.

npx -y github:Leizhidong-creator/modelpick pick "your task"
```

### short-3d.mp4

```
"3D sword for a Unity game" → one model, one real cost, one key.

Tripo H3.1 · quality 94 · $0.21 per usable asset
40 models · 20 task nodes · no gateway

Open source, MIT.
```

### short-pipeline.mp4

```
A launch video is not one model.

Script → keyframes → clips → voice → music.
Five models, one budget, before a single frame renders.

ModelPick plans the pipeline.
```

### short-proof.mp4

```
A 4/5 pass rate is not 80% reliable.
At n=5 the Wilson interval is roughly 38–96%.

Every pick has a test; every limit is written down.

modelpick eval takes your own runs.
```

## Rules

- Do not remove the repo URL.
- Do not add a second music track; the narration is the audio.
- Post native video, not a link to a video.
- One CTA per post.
- YouTube Shorts title should match the hook; do not stuff hashtags.
- If a platform asks for a transcript, use `assets/modelpick-intro.bilingual.srt`.

## Regenerate

The source is `assets/modelpick-intro.mp4`. The vertical layout is a blurred 9:16 background with the 16:9 master centered, plus a hook and repo URL. Re-render with:

```bash
ffmpeg -ss <start> -t <seconds> -i assets/modelpick-intro.mp4 \
  -filter_complex "[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:4[bg2];[fg]scale=1080:-2[fg2];[bg2][fg2]overlay=(W-w)/2:(H-h)/2,drawtext=...:text='<hook>':...:enable='between(t,0,5)',drawtext=...:text='github.com/Leizhidong-creator/modelpick':...[out]" \
  -map "[out]" -map 0:a -c:v libx264 -crf 21 -pix_fmt yuv420p -c:a aac -shortest launch/shorts/<name>.mp4
```

Do not crop the 16:9 master to 9:16; the terminal and the metric card are on opposite sides and the crop destroys the story.
