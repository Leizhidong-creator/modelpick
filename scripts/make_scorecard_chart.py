#!/usr/bin/env python3
"""Render the six-dimension scorecard as a shareable PNG."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'tests/results/scorecard-latest.json').read_text(encoding='utf-8'))

W, H = 1280, 760
BG = (7, 10, 14)
PANEL = (13, 20, 28)
LINE = (34, 48, 62)
TEXT = (235, 241, 247)
DIM = (139, 154, 170)
CYAN = (57, 197, 207)
GOLD = (201, 169, 110)
GREEN = (63, 185, 80)
RED = (248, 81, 73)


def font(size, bold=False):
    paths = [
        'C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',
        'C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]
    for path in paths:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def serif(size):
    paths = ['C:/Windows/Fonts/BOD_B.TTF', 'C:/Windows/Fonts/georgiab.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf']
    for path in paths:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return font(size, True)


image = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(image)
# Soft background wash.
for y in range(H):
    alpha = int(8 * (1 - y / H))
    draw.line((0, y, W, y), fill=(7 + alpha, 12 + alpha, 16 + alpha))

draw.text((70, 62), 'ModelPick', font=serif(46), fill=TEXT)
draw.text((70, 122), 'Multi-dimensional scorecard', font=font(26), fill=DIM)
draw.text((W - 250, 66), f"{data['composite']:.1f}", font=serif(72), fill=GOLD)
draw.text((W - 120, 96), f"/ 100\n{data['grade']}", font=font(20), fill=DIM)

y = 200
for dimension in data['dimensions']:
    score = dimension['score']
    draw.text((70, y), dimension['label'], font=font(20, True), fill=TEXT)
    draw.text((300, y + 2), f"{score:.1f}", font=font(20, True), fill=GOLD if score >= dimension['target'] else RED)
    draw.text((380, y + 4), f"target {dimension['target']}", font=font(14), fill=DIM)
    draw.rounded_rectangle((520, y + 6, 1030, y + 28), radius=4, fill=(24, 34, 46))
    width = int(510 * min(1, score / 100))
    color = GREEN if score >= dimension['target'] else RED
    draw.rounded_rectangle((520, y + 6, 520 + width, y + 28), radius=4, fill=color)
    draw.text((1050, y + 2), f"{dimension['weight']}%", font=font(16), fill=DIM)
    y += 68

draw.line((70, y + 6, W - 70, y + 6), fill=LINE, width=1)
draw.text((70, y + 30), 'Weights sum to 100. Every score reads a committed evidence file.', font=font(15), fill=DIM)
draw.text((70, y + 58), 'Decision benchmark, not a live output benchmark. Quality labels are expert-authored.', font=font(15), fill=DIM)

out = ROOT / 'assets/scorecard.png'
image.save(out, quality=95)
print(f'wrote {out} ({out.stat().st_size / 1024:.0f} KB)')
