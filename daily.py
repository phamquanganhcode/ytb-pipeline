"""Helpers for the daily unattended run (prompts/daily_run.md): one "Your Life as" episode per day.

Usage (PY = C:/Users/phama/.venvs/video-pipeline/Scripts/python):
    PY daily.py next            # pick the next topic, write out/daily_prompt.md (the filled life prompt)
    PY daily.py check <json>    # validate a written script, set voice fields, save it back
    PY daily.py upload <json>   # after render: write out/<name>_upload.md (title, description, files, checklist)
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from make_video import FPS, LANGS, PAINTED, PROMPTS, TRANSITION_FRAMES, count_words, validate

ROOT = Path(__file__).parent
TOPICS = ROOT / "topics" / "life.txt"
SCRIPTS = ROOT / "scripts" / "life"
OUT = ROOT / "out"
MINUTES = 15
MAX_BG_USES = 12  # scenes per background in one episode
MIN_QUOTES = 4  # documented speech-bubble quotes per episode


def slug(topic):
    """Same file name rule as make_video.py --topic (ASCII, max 40 chars)."""
    ascii_topic = unicodedata.normalize("NFD", topic.lower().replace("đ", "d")).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_topic).strip("-")[:40]


def next_topic():
    topics = [t.strip() for t in TOPICS.read_text(encoding="utf-8").splitlines() if t.strip() and not t.startswith("#")]
    left = [t for t in topics if not (SCRIPTS / f"{slug(t)}.json").exists()]
    if not left:
        raise SystemExit("NO TOPICS LEFT: append new names to topics/life.txt")
    topic = left[0]
    template = (ROOT / "prompts" / PROMPTS["life"]).read_text(encoding="utf-8").split("\n---\n", 1)[1]
    painted = "\n".join(f"  - `{name}`: {idea}" for name, idea in PAINTED.items())
    prompt = template.replace("{{PAINTED_BGS}}", painted).replace("{{TOPIC}}", topic).replace("{{LENGTH_MINUTES}}", str(MINUTES))
    OUT.mkdir(exist_ok=True)
    (OUT / "daily_prompt.md").write_text(prompt, encoding="utf-8")
    print(f"topic: {topic}\nscript: {(SCRIPTS / f'{slug(topic)}.json').relative_to(ROOT)}\nprompt: out/daily_prompt.md\ntopics left after this: {len(left) - 1}")


def check(path):
    """Same checks generate_script runs on a Gemini reply, so a hand-written script renders the same way."""
    script = json.loads(path.read_text(encoding="utf-8"))
    script["iconStyle"] = "bubble"  # set before validating: extras need it
    script.update({"lang": "en", **{k: LANGS["en"][k] for k in ("tts", "voice", "friendVoice")}})
    validate(script)
    words, target = count_words(script["scenes"]), MINUTES * LANGS["en"]["rate"]
    if abs(words - target) > 0.25 * target:
        raise SystemExit(f"the narration has {words} words but must have about {target} (±25%); rewrite to that length")
    if not script["scenes"][-1].get("title"):
        raise SystemExit("the last scene must be the title card with a 'title' field")
    # Variety rules (prompts/life_prompt.md): no room overused, real quotes on screen, crowds with faces.
    uses = {}
    for s in script["scenes"]:
        uses[s["bg"]] = uses.get(s["bg"], 0) + 1
    over = {bg: n for bg, n in uses.items() if n > MAX_BG_USES}
    if over:
        raise SystemExit(f"backgrounds used more than {MAX_BG_USES} times: {over}; move scenes to other or new settings")
    quotes = sum(1 for s in script["scenes"] if s.get("quote"))
    if quotes < MIN_QUOTES:
        raise SystemExit(f"only {quotes} 'quote' speech bubbles; add documented quotes until there are at least {MIN_QUOTES}")
    if any(s.get("crowd") for s in script["scenes"]) and "crowd1" not in script.get("cast", {}):
        raise SystemExit("scenes use 'crowd' but the cast has no crowd1/crowd2/crowd3 faces")
    chapters = script.get("meta", {}).get("chapters", [])
    if chapters and any(not c.get("mood") for c in chapters):
        raise SystemExit("every chapter in meta.chapters must have a 'mood' (one of: tense, calm, mystery, triumph, sad)")
    path.write_text(json.dumps(script, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"ok: {words} words, {len(script['scenes'])} scenes")


def srt_starts(script, name):
    """Scene start seconds read back from out/<name>.srt, for when the manifest belongs to another episode.
    make_video.srt writes ceil(words / per_cue) cues per scene, so the first cue of each scene marks its start."""
    path = OUT / f"{name}.srt"
    if not path.exists():
        return []
    cues = re.findall(r"(\d+):(\d+):(\d+),\d+ -->", path.read_text(encoding="utf-8"))
    per_cue, starts, i = LANGS["en"]["captionWords"] * 2, [], 0
    for s in script["scenes"]:
        n = -(-len(s["text"].split()) // per_cue)
        if not n or i >= len(cues):
            return []  # a silent scene has no cue to read its start from
        h, m, sec = map(int, cues[i])
        starts.append(h * 3600 + m * 60 + sec)
        i += n
    return starts if i == len(cues) else []  # cue count mismatch: srt is from another version of the script


def chapters(script, name):
    """YouTube chapter lines from meta.chapters ([{"scene": i, "title": ...}]) and the rendered scene lengths
    in public/manifest.json (same start-time math as make_video.srt). Empty if the manifest is another episode's."""
    marks = script.get("meta", {}).get("chapters")
    manifest = json.loads((ROOT / "public" / "manifest.json").read_text(encoding="utf-8"))
    if not marks:
        return []
    if manifest["title"] == script["title"]:
        scenes, starts = manifest["scenes"], [0]
        for prev, s in zip(scenes, scenes[1:]):
            starts.append(starts[-1] + prev["frames"] - (0 if s["transition"] == "cut" else TRANSITION_FRAMES))
        starts = [f // FPS for f in starts]
    else:
        starts = srt_starts(script, name)
        if not starts:
            return []
    assert marks[0]["scene"] == 0, "YouTube needs the first chapter at 0:00"
    secs = [starts[m["scene"]] for m in marks]
    assert all(b - a >= 10 for a, b in zip(secs, secs[1:])), "YouTube chapters must be at least 10 s long"
    return [f"{s // 60}:{s % 60:02} {m['title']}" for s, m in zip(secs, marks)]


def upload(path):
    script, name = json.loads(path.read_text(encoding="utf-8")), path.stem
    meta = script.get("meta", {})
    chapter_lines = chapters(script, name)
    files = [f"out/{name}{s}" for s in (".mp4", ".srt", "_thumb.jpg", "_facts.md")]
    lines = [f"# Upload: {script['title']}", "",
             "## Files", *[f"- {f}{'' if (ROOT / f).exists() else '  (MISSING)'}" for f in files], "",
             "## Title", "", script["title"], "",
             "## Description", "", meta.get("description", ""), "",
             *(["Chapters:", *chapter_lines, ""] if chapter_lines else []),
             "## Before you publish", "",
             "- [ ] Watch the whole video; check every flagged row in the facts file",
             "- [ ] Upload the .srt as English subtitles (do not burn them in)",
             "- [ ] Altered or synthetic content: Yes (AI voice and AI art)",
             "- [ ] Music: only the pipeline's own sounds or YouTube Audio Library",
             "- [ ] Chapter timestamps come from the rendered scene lengths; spot-check two of them"
             if chapter_lines else "- [ ] No chapters: add meta.chapters to the script and rerun upload after the render", ""]
    out = OUT / f"{name}_upload.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"upload sheet: {out.relative_to(ROOT)}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "next":
        next_topic()
    elif cmd in ("check", "upload") and len(sys.argv) == 3:
        (check if cmd == "check" else upload)(Path(sys.argv[2]))
    else:
        raise SystemExit(__doc__)
