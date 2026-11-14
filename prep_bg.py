"""Turn generated background images into 1920x1080 PNGs in public/bg/.

Covers the Gemini sparkle logo near the bottom-right corner (with the floor texture just left of
it; only for Gemini images, pass --keep-corner for others), then scales to cover 1920x1080 and
center-crops.

Usage: C:/Users/phama/.venvs/video-pipeline/Scripts/python prep_bg.py assets/bg-src/*.png
The output name is the input file name, e.g. assets/bg-src/parlor.png -> public/bg/parlor.png
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).parent / "public" / "bg"
W, H = 1920, 1080


# The Gemini sparkle is white laid over the picture at a fixed opacity, so the original pixels can
# be recovered exactly: original = (seen - a*255) / (1 - a). Shape, place and opacity were fitted on
# three 1376x768 downloads (center 1255.5,647.5, radius 29, astroid exponent 0.6, opacity 0.30).
LOGO = {"cx": 1255.5 / 1376, "cy": 647.5 / 768, "r": 29 / 1376, "p": 0.6, "alpha": 0.30}


def remove_logo(img):
    a = np.asarray(img).astype(np.float32)
    h, w, _ = a.shape
    y, x = np.mgrid[0:h, 0:w]
    cx, cy, r = LOGO["cx"] * w, LOGO["cy"] * h, LOGO["r"] * w
    v = (np.abs(x - cx) ** LOGO["p"] + np.abs(y - cy) ** LOGO["p"]) ** (1 / LOGO["p"])
    m = (np.clip((r - v) / 2.0 + 0.5, 0, 1) * LOGO["alpha"])[..., None]  # soft 2 px edge hides fit error
    return Image.fromarray(((a - m * 255) / (1 - m)).clip(0, 255).round().astype(np.uint8))


def main():
    keep = "--keep-corner" in sys.argv
    for src in (Path(a) for a in sys.argv[1:] if a != "--keep-corner"):
        prep(src, keep)


def prep(src, keep=False):
    OUT.mkdir(parents=True, exist_ok=True)
    img = Image.open(src).convert("RGB")
    img = img if keep else remove_logo(img)
    scale = max(W / img.width, H / img.height)
    # shortcut: Lanczos upscaling of ~1024px sources looks soft at 1080p; use Real-ESRGAN or full-size downloads.
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - W) // 2, (img.height - H) // 2
    out = OUT / f"{src.stem}.png"
    img.crop((left, top, left + W, top + H)).save(out)
    print(f"{src} -> {out.relative_to(Path(__file__).parent)}")


if __name__ == "__main__":
    main()
