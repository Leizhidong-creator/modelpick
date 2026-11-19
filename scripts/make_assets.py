#!/usr/bin/env python3
"""Generate README/site/test evidence images with Pillow (no external services)."""
from __future__ import annotations

import json
import math
import os
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
EVIDENCE = ROOT / "tests" / "evidence"
ASSETS.mkdir(exist_ok=True)
EVIDENCE.mkdir(parents=True, exist_ok=True)

BG = (11, 15, 20)
PANEL = (17, 24, 32)
PANEL2 = (22, 31, 42)
LINE = (35, 48, 64)
TEXT = (230, 237, 243)
DIM = (139, 152, 165)
CYAN = (57, 197, 207)
GREEN = (63, 185, 80)
YELLOW = (210, 153, 34)
RED = (248, 81, 73)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/consolab.ttf" if bold else "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size)
            except OSError:
                continue
    return ImageFont.load_default()


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def clean(text: str) -> str:
    return (
        text.replace("◆", "MP")
        .replace("█", "#")
        .replace("░", "-")
        .replace("─", "-")
        .replace("·", ".")
        .replace("→", "->")
        .replace("×", "x")
    )


def terminal_frame(lines: list[str], title: str, width: int = 1180) -> Image.Image:
    line_height = 25
    height = 92 + max(1, len(lines)) * line_height + 28
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    rounded(draw, (18, 16, width - 18, height - 16), 14, PANEL, LINE, 1)
    draw.rectangle((18, 16, width - 18, 62), fill=(20, 28, 38))
    for index, color in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        draw.ellipse((40 + index * 22, 32, 52 + index * 22, 44), fill=color)
    draw.text((120, 29), title, font=font(15), fill=DIM)

    x = 42
    y = 78
    for raw in lines:
        text = clean(raw.rstrip("\n"))
        color = TEXT
        stripped = text.strip()
        if not stripped:
            y += line_height
            continue
        if stripped.startswith("MP modelpick"):
            color = CYAN
        elif stripped.startswith(("RECOMMENDATION", "ALTERNATIVE")):
            color = CYAN
        elif stripped.startswith(("quality", "cost", "context")):
            color = TEXT
        elif stripped.startswith(("•", "×", "note", "trade-offs", "-")):
            color = DIM
        elif stripped.startswith(("#", "also", "connect", "key", "or ")):
            color = DIM
        if "score" in stripped and "/100" in stripped:
            color = GREEN
        draw.text((x, y), text, font=font(15), fill=color)
        y += line_height
    return image


