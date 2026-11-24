"""JSON-driven Full-Screen Dark Documentary builder (real video/photo + Kokoro + Whisper + Remotion)."""
import argparse
import hashlib
import importlib.util
import json
import math
import re
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
MEDIA_DIR = DOCU_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
FPS = 30
HEADERS = {"User-Agent": "DocuEngineBuilder/1.0 (local-dev)"}

VOICE_PRESETS = {
    "noir_deep": "voices/my_voices_01.mp3",
    "v1": "voices/my_voices_01.mp3",
    "voice1": "voices/my_voices_01.mp3",
    "investigator_crisp": "voices/my_voices_02.mp3",
    "v2": "voices/my_voices_02.mp3",
    "voice2": "voices/my_voices_02.mp3",
}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")[:48]


def fetch_wikimedia_image(query: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 20000:
        return True
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&generator=search"
        f"&gsrnamespace=6&gsrsearch={urllib.parse.quote(query)}&gsrlimit=6"
        "&prop=imageinfo&iiprop=url|mime&iiurlwidth=1920&format=json"
    )
    try:
        data = json.loads(urllib.request.urlopen(urllib.request.Request(api, headers=HEADERS), timeout=15).read().decode("utf-8"))
        pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
        for p in pages:
            info = (p.get("imageinfo") or [{}])[0]
            mime = info.get("mime", "")
            img_url = info.get("thumburl") or info.get("url")
            if img_url and mime in ("image/jpeg", "image/png"):
                raw = urllib.request.urlopen(urllib.request.Request(img_url, headers=HEADERS), timeout=20).read()
                if len(raw) > 20000:
                    dest.write_bytes(raw)
                    print(f"  [image] {dest.name} ({len(raw) // 1024} KB)")
                    return True
    except Exception as e:
        print(f"  [warn] image fetch failed for {query!r}: {e}")
    return False


def fetch_archive_video(query: str, dest: Path, archive_id: str | None = None, start_sec: int = 10) -> bool:
    """Fetch a verified Internet Archive public-domain video clip (by archiveId or strict title search) and normalize to 1280x720 30fps H.264."""
    if dest.exists() and dest.stat().st_size > 100000:
        return True
    search_url = (
        "https://archive.org/advancedsearch.php?"
        f"q=title:({urllib.parse.quote(query)})+AND+mediatype:movies"
        "&fl[]=identifier,title&sort[]=downloads+desc&rows=6&page=1&output=json"
    )
    try:
        if archive_id:
            idents = [archive_id]
        else:
            res = json.loads(urllib.request.urlopen(urllib.request.Request(search_url, headers=HEADERS), timeout=15).read().decode("utf-8"))
            idents = [d["identifier"] for d in res.get("response", {}).get("docs", []) if d.get("identifier")]
        for ident in idents:
            meta_url = f"https://archive.org/metadata/{ident}/files"
            meta = json.loads(urllib.request.urlopen(urllib.request.Request(meta_url, headers=HEADERS), timeout=15).read().decode("utf-8"))
            mp4s = [
                f for f in meta.get("result", [])
                if str(f.get("name", "")).lower().endswith(".mp4")
                and 300_000 < int(f.get("size") or 0) < 35_000_000
            ]
            if not mp4s:
                continue
            mp4s.sort(key=lambda f: int(f.get("size") or 0))
            fname = urllib.parse.quote(mp4s[0]["name"])
            dl_url = f"https://archive.org/download/{ident}/{fname}"
            raw_path = dest.with_suffix(".raw.mp4")
            try:
                req = urllib.request.Request(dl_url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=45) as resp, open(raw_path, "wb") as out_f:
                    out_f.write(resp.read())
                # Skip past opening title slates (`-ss start_sec` when clip is long enough, fallback 0) and loop 18s
                for ss in (str(start_sec), "0"):
                    try:
                        cmd = [
                            mv.FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
                            "-ss", ss, "-stream_loop", "-1", "-i", str(raw_path),
                            "-t", "18",
                            "-vf", "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720",
                            "-r", "30",
                            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
                            "-an", "-movflags", "+faststart", str(dest),
                        ]
                        subprocess.run(cmd, check=True)
                        if dest.exists() and dest.stat().st_size > 100000:
                            break
                    except Exception:
                        dest.unlink(missing_ok=True)
                raw_path.unlink(missing_ok=True)
                if dest.exists() and dest.stat().st_size > 100000:
                    print(f"  [video] {dest.name} <- archive.org/{ident} ({dest.stat().st_size // 1024} KB)")
                    return True
            except Exception:
                raw_path.unlink(missing_ok=True)
                dest.unlink(missing_ok=True)
    except Exception as e:
        print(f"  [warn] archive video search failed for {query!r}: {e}")
    return False


