#!/usr/bin/env python3
"""Render the 90-second ModelPick intro film.

- Voice: Edge TTS, en-US-AndrewNeural, measured keynote pace.
- Visuals: Pillow frames at 1920x1080 / 24fps.
- Music: generated ambient pad, mixed under the VO.
- Output: assets/modelpick-intro.mp4, .srt, thumbnail, storyboard data.
"""
from __future__ import annotations

import asyncio
import json
import math
import os
import shutil
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
WORK = ASSETS / "_video"
FRAMES = WORK / "frames"
for path in (ASSETS, WORK):
    path.mkdir(exist_ok=True)
if FRAMES.exists():
    shutil.rmtree(FRAMES)
FRAMES.mkdir()

W, H = 1920, 1080
FPS = 24
VOICE = "am_michael"
RATE = 0.93
GAP = 0.55
KOKORO_MODEL = ASSETS / "_tts" / "kokoro-v1.0.onnx"
KOKORO_VOICES = ASSETS / "_tts" / "voices-v1.0.bin"
KOKORO = None

BG = (7, 10, 14)
PANEL = (14, 21, 30)
PANEL2 = (19, 28, 39)
LINE = (38, 52, 68)
TEXT = (235, 241, 247)
IVORY = (245, 239, 228)
GOLD = (201, 169, 110)
DIM = (139, 154, 170)
CYAN = (57, 197, 207)
GREEN = (63, 185, 80)
YELLOW = (210, 153, 34)
RED = (248, 81, 73)
VIOLET = (163, 113, 247)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def F(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def M(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/consolab.ttf" if bold else "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/courbd.ttf" if bold else "C:/Windows/Fonts/cour.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def SERIF(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Editorial serif for the emotional lines. Bodoni if present, Garamond/Georgia fallback."""
    candidates = [
        "C:/Windows/Fonts/BOD_B.TTF" if bold else "C:/Windows/Fonts/BOD_R.TTF",
        "C:/Windows/Fonts/GARABD.TTF" if bold else "C:/Windows/Fonts/GARA.TTF",
        "C:/Windows/Fonts/georgiab.ttf" if bold else "C:/Windows/Fonts/georgia.ttf",
        "/System/Library/Fonts/Supplemental/Didot.ttc",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


F_TITLE = SERIF(100, True)
F_H1 = SERIF(82, True)
F_H2 = SERIF(50, True)
F_SERIF_NUM = SERIF(92, True)
F_BODY = F(30)
F_SMALL = F(24)
F_MONO = M(24)
F_MONO_SMALL = M(20)
F_MONO_BIG = M(40, True)


def spaced(draw: ImageDraw.ImageDraw, xy, text: str, font, fill, tracking: int = 4, anchor=None):
    """Letter-spaced caps for kickers and the wordmark. PIL has no tracking."""
    text = text.upper()
    widths = [draw.textlength(char, font=font) for char in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x, y = xy
    if anchor == "ma":
        x -= total / 2
    elif anchor == "mm":
        x -= total / 2
        y -= font.size / 2
    for char, width in zip(text, widths):
        draw.text((x, y), char, font=font, fill=fill)
        x += width + tracking


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def fade(draw: ImageDraw.ImageDraw, xy, text: str, font, fill, alpha: float, anchor="la"):
    alpha = clamp(alpha)
    if alpha <= 0:
        return
    color = tuple(int(BG[i] + (fill[i] - BG[i]) * alpha) for i in range(3))
    draw.text(xy, text, font=font, fill=color, anchor=anchor)


def base_background() -> Image.Image:
    y = np.linspace(0, 1, H)[:, None]
    top = np.array([7, 11, 16], dtype=float)
    bottom = np.array([10, 18, 24], dtype=float)
    arr = top[None, :] + (bottom - top)[None, :] * y
    arr = np.repeat(arr[:, None, :], W, axis=1).astype(np.uint8)
    image = Image.fromarray(arr, "RGB").convert("RGBA")
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((1150, -420, 2100, 520), fill=(18, 82, 88, 120))
    g.ellipse((-500, 520, 480, 1400), fill=(34, 24, 62, 90))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    return Image.alpha_composite(image, glow)


BASE = base_background()


def make_vignette():
    yy, xx = np.mgrid[0:H, 0:W]
    nx = (xx - W / 2) / (W / 2)
    ny = (yy - H / 2) / (H / 2)
    radius = np.sqrt(nx * nx + ny * ny) / 1.414
    shade = np.clip(255 - 78 * (radius**1.8), 150, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([shade, shade, shade]), "RGB")


VIGNETTE = make_vignette()
GRAIN = []
for _ in range(4):
    plate = Image.effect_noise((W, H), 16).convert("RGB")
    GRAIN.append(plate)


def frame_shell() -> Image.Image:
    return BASE.copy()


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def terminal(draw, box, title, lines, progress=1.0, alpha=1.0):
    x0, y0, x1, y1 = box
    rounded(draw, box, 18, (9, 14, 20, int(255 * alpha)), LINE, 2)
    draw.rectangle((x0, y0, x1, y0 + 56), fill=(17, 25, 34))
    for i, color in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        draw.ellipse((x0 + 24 + i * 24, y0 + 20, x0 + 38 + i * 24, y0 + 34), fill=color)
    draw.text((x0 + 120, y0 + 16), title, font=F_MONO_SMALL, fill=DIM)
    y = y0 + 86
    shown = int(len(lines) * clamp(progress))
    for index, (text, color) in enumerate(lines):
        if index >= shown and progress < 1:
            break
        draw.text((x0 + 34, y), text, font=F_MONO, fill=color)
        y += 40


def scene_open(t: float) -> Image.Image:
    image = frame_shell()
    draw = ImageDraw.Draw(image)
    fade(draw, (180, 300), "A  D E C I S I O N  P R O B L E M", F_SMALL, GOLD, ease((t - 0.1) / 0.8))
    draw.line((182, 344, 470, 344), fill=GOLD, width=2)
    fade(draw, (180, 390), "Your agent can build", F_TITLE, IVORY, ease((t - 0.4) / 1.0))
    fade(draw, (180, 510), "almost anything.", F_TITLE, IVORY, ease((t - 0.9) / 1.0))
    fade(draw, (180, 640), "But it still picks", F_H2, DIM, ease((t - 1.8) / 1.0))
    fade(draw, (180, 710), "one model for everything.", F_TITLE, RED, ease((t - 2.3) / 1.0))
    fade(draw, (184, 860), "That is not a model problem. It is a decision problem.", F_BODY, DIM, ease((t - 3.6) / 1.2))
    return image


def scene_cost(t: float) -> Image.Image:
    image = frame_shell()
    draw = ImageDraw.Draw(image)
    fade(draw, (160, 120), "The bill is not the token price.", F_H1, IVORY, ease((t - 0.1) / 0.8))
    draw.line((162, 225, 620, 225), fill=GOLD, width=2)
    cards = [
        ("CLASSIFY A TICKET", "frontier model", "$0.64", "per solved task", 0.8),
        ("GENERATE A PROP", "hero 3D model", "$1.34", "per usable asset", 1.2),
        ("DRAFT A THUMBNAIL", "studio image model", "$0.14", "per image", 1.6),
    ]
    for index, (label, model, price, unit, delay) in enumerate(cards):
        a = ease((t - delay) / 0.8)
        if a <= 0:
            continue
        x = 160 + index * 570
        y = 300 + (1 - a) * 24
        rounded(draw, (x, y, x + 520, y + 330), 3, (PANEL[0], PANEL[1], PANEL[2], int(190 * a)), (60, 74, 90), 1)
        spaced(draw, (x + 32, y + 30), label, F_MONO_SMALL, GOLD, 2)
        draw.text((x + 32, y + 92), model, font=F_H2, fill=IVORY)
        draw.text((x + 32, y + 180), price, font=F_SERIF_NUM, fill=GOLD)
        draw.text((x + 32, y + 278), unit, font=F_BODY, fill=DIM)
    fade(draw, (160, 760), "Most of that spend is wasted.", F_H2, IVORY, ease((t - 3.0) / 1.0))
    fade(draw, (160, 830), "The model is capable. The choice is wrong.", F_BODY, DIM, ease((t - 3.8) / 1.0))
    return image


def scene_intro(t: float) -> Image.Image:
    image = frame_shell()
    draw = ImageDraw.Draw(image)
    a = ease(t / 1.0)
    center = W // 2
    rounded(draw, (center - 66, 210, center + 66, 342), 6, (57, 197, 207, int(255 * a)))
    draw.text((center, 276), "MP", font=F(56, True), fill=(6, 16, 20), anchor="mm")
    spaced(draw, (center, 400), "MODELPICK", SERIF(96, True), IVORY, 10, anchor="ma")
    draw.line((center - 210, 540, center + 210, 540), fill=GOLD, width=2)
    fade(draw, (center, 590), "Not the cheapest. The best value.", F_H2, GOLD, ease((t - 1.2) / 0.9), anchor="ma")
    fade(draw, (center, 675), "Best price-performance at every node, priced per solved task.", F_BODY, DIM, ease((t - 2.0) / 0.9), anchor="ma")
    fade(draw, (center, 790), "5.5 quality points below the best, at 27% of the cost.", F_MONO, GREEN, ease((t - 2.8) / 0.9), anchor="ma")
    return image


def scene_claude(t: float) -> Image.Image:
    image = frame_shell()
    draw = ImageDraw.Draw(image)
    spaced(draw, (140, 80), "CLAUDE CODE", F_MONO_SMALL, GOLD, 3)
    fade(draw, (140, 120), "A 3D asset, decided before it renders.", F_H2, IVORY, ease((t - 0.1) / 0.6))
    draw.line((142, 195, 760, 195), fill=GOLD, width=2)
    lines = [
        ("$ modelpick pick \"3D sword for a Unity game\"", TEXT),
        ("", TEXT),
        ("3D asset generation  ·  high confidence", CYAN),
        ("", TEXT),
        ("Tripo H3.1  ·  Tripo", TEXT),
        ("quality 94   cost $0.21 / usable asset", GREEN),
        ("$0.20 raw × 1.07 attempts", DIM),
        ("", TEXT),
        ("#2  Hunyuan3D 3.1 Pro   $0.59", DIM),
        ("#3  Meshy 7.1           $1.34", DIM),
        ("", TEXT),
        ("connect: export TRIPO_API_KEY=...", DIM),
    ]
    terminal(draw, (140, 220, 1230, 900), "claude — modelpick", lines, progress=ease((t - 0.6) / 2.6))
    a = ease((t - 2.4) / 0.9)
    if a > 0:
        rounded(draw, (1290, 250, 1770, 870), 3, (PANEL[0], PANEL[1], PANEL[2], int(210 * a)), (60, 74, 90), 1)
        spaced(draw, (1326, 290), "THE DECISION", F_MONO_SMALL, GOLD, 3)
        rows = [("QUALITY", "94 / 100"), ("COST", "$0.21"), ("ATTEMPTS", "1.07"), ("SETUP", "TRIPO_API_KEY")]
        y = 380
        for label, value in rows:
            draw.text((1326, y), label, font=F_SMALL, fill=DIM)
            draw.text((1326, y + 34), value, font=F(42, True), fill=IVORY)
            y += 122
    return image


def scene_plan(t: float) -> Image.Image:
    image = frame_shell()
    draw = ImageDraw.Draw(image)
    fade(draw, (140, 80), "One plan. Five models. One budget.", F_H1, IVORY, ease((t - 0.1) / 0.8))
    draw.line((142, 185, 760, 185), fill=GOLD, width=2)
    steps = [
        ("01", "SCRIPT", "Gemini 4 Hydrogen", "$0.03"),
        ("02", "KEYFRAMES", "Nano Banana 2.1", "$0.04"),
        ("03", "CLIPS", "Veo 3.1 Fast", "$0.60"),
        ("04", "VOICE", "Voxtral TTS 3", "$0.02"),
        ("05", "MUSIC", "Lyria 3.5", "$0.09"),
    ]
    start_x = 120
    box_w = 320
    gap = 35
    for index, (num, label, model, cost) in enumerate(steps):
        a = ease((t - 0.5 - index * 0.25) / 0.7)
        if a <= 0:
            continue
        x = start_x + index * (box_w + gap)
        y = 300 + (1 - a) * 30
        rounded(draw, (x, y, x + box_w, y + 320), 3, (PANEL[0], PANEL[1], PANEL[2], int(200 * a)), (60, 74, 90), 1)
        draw.text((x + 24, y + 22), num, font=F_MONO_SMALL, fill=GOLD)
        spaced(draw, (x + 24, y + 70), label, F(22, True), IVORY, 2)
        draw.text((x + 24, y + 150), model, font=F(24), fill=TEXT)
        draw.text((x + 24, y + 215), cost, font=SERIF(72, True), fill=GOLD)
        if index < len(steps) - 1:
            x1 = x + box_w + 8
            x2 = x + box_w + gap - 8
            draw.line((x1, y + 150, x2, y + 150), fill=GOLD, width=1)
            if a > 0.8:
                draw.polygon([(x2 - 4, y + 145), (x2 + 4, y + 150), (x2 - 4, y + 155)], fill=GOLD)
    fade(draw, (140, 700), "Total  $0.77", F_H1, IVORY, ease((t - 2.2) / 0.8))
    fade(draw, (140, 790), "Before a single frame renders.", F_BODY, DIM, ease((t - 2.7) / 0.8))
    fade(draw, (140, 870), "Script → keyframes → clips → voice → music", F_MONO, GOLD, ease((t - 3.2) / 0.8))
    return image


def scene_install(t: float) -> Image.Image:
    image = frame_shell()
    draw = ImageDraw.Draw(image)
    fade(draw, (140, 80), "Set up your agent.", F_H1, IVORY, ease((t - 0.1) / 0.8))
    draw.line((142, 190, 580, 190), fill=GOLD, width=2)
    tabs = ["CLAUDE CODE", "CODEX CLI", "CURSOR", "DEEPSEEK HARNESS", "COPILOT CLI"]
    tab_cmds = ["setup claude-code", "setup codex", "setup cursor", "setup dsh", "setup copilot"]
    for index, name in enumerate(tabs):
        a = ease((t - 0.35 - index * 0.12) / 0.6)
        if a <= 0:
            continue
        x = 140 + index * 350
        active = index == 1
        rounded(draw, (x, 230, x + 330, 296), 3, (PANEL[0], PANEL[1], PANEL[2], int(220 * a)), (57, 197, 207) if active else (60, 74, 90), 2 if active else 1)
        draw.text((x + 18, 246), name, font=F(20, True), fill=CYAN if active else TEXT)
        draw.text((x + 18, 270), tab_cmds[index], font=F_MONO_SMALL, fill=DIM)

    rounded(draw, (140, 330, 1000, 930), 3, (PANEL[0], PANEL[1], PANEL[2], 220), (60, 74, 90), 1)
    draw.text((170, 354), "~/.codex/config.toml", font=F_MONO, fill=GOLD)
    draw.text((900, 360), "global", font=F_MONO_SMALL, fill=DIM)
    draw.line((170, 392, 970, 392), fill=(60, 74, 90), width=1)
    code = [
        "[mcp_servers.modelpick]",
        'command = "npx"',
        'args = ["-y",',
        '  "github:Leizhidong-creator/modelpick",',
        '  "mcp"]',
    ]
    for index, line in enumerate(code):
        draw.text((170, 418 + index * 42), line, font=F_MONO, fill=TEXT if index == 0 else (201, 212, 223))
    draw.text((170, 660), "Existing config is backed up. Sibling", font=F_SMALL, fill=DIM)
    draw.text((170, 692), "MCP servers are left untouched.", font=F_SMALL, fill=DIM)

    steps = [
        ("1", "RUN THIS", "npx -y github:Leizhidong-creator/modelpick setup codex\ncodex mcp add modelpick --\n  npx -y github:Leizhidong-creator/modelpick mcp"),
        ("2", "RESTART", "codex mcp list  →  modelpick  enabled"),
        ("3", "ASK IT", 'pick a model for a 3D sword for Unity'),
    ]
    y = 356
    for index, (num, label, body) in enumerate(steps):
        a = ease((t - 0.8 - index * 0.3) / 0.7)
        if a <= 0:
            continue
        draw.text((1040, y), num, font=F(24, True), fill=CYAN)
        draw.text((1080, y - 2), label, font=F(20, True), fill=GOLD)
        for offset, line in enumerate(body.split("\n")):
            draw.text((1080, y + 34 + offset * 30), line, font=F_MONO_SMALL, fill=TEXT if index < 2 else CYAN)
        y += 150
    return image


def scene_evidence(t: float) -> Image.Image:
    image = frame_shell()
    draw = ImageDraw.Draw(image)
    fade(draw, (140, 80), "Every pick has a test.", F_H1, IVORY, ease((t - 0.1) / 0.8))
    draw.line((142, 190, 580, 190), fill=GOLD, width=2)
    metrics = [("100%", "top-1 acceptable", "115 development runs"), ("1.1ms", "p95 decision", "no network in the path"), ("40", "models · 20 nodes", "every price sourced")]
    for index, (value, label, detail) in enumerate(metrics):
        a = ease((t - 0.5 - index * 0.3) / 0.8)
        x = 140 + index * 560
        draw.text((x, 250), value, font=SERIF(116, True), fill=GOLD if index < 2 else IVORY)
        draw.text((x, 410), label, font=F_H2, fill=TEXT)
        draw.text((x, 480), detail, font=F_BODY, fill=DIM)
    bars = [("top-1", 1.0), ("top-3", 1.0), ("constraints", 1.0), ("stability", 1.0)]
    y = 640
    for label, value in bars:
        draw.text((140, y), label, font=F_MONO_SMALL, fill=DIM)
        rounded(draw, (330, y + 6, 1540, y + 28), 3, (24, 34, 46))
        rounded(draw, (330, y + 6, 330 + int(1210 * value), y + 28), 3, GREEN)
        draw.text((1570, y), "100%", font=F_MONO_SMALL, fill=GREEN)
        y += 58
    return image


def scene_cta(t: float) -> Image.Image:
    image = frame_shell()
    draw = ImageDraw.Draw(image)
    center = W // 2
    a = ease(t / 0.8)
    rounded(draw, (center - 60, 160, center + 60, 280), 6, (57, 197, 207, int(255 * a)))
    draw.text((center, 220), "MP", font=F(50, True), fill=(6, 16, 20), anchor="mm")
    spaced(draw, (center, 340), "MODELPICK", SERIF(84, True), IVORY, 9, anchor="ma")
    draw.line((center - 210, 470, center + 210, 470), fill=GOLD, width=2)
    fade(draw, (center, 520), "Stop paying frontier prices", F_H2, IVORY, ease((t - 0.9) / 0.8), anchor="ma")
    fade(draw, (center, 590), "for non-frontier work.", F_H2, GOLD, ease((t - 1.2) / 0.8), anchor="ma")
    fade(draw, (center, 710), "github.com/Leizhidong-creator/modelpick", F_MONO_BIG, TEXT, ease((t - 2.0) / 0.8), anchor="ma")
    fade(draw, (center, 790), "Open source  ·  MIT  ·  zero dependencies", F_BODY, DIM, ease((t - 2.5) / 0.8), anchor="ma")
    fade(draw, (center, 880), "npx -y github:Leizhidong-creator/modelpick pick \"your task\"", F_MONO, GREEN, ease((t - 3.0) / 0.8), anchor="ma")
    return image


SCENES = [
    {
        "id": "open",
        "vo": "Your agent can build almost anything. But it still picks one model for everything.",
        "min": 7.5,
        "render": scene_open,
    },
    {
        "id": "cost",
        "vo": "A frontier model to classify a support ticket. To generate a barrel prop. To draft a thumbnail. Most of that spend is wasted.",
        "min": 10.5,
        "render": scene_cost,
    },
    {
        "id": "intro",
        "vo": "This is ModelPick. A decision layer that picks the best value at every node — not the cheapest, the best price-performance — and prices it in cost per solved task.",
        "min": 12.0,
        "render": scene_intro,
    },
    {
        "id": "claude",
        "vo": "Inside Claude Code, ask for a game-ready 3D asset. ModelPick compares Tripo, Hunyuan, and Meshy, applies the constraints, and returns one recommendation with the real cost. Twenty-one cents per usable asset.",
        "min": 16.0,
        "render": scene_claude,
    },
    {
        "id": "plan",
        "vo": "For a launch video, it plans the whole pipeline. Script, keyframes, clips, voice, music. Five models, one budget, before a single frame renders.",
        "min": 13.0,
        "render": scene_plan,
    },
    {
        "id": "install",
        "vo": "One command installs it into Codex, Cursor, DeepSeek Harness, or Copilot. A CLI, an MCP server, and a skill. No gateway. No keys stored.",
        "min": 13.0,
        "render": scene_install,
    },
    {
        "id": "evidence",
        "vo": "Every price has a source. Every decision is benchmarked. And the entire catalog is a JSON file you can change.",
        "min": 10.0,
        "render": scene_evidence,
    },
    {
        "id": "cta",
        "vo": "ModelPick. Stop paying frontier prices for non-frontier work. Open source. MIT. On GitHub.",
        "min": 10.0,
        "render": scene_cta,
    },
]


def ffmpeg(args):
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", *args], check=True)


async def synth(text: str, path: Path):
    """Local Kokoro neural TTS. No network, no key, deterministic on re-render."""
    global KOKORO
    if not KOKORO_MODEL.exists() or not KOKORO_VOICES.exists():
        raise FileNotFoundError(
            f"Kokoro model files missing. Download kokoro-v1.0.onnx and voices-v1.0.bin into {KOKORO_MODEL.parent}."
        )
    if KOKORO is None:
        KOKORO = Kokoro(str(KOKORO_MODEL), str(KOKORO_VOICES))
    samples, sample_rate = KOKORO.create(text, voice=VOICE, speed=RATE, lang="en-us")
    sf.write(str(path), samples, sample_rate)


def read_wav(path: Path):
    with wave.open(str(path), "rb") as f:
        assert f.getframerate() == 44100 and f.getnchannels() == 2 and f.getsampwidth() == 2
        return np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, 2)


def build_audio():
    timeline = []
    cursor = 0.0
    pieces = []
    silence = np.zeros((int(44100 * GAP), 2), dtype=np.int16)
    for index, scene in enumerate(SCENES):
        wav24 = WORK / f"vo-{index:02d}-24k.wav"
        wav = WORK / f"vo-{index:02d}.wav"
        asyncio.run(synth(scene["vo"], wav24))
        ffmpeg(["-i", str(wav24), "-ar", "44100", "-ac", "2", str(wav)])
        data = read_wav(wav)
        duration = len(data) / 44100
        scene_duration = max(scene["min"], duration + 0.8)
        start = cursor
        pieces.append(data)
        pieces.append(np.zeros((int(44100 * (scene_duration - duration)), 2), dtype=np.int16))
        timeline.append({**{k: scene[k] for k in ("id", "vo", "min")}, "start": round(start, 3), "duration": round(scene_duration, 3), "voDuration": round(duration, 3)})
        cursor += scene_duration
    voice = np.concatenate(pieces, axis=0).astype(np.float32) / 32768.0
    total = len(voice) / 44100
    # Ambient score: slow minor pad, no percussion.
    t = np.arange(len(voice)) / 44100
    music = np.zeros_like(voice)
    chords = [
        (110.0, 164.81, 220.0, 261.63),
        (98.0, 146.83, 196.0, 246.94),
        (87.31, 130.81, 174.61, 220.0),
        (98.0, 146.83, 196.0, 293.66),
    ]
    for index, chord in enumerate(chords):
        seg = (t >= index * total / 4) & (t < (index + 1) * total / 4 + 1)
        local = t - index * total / 4
        env = np.clip(local / 2.0, 0, 1) * np.clip((total / 4 + 2 - local) / 2.0, 0, 1)
        for freq in chord:
            for detune in (-0.15, 0.0, 0.15):
                music[seg] += (0.025 * env[seg] * np.sin(2 * np.pi * (freq + detune) * t[seg]))[:, None]
    # Sparse piano-like motif at each scene change.
    for scene in timeline:
        start = scene["start"] + 0.15
        for offset, freq in [(0.0, 440.0), (0.35, 659.25), (0.7, 523.25)]:
            begin = int((start + offset) * 44100)
            length = int(2.8 * 44100)
            if begin >= len(music):
                continue
            end = min(len(music), begin + length)
            local_t = np.arange(end - begin) / 44100
            note = np.sin(2 * np.pi * freq * local_t) * np.exp(-local_t * 2.4) * 0.028
            music[begin:end, 0] += note
            music[begin:end, 1] += note
    music *= 0.55
    # Duck music under voice using a slow envelope.
    env = np.abs(voice).mean(axis=1)
    env = np.convolve(env, np.ones(2205) / 2205, mode="same")
    duck = 1.0 / (1.0 + 8.0 * np.clip(env * 18, 0, 1))
    mixed = voice + music * duck[:, None]
    peak = np.max(np.abs(mixed)) or 1.0
    mixed = mixed / peak * 0.92
    out = WORK / "mix.wav"
    with wave.open(str(out), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(44100)
        f.writeframes((mixed * 32767).astype(np.int16).tobytes())
    return timeline, out, total


def write_srt(timeline, path: Path):
    lines = []
    for index, scene in enumerate(timeline, 1):
        text = scene["vo"]
        words = text.split()
        chunks = []
        current = []
        for word in words:
            current.append(word)
            if len(" ".join(current)) > 58:
                chunks.append(" ".join(current))
                current = []
        if current:
            chunks.append(" ".join(current))
        span = scene["voDuration"] / max(1, len(chunks))
        for chunk_index, chunk in enumerate(chunks):
            start = scene["start"] + chunk_index * span
            end = start + span
            lines.append(f"{index * 10 + chunk_index + 1}")
            lines.append(f"{srt_time(start)} --> {srt_time(end)}")
            lines.append(chunk)
            lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def srt_time(seconds: float):
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def render(timeline, total: float):
    frame_count = int(total * FPS)
    index = 0
    preview_times = []
    acc = 0.0
    for scene in timeline:
        acc += scene["duration"]
        preview_times.append((scene["id"], min(acc - 0.4, total - 0.1)))
    preview_set = {}
    for scene_id, when in preview_times:
        preview_set[int(when * FPS)] = scene_id

    for frame in range(frame_count):
        now = frame / FPS
        scene = timeline[-1]
        for candidate in timeline:
            if candidate["start"] <= now < candidate["start"] + candidate["duration"]:
                scene = candidate
                break
        local = now - scene["start"]
        image = next(s for s in SCENES if s["id"] == scene["id"])["render"](local)
        # Slow camera push + grain + vignette: the difference between a slide and a film.
        progress = min(1.0, local / max(scene["duration"], 0.1))
        zoom = 1.006 + 0.010 * progress
        nw, nh = int(W * zoom), int(H * zoom)
        image = image.resize((nw, nh), Image.LANCZOS)
        left = (nw - W) // 2
        top = (nh - H) // 2
        image = image.crop((left, top, left + W, top + H))
        image = image.convert("RGB")
        image = Image.blend(image, GRAIN[frame % 4], 0.028)
        image = ImageChops.multiply(image, VIGNETTE)
        # Gentle fade at scene boundaries (except the first).
        fade_in = min(1.0, local / 0.55) if scene["start"] > 0 else 1.0
        fade_out = min(1.0, (scene["duration"] - local) / 0.45)
        alpha = min(fade_in, fade_out)
        if alpha < 1:
            black = Image.new("RGB", (W, H), BG)
            image = Image.blend(black, image.convert("RGB"), max(0.0, alpha))
        image.convert("RGB").save(FRAMES / f"{frame:05d}.png")
        if frame in preview_set:
            image.convert("RGB").save(ASSETS / f"video-frame-{preview_set[frame]}.png")
        index = frame
        if frame % 120 == 0:
            print(f"frame {frame}/{frame_count}", flush=True)
    return frame_count


def main():
    timeline, audio, total = build_audio()
    (WORK / "timeline.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")
    print(f"audio {total:.2f}s, scenes {len(timeline)}")
    frames = render(timeline, total)
    video = ASSETS / "modelpick-intro.mp4"
    ffmpeg([
        "-framerate", str(FPS),
        "-i", str(FRAMES / "%05d.png"),
        "-i", str(audio),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(video),
    ])
    write_srt(timeline, ASSETS / "modelpick-intro.srt")
    # Thumbnail from the intro scene.
    thumb_time = next(s["start"] + 2.0 for s in timeline if s["id"] == "intro")
    frame_file = FRAMES / f"{int(thumb_time * FPS):05d}.png"
    Image.open(frame_file).save(ASSETS / "modelpick-intro-thumb.png")
    print(f"wrote {video} ({video.stat().st_size / 1e6:.1f} MB), {frames} frames")


if __name__ == "__main__":
    main()
