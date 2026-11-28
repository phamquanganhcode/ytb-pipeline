"""Universal Johnny Harris / Vox / SunnyV2 Editorial Photo-Collage Thumbnail Builder.

Works for all formats (life, disaster, docu, comic):
- Generates text-free 16:9 editorial photo-collage prompts (real photo cutouts, torn paper,
  yellow highlighter swipes, hand-drawn red marker circles/arrows, clean upper-left space).
- Composites crisp condensed Impact headline + tilted torn red-tape subline onto any downloaded
  background image without floating cartoon heads or dashboard boxes.

Usage (PY = C:/Users/phama/.venvs/video-pipeline/Scripts/python):
    PY make_editorial_thumb.py assets/thumbs-src/knight.png --headline "-$440M" --tape "45 MINUTES" --out out/knight_thumb.jpg
    PY make_editorial_thumb.py --prompt scripts/docu/knight-capital-3min.json
"""
import argparse
import json
import random
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from prep_bg import remove_logo

ROOT = Path(__file__).parent
W, H = 1280, 720
FONT_CANDIDATES = (
    "C:/Windows/Fonts/impact.ttf",
    "C:/Windows/Fonts/ariblk.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
)

EDITORIAL_THUMB_PROMPT = (
    "Create a 16:9 widescreen YouTube thumbnail background in authentic Johnny Harris / Vox / SunnyV2 "
    "investigative documentary photo-collage style: {idea}. "
    "Use realistic photographic cutouts with crisp white torn-paper edges, desaturated archival scenes, "
    "torn newspaper or financial/technical document clippings with a vivid yellow highlighter swipe, "
    "subtle 35mm film grain, and a rough hand-drawn red marker circle or arrow pointing to the key failure/evidence. "
    "Keep the upper-left third darker and uncluttered so huge condensed title text can be overlaid cleanly later, "
    "and keep the bottom-right corner dark and clean for YouTube's timestamp. "
    "Strictly NO text, NO words, NO numbers, NO letters, NO cartoon characters, NO UI dashboard boxes."
)


def _pick_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for fp in FONT_CANDIDATES:
        if Path(fp).exists():
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()


def extract_thumb_meta(script: dict) -> tuple[str, str, str | None]:
    """Extract (visual_idea, headline, tape) cleanly from life, disaster, or comic script JSON."""
    meta = script.get("meta", {})
    th = script.get("thumbnail") or meta.get("thumbnail")
    title = script.get("title", "").strip()

    if isinstance(th, dict):
        headline = (th.get("headline") or th.get("title") or "").strip().upper()
        tape = (th.get("tape") or th.get("subline") or th.get("subtitle") or "").strip().upper() or None
        mq = th.get("mediaQuery")
        idea = mq.get("query") if isinstance(mq, dict) else None
        idea = idea or meta.get("description") or script.get("description") or title
        return str(idea).strip(), headline or title.split("|")[-1].strip().upper(), tape

    if isinstance(th, str) and th.strip():
        m = re.search(r"text:\s*['\"‘“]([^'\"’”]+)", th)
        headline = m.group(1).strip().upper() if m else title.split("|")[-1].strip().upper()
        idea = re.split(r"[;,.]?\s*text:", th)[0].strip()
        return idea or title, headline, None

    # Fallback for scripts without explicit thumbnail config: check scene 0 stat/headline, else title
    sc0 = (script.get("scenes") or [{}])[0]
    sc0_stat = str(sc0.get("stat") or "").strip().upper()
    sc0_head = str(sc0.get("headline") or "").strip().upper()
    if sc0_stat:
        time_m = re.search(r"\bIN\s+(\d+\s+(?:SECONDS|MINUTES|HOURS|DAYS|YEARS))\b", sc0_head)
        tape = time_m.group(1) if time_m else (sc0_head if len(sc0_head) <= 20 else None)
        return meta.get("description") or script.get("description") or title, sc0_stat, tape

    stat_m = re.search(
        r"(?:^|\s)(-\$?\d+(?:\.\d+)?(?:\s*(?:MILLION|BILLION|PCs|DAYS|MINUTES|HOURS|SECONDS)|[MBK%])|\$\d+(?:\.\d+)?(?:\s*(?:MILLION|BILLION)|[MBK])|\d+(?:\.\d+)?[MBK]?\s*(?:PCs|MILLION|BILLION|%|DAYS|MINUTES))",
        title,
        re.I,
    )
    headline = stat_m.group(1).strip().upper() if stat_m else title.split("|")[0].split(":")[0].strip().upper()[:18]
    time_m = re.search(r"\bIN\s+(\d+\s+(?:SECONDS|MINUTES|HOURS|DAYS|YEARS))\b", title, re.I)
    tape = time_m.group(1).upper() if time_m else None
    return meta.get("description") or script.get("description") or title, headline, tape


