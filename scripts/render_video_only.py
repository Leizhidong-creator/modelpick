#!/usr/bin/env python3
"""Re-render the film visuals while preserving the existing voice/music mix.

Use this after a visual-only change (type, color, grain, camera) when the VO
timing has not changed. It avoids re-synthesizing the voice.
"""
from pathlib import Path
import subprocess

import imageio_ffmpeg
import make_video as mv

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
WORK = ASSETS / "_video"
WORK.mkdir(parents=True, exist_ok=True)
mv.FRAMES.mkdir(parents=True, exist_ok=True)
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

source = ASSETS / "modelpick-intro.mp4"
audio = WORK / "mix.wav"
subprocess.run(
    [FFMPEG, "-y", "-loglevel", "error", "-i", str(source), "-vn", "-ac", "2", "-ar", "44100", str(audio)],
    check=True,
)
mv.render(TIMELINE, TOTAL)
output = ASSETS / "modelpick-intro-v2.mp4"
subprocess.run(
    [
        FFMPEG, "-y", "-loglevel", "error",
        "-framerate", str(mv.FPS),
        "-i", str(mv.FRAMES / "%05d.png"),
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
        str(output),
    ],
    check=True,
)
print(f"wrote {output} ({output.stat().st_size / 1e6:.1f} MB)")
