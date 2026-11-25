"""JSON-driven English 2D Comic Explainer builder (Lóng-inspired modular style + Kokoro/Edge/Chatterbox + Remotion)."""
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
COMIC_DIR = ROOT / "public" / "comic"
MEDIA_DIR = COMIC_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
FPS = 30
HEADERS = {"User-Agent": "ComicExplainerBuilder/1.0 (local-dev)"}

VOICE_PRESETS = {
    "noir_deep": "voices/my_voices_01.mp3",
    "investigator_crisp": "voices/my_voices_02.mp3",
}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")[:48]


def _strip_html(raw: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", raw or "")).strip()


def _is_commercial_safe_license(license_short: str) -> bool:
    """Allow only Public Domain, CC0, CC BY, and CC BY-SA (reject NC, ND, fair use, unknown)."""
    lic = (license_short or "").strip().lower()
    if not lic:
        return False
    if any(bad in lic for bad in ("nc", "nd", "fair use", "copyrighted", "restricted", "non-free")):
        return False
    return (
        "public domain" in lic
        or lic.startswith("pd")
        or "cc0" in lic
        or "cc-by" in lic
        or "cc by" in lic
    )


def fetch_wikimedia_image(query: str, dest: Path) -> dict | None:
    """Fetch a commercial-safe Wikimedia Commons image and persist license/attribution metadata."""
    meta_path = dest.with_suffix(".meta.json")
    if dest.exists() and dest.stat().st_size > 15000 and meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            if _is_commercial_safe_license(meta.get("license", "")):
                return meta
        except Exception:
            pass

    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&generator=search"
        f"&gsrnamespace=6&gsrsearch={urllib.parse.quote(query)}&gsrlimit=10"
        "&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1920&format=json"
    )
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        data = json.loads(urllib.request.urlopen(req, timeout=15).read().decode("utf-8"))
        pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
        for p in pages:
            info = (p.get("imageinfo") or [{}])[0]
            mime = info.get("mime", "")
            img_url = info.get("thumburl") or info.get("url")
            ext = info.get("extmetadata") or {}
            lic = _strip_html((ext.get("LicenseShortName") or {}).get("value", ""))
            if not _is_commercial_safe_license(lic):
                continue
            artist = _strip_html((ext.get("Artist") or {}).get("value", "")) or "Wikimedia Commons contributor"
            desc_url = info.get("descriptionurl") or ""
            if img_url and mime in ("image/jpeg", "image/png"):
                raw = urllib.request.urlopen(urllib.request.Request(img_url, headers=HEADERS), timeout=20).read()
                if len(raw) > 15000:
                    dest.write_bytes(raw)
                    meta = {
                        "license": lic,
                        "artist": artist,
                        "url": desc_url,
                        "credit": f"{artist} ({lic})",
                    }
                    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
                    print(f"  [image] {dest.name} ({len(raw) // 1024} KB) — {lic}")
                    return meta
        print(f"  [warn] no commercial-safe Wikimedia image found for {query!r}")
    except Exception as e:
        print(f"  [warn] image fetch failed for {query!r}: {e}")
    return None


def resolve_media(scene: dict) -> dict | None:
    if scene.get("media"):
        return scene["media"]
    mq = scene.get("mediaQuery")
    if not mq:
        return None
    query = mq.get("query", "")
    jpg = MEDIA_DIR / f"{slugify(query)}.jpg"
    meta = fetch_wikimedia_image(query, jpg)
    if meta:
        credit = mq.get("credit") or meta["credit"]
        return {
            "type": "image",
            "src": f"comic/media/{jpg.name}",
            "credit": credit,
            "license": meta["license"],
            "sourceUrl": meta.get("url", ""),
        }
    return None