def resolve_media(scene: dict) -> dict | None:
    if scene.get("media"):
        return scene["media"]
    mq = scene.get("mediaQuery")
    if not mq:
        return None
    kind = mq.get("type", "image")
    query = mq.get("query", "")
    credit = mq.get("credit")
    slug = slugify(mq.get("archiveId") or query)
    preset = mq.get("cameraPreset")
    def pack(obj):
        if preset:
            obj["cameraPreset"] = preset
        return obj
    if kind == "video":
        mp4 = MEDIA_DIR / f"{slug}.mp4"
        if fetch_archive_video(query, mp4, archive_id=mq.get("archiveId"), start_sec=int(mq.get("clipStartSec", 10))):
            return pack({"type": "video", "src": f"docu/media/{mp4.name}", "startSec": 0, "credit": credit})
        fb_q = mq.get("fallbackQuery") or query
        jpg = MEDIA_DIR / f"{slugify(fb_q)}.jpg"
        if fetch_wikimedia_image(fb_q, jpg):
            return pack({"type": "image", "src": f"docu/media/{jpg.name}", "credit": credit})
        return None
    jpg = MEDIA_DIR / f"{slug}.jpg"
    if fetch_wikimedia_image(query, jpg):
        return pack({"type": "image", "src": f"docu/media/{jpg.name}", "credit": credit})
    return None