def run_cli(args: list[str]) -> list[str]:
    env = dict(os.environ)
    env["NO_COLOR"] = "1"
    result = subprocess.run(
        ["node", str(ROOT / "bin" / "modelpick.js"), *args, "--no-color"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=env,
        check=True,
    )
    return result.stdout.splitlines()


def save(image: Image.Image, name: str):
    path = ASSETS / name
    image.save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({image.width}x{image.height})")


def social_preview():
    width, height = 1280, 640
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    for y in range(height):
        ratio = y / height
        draw.line((0, y, width, y), fill=(int(11 + ratio * 4), int(15 + ratio * 18), int(20 + ratio * 22)))
    draw.ellipse((760, -180, 1380, 440), fill=(16, 52, 56))
    draw.ellipse((-220, 380, 420, 900), fill=(16, 34, 46))

    rounded(draw, (72, 64, 126, 118), 12, CYAN)
    draw.text((84, 76), "MP", font=font(24, True), fill=BG)
    draw.text((142, 70), "ModelPick", font=font(32, True), fill=TEXT)

    draw.text((72, 152), "Stop paying", font=font(52, True), fill=TEXT)
    draw.text((72, 214), "frontier prices", font=font(52, True), fill=TEXT)
    draw.text((72, 276), "for non-frontier work.", font=font(40, True), fill=CYAN)
    draw.text((76, 344), "The model router for AI agents.", font=font(21), fill=DIM)
    draw.text((76, 374), "Coding, image, video, 3D, audio — one call.", font=font(21), fill=DIM)

    chips = ["cost per solved task", "40 models", "20 nodes", "5 agents"]
    x = 76
    for chip in chips:
        bbox = draw.textbbox((0, 0), chip, font=font(14, True))
        w = bbox[2] - bbox[0] + 28
        rounded(draw, (x, 424, x + w, 460), 10, PANEL2, LINE, 1)
        draw.text((x + 14, 433), chip, font=font(14, True), fill=TEXT)
        x += w + 10

    rounded(draw, (760, 118, 1212, 528), 16, (10, 14, 19), LINE, 1)
    draw.rectangle((760, 118, 1212, 158), fill=(18, 26, 35))
    for index, color in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        draw.ellipse((780 + index * 18, 132, 790 + index * 18, 142), fill=color)
    draw.text((848, 128), "modelpick pick", font=font(13), fill=DIM)
    preview = [
        "3D asset generation · high confidence",
        "",
        "Tripo H3.1 · Tripo",
        "quality 94   score 80.6/100",
        "cost $0.21 / usable asset",
        "$0.20 raw × 1.07 attempts",
        "",
        "Hunyuan3D 3.1 Pro  $0.59",
        "Meshy 7.1          $1.34",
        "",
        "saves 6.2× vs Meshy",
    ]
    y = 182
    for line in preview:
        color = TEXT
        if "quality" in line:
            color = GREEN
        if "cost" in line:
            color = CYAN
        draw.text((784, y), clean(line), font=font(14), fill=color)
        y += 25

    draw.text((76, 538), "github.com/Leizhidong-creator/modelpick", font=font(17, True), fill=TEXT)
    draw.text((76, 570), "MIT · zero dependencies · Node 20+", font=font(14), fill=DIM)
    save(image, "social-preview.png")


def benchmark_chart():
    data = json.loads((ROOT / "tests" / "results" / "benchmark-latest.json").read_text(encoding="utf-8"))
    width, height = 1180, 620
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    draw.text((54, 40), "Decision benchmark", font=font(30, True), fill=TEXT)
    draw.text((54, 82), f"{data['runs']} runs · {data['scenarios']} scenarios · catalog {data['catalogVersion']}", font=font(15), fill=DIM)
    rounded(draw, (930, 44, 1126, 82), 10, (18, 44, 30), (35, 80, 48), 1)
    draw.text((956, 55), "PASS" if data["passed"] else "FAIL", font=font(16, True), fill=GREEN if data["passed"] else RED)

    rows = [
        ("Top-1 acceptable", data["metrics"]["top1"], data["thresholds"]["top1"], 100),
        ("Top-3 acceptable", data["metrics"]["top3"], data["thresholds"]["top3"], 100),
        ("Intent accuracy", data["metrics"]["intentAccuracy"], data["thresholds"]["intentAccuracy"], 100),
        ("Hard constraints", data["metrics"]["constraintPass"], 1, 100),
        ("Price stability", data["metrics"]["priceStability"], data["thresholds"]["priceStability"], 100),
    ]
    y = 148
    for label, value, target, scale in rows:
        draw.text((54, y), label, font=font(16), fill=TEXT)
        draw.text((300, y), f"{value:.0%}", font=font(18, True), fill=CYAN if value >= target else RED)
        rounded(draw, (400, y + 4, 980, y + 24), 8, PANEL2)
        filled = int(580 * min(1, (value * 100) / (scale or 100)))
        rounded(draw, (400, y + 4, 400 + max(8, filled), y + 24), 8, CYAN if value >= target else RED)
        draw.line((400 + int(580 * target), y - 2, 400 + int(580 * target), y + 30), fill=YELLOW, width=2)
        draw.text((1000, y), f"target {target:.0%}", font=font(13), fill=DIM)
        y += 64

    draw.text((54, 520), "Cost model: price × expected attempts. Labels are expert-authored before the final run.", font=font(13), fill=DIM)
    draw.text((54, 546), "Reproduce: node bench/run.js   ·   tests/results/benchmark-latest.json", font=font(13), fill=DIM)
    save(image, "benchmark.png")


def cost_quality_chart():
    data = json.loads((ROOT / "assets" / "chart-data.json").read_text(encoding="utf-8"))
    width, height = 1180, 720
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    draw.text((54, 38), "Quality vs cost per solved task", font=font(30, True), fill=TEXT)
    draw.text((54, 80), "Coding-agent node · further left is cheaper", font=font(15), fill=DIM)

    points = data["series"]["coding-agent"]["points"]
    left, right, top, bottom = 110, 1110, 130, 610
    draw.line((left, bottom, right, bottom), fill=LINE, width=1)
    draw.line((left, top, left, bottom), fill=LINE, width=1)
    max_cost = max(point["cost"] for point in points)
    min_cost = min(point["cost"] for point in points)
    log_min = math.log10(max(min_cost, 0.001))
    log_max = math.log10(max_cost)
    for quality in [60, 70, 80, 90, 100]:
        y = bottom - (quality - 50) / 50 * (bottom - top)
        draw.line((left, y, right, y), fill=(24, 34, 45), width=1)
        draw.text((62, y - 9), str(quality), font=font(13), fill=DIM)
    for index in range(5):
        cost = 10 ** (log_min + (log_max - log_min) * index / 4)
        x = left + ((math.log10(cost) - log_min) / (log_max - log_min)) * (right - left)
        draw.line((x, top, x, bottom), fill=(24, 34, 45), width=1)
        draw.text((x - 22, bottom + 14), f"${cost:.3f}" if cost < 1 else f"${cost:.1f}", font=font(12), fill=DIM)

    for point in points:
        x = left + (math.log10(max(point["cost"], 0.001)) - log_min) / (log_max - log_min) * (right - left)
        y = bottom - (point["quality"] - 50) / 50 * (bottom - top)
        radius = 5 + point["score"] / 25
        color = GREEN if point["score"] > 75 else CYAN if point["score"] > 60 else YELLOW
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color, outline=BG, width=2)
    highlights = {"claude-fable-5.2", "gemini-4-carbon", "deepseek-v4.1-flash", "claude-haiku-5.5"}
    for point in points:
        if point["slug"] not in highlights:
            continue
        x = left + (math.log10(max(point["cost"], 0.001)) - log_min) / (log_max - log_min) * (right - left)
        y = bottom - (point["quality"] - 50) / 50 * (bottom - top)
        draw.text((x + 12, y - 8), point["name"], font=font(13, True), fill=TEXT)
    draw.text((54, 656), "Bubble size = weighted score. The frontier is the best trade at each node, not the highest price.", font=font(13), fill=DIM)
    save(image, "cost-quality.png")


