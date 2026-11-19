#!/usr/bin/env python3
"""Fast cinematic pass: one master still per scene + slow camera moves.

This keeps the editorial typography and grain from make_video.py but avoids
re-drawing complex UI at 24fps. The voice/music mix is reused from the existing
cut, so the timing never changes.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageChops

import make_video as mv

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
WORK = ASSETS / "_video"
FRAMES = WORK / "frames-still"
for path in (WORK, FRAMES):
    path.mkdir(parents=True, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

TIMELINE = [
    {"id": "open", "start": 0.0, "duration": 7.5},
    {"id": "cost", "start": 7.5, "duration": 10.5},
    {"id": "intro", "start": 18.0, "duration": 12.171},
    {"id": "claude", "start": 30.171, "duration": 17.376},
    {"id": "plan", "start": 47.547, "duration": 13.0},
    {"id": "install", "start": 60.547, "duration": 13.0},
    {"id": "evidence", "start": 73.547, "duration": 10.0},
    {"id": "cta", "start": 83.547, "duration": 10.0},
]
TOTAL = 93.547
FPS = 24
W, H = mv.W, mv.H

# Master stills: the last readable state of each scene.
stills = {}
for index, scene in enumerate(TIMELINE):
    renderer = next(item["render"] for item in mv.SCENES if item["id"] == scene["id"])
    still = renderer(max(0.0, scene["duration"] - 1.1)).convert("RGB")
    still.save(WORK / f"still-{index}.png")
    stills[scene["id"]] = still

source = ASSETS / "modelpick-intro.mp4"
audio = WORK / "mix.wav"
subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(source), "-vn", "-ac", "2", "-ar", "44100", str(audio)], check=True)


def camera(still: Image.Image, progress: float, scene_index: int) -> Image.Image:
    zoom = 1.012 + 0.032 * progress
    nw, nh = int(W * zoom), int(H * zoom)
    image = still.resize((nw, nh), Image.LANCZOS)
    # Very slow lateral drift, alternating direction by scene.
    drift = (progress - 0.5) * 18 * (1 if scene_index % 2 else -1)
    left = (nw - W) // 2 + int(drift)
    top = (nh - H) // 2 - int((progress - 0.5) * 8)
    left = max(0, min(nw - W, left))
    top = max(0, min(nh - H, top))
    return image.crop((left, top, left + W, top + H))


frame_count = int(TOTAL * FPS)
for frame in range(frame_count):
    now = frame / FPS
    index = len(TIMELINE) - 1
    for i, scene in enumerate(TIMELINE):
        if scene["start"] <= now < scene["start"] + scene["duration"]:
            index = i
            break
    scene = TIMELINE[index]
    local = now - scene["start"]
    progress = min(1.0, local / max(scene["duration"], 0.1))
    image = camera(stills[scene["id"]], progress, index)

    # 0.45s crossfade into the next still at the end of each scene.
    remaining = scene["duration"] - local
    if index < len(TIMELINE) - 1 and remaining < 0.45:
        next_scene = TIMELINE[index + 1]
        next_image = camera(stills[next_scene["id"]], 0.0, index + 1)
        alpha = 1 - remaining / 0.45
        image = Image.blend(image, next_image, max(0.0, min(1.0, alpha)))

    image = Image.blend(image, mv.GRAIN[frame % 4], 0.028)
    image = ImageChops.multiply(image, mv.VIGNETTE)
    # Global fade-in/out only; scene crossfades already handle the middle.
    if now < 0.5:
        image = Image.blend(Image.new("RGB", (W, H), mv.BG), image, now / 0.5)
    if TOTAL - now < 0.8:
        image = Image.blend(image, Image.new("RGB", (W, H), mv.BG), 1 - (TOTAL - now) / 0.8)
    image.save(FRAMES / f"{frame:05d}.jpg", quality=92, subsampling=0)
    if frame % 240 == 0:
        print(f"frame {frame}/{frame_count}", flush=True)

output = ASSETS / "modelpick-intro-v3.mp4"
subprocess.run(
    [
        FFMPEG, "-y", "-loglevel", "error",
        "-framerate", str(FPS), "-i", str(FRAMES / "%05d.jpg"),
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
        str(output),
    ],
    check=True,
)
print(f"wrote {output} ({output.stat().st_size / 1e6:.1f} MB)")