def _split_headline(headline: str) -> list[str]:
    clean = headline.strip().upper()
    if "\n" in clean:
        return [ln.strip() for ln in clean.splitlines() if ln.strip()][:2]
    words = clean.split()
    if len(words) >= 2 and len(clean) > 7:
        return [words[0], " ".join(words[1:])]
    return [clean] if clean else ["TRUE STORY"]


def _draw_torn_tape(base: Image.Image, text: str, x: int, y: int) -> None:
    """Draw a tilted crimson torn-paper tape strip with bold white uppercase text."""
    clean = text.strip().upper()
    if not clean:
        return
    font_size = 44 if len(clean) <= 14 else 36 if len(clean) <= 22 else 28
    font = _pick_font(font_size)
    tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    bbox = tmp.textbbox((0, 0), clean, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 32, 14
    pw, ph = tw + pad_x * 2, th + pad_y * 2 + 6

    patch = Image.new("RGBA", (pw + 24, ph + 24), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(patch)
    rng = random.Random(hash(clean) & 0xFFFF)

    # Build serrated torn left and right edges
    x0, y0, x1, y1 = 12, 12, 12 + pw, 12 + ph
    pts = [(x0, y0)]
    steps = 6
    for i in range(1, steps):
        pts.append((x0 + rng.randint(-6, 5), y0 + int(ph * i / steps)))
    pts.append((x0, y1))
    pts.append((x1, y1))
    for i in range(steps - 1, 0, -1):
        pts.append((x1 + rng.randint(-5, 6), y0 + int(ph * i / steps)))
    pts.append((x1, y0))

    # Drop shadow behind tape
    shadow = Image.new("RGBA", patch.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).polygon([(px + 4, py + 7) for px, py in pts], fill=(0, 0, 0, 195))
    shadow = shadow.filter(ImageFilter.GaussianBlur(5))
    patch = Image.alpha_composite(patch, shadow)
    pdraw = ImageDraw.Draw(patch)
    pdraw.polygon(pts, fill=(217, 32, 39, 250))

    # Subtle top/bottom highlight/crease
    pdraw.line([(x0 + 4, y0 + 2), (x1 - 4, y0 + 2)], fill=(255, 130, 130, 90), width=2)
    tx = (patch.width - tw) // 2 - bbox[0]
    ty = (patch.height - th) // 2 - bbox[1] - 1
    pdraw.text((tx, ty), clean, font=font, fill=(255, 255, 255, 255))

    rotated = patch.rotate(2.4, resample=Image.BICUBIC, expand=True)
    base.paste(rotated, (x - 10, y - 6), rotated)


def render_editorial_thumb(
    src_image: Path,
    out_path: Path,
    headline: str,
    tape: str | None = None,
    strip_gemini_logo: bool = True,
) -> Path:
    """Composite crisp Johnny Harris / Vox style typography onto a 16:9 photo-collage image."""
    img = Image.open(src_image).convert("RGB")
    if strip_gemini_logo:
        img = remove_logo(img)
    scale = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - W) // 2, (img.height - H) // 2
    img = img.crop((left, top, left + W, top + H)).convert("RGBA")

    # Directional upper-left shadow gradient so text pops cleanly without dulling the collage
    grad_x = Image.linear_gradient("L").rotate(90).resize((W, H))   # 255 on left -> 0 on right
    grad_y = Image.linear_gradient("L").rotate(180).resize((W, H))  # 255 on top -> 0 on bottom
    mask_x = grad_x.point(lambda v: min(255, int(max(0, v - 50) * 1.25)))
    mask_y = grad_y.point(lambda v: min(255, int(max(0, v - 40) * 1.25)))
    alpha_mask = Image.eval(Image.blend(Image.new("L", (W, H), 0), mask_x, 1.0), lambda v: v)
    # Multiply normalized masks for smooth radial-like top-left falloff
    import numpy as np
    alpha_np = (np.asarray(mask_x, dtype=np.float32) * np.asarray(mask_y, dtype=np.float32) / 255.0 * 0.78).clip(0, 195).astype(np.uint8)
    alpha_mask = Image.fromarray(alpha_np, mode="L")
    img = Image.alpha_composite(img, Image.merge("RGBA", (
        Image.new("L", (W, H), 8),
        Image.new("L", (W, H), 10),
        Image.new("L", (W, H), 15),
        alpha_mask,
    )))

    lines = _split_headline(headline)
    max_w = 575
    tmp_draw = ImageDraw.Draw(img)

    sized_lines = []
    for idx, line in enumerate(lines):
        size = 195 if (len(lines) == 1 or idx == 0) else 142
        font = _pick_font(size)
        while size > 48:
            bb = tmp_draw.textbbox((0, 0), line, font=font)
            if (bb[2] - bb[0]) <= max_w:
                break
            size -= 6
            font = _pick_font(size)
        bb = tmp_draw.textbbox((0, 0), line, font=font)
        sized_lines.append((line, font, bb, size))

    # Draw hard shadow layer first for clean depth
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_layer)
    x0 = 54
    y_cursor = 58 if (len(sized_lines) == 2 or tape) else 95
    coords = []
    for idx, (line, font, bb, size) in enumerate(sized_lines):
        tx = x0 - bb[0]
        ty = y_cursor - bb[1]
        lw = bb[3] - bb[1]
        stroke = max(6, size // 18)
        sdraw.text((tx + 4, ty + 10), line, font=font, fill=(0, 0, 0, 220), stroke_width=stroke + 2, stroke_fill=(0, 0, 0, 220))
        coords.append((tx, ty, line, font, stroke, idx))
        y_cursor += lw + 18

    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(7))
    img = Image.alpha_composite(img, shadow_layer)

    draw = ImageDraw.Draw(img)
    for tx, ty, line, font, stroke, idx in coords:
        fill = (255, 255, 255, 255) if idx == 0 else (255, 230, 0, 255)
        draw.text((tx, ty), line, font=font, fill=fill, stroke_width=stroke, stroke_fill=(10, 10, 14, 255))

    if tape:
        _draw_torn_tape(img, tape, x0 + 6, y_cursor + 6)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    final_rgb = img.convert("RGB")
    if out_path.suffix.lower() in (".jpg", ".jpeg"):
        final_rgb.save(out_path, quality=92)
        if out_path.stat().st_size >= 2_000_000:
            final_rgb.save(out_path, quality=84)
    else:
        final_rgb.save(out_path)
    print(f"  editorial thumbnail: {out_path}")
    return out_path