def architecture():
    width, height = 1180, 700
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    draw.text((54, 38), "Data -> decisions -> agent surfaces", font=font(28, True), fill=TEXT)
    draw.text((54, 78), "Every layer is replaceable. No model names or prices are hard-coded in the engine.", font=font(15), fill=DIM)

    boxes = [
        ((54, 140, 330, 300), "CATALOG (DATA)", ["models.json · prices, IDs, quality", "tasks.json · 20 nodes", "policy.json · retry + presets", "overrides.json · your models"]),
        ((424, 140, 744, 300), "DECISION ENGINE", ["hard filters -> candidates", "cost per solved task", "weighted utility + labels", "explanations + confidence"]),
        ((834, 140, 1126, 300), "SURFACES", ["CLI (zero deps)", "MCP server (stdio)", "portable SKILL.md", "Claude plugin"]),
    ]
    for (box, title, lines) in boxes:
        rounded(draw, box, 14, PANEL, LINE, 1)
        draw.text((box[0] + 20, box[1] + 16), title, font=font(14, True), fill=CYAN)
        y = box[1] + 50
        for line in lines:
            draw.text((box[0] + 20, y), line, font=font(13), fill=TEXT if "·" in line else DIM)
            y += 27

    for start, end in [((330, 220), (424, 220)), ((744, 220), (834, 220))]:
        draw.line((start[0] + 6, start[1], end[0] - 10, end[1]), fill=CYAN, width=2)
        draw.polygon([(end[0] - 10, end[1] - 6), (end[0], end[1]), (end[0] - 10, end[1] + 6)], fill=CYAN)

    agents = [
        ("Claude Code", ".mcp.json + skills/"),
        ("Codex CLI", "AGENTS.md + .agents/skills"),
        ("Cursor", ".cursor/mcp.json + rules"),
        ("DeepSeek Harness", ".dsh/skills + MCP row"),
        ("Copilot CLI", ".mcp.json + .github/skills"),
    ]
    y = 370
    draw.text((54, y), "AGENT ADAPTERS", font=font(14, True), fill=CYAN)
    y += 34
    for index, (name, how) in enumerate(agents):
        x = 54 + (index % 3) * 372
        row = index // 3
        box = (x, y + row * 100, x + 348, y + row * 100 + 78)
        rounded(draw, box, 12, PANEL2, LINE, 1)
        draw.text((box[0] + 16, box[1] + 14), name, font=font(14, True), fill=TEXT)
        draw.text((box[0] + 16, box[1] + 40), how, font=font(12), fill=DIM)

    draw.text((54, 620), "Update path: edit JSON / policy -> validate -> tests -> bench. No engine fork required.", font=font(13), fill=DIM)
    save(image, "architecture.png")


def main():
    social_preview()
    benchmark_chart()
    cost_quality_chart()
    architecture()

    pick = terminal_frame(run_cli(["pick", "create a stylized 3D sword for a Unity game"]), "modelpick pick")
    save(pick, "terminal-pick.png")
    plan = terminal_frame(run_cli(["plan", "30 second product launch video for a coffee brand"]), "modelpick plan")
    save(plan, "terminal-plan.png")

    for name in ["social-preview.png", "benchmark.png", "cost-quality.png", "architecture.png", "terminal-pick.png", "terminal-plan.png"]:
        (EVIDENCE / name).write_bytes((ASSETS / name).read_bytes())


if __name__ == "__main__":
    main()