def tighten_dead_air(audio: np.ndarray, sr: int, max_silence_sec: float = 0.24, thresh: float = 0.012) -> np.ndarray:
    """Trim long silent gaps (> max_silence_sec) to match Lóng's zero-dead-air 99.8% speech density."""
    win = max(1, int(sr * 0.02))  # 20ms frames
    max_silent_wins = max(1, int(max_silence_sec / 0.02))
    out = []
    silent_run = 0
    for i in range(0, len(audio), win):
        chunk = audio[i : i + win]
        rms = float(np.sqrt(np.mean(chunk ** 2))) if len(chunk) else 0.0
        if rms < thresh:
            silent_run += 1
            if silent_run <= max_silent_wins:
                out.append(chunk)
        else:
            silent_run = 0
            out.append(chunk)
    return np.concatenate(out) if out else audio


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("script", nargs="?", default="scripts/comic/binance-6b-hack-en.json")
    parser.add_argument("--no-render", action="store_true", help="Build manifest & audio only")
    parser.add_argument("--stills-only", action="store_true", help="Render thumbnail + scene preview stills without full MP4")
    parser.add_argument("--voice-ref", default=None, help="Voice preset or path to reference audio for Chatterbox cloning")
    parser.add_argument("--out-slug", default=None, help="Override output slug")
    args = parser.parse_args()

    script_path = ROOT / args.script
    script = json.loads(script_path.read_text(encoding="utf-8"))
    slug = args.out_slug or script.get("slug") or script_path.stem
    brand = script.get("brand", "BRIEFED")
    voice = script.get("voice", "am_adam")
    voice_ref = args.voice_ref or script.get("voiceRef")
    if voice_ref:
        voice_ref = VOICE_PRESETS.get(voice_ref, voice_ref)
    raw_scenes = script["scenes"]

    print(f"Resolving stock/archival images for {len(raw_scenes)} comic scenes...")
    resolved_media = [resolve_media(s) for s in raw_scenes]

    thumb_cfg = dict(script.get("thumbnail") or {})
    thumb_media_meta = None
    if thumb_cfg.get("mediaQuery"):
        tm = resolve_media({"mediaQuery": thumb_cfg["mediaQuery"]})
        if tm:
            thumb_cfg["mediaSrc"] = tm["src"]
            thumb_media_meta = tm
        thumb_cfg.pop("mediaQuery", None)
    thumb_cfg.setdefault("brand", brand)

    full_text = " ".join(s["text"].strip() for s in raw_scenes)
    if voice_ref:
        ref_path = Path(voice_ref)
        if not ref_path.is_absolute():
            ref_path = (ROOT / ref_path).resolve()
        text_hash = hashlib.sha256(f"chatterbox:{ref_path.name}:{full_text}".encode("utf-8")).hexdigest()[:12]
        wav_path = COMIC_DIR / f"{slug}_{text_hash}.wav"
        if wav_path.exists() and wav_path.stat().st_size > 20000:
            audio, _ = sf.read(wav_path, dtype="float32")
            print(f"Using cached cloned narration: {wav_path.name}")
        else:
            blocks_json = COMIC_DIR / f"{slug}_{text_hash}_blocks.json"
            blocks_json.write_text(json.dumps([s["text"].strip() for s in raw_scenes], indent=2), encoding="utf-8")
            venv_cb = Path(r"C:\Users\phama\.venvs\voice-clone\Scripts\python.exe")
            cb_python = sys.executable if importlib.util.find_spec("chatterbox") is not None else str(venv_cb)
            subprocess.run([cb_python, str(ROOT / "tts_chatterbox.py"), str(ref_path), str(blocks_json), str(wav_path)], check=True)
            audio, _ = sf.read(wav_path, dtype="float32")
    else:
        has_kokoro = importlib.util.find_spec("kokoro") is not None
        tts_engine = "kokoro" if has_kokoro else "edge"
        tts_voice = voice if has_kokoro else "en-US-AndrewMultilingualNeural"
        text_hash = hashlib.sha256(f"{tts_engine}:{tts_voice}:snappy:{full_text}".encode("utf-8")).hexdigest()[:12]
        wav_path = COMIC_DIR / f"{slug}_{text_hash}.wav"
        if wav_path.exists() and wav_path.stat().st_size > 20000:
            audio, _ = sf.read(wav_path, dtype="float32")
            print(f"Using cached narration: {wav_path.name}")
        else:
            print(f"Synthesizing snappy English narration ({len(full_text.split())} words) with {tts_engine} ({tts_voice})...")
            chunks = []
            block_size = 4 if has_kokoro else 1
            for i in range(0, len(raw_scenes), block_size):
                block_text = " ".join(s["text"].strip() for s in raw_scenes[i : i + block_size])
                pad = 1.0 if i + block_size >= len(raw_scenes) else 0.15
                chunks.append(mv.synth(block_text, voice=tts_voice, engine=tts_engine, pad_seconds=pad, gain=1.0))
            audio = tighten_dead_air(np.concatenate(chunks), mv.SAMPLE_RATE, max_silence_sec=0.22)
            sf.write(wav_path, audio, mv.SAMPLE_RATE)

    total_frames = math.ceil(len(audio) / mv.SAMPLE_RATE * FPS)
    speech_frames = max(1, total_frames - int(1.0 * FPS))
    word_at = mv.word_frames(audio, full_text, "en", speech_frames)
    all_words = mv._words(full_text)

    starts = [0]
    scene_word_ranges = []
    word_cursor = 0
    for idx_s, s in enumerate(raw_scenes):
        n_w = len(mv._words(s["text"]))
        scene_word_ranges.append((word_cursor, word_cursor + n_w))
        if idx_s > 0:
            idx = min(word_cursor, len(word_at) - 1)
            starts.append(max(starts[-1] + 24, int(word_at[idx])))
        word_cursor += n_w

    def find_cue_frame(phrase: str, scene_tokens: list[str], w_start: int, frm: int, dur: int) -> int | None:
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
        return max(6, min(dur - 12, int(word_at[global_idx]) - frm))

    scenes_out = []
    for i, s in enumerate(raw_scenes):
        frm = starts[i]
        dur = (starts[i + 1] - frm) if i < len(raw_scenes) - 1 else max(45, total_frames - frm)
        scene_obj = {k: v for k, v in s.items() if k not in ("text", "mediaQuery", "cueWord")}
        scene_obj["from"] = frm
        scene_obj["duration"] = dur
        w_start, w_end = scene_word_ranges[i]
        scene_tokens = all_words[w_start:w_end]
        if s.get("cueWord"):
            cf = find_cue_frame(s["cueWord"], scene_tokens, w_start, frm, dur)
            if cf is not None:
                scene_obj["cueFrame"] = cf
            else:
                print(f"  [warn] scene {i}: cueWord {s['cueWord']!r} not found in narration text")
        if resolved_media[i]:
            scene_obj["media"] = {
                k: v for k, v in resolved_media[i].items() if k in ("type", "src", "credit") and v is not None
            }
        scenes_out.append(scene_obj)

    manifest = {
        "title": script["title"],
        "brand": brand,
        "fps": FPS,
        "durationInFrames": total_frames,
        "audio": f"comic/{wav_path.name}",
        "bgm": script.get("bgm", "music/calm.mp3"),
        "thumbnail": thumb_cfg,
        "scenes": scenes_out,
    }
    (COMIC_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Write YouTube CC (.srt) and Lóng-style humble English Metadata Pack
    (ROOT / "out").mkdir(exist_ok=True)
    srt_scenes = [{"text": raw_scenes[i]["text"], "frames": scenes_out[i]["duration"], "transition": "cut"} for i in range(len(raw_scenes))]
    (ROOT / "out" / f"{slug}.srt").write_text(mv.srt(srt_scenes, 8), encoding="utf-8")

    def fmt_ts(frame: int) -> str:
        sec = max(0, round(frame / FPS))
        return f"{sec // 60:02d}:{sec % 60:02d}"

    chapters = [f"{fmt_ts(starts[c['scene']])} {c['title']}" for c in script.get("chapters", []) if 0 <= c.get("scene", -1) < len(starts)]
    disclaimer = (
        "The information in this video is compiled from multiple public sources and our own research. "
        "We're just curious researchers who love breaking down big stories—not financial or security experts. "
        "If you spot any mistakes or updates, drop a comment below!"
    )
    # Collect Sources & Media Credits automatically for YouTube description
    source_lines = []
    seen_sources = set()
    for src in script.get("sources", []):
        s_clean = src.strip()
        if s_clean and s_clean.lower() not in seen_sources:
            seen_sources.add(s_clean.lower())
            source_lines.append(f"- {s_clean}")
    for s in raw_scenes:
        src = (s.get("source") or "").strip()
        if src and not any(src.lower() in existing for existing in seen_sources):
            seen_sources.add(src.lower())
            source_lines.append(f"- {src}")

    credit_lines = []
    seen_credits = set()
    all_media_items = [m for m in resolved_media if m] + ([thumb_media_meta] if thumb_media_meta else [])
    for m in all_media_items:
        cr = (m.get("credit") or "").strip()
        url = (m.get("sourceUrl") or "").strip()
        if cr:
            line = f"- {cr}" + (f" — {url}" if url else "")
            if line not in seen_credits:
                seen_credits.add(line)
                credit_lines.append(line)

    sources_block = (
        "SOURCES:\n" + ("\n".join(source_lines) if source_lines else "- Compiled from public reports (verify before publishing)") + "\n\n"
    )
    credits_block = ("MEDIA CREDITS:\n" + "\n".join(credit_lines) + "\n\n") if credit_lines else ""

    yt_pack = (
        f"TITLE:\n{script['title']}\n\n"
        f"DESCRIPTION:\n{script.get('description', disclaimer)}\n\n"
        f"DISCLAIMER:\n{disclaimer}\n\n"
        f"CHAPTERS:\n" + "\n".join(chapters) + "\n\n"
        f"{sources_block}"
        f"{credits_block}"
        f"PINNED COMMENT:\n{script.get('pinnedComment', 'What part of this breakdown surprised you most? Drop it below!')}\n"
    )
    (ROOT / "out" / f"{slug}_youtube.txt").write_text(yt_pack, encoding="utf-8")
    wpm = len(all_words) / max(0.1, (total_frames / FPS) / 60.0)
    print(f"Built comic manifest: {total_frames / FPS:.1f}s ({total_frames} frames) | scenes={len(scenes_out)} | words={len(all_words)} ({wpm:.0f} WPM)")

    if args.no_render:
        return

    remotion_bin = ROOT / "node_modules" / ".bin" / ("remotion.cmd" if sys.platform == "win32" else "remotion")
    remotion_cmd = [str(remotion_bin)] if remotion_bin.exists() else ["npx", "remotion"]

    # Render Lóng-style Thumbnail
    thumb_out = ROOT / "out" / f"{slug}_thumb.png"
    subprocess.run(
        remotion_cmd + ["still", "src/index.ts", "ComicThumbnail", str(thumb_out)],
        cwd=ROOT,
        check=True,
        shell=(sys.platform == "win32"),
    )
    print(f"Rendered thumbnail: {thumb_out}")

    # Render representative scene preview stills
    sample_indices = sorted(set([0, 1, 2, len(starts) // 3, len(starts) // 2, (2 * len(starts)) // 3, len(starts) - 2, len(starts) - 1]))
    for idx in sample_indices:
        if 0 <= idx < len(starts):
            frm = min(total_frames - 1, starts[idx] + max(24, int(scenes_out[idx]["duration"] * 0.65)))
            still_out = ROOT / "out" / f"{slug}_still_{idx:02d}_{scenes_out[idx]['kind']}.png"
            subprocess.run(
                remotion_cmd + ["still", "src/index.ts", "ComicExplainer", str(still_out), f"--frame={frm}"],
                cwd=ROOT,
                check=True,
                shell=(sys.platform == "win32"),
            )

    if args.stills_only:
        print("Stills-only mode complete.")
        return

    out_mp4 = ROOT / "out" / f"{slug}.mp4"
    subprocess.run(
        remotion_cmd + ["render", "src/index.ts", "ComicExplainer", str(out_mp4)],
        cwd=ROOT,
        check=True,
        shell=(sys.platform == "win32"),
    )
    mv.loudnorm(out_mp4)
    print(f"DONE! Comic explainer rendered at: {out_mp4}")


if __name__ == "__main__":
    main()
