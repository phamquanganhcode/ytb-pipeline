"""Cut 9:16 vertical YouTube Shorts trailers (21-34s) from any rendered MP4 + SRT.

Usage (PY = C:/Users/phama/.venvs/video-pipeline/Scripts/python):
    PY make_shorts.py out/crowdstrike_en.mp4 [--srt out/crowdstrike_en.srt] [--max-clips 2] [--no-render]
    PY make_shorts.py out/charles-ponzi.mp4 --clips 0:00-0:27,5:10-5:38 --title "Charles Ponzi's 45-Day Trap"
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import make_video as mv

ROOT = Path(__file__).parent
FPS = 30
TMP_DIR = ROOT / "public" / "_shorts_tmp"
OUT_DIR = ROOT / "out" / "shorts"


def parse_ts(text: str) -> float:
    """Parse SRT timestamp (HH:MM:SS,mmm) or CLI timestamp (MM:SS or HH:MM:SS or seconds) to seconds."""
    text = text.strip().replace(",", ".")
    parts = [float(p) for p in text.split(":")]
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    raise ValueError(f"Invalid timestamp: {text!r}")


def load_srt(srt_path: Path):
    """Parse an .srt file into [{start, end, text}, ...]."""
    if not srt_path or not srt_path.exists():
        return []
    blocks = re.split(r"\r?\n\r?\n+", srt_path.read_text(encoding="utf-8").strip())
    cues = []
    for blk in blocks:
        lines = [ln.strip() for ln in blk.splitlines() if ln.strip()]
        if len(lines) < 3:
            continue
        m = re.match(r"(\d+:\d+:\d+[,.]\d+)\s*-->\s*(\d+:\d+:\d+[,.]\d+)", lines[1])
        if not m:
            continue
        cues.append({
            "start": parse_ts(m.group(1)),
            "end": parse_ts(m.group(2)),
            "text": " ".join(lines[2:]),
        })
    return cues


def probe_duration(mp4: Path) -> float:
    """Read MP4 duration in seconds using ffmpeg stderr."""
    proc = subprocess.run([mv.FFMPEG, "-hide_banner", "-i", str(mp4)], capture_output=True, text=True)
    m = re.search(r"Duration:\s*(\d+:\d+:\d+(?:\.\d+)?)", proc.stderr)
    if not m:
        raise RuntimeError(f"Could not probe duration of {mp4}")
    return parse_ts(m.group(1))


def auto_select_windows(cues, total_sec: float, max_clips: int):
    """Pick 1-2 clean 21-34s windows ending on cue boundaries (opening hook + mid-video peak)."""
    windows = []
    # Clip 1: Opening hook (0:00 -> ~26s, clamped to [21, 34])
    if cues:
        candidates = [c["end"] for c in cues if 21.0 <= c["end"] <= 34.0]
        end1 = min(candidates, key=lambda t: abs(t - 26.0)) if candidates else min(28.0, total_sec)
    else:
        end1 = min(27.0, total_sec)
    if end1 >= 8.0:
        windows.append((0.0, end1, "HOOK"))

    # Clip 2: Mid-video peak (35%-65% range) if video is >= 120s
    if max_clips >= 2 and total_sec >= 120.0 and cues:
        mid_lo, mid_hi = total_sec * 0.35, total_sec * 0.65
        peak_pat = re.compile(r"(\?|!|\bbut\b|\bwait\b|\bmillion\b|\bbillion\b|\bcrash|\bfail|\bfatal)", re.I)
        best = None
        for idx, c in enumerate(cues):
            if not (mid_lo <= c["start"] <= mid_hi):
                continue
            score = len(peak_pat.findall(c["text"])) + (1 if c["text"].endswith(("?", "!")) else 0)
            # Extend forward to hit 24-32s window
            end_c = c["end"]
            for nxt in cues[idx + 1 :]:
                if nxt["end"] - c["start"] > 33.0:
                    break
                end_c = nxt["end"]
                if end_c - c["start"] >= 24.0:
                    break
            dur = end_c - c["start"]
            if 21.0 <= dur <= 34.0:
                cand = (score, -abs(dur - 27.0), c["start"], end_c)
                if best is None or cand > best:
                    best = cand
        if best:
            windows.append((best[2], best[3], "PEAK"))

    return windows[:max_clips]


def build_cues_for_window(cues, start_sec: float, end_sec: float):
    """Convert SRT cues intersecting [start_sec, end_sec] into local-frame ShortCue dicts."""
    out = []
    for c in cues:
        if c["end"] <= start_sec or c["start"] >= end_sec:
            continue
        loc_start = max(0.0, c["start"] - start_sec)
        loc_end = min(end_sec - start_sec, c["end"] - start_sec)
        s_frame = int(round(loc_start * FPS))
        e_frame = max(s_frame + 1, int(round(loc_end * FPS)))
        words = c["text"].split()
        span = max(1, e_frame - s_frame)
        word_timings = [
            {"word": w, "at": int(i / max(1, len(words)) * span)}
            for i, w in enumerate(words)
        ]
        out.append({
            "text": c["text"],
            "startFrame": s_frame,
            "endFrame": e_frame,
            "words": word_timings,
        })
    return out


def trim_clip(src_mp4: Path, dst_mp4: Path, start_sec: float, dur_sec: float):
    """Trim clip cleanly with frame-accurate re-encode so Remotion OffthreadVideo seeks without stalls."""
    dst_mp4.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            mv.FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-ss", f"{start_sec:.3f}", "-i", str(src_mp4), "-t", f"{dur_sec:.3f}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-ar", "48000", "-b:a", "192k",
            str(dst_mp4),
        ],
        check=True,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("mp4", help="Source rendered MP4 path (e.g. out/crowdstrike_en.mp4)")
    parser.add_argument("--srt", help="Optional .srt path (defaults to <mp4_stem>.srt in same folder)")
    parser.add_argument("--title", help="Short header title (defaults to humanized filename)")
    parser.add_argument("--badge", default="FULL STORY IN RELATED VIDEO", help="Top hook pill badge")
    parser.add_argument("--cta", default="WATCH FULL VIDEO BELOW ↓", help="Bottom CTA pill in last 3s")
    parser.add_argument("--clips", help="Comma-separated ranges like 0:00-0:27,2:10-2:38")
    parser.add_argument("--max-clips", type=int, default=2, help="Max auto-selected clips (default 2)")
    parser.add_argument("--no-render", action="store_true", help="Prepare trimmed clip & short_manifest.json only")
    args = parser.parse_args()

    src_mp4 = Path(args.mp4)
    if not src_mp4.is_absolute():
        src_mp4 = (ROOT / src_mp4).resolve()
    if not src_mp4.exists():
        raise SystemExit(f"Source MP4 not found: {src_mp4}")

    slug = src_mp4.stem
    srt_path = Path(args.srt) if args.srt else src_mp4.with_suffix(".srt")
    if not srt_path.is_absolute():
        srt_path = (ROOT / srt_path).resolve()
    cues = load_srt(srt_path)
    total_sec = probe_duration(src_mp4)

    if args.clips:
        windows = []
        for idx, spec in enumerate(args.clips.split(","), 1):
            a, b = spec.split("-", 1)
            sa, sb = parse_ts(a), min(total_sec, parse_ts(b))
            if sb > sa + 2:
                windows.append((sa, sb, f"CLIP {idx}"))
    else:
        windows = auto_select_windows(cues, total_sec, args.max_clips)

    if not windows:
        raise SystemExit("No valid clip windows found.")

    title = args.title or slug.replace("_", " ").replace("-", " ").title()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    remotion_bin = ROOT / "node_modules" / ".bin" / ("remotion.cmd" if sys.platform == "win32" else "remotion")
    remotion_cmd = [str(remotion_bin)] if remotion_bin.exists() else ["npx", "remotion"]

    try:
        for idx, (s_sec, e_sec, kind) in enumerate(windows, 1):
            dur_sec = max(1.0, e_sec - s_sec)
            dur_frames = int(round(dur_sec * FPS))
            tmp_clip = TMP_DIR / f"{slug}_clip_{idx:02d}.mp4"
            trim_clip(src_mp4, tmp_clip, s_sec, dur_sec)

            short_cues = build_cues_for_window(cues, s_sec, e_sec)
            manifest = {
                "title": title,
                "hookBadge": args.badge,
                "fps": FPS,
                "durationInFrames": dur_frames,
                "videoSrc": f"_shorts_tmp/{tmp_clip.name}",
                "ctaText": args.cta,
                "cues": short_cues,
            }
            (ROOT / "public" / "short_manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

            out_mp4 = OUT_DIR / f"{slug}_short_{idx:02d}.mp4"
            meta_txt = OUT_DIR / f"{slug}_short_{idx:02d}_meta.txt"
            meta_txt.write_text(
                f"TITLE: {title} #Shorts\n"
                f"CLIP WINDOW: {s_sec:.1f}s - {e_sec:.1f}s ({dur_sec:.1f}s, {kind})\n"
                f"RELATED VIDEO: Link full episode '{src_mp4.name}' in YouTube Studio Shorts Related Video!\n"
                f"HASHTAGS: #Shorts #Documentary #Finance #History\n",
                encoding="utf-8",
            )
            print(f"[Short {idx}/{len(windows)}] {s_sec:.1f}s -> {e_sec:.1f}s ({dur_sec:.1f}s, {len(short_cues)} cues) -> {out_mp4.relative_to(ROOT)}")

            if args.no_render:
                break

            subprocess.run(
                remotion_cmd + ["render", "src/index.ts", "ShortEpisode", str(out_mp4)],
                cwd=ROOT,
                check=True,
                shell=(sys.platform == "win32"),
            )
            mv.loudnorm(out_mp4)
            print(f"  rendered: {out_mp4.relative_to(ROOT)}")
    finally:
        if not args.no_render and TMP_DIR.exists():
            shutil.rmtree(TMP_DIR, ignore_errors=True)


if __name__ == "__main__":
    main()