def resolve_media_list(scene: dict) -> list[dict]:
    items = []
    for mq in scene.get("mediaListQueries", []):
        m = resolve_media({"mediaQuery": mq})
        if m:
            items.append(m)
    return items


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("script", nargs="?", default="scripts/docu/knight-capital-3min.json")
    parser.add_argument("--no-render", action="store_true")
    parser.add_argument("--voice-ref", default=None, help="Voice preset (noir_deep | investigator_crisp) or path to reference audio")
    parser.add_argument("--out-slug", default=None, help="Override output file slug (e.g. knight_docu_3min_noir_deep)")
    args = parser.parse_args()

    script_path = ROOT / args.script
    script = json.loads(script_path.read_text(encoding="utf-8"))
    slug = args.out_slug or script.get("slug") or script_path.stem
    voice = script.get("voice", "am_michael")
    voice_ref = args.voice_ref or script.get("voiceRef")
    if voice_ref:
        voice_ref = VOICE_PRESETS.get(voice_ref, voice_ref)
    raw_scenes = script["scenes"]

    print(f"Resolving real archival media for {len(raw_scenes)} scenes...")
    resolved_media = [resolve_media(s) for s in raw_scenes]
    resolved_lists = [resolve_media_list(s) for s in raw_scenes]

    # Synthesize narration (Chatterbox voice clone if voiceRef is set, else Kokoro / Edge-TTS)
    full_text = " ".join(s["text"].strip() for s in raw_scenes)
    if voice_ref:
        ref_path = Path(voice_ref)
        if not ref_path.is_absolute():
            ref_path = (ROOT / ref_path).resolve()
        if not ref_path.exists():
            raise FileNotFoundError(f"Missing voiceRef audio: {ref_path}")
        text_hash = hashlib.sha256(f"chatterbox:{ref_path.name}:{full_text}".encode("utf-8")).hexdigest()[:12]
        wav_path = DOCU_DIR / f"{slug}_{text_hash}.wav"
        if wav_path.exists() and wav_path.stat().st_size > 20000:
            audio, _ = sf.read(wav_path, dtype="float32")
            print(f"Using cached cloned narration: {wav_path.name}")
        else:
            print(f"Synthesizing cloned narration ({len(full_text.split())} words) from {ref_path.name} with Chatterbox...")
            blocks_json = DOCU_DIR / f"{slug}_{text_hash}_blocks.json"
            blocks_json.write_text(json.dumps([s["text"].strip() for s in raw_scenes], indent=2), encoding="utf-8")
            venv_cb = Path(r"C:\Users\phama\.venvs\voice-clone\Scripts\python.exe")
            cb_python = sys.executable if importlib.util.find_spec("chatterbox") is not None else str(venv_cb)
            subprocess.run([cb_python, str(ROOT / "tts_chatterbox.py"), str(ref_path), str(blocks_json), str(wav_path)], check=True)
            audio, _ = sf.read(wav_path, dtype="float32")
    else:
        has_kokoro = importlib.util.find_spec("kokoro") is not None
        tts_engine = "kokoro" if has_kokoro else "edge"
        tts_voice = voice if has_kokoro else "en-US-AndrewMultilingualNeural"
        text_hash = hashlib.sha256(f"{tts_engine}:{tts_voice}:{full_text}".encode("utf-8")).hexdigest()[:12]
        wav_path = DOCU_DIR / f"{slug}_{text_hash}.wav"
        if wav_path.exists() and wav_path.stat().st_size > 20000:
            audio, _ = sf.read(wav_path, dtype="float32")
            print(f"Using cached narration: {wav_path.name}")
        else:
            print(f"Synthesizing continuous narration ({len(full_text.split())} words) with {tts_engine} ({tts_voice})...")
            # Synthesize per-act (~5 scenes per chunk for Kokoro, 1 scene for Edge-TTS to avoid timeouts)
            chunks = []
            block_size = 5 if has_kokoro else 1
            for i in range(0, len(raw_scenes), block_size):
                block_text = " ".join(s["text"].strip() for s in raw_scenes[i : i + block_size])
                pad = 2.0 if i + block_size >= len(raw_scenes) else 0.25
                chunks.append(mv.synth(block_text, voice=tts_voice, engine=tts_engine, pad_seconds=pad, gain=1.0))
            audio = np.concatenate(chunks)
            sf.write(wav_path, audio, mv.SAMPLE_RATE)

    total_frames = math.ceil(len(audio) / mv.SAMPLE_RATE * FPS)
    speech_frames = max(1, total_frames - int(2.0 * FPS))
    word_at = mv.word_frames(audio, full_text, "en", speech_frames)
    all_words = mv._words(full_text)

    # Map each scene's first word offset to its exact start frame in the continuous narration
    starts = [0]
    scene_word_ranges = []
    word_cursor = 0
    for idx_s, s in enumerate(raw_scenes):
        n_w = len(mv._words(s["text"]))
        scene_word_ranges.append((word_cursor, word_cursor + n_w))
        if idx_s > 0:
            idx = min(word_cursor, len(word_at) - 1)
            starts.append(max(starts[-1] + 30, int(word_at[idx])))
        word_cursor += n_w

    def find_cue_frame(phrase: str, scene_tokens: list[str], w_start: int, frm: int, dur: int, min_frame: int = 6) -> int | None:
        cue_tokens = mv._words(phrase)
        if not cue_tokens:
            return None
        match_pos = next(
            (j for j in range(len(scene_tokens) - len(cue_tokens) + 1) if scene_tokens[j : j + len(cue_tokens)] == cue_tokens),
            None,
        )
        if match_pos is None:
            return None
        global_idx = min(w_start + match_pos, len(word_at) - 1)
        return max(min_frame, min(dur - 12, int(word_at[global_idx]) - frm))

    scenes_out = []
    for i, s in enumerate(raw_scenes):
        frm = starts[i]
        dur = (starts[i + 1] - frm) if i < len(raw_scenes) - 1 else max(45, total_frames - frm)
        scene_obj = {k: v for k, v in s.items() if k not in ("text", "mediaQuery", "mediaListQueries", "cueWord", "cutCues")}
        scene_obj["from"] = frm
        scene_obj["duration"] = dur
        w_start, w_end = scene_word_ranges[i]
        scene_tokens = all_words[w_start:w_end]
        if s.get("cueWord"):
            cue_f = find_cue_frame(s["cueWord"], scene_tokens, w_start, frm, dur, min_frame=6)
            if cue_f is not None:
                scene_obj["cueFrame"] = cue_f
                print(f"  [micro-sync] scene {i} ({s.get('kind')}): cueWord={s['cueWord']!r} -> cueFrame={cue_f}/{dur}")
            else:
                print(f"  [warn] scene {i}: cueWord={s['cueWord']!r} not found in scene text")
        if s.get("cutCues"):
            cut_frames: list[int] = []
            prev_f = 0
            for phrase in s["cutCues"]:
                cf = find_cue_frame(phrase, scene_tokens, w_start, frm, dur, min_frame=12)
                if cf is not None:
                    cf = min(dur - 12, max(prev_f + 12, cf))
                    cut_frames.append(cf)
                    prev_f = cf
                    print(f"  [micro-sync] scene {i} ({s.get('kind')}): cutCue={phrase!r} -> cutFrame={cf}/{dur}")
                else:
                    print(f"  [warn] scene {i}: cutCue={phrase!r} not found in scene text")
            if cut_frames:
                scene_obj["cutFrames"] = cut_frames
        if resolved_media[i]:
            scene_obj["media"] = resolved_media[i]
        if resolved_lists[i]:
            scene_obj["mediaList"] = resolved_lists[i]
        scenes_out.append(scene_obj)

    manifest = {
        "title": script["title"],
        "fps": FPS,
        "durationInFrames": total_frames,
        "audio": f"docu/{wav_path.name}",
        "scenes": scenes_out,
    }
    (DOCU_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Write YouTube CC (.srt) and Metadata Pack (_youtube.txt)
    (ROOT / "out").mkdir(exist_ok=True)
    srt_scenes = [{"text": raw_scenes[i]["text"], "frames": scenes_out[i]["duration"], "transition": "cut"} for i in range(len(raw_scenes))]
    (ROOT / "out" / f"{slug}.srt").write_text(mv.srt(srt_scenes, 8), encoding="utf-8")

    def fmt_ts(frame: int) -> str:
        sec = max(0, round(frame / FPS))
        return f"{sec // 60:02d}:{sec % 60:02d}"

    chapters = [f"{fmt_ts(starts[c['scene']])} {c['title']}" for c in script.get("chapters", []) if 0 <= c.get("scene", -1) < len(starts)]
    facts = "\n".join(f"- {f}" for f in script.get("factCheck", []))
    yt_pack = (
        f"TITLE:\n{script['title']}\n\n"
        f"DESCRIPTION:\n{script.get('description', '')}\n\nSources & Verification:\n{facts}\n\n"
        f"CHAPTERS:\n" + "\n".join(chapters) + "\n\n"
        "PINNED COMMENT:\nWhich failure in this chain surprised you most—leaving dead test code for 9 years, ignoring 97 alerts, or hitting rollback?\n"
    )
    (ROOT / "out" / f"{slug}_youtube.txt").write_text(yt_pack, encoding="utf-8")
    print(f"Built manifest: {total_frames / FPS:.1f}s ({total_frames} frames) | scenes={len(scenes_out)} | words={len(all_words)}")

    if args.no_render:
        return

    remotion_bin = ROOT / "node_modules" / ".bin" / ("remotion.cmd" if sys.platform == "win32" else "remotion")
    remotion_cmd = [str(remotion_bin)] if remotion_bin.exists() else ["npx", "remotion"]
    out_mp4 = ROOT / "out" / f"{slug}.mp4"
    subprocess.run(
        remotion_cmd + ["render", "src/index.ts", "DocuEngine", str(out_mp4)],
        cwd=ROOT,
        check=True,
        shell=(sys.platform == "win32"),
    )
    mv.loudnorm(out_mp4)

    # Render inspection stills (4 upgrades for full docu, or 1 per scene for short demos)
    def cue_or(idx, default_off):
        return scenes_out[idx].get("cueFrame", default_off)

    if len(starts) >= 8:
        preview_map = [
            ("docu_up_map.png", min(total_frames - 1, starts[1] + 55)),
            ("docu_up_gloss.png", min(total_frames - 1, starts[3] + 55)),
            ("docu_up_doc.png", min(total_frames - 1, starts[5] + cue_or(5, 80) + 22)),
            ("docu_up_term.png", min(total_frames - 1, starts[7] + cue_or(7, 90) + 12)),
        ]
    else:
        preview_map = [
            (
                f"{slug}_scene_{i}.png",
                min(total_frames - 1, starts[i] + cue_or(i, max(20, scenes_out[i]["duration"] // 2)) + 15),
            )
            for i in range(len(starts))
        ]
    for name, frm in preview_map:
        subprocess.run(
            remotion_cmd + ["still", "src/index.ts", "DocuEngine", f"out/{name}", f"--frame={frm}"],
            cwd=ROOT,
            check=True,
            shell=(sys.platform == "win32"),
        )
    print(f"DONE! Video rendered at: {out_mp4}")


if __name__ == "__main__":
    main()
