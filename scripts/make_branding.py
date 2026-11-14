"""Render channel avatar (800x800) and banner (2560x1440) from project art.

Usage: PY scripts/make_branding.py   -> out/branding/avatar.png, out/branding/banner.png
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
OUT = ROOT / "out" / "branding"
FONT = str(PUB / "fonts" / "PermanentMarker-Regular.ttf")
NAME = "DAILY LIVES EXPLAINED"
TAGLINE = "What it was really like to live their life"


def face(name, height):
    im = Image.open(PUB / "faces" / f"{name}.png").convert("RGBA")
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def text_center(draw, cx, y, s, size, stroke):
    font = ImageFont.truetype(FONT, size)
    w = draw.textlength(s, font=font)
    draw.text((cx - w / 2, y), s, font=font, fill="white", stroke_width=stroke, stroke_fill="black")


def avatar():
    im = Image.new("RGBA", (800, 800), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((0, 0, 799, 799), fill=(244, 196, 84))
    f = face("townswoman-1880s_neutral", 600)
    im.alpha_composite(f, ((800 - f.width) // 2, 150))
    # YouTube crops to a circle; clip the face to it and draw the ring last
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 799, 799), fill=255)
    im.putalpha(Image.composite(im.getchannel("A"), mask, mask))
    ImageDraw.Draw(im).ellipse((10, 10, 789, 789), outline="black", width=20)
    return im


def banner():
    bg = Image.open(PUB / "bg" / "street1900.png").convert("RGBA")
    bg = bg.resize((2560, round(bg.height * 2560 / bg.width)), Image.LANCZOS)
    top = (bg.height - 1440) // 2
    im = ImageEnhance.Brightness(bg.crop((0, top, 2560, top + 1440))).enhance(0.55)
    d = ImageDraw.Draw(im)
    # safe area on every device: 1546x423 centered
    cx, sy = 1280, (1440 - 423) // 2
    # faces sit just outside the safe area: decoration on desktop/TV, cropped on phones
    for name, x in (("clerk-1890s_neutral", 300), ("hetty-green-young_happy", 2260)):
        f = face(name, 460)
        im.alpha_composite(f, (x - f.width // 2, sy - 20))
    text_center(d, cx, sy + 70, NAME, 120, 8)
    text_center(d, cx, sy + 260, TAGLINE, 54, 5)
    return im.convert("RGB")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    a, b = avatar(), banner()
    assert a.size == (800, 800) and b.size == (2560, 1440)
    a.save(OUT / "avatar.png")
    b.save(OUT / "banner.png", optimize=True)
    print("ok", (OUT / "banner.png").stat().st_size // 1024, "KB")
