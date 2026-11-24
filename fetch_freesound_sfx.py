#!/usr/bin/env python3
"""
Download Creative Commons 0 (CC0) documentary sound effects from Freesound.org,
trim silence, normalize loudness, and save as 44.1 kHz stereo 16-bit PCM WAVs in public/sfx/.
"""
import html as html_lib
import json
import re
import shutil
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent
SFX_DIR = ROOT / "public" / "sfx"
BACKUP_DIR = SFX_DIR / "_synth_backup"
CREDITS_PATH = SFX_DIR / "freesound_credits.json"

REMOTION_BIN_DIR = ROOT / "node_modules" / "@remotion" / "compositor-win32-x64-msvc"
FFMPEG = str(REMOTION_BIN_DIR / "ffmpeg.exe") if (REMOTION_BIN_DIR / "ffmpeg.exe").exists() else "ffmpeg"
FFPROBE = str(REMOTION_BIN_DIR / "ffprobe.exe") if (REMOTION_BIN_DIR / "ffprobe.exe").exists() else "ffprobe"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

# 12 curated documentary SFX slots with primary & fallback CC0 search queries
SLOTS = [
    {"file": "scribble.wav", "queries": ["marker write paper", "pen write paper"], "max_dur": 1.2},
    {"file": "scratch.wav", "queries": ["drawing circles pen", "pencil scribble circle paper"], "max_dur": 1.2},
    {"file": "paper_flip.wav", "queries": ["page turn paper flip", "paper rustle flip"], "max_dur": 1.2},
    {"file": "whoosh.wav", "queries": ["cinematic whoosh transition", "whoosh swoosh"], "max_dur": 1.4},
    {"file": "boom.wav", "queries": ["cinematic sub boom bass drop", "deep bass boom hit"], "max_dur": 2.4},
    {"file": "thud.wav", "queries": ["cinematic impact hit thud", "heavy thud impact"], "max_dur": 1.5},
    {"file": "glitch.wav", "queries": ["digital computer glitch error", "glitch static error"], "max_dur": 1.1},
    {"file": "alarm.wav", "queries": ["warning alarm beep", "alarm buzzer"], "max_dur": 1.6},
    {"file": "gavel.wav", "queries": ["gavel", "wooden hammer"], "max_dur": 1.4},
    {"file": "bell.wav", "queries": ["bell chime", "brass bell ring"], "max_dur": 2.0},
    {"file": "camera_shutter.wav", "queries": ["camera shutter", "dslr shutter"], "max_dur": 0.9},
    {"file": "explosion.wav", "queries": ["explosion impact", "dramatic boom explosion"], "max_dur": 2.4},
]


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def download_file(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp, open(dest, "wb") as f:
        shutil.copyfileobj(resp, f)


def probe_duration(path: Path) -> float | None:
    res = subprocess.run(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True,
        text=True,
    )
    if res.returncode != 0:
        return None
    try:
        return float(res.stdout.strip())
    except ValueError:
        return None


def search_candidates(query: str) -> list[str]:
    q = urllib.parse.quote_plus(query)
    url = f'https://freesound.org/search/?q={q}&f=license%3A%22Creative+Commons+0%22&s=score+desc'
    page = fetch_text(url)
    matches = re.findall(r'href="(/people/[^"/]+/sounds/\d+/|/s/\d+/)"', page)
    seen: set[str] = set()
    ordered: list[str] = []
    for m in matches:
        full = f"https://freesound.org{m}"
        if full not in seen:
            seen.add(full)
            ordered.append(full)
    return ordered[:14]


def parse_sound_page(url: str) -> dict | None:
    page = fetch_text(url)
    if "creativecommons.org/publicdomain/zero" not in page:
        return None
    mp3s = re.findall(r'https://cdn\.freesound\.org/previews/[^"\']+?-hq\.mp3', page)
    if not mp3s:
        mp3s = re.findall(r'https://cdn\.freesound\.org/previews/[^"\']+?-lq\.mp3', page)
    if not mp3s:
        return None

    title_m = re.search(r"<title>(.*?)</title>", page, re.S)
    raw_title = html_lib.unescape(title_m.group(1)).strip() if title_m else "Freesound SFX"
    title = re.sub(r"^Freesound\s*-\s*", "", raw_title)
    title = re.sub(r"\s+by\s+.*$", "", title).strip()

    author_m = re.search(r"/people/([^/]+)/sounds/\d+/", url)
    if not author_m:
        author_m = re.search(r'\s+by\s+([^\-<|]+)', raw_title)
    author = author_m.group(1).strip() if author_m else "unknown"

    return {"url": url, "title": title, "author": author, "mp3": mp3s[0]}


def convert_to_wav(src_mp3: Path, dest_wav: Path, max_dur: float) -> float | None:
    raw_wav = dest_wav.with_suffix(".raw.wav")
    res = subprocess.run(
        [
            FFMPEG, "-y", "-v", "error", "-i", str(src_mp3),
            "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le",
            str(raw_wav),
        ],
        capture_output=True,
        text=True,
    )
    if res.returncode != 0 or not raw_wav.exists():
        return None

    data, sr = sf.read(raw_wav, dtype="float32")
    raw_wav.unlink(missing_ok=True)
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)

    mono_env = np.max(np.abs(data), axis=1)
    peak_raw = float(np.max(mono_env)) if len(mono_env) else 0.0
    if peak_raw < 1e-4:
        return None

    # Trim leading silence below -42 dB relative to peak
    thresh = max(1e-4, peak_raw * 0.008)
    above = np.flatnonzero(mono_env >= thresh)
    if len(above) == 0:
        return None
    start_idx = max(0, int(above[0]) - int(0.01 * sr))
    data = data[start_idx : start_idx + int(max_dur * sr)]
    if len(data) < int(0.15 * sr):
        return None

    # Short 5ms fade-in + smooth exponential/cosine tail fade-out
    fade_in_n = min(len(data) // 10, int(0.005 * sr))
    if fade_in_n > 1:
        data[:fade_in_n] *= np.linspace(0.0, 1.0, fade_in_n, dtype=np.float32)[:, None]
    fade_out_n = min(len(data) // 3, int(min(0.18, max_dur * 0.25) * sr))
    if fade_out_n > 1:
        data[-fade_out_n:] *= np.linspace(1.0, 0.0, fade_out_n, dtype=np.float32)[:, None]

    # Normalize RMS toward -18 dBFS while capping peak at -1.5 dBFS (~0.84)
    rms = float(np.sqrt(np.mean(data ** 2)))
    if rms > 1e-5:
        gain = min(0.84 / max(1e-5, float(np.max(np.abs(data)))), 0.125 / rms)
        data = np.clip(data * gain, -0.95, 0.95)

    sf.write(dest_wav, data, sr, subtype="PCM_16")
    if not dest_wav.exists() or dest_wav.stat().st_size < 10_000:
        return None
    return round(len(data) / sr, 2)


def backup_existing_sfx() -> None:
    SFX_DIR.mkdir(parents=True, exist_ok=True)
    if BACKUP_DIR.exists():
        return
    existing = list(SFX_DIR.glob("*.wav"))
    if not existing:
        return
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    for f in existing:
        shutil.copy2(f, BACKUP_DIR / f.name)
    print(f"Backed up {len(existing)} existing WAVs to {BACKUP_DIR}")


def fetch_slot(slot: dict, tmp_dir: Path, used_urls: set[str]) -> dict:
    target = SFX_DIR / slot["file"]
    max_dur = slot["max_dur"]
    fallback_candidate: tuple[dict, float, Path] | None = None

    for query in slot["queries"]:
        candidates = search_candidates(query)
        for idx, cand_url in enumerate(candidates):
            if cand_url in used_urls:
                continue
            try:
                info = parse_sound_page(cand_url)
            except Exception:
                continue
            if not info:
                continue

            tmp_mp3 = tmp_dir / f"{slot['file']}_{idx}.mp3"
            try:
                download_file(info["mp3"], tmp_mp3)
            except Exception:
                continue

            raw_dur = probe_duration(tmp_mp3)
            if raw_dur is None or raw_dur < 0.15 or raw_dur > 20.0:
                continue

            tmp_wav = tmp_dir / f"{slot['file']}_{idx}.wav"
            out_dur = convert_to_wav(tmp_mp3, tmp_wav, max_dur)
            if out_dur is None:
                continue

            # Prefer naturally short clips (0.25s - 5.0s) so we don't chop a long loop mid-sound
            if 0.25 <= raw_dur <= 5.0:
                shutil.copy2(tmp_wav, target)
                used_urls.add(info["url"])
                return {
                    "file": slot["file"],
                    "title": info["title"],
                    "author": info["author"],
                    "url": info["url"],
                    "license": "CC0",
                    "raw_duration_sec": round(raw_dur, 2),
                    "duration_sec": round(out_dur, 2),
                }
            if fallback_candidate is None:
                fallback_candidate = (info, raw_dur, tmp_wav)
            time.sleep(0.15)

    if fallback_candidate is not None:
        info, raw_dur, tmp_wav = fallback_candidate
        out_dur = probe_duration(tmp_wav) or max_dur
        shutil.copy2(tmp_wav, target)
        used_urls.add(info["url"])
        return {
            "file": slot["file"],
            "title": info["title"],
            "author": info["author"],
            "url": info["url"],
            "license": "CC0",
            "raw_duration_sec": round(raw_dur, 2),
            "duration_sec": round(out_dur, 2),
        }

    raise RuntimeError(f"Failed to find a valid CC0 sound on Freesound for {slot['file']}")


def main() -> None:
    backup_existing_sfx()
    credits = []
    used_urls: set[str] = set()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        for slot in SLOTS:
            print(f"Fetching {slot['file']}...")
            entry = fetch_slot(slot, tmp_dir, used_urls)
            credits.append(entry)
            print(f"  -> {entry['title']!r} by {entry['author']} ({entry['duration_sec']}s) [{entry['url']}]")

    CREDITS_PATH.write_text(json.dumps(credits, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved {len(credits)} Freesound CC0 SFX and credits to {CREDITS_PATH}")


if __name__ == "__main__":
    main()
