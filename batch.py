"""Render every script in a folder, so only the finished videos need a human check.

Usage (PY = C:/Users/phama/.venvs/video-pipeline/Scripts/python):
    PY batch.py [scripts/life]
For each scripts/<dir>/<name>.json without out/<name>.mp4:
  1. Art: new settings a script names (bg + bgIdea) are listed with prompts in out/bg_todo.md; paintings
     saved as assets/bg-src/<bg>.png are prepared and added to assets/backgrounds.json for later episodes.
     Faces: images you saved from the Gemini web app as assets/faces-src/<face>_<expression>.png are keyed
     and installed. Faces still missing get ready-to-paste prompts in out/faces_todo.md, and the episode
     waits for the next run (the free API tier cannot make images).
  2. Facts: out/<name>_facts.md lists every checkable claim with a verdict (needs GEMINI_API_KEY; skipped
     without it).
  3. Render: make_video.py writes out/<name>.mp4 and out/<name>.srt.
  4. Thumbnail: out/thumb_todo.md has a Gemini prompt per episode; a picture saved as
     assets/thumbs-src/<name>.png becomes out/<name>_thumb.jpg (face + title words added).
Rerun the same command after saving faces: finished episodes are skipped.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from gen_face import EXPRESSIONS, PROMPT, save_face
from make_video import PAINTED, bg_ready, gemini_call
from prep_bg import prep, remove_logo

ROOT = Path(__file__).parent
BG_SRC = ROOT / "assets" / "bg-src"
CATALOG = ROOT / "assets" / "backgrounds.json"
BG_PROMPT = """Wide 16:9 landscape painted background for a 2D animated history explainer: {idea}.
Full rich color, not sepia and not a pencil sketch: bold dark-brown ink outlines, flat color fills
with soft cel shading, warm saturated palette with deep shadows, like a polished animated cartoon
background (match the attached image's style if one is attached). Detailed period-accurate props.
Eye-level camera. Leave the floor or ground across the lower fifth clear and flat, because cartoon
characters will stand there. No people, no animals, no text or lettering anywhere (blank barrels,
blank signs), no frame or border."""
THUMB_SRC = ROOT / "assets" / "thumbs-src"
THUMB_FONT = "C:/Windows/Fonts/ariblk.ttf"  # Arial Black, same as the video's stamps
THUMB_PROMPT = """Create an image. Wide 16:9 background for a YouTube thumbnail of a 2D animated history video: {idea}
Do NOT draw the main character: her cartoon head is pasted on the left third later, so keep that area simple.
Full rich color, bold dark-brown ink outlines, flat color fills with soft cel shading, high contrast and
dramatic lighting, like a polished animated cartoon. No text or lettering anywhere, no frame or border."""
SRC = ROOT / "assets" / "faces-src"
FACES = ROOT / "public" / "faces"
OUT = ROOT / "out"
MODELS = "gemini-3.5-flash,gemini-3.6-flash,gemini-3.8-flash"  # same fallback order as make_video --model

FACT_PROMPT = """You are fact-checking narration for a history video. List every checkable claim in it
(years, ages, amounts, names, places, quotes, causes). For each give: scene number, the claim, a verdict
(WELL-DOCUMENTED, DISPUTED, LIKELY WRONG, or UNKNOWN), and one short reason. Put LIKELY WRONG and DISPUTED
first. Answer as a Markdown table only.

"""


def faces_needed(script):
    """{face name: description} for every head the script shows."""
    cast = script.get("cast", {})
    need = {m["face"]: m.get("faceIdea", m.get("name", m["face"])) for m in cast.values() if m.get("face")}
    for scene in script["scenes"]:
        for who, face in scene.get("looks", {}).items():
            base = cast.get(who, {})
            need.setdefault(face, f"{base.get('faceIdea', base.get('name', who))}, as '{face}'")
    return need


def install_faces(need):
    """Key out downloaded Gemini images; return the faces that are still missing."""
    missing = {}
    for face, desc in need.items():
        for expr in EXPRESSIONS:
            src = SRC / f"{face}_{expr}.png"
            if src.exists() and not (FACES / f"{face}_{expr}.png").exists():
                save_face(Image.open(src), src.stem)
        if not (FACES / f"{face}_neutral.png").exists():
            missing[face] = desc
    return missing


def install_bgs(script):
    """Prepare downloaded paintings for new settings, add them to the catalog; return those still missing."""
    need = {}
    for scene in script["scenes"]:
        if not bg_ready(scene["bg"]):
            need.setdefault(scene["bg"], PAINTED.get(scene["bg"]) or scene.get("bgIdea", scene["bg"]))
    missing = {}
    for name, idea in need.items():
        src = BG_SRC / f"{name}.png"
        if src.exists():
            prep(src)
            PAINTED[name] = idea  # later scripts in this run (and the prompt) can reuse it
            CATALOG.write_text(json.dumps(PAINTED, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        else:
            missing[name] = idea
    return missing


def bg_todo_text(missing):
    lines = ["# Backgrounds to make in gemini.google.com", "",
             "Attach public/bg/parlor.png (style reference) to each prompt. Use the download menu's full-size",
             f"option (sharper at 1080p) and save into {BG_SRC.relative_to(ROOT)} with the exact file name shown.", ""]
    for name, idea in missing.items():
        lines += [f"## {name}", "", f"Save as `{name}.png`:", "", "```", BG_PROMPT.format(idea=idea), "```", ""]
    return "\n".join(lines)


def thumb_text(script):
    """Big thumbnail words: the quoted text in meta.thumbnail ("...; text: 'WITCH OF WALL STREET'"), else the title."""
    m = re.search(r"text:\s*['\"‘“]([^'\"’”]+)", script.get("meta", {}).get("thumbnail", ""))
    return (m.group(1) if m else script["title"].split("|")[-1]).strip().upper()


def make_thumb(script, name, expr="happy"):
    """1280x720 JPEG: Gemini scene + the hero's face (left) + title words (right), under YouTube's 2 MB limit.
    A <name>_hero.png (Gemini drew the hero in, from her face attached as reference) is used as is, no face pasted."""
    hero = (THUMB_SRC / f"{name}_hero.png").exists()
    face_name = script.get("cast", {}).get("you", {}).get("face")
    if not hero and not (FACES / f"{face_name}_neutral.png").exists():
        return False  # face not installed yet (new episode): retry on the next run instead of a faceless thumbnail
    img = remove_logo(Image.open(THUMB_SRC / f"{name}{'_hero' if hero else ''}.png").convert("RGB"))
    scale = max(1280 / img.width, 720 / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    img = img.crop(((img.width - 1280) // 2, (img.height - 720) // 2, (img.width - 1280) // 2 + 1280, (img.height - 720) // 2 + 720))
    shade = Image.linear_gradient("L").rotate(90).resize((1280, 720))  # dark on the right, where the text goes
    img = Image.composite(Image.new("RGB", img.size, "black"), img, shade.point(lambda v: v * 0.55))
    for expr in () if hero else (expr, "neutral"):  # default: knowing smile against the chaos behind her; neutral always exists
        f = FACES / f"{face_name}_{expr}.png"
        if face_name and f.exists():
            face = Image.open(f)
            face = face.resize((round(face.width * 620 / face.height), 620), Image.LANCZOS)
            img.paste(face, (30, 720 - face.height + 20), face)
            break
    draw = ImageDraw.Draw(img)
    words, lines = thumb_text(script).split(), []
    for w in words:  # greedy wrap into the right half
        if lines and len(lines[-1]) + 1 + len(w) <= 10:
            lines[-1] += " " + w
        else:
            lines.append(w)
    size = min(150, 560 // len(lines))
    font = ImageFont.truetype(THUMB_FONT, size)
    while size > 40 and max(draw.textlength(l, font=font) for l in lines) > 680:  # right half is 560..1240
        size -= 6
        font = ImageFont.truetype(THUMB_FONT, size)
    y = (720 - size * 1.1 * len(lines)) / 2
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text((max(560, 1240 - w), y), line, font=font, fill="#ffd400", stroke_width=10, stroke_fill="black")
        y += size * 1.1
    out = OUT / f"{name}_thumb.jpg"
    img.save(out, quality=90)
    assert out.stat().st_size < 2_000_000, "YouTube thumbnails must be under 2 MB"
    print(f"  thumbnail: {out.relative_to(ROOT)}")


def todo_text(missing):
    lines = ["# Faces to make in gemini.google.com", "",
             "One new chat per face. Attach public/bg/parlor.png (style reference) to the first prompt,",
             f"then download each image into {SRC.relative_to(ROOT)} with the exact file name shown.", ""]
    for face, desc in missing.items():
        lines += [f"## {face}", "", f"Save as `{face}_neutral.png`:", "", "```",
                  PROMPT.format(desc=desc, expression=EXPRESSIONS["neutral"]), "```", ""]
        for expr in ("happy", "shock"):
            lines += [f"Same chat, save as `{face}_{expr}.png` (optional, falls back to neutral):", "", "```",
                      f"Same character, same style, same framing and green background, but: {EXPRESSIONS[expr]}.",
                      "```", ""]
    return "\n".join(lines)


def write_facts(script, path):
    text = "\n".join(f"{i}. {s['text']}" for i, s in enumerate(script["scenes"], 1))
    body = {"contents": [{"parts": [{"text": FACT_PROMPT + text}]}]}
    reply = gemini_call(MODELS, body)["candidates"][0]["content"]["parts"][0]["text"]
    path.write_text(f"# Fact check: {script['title']}\n\nModel verdicts, not proof: confirm each flagged row in a real source.\n\n{reply}\n", encoding="utf-8")
    print(f"  facts: {path.relative_to(ROOT)}")


def main():
    folder = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "scripts/life")
    OUT.mkdir(exist_ok=True)
    all_missing, all_bgs, done, waiting, failed = {}, {}, [], [], []
    for name, idea in PAINTED.items():  # catalog settings: prepare new downloads, list the undrawn ones
        if not bg_ready(name):
            if (BG_SRC / f"{name}.png").exists():
                prep(BG_SRC / f"{name}.png")
            else:
                all_bgs[name] = idea
    thumbs = {}
    for path in sorted(folder.glob("*.json")):
        name = path.stem
        script = json.loads(path.read_text(encoding="utf-8"))
        if not (OUT / f"{name}_thumb.jpg").exists():
            if (THUMB_SRC / f"{name}.png").exists() or (THUMB_SRC / f"{name}_hero.png").exists():
                make_thumb(script, name)
            else:
                idea = script.get("meta", {}).get("thumbnail", script["title"])
                thumbs[name] = THUMB_PROMPT.format(idea=re.split(r"[;,.]?\s*text:", idea)[0] + ".")  # words are drawn by make_thumb
        if (OUT / f"{name}.mp4").exists():
            continue
        print(f"== {name}")
        missing = install_faces(faces_needed(script))
        missing_bgs = install_bgs(script)
        if missing or missing_bgs:
            print(f"  waiting for: {', '.join([*missing, *missing_bgs])}")
            all_missing.update(missing)
            all_bgs.update(missing_bgs)
            waiting.append(name)
            continue
        facts = OUT / f"{name}_facts.md"
        if not facts.exists() and os.environ.get("GEMINI_API_KEY"):
            try:
                write_facts(script, facts)
            except SystemExit as e:  # quota or API trouble must not block the render
                print(f"  facts skipped: {e}")
        if subprocess.run([sys.executable, str(ROOT / "make_video.py"), str(path)], cwd=ROOT).returncode:
            failed.append(name)
        else:
            done.append(name)
    todo = OUT / "faces_todo.md"
    if all_missing:
        todo.write_text(todo_text(all_missing), encoding="utf-8")
        print(f"faces to make: see {todo.relative_to(ROOT)}")
    elif todo.exists():
        todo.unlink()
    bg_todo = OUT / "bg_todo.md"
    if all_bgs:
        bg_todo.write_text(bg_todo_text(all_bgs), encoding="utf-8")
        print(f"backgrounds to make: see {bg_todo.relative_to(ROOT)}")
    elif bg_todo.exists():
        bg_todo.unlink()
    thumb_todo = OUT / "thumb_todo.md"
    if thumbs:
        lines = ["# Thumbnail backgrounds to make in gemini.google.com", "",
                 f"Save each full-size image into {THUMB_SRC.relative_to(ROOT)} with the exact file name shown;",
                 "the next batch.py run adds the episode's face and title text.", ""]
        for name, prompt in thumbs.items():
            lines += [f"## {name}", "", f"Save as `{name}.png`:", "", "```", prompt, "```", ""]
        thumb_todo.write_text("\n".join(lines), encoding="utf-8")
        print(f"thumbnails to make: see {thumb_todo.relative_to(ROOT)}")
    elif thumb_todo.exists():
        thumb_todo.unlink()
    print(f"rendered: {done or 'none'}; waiting for art: {waiting or 'none'}; failed: {failed or 'none'}")


if __name__ == "__main__":
    main()