def main():
    import sys
    # Allow negative values like "--headline -$440M" without argparse treating "-$440M" as a flag
    argv, i = [], 1
    while i < len(sys.argv):
        tok = sys.argv[i]
        if tok in ("--headline", "--tape") and i + 1 < len(sys.argv) and sys.argv[i + 1].startswith("-"):
            argv.append(f"{tok}={sys.argv[i + 1]}")
            i += 2
        else:
            argv.append(tok)
            i += 1
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("image", nargs="?", help="Source photo-collage image path")
    parser.add_argument("--headline", help="Main 1-3 word headline (e.g. '-$440M' or '50%% IN 45 DAYS')")
    parser.add_argument("--tape", help="Optional red torn-tape subtitle (e.g. '45 MINUTES')")
    parser.add_argument("--out", help="Output path (.jpg or .png)")
    parser.add_argument("--keep-corner", action="store_true", help="Do not remove Gemini bottom-right watermark")
    parser.add_argument("--prompt", help="Print editorial photo-collage prompt for a script JSON")
    args = parser.parse_args(argv)

    if args.prompt:
        sp = Path(args.prompt)
        script = json.loads(sp.read_text(encoding="utf-8"))
        idea, headline, tape = extract_thumb_meta(script)
        print(f"# Editorial Photo-Collage Prompt for: {sp.name}")
        print(f"# Overlay Headline: {headline!r} | Red Tape: {tape!r}\n")
        print(EDITORIAL_THUMB_PROMPT.format(idea=idea))
        return

    if not args.image:
        parser.error("Provide an image path or --prompt <script.json>")
    src = Path(args.image)
    out = Path(args.out) if args.out else ROOT / "out" / f"{src.stem}_editorial.jpg"
    render_editorial_thumb(src, out, args.headline or "TRUE STORY", args.tape, strip_gemini_logo=not args.keep_corner)


if __name__ == "__main__":
    main()
