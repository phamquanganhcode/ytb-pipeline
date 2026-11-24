"""Build & render a 55-60s Full-Screen Dark Documentary prototype (DocuPrototype)."""
import json
import math
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

import make_video as mv

ROOT = Path(__file__).parent
DOCU_DIR = ROOT / "public" / "docu"
DOCU_DIR.mkdir(parents=True, exist_ok=True)
FPS = 30

NARRATION = (
    "Four hundred forty million dollars vanished in forty-five minutes because one engineer skipped a single server. "
    "Nine thirty AM, August first, twenty twelve: the opening bell rings across Wall Street. "
    "Inside a quiet office in Jersey City, Knight Capital Group handles seventeen percent of all retail stock trades in America. "
    "Within sixty seconds, monitors erupt in crimson alerts as their flagship order router bleeds ten million dollars every single minute. "
    "Forty-five minutes later, a thirty-year trading giant is effectively bankrupt before ten fifteen. "
    "No hacker broke in. There was no market crash. Just one skipped server during a routine manual update. "
    "When customer orders hit unpatched Server eight, a nine-year-old piece of dead test code woke up with zero stop limits. "
    "According to the official SEC order, that single deployment mistake triggered four million rogue trades and sealed Knight Capital's fate."
)

# 8 anchor phrases marking where each visual scene begins in the continuous voiceover
ANCHORS = [
    "Four",
    "Nine",
    "Inside",
    "Within",
    "Forty-five",
    "No",
    "When",
    "According",
]

WIKI_QUERIES = {
    "nyse.jpg": "New York Stock Exchange building facade",
    "trading_floor.jpg": "New York Stock Exchange trading floor",
    "server_rack.jpg": "Data center server racks",
}


def fetch_wikimedia_photo(query: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 20000:
        return True
    headers = {"User-Agent": "DocuPrototypeResearch/1.0 (local-dev)"}
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&generator=search"
        f"&gsrnamespace=6&gsrsearch={urllib.parse.quote(query)}&gsrlimit=5"
        "&prop=imageinfo&iiprop=url|mime&iiurlwidth=1920&format=json"
    )
    try:
        req = urllib.request.Request(api, headers=headers)
        data = json.loads(urllib.request.urlopen(req, timeout=15).read().decode("utf-8"))
        pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
        for p in pages:
            info = (p.get("imageinfo") or [{}])[0]
            mime = info.get("mime", "")
            img_url = info.get("thumburl") or info.get("url")
            if img_url and mime in ("image/jpeg", "image/png"):
                img_bytes = urllib.request.urlopen(urllib.request.Request(img_url, headers=headers), timeout=20).read()
                if len(img_bytes) > 20000:
                    dest.write_bytes(img_bytes)
                    print(f"downloaded {dest.name} ({len(img_bytes) // 1024} KB)")
                    return True
    except Exception as e:
        print(f"warning: could not fetch {dest.name}: {e}")
    return False


def find_beats(audio: np.ndarray, total_frames: int) -> list[int]:
    word_at = mv.word_frames(audio, NARRATION, "en", total_frames)
    words = mv._words(NARRATION)
    beats = [0]
    cursor = 1
    for anchor in ANCHORS[1:]:
        a_norm = mv._words(anchor)[0]
        idx = next((i for i in range(cursor, len(words)) if words[i] == a_norm), None)
        if idx is None:
            beats.append(int(len(beats) / len(ANCHORS) * total_frames))
        else:
            beats.append(max(beats[-1] + 24, int(word_at[idx])))
            cursor = idx + 1
    return beats


def main():
    has_nyse = fetch_wikimedia_photo(WIKI_QUERIES["nyse.jpg"], DOCU_DIR / "nyse.jpg")
    has_floor = fetch_wikimedia_photo(WIKI_QUERIES["trading_floor.jpg"], DOCU_DIR / "trading_floor.jpg")
    has_server = fetch_wikimedia_photo(WIKI_QUERIES["server_rack.jpg"], DOCU_DIR / "server_rack.jpg")

    wav_path = DOCU_DIR / "narration.wav"
    txt_path = DOCU_DIR / "narration.txt"
    cached_ok = (
        wav_path.exists()
        and wav_path.stat().st_size > 10000
        and txt_path.exists()
        and txt_path.read_text(encoding="utf-8") == NARRATION
    )
    if cached_ok:
        audio, _ = sf.read(wav_path, dtype="float32")
    else:
        print("Synthesizing continuous documentary narration with local Kokoro (am_michael)...")
        audio = mv.synth(
            NARRATION,
            voice="am_michael",
            engine="kokoro",
            pad_seconds=2.5,
            gain=1.0,
        )
        sf.write(wav_path, audio, mv.SAMPLE_RATE)
        txt_path.write_text(NARRATION, encoding="utf-8")

    total_frames = math.ceil(len(audio) / mv.SAMPLE_RATE * FPS)
    beats = find_beats(audio, total_frames - int(2.5 * FPS))
    print(f"Total duration: {total_frames / FPS:.1f}s ({total_frames} frames) | beats={beats}")

    manifest = {
        "audio": "docu/narration.wav",
        "fps": FPS,
        "durationInFrames": total_frames,
        "beats": beats,
        "hasNyseImg": has_nyse,
        "hasFloorImg": has_floor,
        "hasServerImg": has_server,
    }
    (DOCU_DIR / "proto_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    remotion_cmd = str(ROOT / "node_modules" / ".bin" / "remotion.cmd")
    out_mp4 = ROOT / "out" / "knight_docu_60s.mp4"
    (ROOT / "out").mkdir(exist_ok=True)
    subprocess.run([remotion_cmd, "render", "src/index.ts", "DocuPrototype", str(out_mp4)], cwd=ROOT, check=True, shell=sys.platform == "win32")
    mv.loudnorm(out_mp4)

    # Render hook frames (0.5s, 1.5s, 2.5s) + fixed Scene 4 chart frame
    previews = [
        ("docu_hook_0s.png", 15),
        ("docu_hook_1s.png", 45),
        ("docu_hook_2s.png", 75),
        ("docu_frame_4.png", beats[4] + 60),
    ]
    for name, frm in previews:
        subprocess.run(
            [remotion_cmd, "still", "src/index.ts", "DocuPrototype", f"out/{name}", f"--frame={min(frm, total_frames - 1)}"],
            cwd=ROOT,
            check=True,
            shell=sys.platform == "win32",
        )
    print("DONE! Prototype rendered at:", out_mp4)


if __name__ == "__main__":
    main()
