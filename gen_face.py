"""Make caricature heads of a real person with Gemini, in the style of the painted backgrounds.

Usage:
    # API (needs GEMINI_API_KEY with image quota; the free tier returned 429 in tests):
    C:/Users/phama/.venvs/video-pipeline/Scripts/python gen_face.py hetty-green "Hetty Green, American financier (1834-1916), ..."
    # Images made in the Gemini app on a green background, named <name>_<expression>.png:
    C:/Users/phama/.venvs/video-pipeline/Scripts/python gen_face.py --files assets/faces-src/hetty-green_*.png
Writes public/faces/<name>_{neutral,happy,shock}.png with transparent backgrounds. Use it in a script
with "cast": {"you": {"face": "<name>", "shirt": "#2b2b2b"}}. A missing expression falls back to neutral.
Review every face: likeness and period details come from the model.
"""
import base64
import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from make_video import gemini_call

ROOT = Path(__file__).parent
MODEL = "gemini-3.1-flash-image,gemini-2.5-flash-image"  # fallback order, like the script models
STYLE_REF = ROOT / "public" / "bg" / "parlor.png"
EXPRESSIONS = {
    "neutral": "calm, neutral expression, mouth closed",
    "happy": "big warm smile",
    "shock": "shocked: wide eyes, raised eyebrows, small open mouth",
}
PROMPT = """Caricature head of {desc}, for a 2D animated history explainer.
Big expressive head, a recognizable likeness based on historical portraits, period-accurate hair
and headwear, only the neck and a hint of collar below the head (no body, no hands). {expression}.
Turned slightly to the viewer's right. Flat 2D cartoon, clean vector lines, soft cel shading,
slightly muted warm palette, matching the art style of the attached background image.
Plain solid pure green background (#00FF00) filling the whole image, nothing else in the picture,
no shadow, no text."""
HEIGHT = 600  # output head image height in px


def key_out_green(img):
    """Make the green screen transparent and pull green spill off the edges."""
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (g > 120) & (g > r + 40) & (g > b + 40)
    h, w = bg.shape
    bg[int(h * 0.85):, int(w * 0.85):] = True  # Gemini sparkle logo sits in this corner
    spill = (g > np.maximum(r, b)) & ~bg
    a[..., 1][spill] = np.maximum(r, b)[spill]
    rgba = np.dstack([a.clip(0, 255).astype(np.uint8), np.where(bg, 0, 255).astype(np.uint8)])
    out = Image.fromarray(rgba, "RGBA")
    return out.crop(out.getbbox())


def save_face(raw, stem):
    face = key_out_green(raw)
    face = face.resize((round(face.width * HEIGHT / face.height), HEIGHT), Image.LANCZOS)
    out = ROOT / "public" / "faces" / f"{stem}.png"
    face.save(out)
    print(f"{out.relative_to(ROOT)} {face.size}")


def main():
    (ROOT / "public" / "faces").mkdir(parents=True, exist_ok=True)
    if sys.argv[1] == "--files":
        for path in map(Path, sys.argv[2:]):
            save_face(Image.open(path), path.stem)
        return
    name, desc = sys.argv[1], sys.argv[2]
    ref = base64.b64encode(STYLE_REF.read_bytes()).decode()
    (ROOT / "assets" / "faces-src").mkdir(parents=True, exist_ok=True)
    for expr, how in EXPRESSIONS.items():
        body = {
            "contents": [{"parts": [{"text": PROMPT.format(desc=desc, expression=how)},
                                    {"inlineData": {"mimeType": "image/png", "data": ref}}]}],
            "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
        }
        parts = gemini_call(MODEL, body)["candidates"][0]["content"]["parts"]
        data = next((p["inlineData"]["data"] for p in parts if "inlineData" in p), None)
        if data is None:
            raise SystemExit(f"{expr}: Gemini returned no image: {[p.get('text') for p in parts]}")
        raw = Image.open(io.BytesIO(base64.b64decode(data)))
        raw.save(ROOT / "assets" / "faces-src" / f"{name}_{expr}.png")
        save_face(raw, f"{name}_{expr}")


if __name__ == "__main__":
    main()
