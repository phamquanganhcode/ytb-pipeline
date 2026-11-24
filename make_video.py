"""Script JSON -> voice per scene -> public/manifest.json -> Remotion render.

Setup (once; the venv lives outside the project so it survives moves):
    py -3.12 -m venv C:/Users/phama/.venvs/video-pipeline
    C:/Users/phama/.venvs/video-pipeline/Scripts/python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
    C:/Users/phama/.venvs/video-pipeline/Scripts/python -m pip install kokoro soundfile edge-tts pillow faster-whisper
    npm install

Usage (PY = C:/Users/phama/.venvs/video-pipeline/Scripts/python):
    PY make_video.py scripts/intro02.json [--no-render]
    PY make_video.py --topic "What if rent was free?" --minutes 9 [--format whatif|life] [--script-only]
    PY make_video.py --topics-file topics/life.txt --format life --minutes 15
    PY make_video.py --topic "Nếu tiền thuê nhà miễn phí?" --lang vi
      (--topic / --topics-file need the GEMINI_API_KEY environment variable; scripts are saved to
       scripts/<format>/ for review before rendering)
Voices: English uses Kokoro (local). Vietnamese uses Edge TTS by default; set "tts": "gemini" and a
Gemini voice name (e.g. "Charon") in a script to use Gemini TTS instead (needs GEMINI_API_KEY, has quotas).
Preview/edit visuals live: npm run studio
"""
import argparse
import asyncio
import base64
import difflib
import json
import math
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

import numpy as np
import soundfile as sf

FPS = 30
SAMPLE_RATE = 24000  # Kokoro, Edge (24 kHz mp3) and Gemini TTS all produce this rate
KOKORO_SAY = {"Peirce": "pˈɜɹs", "Astor": "ˈæstəɹ"}  # names Kokoro mispronounces
PAD_SECONDS = 0.5  # silence after each scene so cuts don't feel rushed
ROOT = Path(__file__).parent

# Per-language defaults. `rate` is spoken words per minute (Vietnamese: syllables), measured on samples.
LANGS = {
    "en": {"tts": "kokoro", "voice": "am_michael", "friendVoice": "am_puck", "friend": "Milo", "rate": 150, "captionWords": 6},
    "vi": {"tts": "edge", "voice": "vi-VN-HoaiMyNeural", "friendVoice": "vi-VN-NamMinhNeural", "friend": "Tùng", "rate": 175, "captionWords": 9},
}
GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"  # 3.8 TTS read the style prefix aloud and has tighter rate limits
# Delivery notes for Gemini TTS, sent in front of each line (2.5 follows them without reading them out).
# A script can override them with "ttsStyle": {"narrator": "...", "friend": "..."}.
TTS_STYLE = {
    "en": {"narrator": "Narrate like an engaging YouTube storyteller, with natural pauses and emphasis: ",
           "friend": "Say this as a young, quick, teasing best friend: "},
    "vi": {"narrator": "Kể chuyện bằng tiếng Việt, giọng miền Bắc, tự nhiên và lôi cuốn như một YouTuber kể chuyện, có nhấn nhá và ngắt nghỉ: ",
           "friend": "Nói bằng tiếng Việt, giọng miền Bắc, trẻ trung, nhanh, hay trêu chọc bạn thân: "},
}
SFX_NAMES = {
    "whoosh", "pop", "coin", "scribble", "rain", "thunder", "wind", "boom",
    "cash", "gavel", "scratch", "buzzer", "thud",
    "alarm", "explosion", "glitch", "creak", "geiger"
}


def gemini_call(models, body):
    """POST to the Gemini API. `models` is a comma-separated list: on busy/out-of-quota (503/429)
    the next model is tried, since each model has its own daily quota; then the round repeats."""
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise SystemExit("Set the GEMINI_API_KEY environment variable first.")
    for wait in (5, 20, 60, None):
        for model in models.split(","):
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model.strip()}:generateContent"
            req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key})
            try:
                with urllib.request.urlopen(req, timeout=300) as resp:
                    return json.load(resp)
            except urllib.error.HTTPError as e:
                if e.code not in (429, 503):
                    raise SystemExit(f"Gemini API error {e.code} from {model}: {e.read().decode()[:500]}") from None
                print(f"{model} unavailable ({e.code})")
        if wait is None:
            raise SystemExit(f"every model is busy or out of quota: {models}")
        print(f"retrying in {wait}s")
        time.sleep(wait)


_kokoro = None


VOICE_RMS = 0.126  # -18 dBFS speech: YouTube turns loud videos down to -14 LUFS but never turns quiet ones up
PEAK = 0.9


def level(audio):
    """Raise speech to VOICE_RMS, then limit peaks to PEAK with a 10 ms gain envelope (TTS peaks run ~20 dB over speech)."""
    frame = SAMPLE_RATE // 100
    n = len(audio) // frame
    if n < 3:
        return audio
    rms = np.sqrt((audio[:n * frame].reshape(n, frame) ** 2).mean(1))
    voiced = rms[rms > 0.1 * rms.max()]
    audio = audio * (VOICE_RMS / np.median(voiced))
    peaks = np.abs(np.pad(audio, (0, (n + 1) * frame - len(audio)))[:(n + 1) * frame].reshape(n + 1, frame)).max(1)
    g = np.minimum(1.0, PEAK / np.maximum(peaks, 1e-9))
    g = np.minimum(g, np.minimum(np.roll(g, 1), np.roll(g, -1)))  # erode so interpolation never lets a peak through
    centers = np.arange(n + 1) * frame + frame / 2
    return (audio * np.interp(np.arange(len(audio)), centers, g)).astype(np.float32)


def _scene_prosody(scene, mood="calm"):
    """Dynamic (rate, pitch, pad_seconds, gain) so Edge-TTS varies energy across acts instead of reading flat."""
    pace = scene.get("pace")
    fx = scene.get("fx")
    if pace == "dramatic" or scene.get("title"):
        return ("-9%", "-4Hz", 0.60, 0.96)
    if pace == "fast":
        return ("+13%", "+3Hz", 0.14, 1.10)
    if pace == "slow":
        return ("-6%", "-3Hz", 0.45, 0.95)
    if fx in ("alarm", "fire"):
        return ("+12%", "+3Hz", 0.14, 1.10)
    if mood == "tense":
        return ("+8%", "+2Hz", 0.18, 1.05)
    if mood == "mystery":
        return ("-4%", "-3Hz", 0.34, 0.96)
    if mood == "sad":
        return ("-6%", "-4Hz", 0.44, 0.95)
    return ("+3%", "+0Hz", PAD_SECONDS, 1.0)


def synth(text, voice, engine, style="", rate="+0%", pitch="+0Hz", pad_seconds=PAD_SECONDS, gain=1.0):
    """Speech for one scene as float32 mono at SAMPLE_RATE, followed by the closing pad.

    `style` is a delivery note only Gemini TTS understands; the other engines would read it aloud.
    """
    global _kokoro
    if engine == "kokoro":
        if _kokoro is None:
            from kokoro import KPipeline  # heavy (torch); only load when English is rendered
            _kokoro = KPipeline(lang_code="a")  # "a" = American English
        for word, ipa in KOKORO_SAY.items():  # misaki reads [word](/ipa/) as a pronunciation override
            text = re.sub(rf"\b{word}\b", f"[{word}](/{ipa}/)", text)
        chunks = [np.asarray(a, dtype=np.float32) for _, _, a in _kokoro(text, voice=voice)]
        audio = np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)
    elif engine == "edge":
        # Edge TTS WebSocket hangs on the 2nd call from the same process on Windows (aiohttp
        # connection pool + IocpProactor bug). Shell out to `edge-tts` CLI instead with stdin=DEVNULL.
        # Upstream Microsoft server intermittently terminates websocket (error 1006) or throttles;
        # timeout after 10s and retry with exponential backoff up to 5 times.
        edge_bin = str(Path(sys.executable).parent / ("edge-tts.exe" if sys.platform == "win32" else "edge-tts"))
        if not Path(edge_bin).exists():
            edge_bin = "edge-tts"
        audio = None
        for attempt in range(8):
            tmp = ROOT / "public" / f"_edge_{os.getpid()}_{int(time.time()*1000)}.mp3"
            try:
                use_pitch = pitch if attempt < 6 else "+0Hz"
                cmd = [edge_bin, "--text", text, "--voice", voice, f"--rate={rate}", f"--pitch={use_pitch}", "--write-media", str(tmp)]
                subprocess.run(cmd, check=True, stdin=subprocess.DEVNULL, capture_output=True, timeout=25)
                if tmp.exists() and tmp.stat().st_size > 0:
                    audio, sr = sf.read(tmp, dtype="float32")
                    if sr != SAMPLE_RATE:
                        raise ValueError(f"Edge TTS returned {sr} Hz audio; expected {SAMPLE_RATE}")
                    break
            except Exception:
                time.sleep(2.0 * (attempt + 1))
            finally:
                if tmp.exists():
                    tmp.unlink()
        if audio is None:
            raise RuntimeError(f"Edge TTS failed for {text!r} after 8 attempts")
    elif engine == "gemini":
        body = {"contents": [{"parts": [{"text": style + text}]}],
                "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
        data = gemini_call(GEMINI_TTS_MODEL, body)["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
        audio = np.frombuffer(base64.b64decode(data), dtype="<i2").astype(np.float32) / 32768  # 16-bit PCM, 24 kHz
    else:
        raise ValueError(f"unknown tts engine {engine!r}; use kokoro, edge or gemini")
    if not len(audio):
        raise ValueError(f"{engine} returned no audio for: {text!r}")
    # TTS engines add ~0.5 s of their own silence at each end; trim it so the pad alone sets the gap.
    loud = np.flatnonzero(np.abs(audio) > 0.01)
    margin = int(0.05 * SAMPLE_RATE)
    if len(loud):
        audio = audio[max(0, loud[0] - margin):loud[-1] + margin]
    audio = np.clip(level(audio) * gain, -PEAK, PEAK).astype(np.float32)
    return np.concatenate([audio, np.zeros(int(pad_seconds * SAMPLE_RATE), dtype=np.float32)])


def write_sfx(out_dir):
    """Synthesise transition/comic sounds so there are no third-party licences to track."""
    sr = 44100
    rng = np.random.default_rng(0)
    out_dir.mkdir(parents=True, exist_ok=True)

    n = int(0.45 * sr)  # whoosh: band-limited noise swelling in and out
    noise = np.convolve(rng.standard_normal(n), np.ones(30) / 30, "same")
    whoosh = noise * np.sin(np.linspace(0, np.pi, n)) ** 2

    t = np.arange(int(0.12 * sr)) / sr  # pop: quick downward pitch blip
    pop = np.sin(2 * np.pi * np.cumsum(np.linspace(900, 250, len(t))) / sr) * np.exp(-t * 30)

    def tone(freq, secs, decay):
        tt = np.arange(int(secs * sr)) / sr
        return np.sin(2 * np.pi * freq * tt) * np.exp(-tt * decay)

    coin = np.concatenate([tone(1319, 0.08, 4), tone(1760, 0.4, 8)])  # two-note "coin" chime

    # scribble: three short high-passed noise strokes, like a marker on paper
    stroke = lambda secs: np.diff(rng.standard_normal(int(secs * sr) + 1)) * np.sin(np.linspace(0, np.pi, int(secs * sr)))
    gap = np.zeros(int(0.03 * sr))
    scribble = np.concatenate([stroke(0.09), gap, stroke(0.07), gap, stroke(0.12)])

    # rain: 4 s of softened noise with a slow swell, looped under rainy scenes
    rain = np.convolve(rng.standard_normal(4 * sr), np.ones(6) / 6, "same") * (0.8 + 0.2 * np.sin(np.linspace(0, 2 * np.pi, 4 * sr)))
    # thunder: low rumble, sharp crack then a long decay
    tt = np.arange(int(2.5 * sr)) / sr
    thunder = np.convolve(rng.standard_normal(len(tt)), np.ones(400) / 400, "same") * (np.exp(-tt * 1.6) + 0.6 * np.exp(-((tt - 0.05) * 40) ** 2))
    # wind: slowly wavering filtered noise for snow scenes
    wind = np.convolve(rng.standard_normal(4 * sr), np.ones(120) / 120, "same") * (0.6 + 0.4 * np.sin(np.linspace(0, 4 * np.pi, 4 * sr)))

    # 1. boom: cinematic bass drop + impact punch
    t_boom = np.arange(int(1.2 * sr)) / sr
    freq_sweep = 110 * np.exp(-t_boom * 3.5) + 35
    sine_boom = np.sin(2 * np.pi * np.cumsum(freq_sweep) / sr) * np.exp(-t_boom * 2.5)
    hit_noise = np.convolve(rng.standard_normal(int(0.08 * sr)), np.ones(30) / 30, "same") * np.exp(-np.linspace(0, 10, int(0.08 * sr)))
    boom = sine_boom
    boom[:len(hit_noise)] += hit_noise * 0.7

    # 2. cash: mechanical click + rich 3-tone chime
    t_click = np.arange(int(0.05 * sr)) / sr
    click = np.sin(2 * np.pi * 3200 * t_click) * np.exp(-t_click * 100)
    t_bell = np.arange(int(0.7 * sr)) / sr
    bell = (np.sin(2 * np.pi * 1318.5 * t_bell) * np.exp(-t_bell * 5) * 0.4 +
            np.sin(2 * np.pi * 1661.2 * t_bell) * np.exp(-t_bell * 4) * 0.4 +
            np.sin(2 * np.pi * 1975.5 * t_bell) * np.exp(-t_bell * 3.5) * 0.5)
    cash = np.concatenate([click * 0.6, bell])

    # 3. gavel: sharp wooden crack + resonant wood ring
    t_gavel = np.arange(int(0.35 * sr)) / sr
    crack = np.diff(rng.standard_normal(int(0.04 * sr) + 1)) * np.exp(-np.linspace(0, 15, int(0.04 * sr)))
    wood = np.sin(2 * np.pi * 210 * t_gavel) * np.exp(-t_gavel * 16) + 0.5 * np.sin(2 * np.pi * 440 * t_gavel) * np.exp(-t_gavel * 25)
    gavel = np.zeros(len(t_gavel))
    gavel[:len(crack)] += crack * 0.8
    gavel += wood * 0.7

    # 4. scratch: comic vinyl record stop
    t_sc = np.arange(int(0.28 * sr)) / sr
    mod = np.sin(2 * np.pi * 15 * t_sc)
    noise_sc = rng.standard_normal(len(t_sc)) * (1 - t_sc / 0.28)
    f_sweep = np.linspace(2500, 400, len(t_sc))
    scratch = np.sin(2 * np.pi * np.cumsum(f_sweep + 200 * mod) / sr) * 0.5 + noise_sc * 0.35
    scratch = np.convolve(scratch, np.ones(10) / 10, "same") * np.exp(-t_sc * 2)

    # 5. buzzer: discordant square wave buzzer
    t_buzz = np.arange(int(0.35 * sr)) / sr
    buzzer = (np.sign(np.sin(2 * np.pi * 140 * t_buzz)) + np.sign(np.sin(2 * np.pi * 149 * t_buzz))) * 0.5 * np.exp(-t_buzz * 2)
    buzzer = np.convolve(buzzer, np.ones(8) / 8, "same")

    # 6. thud: comic punch / physical impact
    t_thud = np.arange(int(0.2 * sr)) / sr
    f_thud = 180 * np.exp(-t_thud * 18) + 50
    thud = np.sin(2 * np.pi * np.cumsum(f_thud) / sr) * np.exp(-t_thud * 12)

    # 7. alarm: industrial warning siren (alternating 800Hz / 1050Hz)
    t_al = np.arange(int(1.0 * sr)) / sr
    mod_al = np.sin(2 * np.pi * 3 * t_al)
    f_al = 920 + 130 * np.sign(mod_al)
    alarm = np.sin(2 * np.pi * np.cumsum(f_al) / sr) * (0.8 + 0.2 * np.sin(2 * np.pi * 12 * t_al))

    # 8. explosion: heavy blast + deep sub-bass shockwave decay
    t_ex = np.arange(int(1.8 * sr)) / sr
    f_sub = 80 * np.exp(-t_ex * 2.8) + 30
    sub_blast = np.sin(2 * np.pi * np.cumsum(f_sub) / sr) * np.exp(-t_ex * 1.5)
    noise_blast = np.convolve(rng.standard_normal(len(t_ex)), np.ones(80) / 80, "same") * np.exp(-t_ex * 3.2)
    explosion = sub_blast * 0.7 + noise_blast * 0.9

    # 9. glitch: digital error / electronic spark / bit-crush burst
    t_gl = np.arange(int(0.35 * sr)) / sr
    f_gl = 1200 - 800 * (t_gl / 0.35)
    glitch_carrier = np.sign(np.sin(2 * np.pi * np.cumsum(f_gl + rng.choice([-300, 0, 300], len(t_gl))) / sr))
    glitch = glitch_carrier * np.exp(-t_gl * 4) * 0.6

    # 10. creak: metal strain / bending structural stress
    t_cr = np.arange(int(0.65 * sr)) / sr
    cr_wobble = np.sin(2 * np.pi * 8 * t_cr)
    f_cr = 110 + 25 * cr_wobble
    creak = (np.sin(2 * np.pi * np.cumsum(f_cr) / sr) + 0.4 * np.sin(2 * np.pi * np.cumsum(f_cr * 2.1) / sr)) * np.exp(-t_cr * 1.8)

    # 11. geiger: radiation counter stochastic clicks
    t_ge = np.arange(int(0.8 * sr)) / sr
    geiger = np.zeros(len(t_ge))
    click_indices = rng.choice(len(t_ge) - 200, size=18, replace=False)
    for idx in click_indices:
        t_click_g = np.arange(150) / sr
        geiger[idx:idx + 150] += np.sin(2 * np.pi * 3200 * t_click_g) * np.exp(-t_click_g * 800)

    sounds = [
        ("whoosh", whoosh, 0.5), ("pop", pop, 0.6), ("coin", coin, 0.4), ("scribble", scribble, 0.3),
        ("rain", rain, 0.3), ("thunder", thunder, 0.8), ("wind", wind, 0.4),
        ("boom", boom, 0.7), ("cash", cash, 0.55), ("gavel", gavel, 0.6),
        ("scratch", scratch, 0.5), ("buzzer", buzzer, 0.45), ("thud", thud, 0.65),
        ("alarm", alarm, 0.6), ("explosion", explosion, 0.8), ("glitch", glitch, 0.5),
        ("creak", creak, 0.5), ("geiger", geiger, 0.65)
    ]
    for name, wave, peak in sounds:
        target_file = out_dir / f"{name}.wav"
        if not target_file.exists():
            sf.write(target_file, (wave / np.abs(wave).max() * peak).astype(np.float32), sr)


def write_music(path):
    """A license-free ambient loop (A minor pad, soft arpeggio, bass) for scripts without their own "music".

    shortcut: synthesized, so it sounds plain; drop a real track (e.g. from the YouTube Audio Library) in
    public/music/ and set "music": "music/<file>" in the script for a richer bed.
    """
    sr, beat = 44100, 60 / 70
    chords = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Am F C G as MIDI notes
    bar = 8 * beat
    n = int(len(chords) * bar * sr)
    out = np.zeros(n)
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)

    def add(start, wave):  # circular, so the loop point is seamless
        idx = (int(start * sr) + np.arange(len(wave))) % n
        np.add.at(out, idx, wave)

    for k, chord in enumerate(chords):
        t0 = k * bar
        tt = np.arange(int((bar + 2) * sr)) / sr
        env = np.minimum(1, tt / 1.2) * np.clip((bar + 2 - tt) / 2, 0, 1)
        for m in chord:  # pad: two slightly detuned sines per note
            add(t0, 0.12 * env * (np.sin(2 * np.pi * hz(m) * tt) + np.sin(2 * np.pi * hz(m) * 1.003 * tt)))
        add(t0, 0.25 * env * np.sin(2 * np.pi * hz(chord[0] - 12) * tt))  # bass
        tp = np.arange(int(1.5 * sr)) / sr
        for j in range(16):  # arpeggio: eighth-note plucks over the chord, an octave up
            m = chord[j % 3] + 12 + (12 if j % 8 == 7 else 0)
            add(t0 + j * beat / 2, 0.08 * np.exp(-tp * 3) * (np.sin(2 * np.pi * hz(m) * tp) + 0.3 * np.sin(4 * np.pi * hz(m) * tp)))
    out = np.convolve(out, np.ones(8) / 8, "same")  # soften the top end
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(path, (out / np.abs(out).max() * 0.5).astype(np.float32), sr)


def _word(w):
    # Possessives match their noun, so the trigger "father" fires on "father's".
    return re.sub(r"[^\w]", "", re.sub(r"['’]s$", "", w.strip(".,;:!?\"()"))).lower()


def _words(text):
    # Hyphenated words count as separate words, so "engine" matches "super-engine".
    return [w for w in (_word(t) for t in re.split(r"[\s\-‐–—]+", text)) if w]


_whisper = None


def word_frames(audio, text, lang, speech_frames):
    """Frame at which each word of _words(text) starts, heard by faster-whisper in the scene audio.

    Words whisper hears differently ("$1,000" vs "one thousand") are interpolated between their
    matched neighbours. Without faster-whisper, words are assumed evenly spaced.
    """
    global _whisper
    words = _words(text)
    even = [int(i / len(words) * speech_frames) for i in range(len(words))]
    if _whisper is None:
        try:
            from faster_whisper import WhisperModel
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            compute_type = "float16" if device == "cuda" else "int8"
            _whisper = WhisperModel("small", device=device, compute_type=compute_type)
        except ImportError:
            print("warning: faster-whisper not installed; trigger timing assumes evenly spaced words")
            _whisper = False
    if not _whisper or not words:
        return even
    audio16 = np.interp(np.arange(0, len(audio), SAMPLE_RATE / 16000), np.arange(len(audio)), audio).astype(np.float32)
    segments, _ = _whisper.transcribe(audio16, language=lang, word_timestamps=True)  # no initial_prompt: whisper then skips words it thinks were already said
    heard = [(h, w.start) for s in segments for w in s.words for h in _words(w.word)]
    times = {}
    for a, b, n in difflib.SequenceMatcher(None, words, [h for h, _ in heard], autojunk=False).get_matching_blocks():
        times.update({a + k: heard[b + k][1] for k in range(n)})
    if len(times) < len(words) / 2:  # whisper misheard most of it: its anchors are not trustworthy
        print(f"warning: whisper matched {len(times)}/{len(words)} words, using even spacing for: {text[:60]!r}")
        return even
    known = sorted(times)
    return [min(int(t * FPS), speech_frames - 1) for t in np.interp(range(len(words)), known, [times[i] for i in known])]


def timed(scene, items, word_at, kind):
    """Attach an `at` frame to each item: when its trigger `word` is spoken (`word_at` from word_frames).

    A trigger may be several words ("Day 7", "thirty-day"); it fires on its first word.
    """
    words = _words(scene["text"])
    out, start = [], 0
    for item in items:
        trigger = _words(item["word"])
        idx = next((i for i in range(start, len(words) - len(trigger) + 1) if trigger and words[i:i + len(trigger)] == trigger), None)
        if idx is None:
            raise ValueError(f"{kind} trigger word {item['word']!r} not found (in order) in: {scene['text']!r}")
        start = idx + 1
        out.append({**item, "at": word_at[idx] if word_at else 0})  # None: validate() only checks the triggers
    return out


POSES = {"idle", "point", "shrug", "cheer", "handOut"}
EXPRESSIONS = {"neutral", "happy", "shock"}


def scene_actions(scene):
    """Gestures for the scene; older scripts with a scene-level pose get it at the first word."""
    if "actions" in scene:
        actions = scene["actions"]
    elif "pose" in scene or "expression" in scene:
        who = "friend" if scene.get("speaker") == "friend" else "you"
        actions = [{"who": who, "word": scene["text"].split()[0],
                    **{k: scene[k] for k in ("pose", "expression") if k in scene}}]
    else:
        actions = []
    # Models often drop "who" in the life format, where only "you" acts: default to "you".
    actions = [a if "who" in a else {"who": "you", **a} for a in actions]
    for a in actions:
        if a.get("who") not in ("you", "friend"):
            raise ValueError(f"action 'who' must be 'you' or 'friend': {a}")
        if "pose" in a and a["pose"] not in POSES:
            raise ValueError(f"unknown pose {a['pose']!r}; use one of {sorted(POSES)}")
        if "expression" in a and a["expression"] not in EXPRESSIONS:
            raise ValueError(f"unknown expression {a['expression']!r}; use one of {sorted(EXPRESSIONS)}")
        if "face" in a and a["face"] not in ("left", "right"):
            raise ValueError(f"face must be 'left' or 'right': {a}")
    return actions


def resolve_cast(cast):
    """{"you": {"face": "hetty-green", "shirt": ...}} -> per-expression head images in public/faces.

    A missing expression falls back to the neutral head, so one drawing is enough to start.
    """
    out = {}
    for who, member in cast.items():
        entry = {k: v for k, v in member.items() if k in ("shirt", "size")}
        if member.get("face"):
            files = {e: f"faces/{member['face']}_{e}.png" for e in sorted(EXPRESSIONS)}
            if not (ROOT / "public" / files["neutral"]).exists():
                if who in ("you", "friend"):
                    raise ValueError(f"cast {who}: missing public/{files['neutral']} (make it with gen_face.py)")
                # Supporting characters fall back to a plain black head until their face is drawn.
                print(f"warning: cast {who}: no public/{files['neutral']} yet, drawn as a black head "
                      f"(make it with gen_face.py {member['face']} \"{member.get('faceIdea', member.get('name', who))}\")")
                out[who] = entry
                continue
            entry["faces"] = {e: f if (ROOT / "public" / f).exists() else files["neutral"] for e, f in files.items()}
        out[who] = entry
    return out


def mouth_track(audio, frames):
    """Mouth opening 0..1 per video frame, from loudness normalised to the scene's loud parts."""
    step = SAMPLE_RATE // FPS
    level = np.array([np.abs(audio[i * step:(i + 1) * step]).mean() if i * step < len(audio) else 0.0 for i in range(frames)])
    loud = np.percentile(level, 90) or 1.0
    return [round(float(x), 2) for x in np.clip(level / loud, 0, 1)]


# Keep in sync with BACKGROUNDS in src/Backgrounds.tsx and ICONS in src/Icons.tsx.
SVG_BACKGROUNDS = {
    "office", "home", "vault", "bank", "city", "cafe", "future",
    "control_room", "factory", "server_room", "bridge"
}
# Painted backgrounds: public/bg/<name>.png, described in assets/backgrounds.json (batch.py adds new ones).
PAINTED = json.loads((ROOT / "assets" / "backgrounds.json").read_text(encoding="utf-8"))
NEW_BG_NAME = re.compile(r"^[a-z][a-z0-9]{2,30}$")
MAX_NEW_BGS = 10  # new painted settings one script may ask for


def bg_ready(name):
    return name in SVG_BACKGROUNDS or (ROOT / "public" / "bg" / f"{name}.png").exists()
ICONS = {
    "coffee", "coin", "money", "calendar", "piggy", "chart", "question",
    "hazard", "radiation", "fire", "gear", "wrench", "skull", "electricity", "siren", "timer"
}
FX_KINDS = {"rain", "storm", "snow", "alarm", "smoke", "fire"}


def vision_file(name):
    """Picture for a thought bubble: a painted background (public/bg) or public/vision/<name>.png."""
    for f in (f"bg/{name}.png", f"vision/{name}.png"):
        if (ROOT / "public" / f).exists():
            return f
    return None


def validate(script):
    """Reject a script before any voice is generated, with a message an LLM can act on."""
    if not script.get("title") or not script.get("scenes"):
        raise ValueError("script needs a 'title' and a non-empty 'scenes' list")
    cast = script.get("cast", {})
    has_friend = any(s.get("speaker") == "friend" for s in script["scenes"])
    new_bgs = {s.get("bg") for s in script["scenes"]} - SVG_BACKGROUNDS - PAINTED.keys()
    if len(new_bgs) > MAX_NEW_BGS:
        raise ValueError(f"{len(new_bgs)} new backgrounds {sorted(new_bgs)}: use at most {MAX_NEW_BGS}, reuse the listed ones elsewhere")
    for i, scene in enumerate(script["scenes"]):
        where = f"scene {i} ({scene.get('text', '')[:40]!r})"
        if not scene.get("text"):
            raise ValueError(f"{where}: missing 'text'")
        if scene.get("speaker", "narrator") not in ("narrator", "friend"):
            raise ValueError(f"{where}: speaker must be 'narrator' or 'friend'")
        bg = scene.get("bg")
        if bg not in SVG_BACKGROUNDS and bg not in PAINTED and not (isinstance(bg, str) and NEW_BG_NAME.match(bg) and scene.get("bgIdea")):
            raise ValueError(f"{where}: bg {bg!r} must be one of {sorted(SVG_BACKGROUNDS | PAINTED.keys())}, "
                             "or a new lowercase name (letters and digits) with a 'bgIdea' describing it")
        if (scene.get("icons") or scene.get("callouts")) and scene.get("title"):
            raise ValueError(f"{where}: a title scene must have no icons and no callouts")
        for icon in scene.get("icons", []):
            if icon.get("icon") not in ICONS:
                raise ValueError(f"{where}: icon {icon.get('icon')!r} must be one of {sorted(ICONS)}")
        try:
            actions = scene_actions(scene)
        except ValueError as e:
            raise ValueError(f"{where}: {e}") from None
        for a in actions:
            if a.get("hold") not in ICONS | {None}:
                raise ValueError(f"{where}: hold {a['hold']!r} must be null or one of {sorted(ICONS)}")
        callouts = scene.get("callouts", [])
        if len(callouts) > 2 or any(len(c.get("text", "")) > 28 for c in callouts):
            raise ValueError(f"{where}: at most 2 callouts per scene, each at most 28 characters")
        # Who is on screen: "you", the friend (only drawn when they speak somewhere, see Episode.tsx) and this scene's extras.
        extras = scene.get("extras", [])
        if extras and script.get("iconStyle") != "bubble":
            raise ValueError(f"{where}: extras need \"iconStyle\": \"bubble\" (they stand where the icon panel would be)")
        if len(extras) > 4:
            raise ValueError(f"{where}: at most 4 extras per scene")
        crowd = scene.get("crowd", 0)
        if not isinstance(crowd, int) or not 0 <= crowd <= 8 or (crowd and scene.get("empty")):
            raise ValueError(f"{where}: crowd must be a whole number 0-8, and an empty scene has no crowd")
        for e in extras:
            if e.get("who") in (None, "you", "friend") or e["who"] not in cast:
                raise ValueError(f"{where}: extra {e} must name a supporting character defined in the script's \"cast\"")
            if e.get("pose", "idle") not in POSES or e.get("expression", "neutral") not in EXPRESSIONS or e.get("face", "left") not in ("left", "right"):
                raise ValueError(f"{where}: extra {e}: pose/expression/face must use the allowed values")
        if extras and scene.get("icons"):
            raise ValueError(f"{where}: a scene with extras has no icons (the thought bubble would cover them)")
        on_screen = {"you"} | {e["who"] for e in extras}
        if has_friend:
            on_screen.add("friend")
        if scene.get("empty"):
            if extras or scene.get("icons") or scene.get("quote") or scene_actions(scene) or any(c.get("target") for c in callouts):
                raise ValueError(f"{where}: an empty (establishing) scene has no characters, so no extras, icons, quote, actions or targeted callouts")
            on_screen = set()
        for c in callouts:
            if c.get("target") is not None and c["target"] not in on_screen:
                raise ValueError(f"{where}: callout target {c['target']!r} is not on screen here (on screen: {sorted(on_screen)})")
        if scene.get("stamp") is not None and not (isinstance(scene["stamp"], str) and 0 < len(scene["stamp"]) <= 24):
            raise ValueError(f"{where}: stamp must be a string of 1-24 characters, e.g. 'NEW BEDFORD, 1834'")
        quote = scene.get("quote")
        if quote is not None:
            if quote.get("who") not in on_screen or not 0 < len(quote.get("text", "")) <= 90 or not quote.get("word"):
                raise ValueError(f"{where}: quote needs 'who' on screen (on screen: {sorted(on_screen)}), 'text' of 1-90 characters and a trigger 'word'")
            if quote["who"] == "you" and scene.get("icons") and script.get("iconStyle") == "bubble":
                raise ValueError(f"{where}: a quote from 'you' and icons would both sit right of your head; drop the icons")
        if any(w not in on_screen | {"you"} for w in scene.get("looks", {})):
            raise ValueError(f"{where}: looks may only swap heads of characters in this scene")
        if scene.get("fx") is not None and scene.get("fx") not in FX_KINDS:
            raise ValueError(f"{where}: fx must be one of {sorted(FX_KINDS)}")
        paper = scene.get("paper")
        if paper is not None:
            if not 0 < len(paper.get("text", "")) <= 60 or not paper.get("word") or scene.get("icons") or len(extras) > 2:
                raise ValueError(f"{where}: paper needs 'text' (1-60 characters) and a trigger 'word', and the scene has no icons and at most 2 extras (the paper covers the middle)")
            fix = paper.get("fix")
            if fix is not None and (_word(fix.get("strike", "")) not in _words(paper["text"]) or not 0 < len(fix.get("write", "")) <= 16 or not fix.get("word")):
                raise ValueError(f"{where}: paper fix needs 'strike' (a word of the paper text), 'write' (1-16 characters) and a trigger 'word'")
        vision = scene.get("vision")
        if vision is not None:
            if script.get("iconStyle") != "bubble" or extras or scene.get("empty") or scene.get("icons") or (quote or {}).get("who") == "you":
                raise ValueError(f"{where}: vision needs \"iconStyle\": \"bubble\" and a scene with no extras, icons, empty or quote from 'you' (it fills the thought bubble)")
            if not vision.get("word") or not vision_file(vision.get("image", "")):
                raise ValueError(f"{where}: vision needs a trigger 'word' and an 'image' that is a painted bg name or a file in public/vision/")
        if scene.get("sfx"):
            for s in scene["sfx"]:
                if not s.get("sound") or not s.get("word"):
                    raise ValueError(f"{where}: sfx needs 'sound' and 'word'")
                if s["sound"] not in SFX_NAMES:
                    raise ValueError(f"{where}: sfx sound {s['sound']!r} must be one of {sorted(SFX_NAMES)}")
        doc = scene.get("doc")
        if doc is not None:
            for k in ("source", "headline", "excerpt", "highlight"):
                if not isinstance(doc.get(k), str) or not doc[k].strip():
                    raise ValueError(f"{where}: doc needs non-empty '{k}'")
        try:
            timed(scene, [vision] if vision else [], None, "Vision")
            timed(scene, [doc] if doc and doc.get("word") else [], None, "Doc")
            timed(scene, scene.get("sfx", []), None, "SFX")
            timed(scene, scene.get("icons", []), None, "Icon")
            timed(scene, callouts, None, "Callout")
            timed(scene, actions, None, "Action")
            timed(scene, [quote] if quote else [], None, "Quote")
            timed(scene, [paper] + ([paper["fix"]] if paper.get("fix") else []) if paper else [], None, "Paper")
        except ValueError as e:
            raise ValueError(f"{where}: {e}") from None
    for c in script.get("meta", {}).get("chapters", []):
        if c.get("mood") is not None and c["mood"] not in MOODS:
            raise ValueError(f"chapter {c.get('title')!r}: mood {c['mood']!r} is not one of {MOODS}")


def _episode_key(path):
    """Normalize a script path to its base episode slug (language variants like chernobyl / chernobyl_en match)."""
    stem = Path(path).stem.lower()
    for suffix in ("_en", "_vi", "_long", "_web"):
        if stem.endswith(suffix):
            stem = stem[: -len(suffix)]
    return stem


def validate_unique_faces(script, script_path=None):
    """Enforce that every video uses its own unique character faces — never duplicated within or across videos."""
    cast = script.get("cast", {})
    if not cast:
        return
    # 1. No duplicate faces between different characters in the same video
    seen_local = {}
    for role, info in cast.items():
        face = info.get("face")
        if not face:
            continue
        if face in seen_local:
            raise ValueError(
                f"duplicate face {face!r} inside the same script (roles {seen_local[face]!r} and {role!r}); "
                "every character must have its own unique face"
            )
        seen_local[face] = role

    # 2. No face reused from another video in scripts/
    current_key = _episode_key(script_path) if script_path else None
    scripts_dir = ROOT / "scripts"
    if not scripts_dir.exists():
        return
    for other in sorted(scripts_dir.rglob("*.json")):
        if other.stem.startswith(("test_", "intro")):
            continue
        if current_key and _episode_key(other) == current_key:
            continue
        try:
            other_cast = json.loads(other.read_text(encoding="utf-8")).get("cast", {})
        except Exception:
            continue
        other_faces = {info.get("face") for info in other_cast.values() if isinstance(info, dict) and info.get("face")}
        conflicts = sorted(seen_local.keys() & other_faces)
        if conflicts:
            rel = other.relative_to(ROOT)
            raise ValueError(
                f"face(s) {conflicts} already used in {rel}; every video must have its own unique character images "
                "(generate new faces with gen_face.py and never reuse faces across videos)"
            )


VI_RULES = """

## Language: Vietnamese (overrides the rules above where they differ)

Write for a Vietnamese audience in natural spoken Vietnamese. Do not translate from English; write it
the way a Vietnamese storyteller would tell it out loud to friends.
- Spoken style: short sentences of 5–12 syllables, everyday words, natural particles (thôi, mà, đấy,
  nhỉ, à, chứ, luôn), and drop the subject when a Vietnamese speaker would.
- Avoid translated phrasing: no "Bạn có biết rằng", "Điều này có nghĩa là", "Hãy tưởng tượng",
  no repeated "của bạn", no passive voice, no written-style connectors ("tuy nhiên", "do đó").
  Bad: "Bạn nhận được mức lương mười triệu đồng của bạn và bạn mỉm cười."
  Good: "Sếp đưa phong bì lương. Mười triệu. Bình thường thôi, đúng không?"
- Every `text`, `title`, `stamp`, icon `label`, counter `label`/`value` and every `meta` text is in Vietnamese.
  JSON keys and the allowed values (pose, expression, bg, icon, who, face, speaker, target) stay in English.
- Money is in Vietnamese dong unless the story happens abroad: spoken as words ("ba mươi triệu đồng"),
  short in labels and counters ("30 triệu", "61,4 tỷ"). Use everyday Vietnamese references.
- The cold open starts with "Ngày 1." (or "Tháng 1." / "Năm 1." to match the counter), and the
  episode title starts with "Nếu".
- {{FRIEND_NAME}} talks like a Vietnamese friend; keep one pair of pronouns (cậu/tớ) all episode.
- Length is counted in Vietnamese syllables (space-separated): about {{LENGTH_MINUTES}} × 175 syllables.
- Icon and action `word` values are copied exactly from the Vietnamese `text` (one syllable is fine).
"""

PROMPTS = {
    "whatif": "script_prompt.md",
    "life": "life_prompt.md",
    "disaster": "disaster_prompt.md",
}  # one prompt per channel format


def ask_json(models, prompt, check, what):
    """Ask Gemini for one JSON object; feed `check` errors back until it passes (max 3 tries)."""
    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    for attempt in range(3):
        body = {"contents": contents, "generationConfig": {"responseMimeType": "application/json", "temperature": 0.9}}
        answer = gemini_call(models, body)["candidates"][0]["content"]["parts"][0]["text"]
        try:
            obj = json.loads(answer)
            check(obj)
            return obj
        except (ValueError, KeyError, TypeError) as e:
            print(f"{what} attempt {attempt + 1}: rejected: {e}")
            contents += [
                {"role": "model", "parts": [{"text": answer}]},
                {"role": "user", "parts": [{"text": f"That JSON was rejected: {e}. Reply with the full corrected JSON object only."}]},
            ]
    raise SystemExit(f"Gemini did not produce a valid {what} in 3 attempts.")


def count_words(scenes):
    return sum(len(s["text"].split()) for s in scenes)


def generate_script(topic, minutes, friend, model, lang, fmt="whatif", chunked=False):
    """Write a script with Gemini, in one reply or (chunked) as an outline then one reply per chapter.

    Chunked exists because Flash-Lite stops at ~600-750 words per reply, far short of 8+ minutes.
    """
    template = (ROOT / "prompts" / PROMPTS[fmt]).read_text(encoding="utf-8").split("\n---\n", 1)[1]
    if lang == "vi":
        template += VI_RULES
    painted = "\n".join(f"  - `{name}`: {idea}" for name, idea in PAINTED.items())
    prompt = template.replace("{{PAINTED_BGS}}", painted).replace("{{TOPIC}}", topic).replace("{{LENGTH_MINUTES}}", str(minutes)).replace("{{FRIEND_NAME}}", friend)
    unit = "syllables" if lang == "vi" else "words"
    target = minutes * LANGS[lang]["rate"]

    def check_full(script):
        if fmt == "life":
            script["iconStyle"] = "bubble"  # set before validating: extras need it
        validate(script)
        validate_unique_faces(script)
        words = count_words(script["scenes"])
        if abs(words - target) > 0.25 * target:
            raise ValueError(f"the narration has {words} {unit} but must have about {target:.0f} (±25%); rewrite to that length")
        if not script["scenes"][-1].get("title"):
            raise ValueError("the last scene must be the title card with a 'title' field")

    if not chunked:
        script = ask_json(model, prompt, check_full, "script")
    else:
        n = max(2, round(target / 200))  # Flash-Lite holds ~200 words per reply even after rejections
        per = target / n

        def check_outline(o):
            if not o.get("title") or len(o.get("chapters", [])) != n:
                raise ValueError(f"need a 'title' and exactly {n} chapters")
            if not isinstance(o.get("cast", {}), dict):
                raise ValueError("'cast' must be an object keyed by character key")

        # The life format's supporting cast is fixed in the outline so every chapter uses the same keys.
        cast_line = ',\n "cast": <the "cast" object described in the Output section>' if fmt == "life" else ""
        outline = ask_json(model, prompt + f"""

## This step: outline only
Plan the whole episode as exactly {n} chapters of about {per:.0f} {unit} each, in story order,
covering every part of the story structure above. Reply with JSON only:
{{"title": "...", "chapters": [{{"summary": "<4-6 sentences: what happens, the real facts and numbers used, jokes, setups and payoffs>"}}],
 "meta": <the "meta" object described in the Output section>{cast_line}}}""", check_outline, "outline")
        cast = outline.get("cast", {})
        style = {"iconStyle": "bubble"} if fmt == "life" else {}

        scenes = []
        for k, chapter in enumerate(outline["chapters"], 1):
            last = k == n

            def check_chapter(o, last=last):
                validate({"title": outline["title"], "scenes": o["scenes"], "cast": cast, **style})
                words = count_words(o["scenes"])
                if words < 0.7 * per:
                    raise ValueError(f"this chapter has {words} {unit} but must have about {per:.0f}; write it longer")
                if last != bool(o["scenes"][-1].get("title")) or any(s.get("title") for s in o["scenes"][:-1]):
                    raise ValueError("only the final chapter ends with the title-card scene" if last else "do not write a title-card scene in this chapter")

            before = f"\nThe previous chapter ended with these scenes; continue directly, do not repeat them:\n{json.dumps(scenes[-4:], ensure_ascii=False)}\n" if scenes else ""
            part = ask_json(model, prompt + f"""

## This step: write chapter {k} of {n} only
Episode title: {outline["title"]}
Full outline: {json.dumps(outline["chapters"], ensure_ascii=False)}
{before}
{f"Supporting cast (use only these keys): {json.dumps(cast, ensure_ascii=False)}" if cast else ""}
Write only chapter {k}: {chapter["summary"]}
About {per:.0f} {unit}. {"End with the final title-card scene." if last else "Do not write a title-card scene."}
Reply with JSON only: {{"scenes": [...]}} using the scene format above.""", check_chapter, f"chapter {k}/{n}")
            scenes += part["scenes"]
        script = {"title": outline["title"], "scenes": scenes, "meta": outline.get("meta", {}), "cast": cast, **style}
        try:
            check_full(script)
        except ValueError as e:
            raise SystemExit(f"assembled script rejected: {e}") from None

    # Voices come from the language defaults, not from whatever the model copied from the example.
    script.update({"lang": lang, **{k: LANGS[lang][k] for k in ("tts", "voice", "friendVoice")}})
    if fmt == "life":
        script["iconStyle"] = "bubble"  # painted period backgrounds stay visible
    return script


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("script", nargs="?", help="existing script JSON (omit when using --topic)")
    parser.add_argument("--topic", help="generate a new script with Gemini, e.g. 'What if rent was free?'")
    parser.add_argument("--minutes", type=float, help="target length for --topic (default 15 for life, 12 for disaster, else 8)")
    parser.add_argument("--lang", choices=sorted(LANGS), default="en", help="language for --topic (default en)")
    parser.add_argument("--friend", help="sidekick name for --topic (default Milo, or Tùng for vi)")
    parser.add_argument("--tts", choices=["kokoro", "edge", "gemini"], help="voice engine for --topic (default per language)")
    # Flash-Lite passed validation but invented facts and broke the math in tests; Flash kept them right.
    # Each Flash model has its own ~20/day free quota, so falling back across three triples it.
    parser.add_argument("--model", default="gemini-3.5-flash,gemini-3.6-flash,gemini-3.8-flash",
                        help="Gemini model(s) for --topic, comma-separated fallback order")
    parser.add_argument("--format", choices=sorted(PROMPTS), default="whatif", help="channel format for --topic (default whatif)")
    parser.add_argument("--topics-file", help="one topic per line: write a script for each (skipping ones already written), no render")
    parser.add_argument("--script-only", action="store_true", help="with --topic: stop after saving the script")
    # In tests Flash-Lite reached the length this way but narrated the outline ("Real fact check:", "The final
    # scene settles the wager") and invented sources, so the default Flash models stay the recommended path.
    parser.add_argument("--chunked", action="store_true", help="write an outline, then one chapter per call (for Flash-Lite, which writes short replies)")
    parser.add_argument("--no-render", action="store_true", help="stop after voices and manifest")
    args = parser.parse_args()
    if args.minutes is None:
        args.minutes = 15 if args.format == "life" else 12 if args.format == "disaster" else 8
    if sum(map(bool, (args.script, args.topic, args.topics_file))) != 1:
        parser.error("give exactly one of: a script path, --topic or --topics-file")

    def script_path_for(topic):
        # ASCII file name even for Vietnamese topics ("Nếu đồng" -> "neu-dong").
        ascii_topic = unicodedata.normalize("NFD", topic.lower().replace("đ", "d")).encode("ascii", "ignore").decode()
        return ROOT / "scripts" / args.format / f"{re.sub(r'[^a-z0-9]+', '-', ascii_topic).strip('-')[:40]}.json"

    def write_script(topic, path):
        script = generate_script(topic, args.minutes, args.friend or LANGS[args.lang]["friend"], args.model, args.lang, args.format, args.chunked)
        if args.tts == "gemini":
            script.update({"tts": "gemini", "voice": "Charon", "friendVoice": "Puck"})
        elif args.tts:
            script["tts"] = args.tts
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(script, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"script saved: {path.relative_to(ROOT)} (review it before publishing)")
        return script

    if args.topics_file:
        topics = [t.strip() for t in Path(args.topics_file).read_text(encoding="utf-8").splitlines() if t.strip()]
        failed = []
        for n, topic in enumerate(topics, 1):
            path = script_path_for(topic)
            if path.exists():
                continue  # resumable: rerun the same command after quota errors
            print(f"[{n}/{len(topics)}] {topic}")
            try:
                write_script(topic, path)
            except (SystemExit, ValueError, KeyError) as e:  # one bad topic must not stop the batch
                print(f"  failed: {e}")
                failed.append(topic)
                if str(e).startswith("every model"):
                    break  # all quotas are spent or Gemini is down: later topics would fail too
        print(f"done: {len(topics) - len(failed)}/{len(topics)} scripts; failed: {failed or 'none'}")
        return

    if args.topic:
        script_path = script_path_for(args.topic)
        script = write_script(args.topic, script_path)
        if args.script_only:
            return
    else:
        script_path = Path(args.script)
        script = json.loads(script_path.read_text(encoding="utf-8"))
        validate(script)
        validate_unique_faces(script, script_path)
    cast = resolve_cast(script.get("cast", {}))  # fail on missing face images before any voice work
    missing_bgs = sorted({s["bg"] for s in script["scenes"] if not bg_ready(s["bg"])})
    if missing_bgs:
        raise SystemExit(f"missing backgrounds {missing_bgs}: run batch.py, which lists them in out/bg_todo.md")

    episode = script_path.stem
    out_dir = ROOT / "public" / episode
    out_dir.mkdir(parents=True, exist_ok=True)

    write_sfx(ROOT / "public" / "sfx")
    lang = LANGS[script.get("lang", "en")]
    engine = script.get("tts", lang["tts"])
    styles = script.get("ttsStyle", TTS_STYLE[script.get("lang", "en")]) if engine == "gemini" else {}
    scenes = []
    # Each character keeps their pose, face and held prop across cuts until an action changes it.
    state = {who: {"pose": "idle", "expression": "neutral", "hold": None, "face": "right"} for who in ("you", "friend")}
    chapters_meta = sorted(script.get("meta", {}).get("chapters", []), key=lambda c: c.get("scene", 0))
    print(f"Processing {len(script['scenes'])} scenes for {episode} (engine: {engine})...", flush=True)
    for i, scene in enumerate(script["scenes"]):
        speaker = scene.get("speaker", "narrator")
        voice = script.get("friendVoice", lang["friendVoice"]) if speaker == "friend" else script.get("voice", lang["voice"])
        active_mood = "calm"
        for ch in chapters_meta:
            if ch.get("scene", 0) <= i and ch.get("mood"):
                active_mood = ch["mood"]
        rate, pitch, pad_seconds, gain = _scene_prosody(scene, active_mood)
        wav = out_dir / f"scene_{i}.wav"
        if wav.exists() and wav.stat().st_size > 1000:
            audio, _ = sf.read(wav, dtype="float32")
        else:
            audio = synth(scene["text"], voice, engine, styles.get(speaker, ""), rate=rate, pitch=pitch, pad_seconds=pad_seconds, gain=gain)
            sf.write(wav, audio, SAMPLE_RATE)
            time.sleep(1.2)
        frames = math.ceil(len(audio) / SAMPLE_RATE * FPS)
        speech_frames = max(1, frames - int(pad_seconds * FPS))
        word_at = word_frames(audio, scene["text"], script.get("lang", "en"), speech_frames)
        display_words = scene["text"].split()
        if word_at and len(word_at) == len(display_words):
            scene_words = [{"word": w, "at": f} for w, f in zip(display_words, word_at)]
        elif display_words:
            n_words = len(display_words)
            n_at = len(word_at) if word_at else 0
            scene_words = [{"word": w, "at": word_at[min(int(i / n_words * n_at), n_at - 1)] if n_at else int(i / n_words * speech_frames)} for i, w in enumerate(display_words)]
        else:
            scene_words = []
        icons = timed(scene, scene.get("icons", []), word_at, "Icon")
        callouts = timed(scene, scene.get("callouts", []), word_at, "Callout")
        actions = timed(scene, scene_actions(scene), word_at, "Action")
        quote = timed(scene, [scene["quote"]], word_at, "Quote")[0] if scene.get("quote") else None
        vision = None
        if scene.get("vision"):
            v = timed(scene, [scene["vision"]], word_at, "Vision")[0]
            vision = {"src": vision_file(v["image"]), "at": v["at"]}
        paper = None
        if scene.get("paper"):
            # The paper and its correction trigger in order, like icons.
            timed_paper = timed(scene, [scene["paper"]] + ([scene["paper"]["fix"]] if scene["paper"].get("fix") else []), word_at, "Paper")
            paper = {**timed_paper[0], **({"fix": timed_paper[1]} if len(timed_paper) > 1 else {})}
        doc = None
        if scene.get("doc"):
            doc = timed(scene, [scene["doc"]], word_at, "Doc")[0] if scene["doc"].get("word") else dict(scene["doc"])
        scene_sfx = []
        if scene.get("sfx"):
            timed_sfx = timed(scene, scene["sfx"], word_at, "SFX")
            scene_sfx.extend([{"sound": s["sound"], "at": s["at"], "volume": s.get("volume", 0.35)} for s in timed_sfx])
        for a in actions:
            if a.get("expression") == "shock" and not any(s["sound"] in ("boom", "thunder", "explosion") for s in scene_sfx):
                scene_sfx.append({"sound": "boom", "at": a["at"], "volume": 0.32})
            elif a.get("hold") in ("money", "gold", "briefcase") and not any(s["sound"] in ("cash", "coin") for s in scene_sfx):
                scene_sfx.append({"sound": "cash", "at": a["at"], "volume": 0.28})
            elif a.get("hold") in ("hazard", "radiation", "siren") and not any(s["sound"] in ("alarm", "glitch") for s in scene_sfx):
                scene_sfx.append({"sound": "alarm", "at": a["at"], "volume": 0.30})
            elif a.get("hold") in ("wrench", "gear") and not any(s["sound"] in ("thud", "creak") for s in scene_sfx):
                scene_sfx.append({"sound": "creak", "at": a["at"], "volume": 0.25})
        # looks: {"you": "hetty-green-young"} swaps a head for this scene (aging); same files as cast faces.
        looks = {who: f for who, f in ((w, resolve_cast({w: {"face": name}})[w].get("faces")) for w, name in scene.get("looks", {}).items()) if f}
        start_state = {who: dict(s) for who, s in state.items()}
        for a in actions:
            state[a["who"]].update({k: a[k] for k in ("pose", "expression", "hold", "face") if k in a})
        # How to enter this scene: same place and time -> hard cut, new counter label -> time jump, else new place.
        prev = script["scenes"][i - 1] if i else None
        label = (scene.get("counter") or {}).get("label")
        prev_label = ((prev or {}).get("counter") or {}).get("label")
        transition = None if prev is None else "cut" if prev["bg"] == scene["bg"] and prev_label == label else "time" if prev_label != label else "place"
        scenes.append({
            **scene,
            "transition": transition,
            "icons": icons,
            "callouts": callouts,
            "actions": actions,
            **({"quote": quote} if quote else {}),
            **({"paper": paper} if paper else {}),
            **({"doc": doc} if doc else {}),
            **({"vision": vision} if vision else {}),
            "looks": looks,  # always replaces the script's face names with resolved files
            "start": start_state,
            "sfx": scene_sfx,
            "audio": f"{episode}/{wav.name}",
            "frames": frames,
            "mouth": mouth_track(audio, frames),
            "words": scene_words,
        })
        print(f"[{i + 1}/{len(script['scenes'])}] scene {i}: {frames / FPS:.1f}s - {scene['text'][:40]}", flush=True)

    # Burned-in captions and the corner counter are off by default, like the reference channel;
    # "captions": true / "showCounter": true in a script turn them back on. The .srt goes to YouTube CC.
    manifest = {"title": script["title"], "fps": FPS,
                "captionWords": lang["captionWords"] if script.get("captions") else (script.get("captionWords") or 4),
                "captionStyle": script.get("captionStyle", "kinetic"),
                "showCounter": script.get("showCounter", False),
                "iconStyle": script.get("iconStyle", "panel"), "cast": cast, "scenes": scenes,
                "music": music_tracks(script, scenes),
                "meta": script.get("meta", {})}
    if not (ROOT / "public" / "music" / "bed.wav").exists():
        write_music(ROOT / "public" / "music" / "bed.wav")
    for track in manifest["music"]:
        if not (ROOT / "public" / track["src"]).exists():
            raise SystemExit(f"music file public/{track['src']} not found")
        # Audio Library tracks range from -11 to -15 LUFS; bring each to the synthesized bed's level so the
        # mix under the voice stays the same whatever track plays.
        track["gain"] = round(10 ** ((MUSIC_LUFS - float(measure_loudness(ROOT / "public" / track["src"])["input_i"])) / 20), 3)
    (ROOT / "public" / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (ROOT / "out").mkdir(exist_ok=True)
    (ROOT / "out" / f"{episode}.srt").write_text(srt(scenes, lang["captionWords"] * 2), encoding="utf-8")
    (ROOT / "out" / f"{episode}_youtube.txt").write_text(youtube_pack(script, scenes), encoding="utf-8")
    audit_monetization(script, scenes)

    if not args.no_render:
        remotion_bin = str(ROOT / "node_modules" / ".bin" / "remotion.cmd") if sys.platform == "win32" and (ROOT / "node_modules" / ".bin" / "remotion.cmd").exists() else "npx"
        render_cmd = [remotion_bin, "render", "src/index.ts", "Episode", f"out/{episode}.mp4"] if remotion_bin != "npx" else ["npx", "remotion", "render", "src/index.ts", "Episode", f"out/{episode}.mp4"]
        subprocess.run(
            render_cmd,
            cwd=ROOT, check=True, shell=sys.platform == "win32",
        )
        loudnorm(ROOT / "out" / f"{episode}.mp4")

        thumb_cmd = [remotion_bin, "still", "src/index.ts", "Thumbnail", f"out/{episode}_thumb.png"] if remotion_bin != "npx" else ["npx", "remotion", "still", "src/index.ts", "Thumbnail", f"out/{episode}_thumb.png"]
        try:
            subprocess.run(thumb_cmd, cwd=ROOT, check=False, shell=sys.platform == "win32")
            print(f"thumbnail: out/{episode}_thumb.png")
        except Exception as e:
            print(f"warning: thumbnail render skipped: {e}")


MOODS = ("tense", "calm", "mystery", "triumph", "sad")


def music_tracks(script, scenes):
    """[{"from": frame, "src": path}]: one track per run of chapters with the same mood (meta.chapters[].mood
    -> public/music/<mood>.mp3, e.g. from the YouTube Audio Library), else the script's single "music"
    (default the synthesized bed). "music": null turns music off. Episode.tsx crossfades between tracks."""
    default_single = "music/calm.mp3" if (ROOT / "public" / "music" / "calm.mp3").exists() else "music/bed.wav"
    single = script.get("music", default_single)
    if single is None:
        return []
    starts = [0]
    for i, s in enumerate(scenes[1:], 1):
        starts.append(starts[-1] + scenes[i - 1]["frames"] - (0 if s["transition"] == "cut" else TRANSITION_FRAMES))
    tracks = []
    for c in script.get("meta", {}).get("chapters", []):
        mood = c.get("mood")
        if mood is None:
            continue
        if mood not in MOODS:
            raise SystemExit(f"chapter {c.get('title')!r}: mood {mood!r} is not one of {MOODS}")
        src = f"music/{mood}.mp3"
        if not (ROOT / "public" / src).exists():
            print(f"warning: public/{src} missing; chapter {c.get('title')!r} keeps the previous music")
            src = tracks[-1]["src"] if tracks else single
        if not tracks or tracks[-1]["src"] != src:
            tracks.append({"from": 0 if not tracks else starts[c["scene"]], "src": src})
    return tracks or [{"from": 0, "src": single}]


# Remotion ships an ffmpeg with loudnorm; fall back to one on PATH.
FFMPEG = next((str(p) for p in ROOT.glob("node_modules/@remotion/compositor-*/ffmpeg*")), "ffmpeg")
LOUDNESS = "I=-14:TP=-1.5:LRA=11"  # YouTube plays at about -14 LUFS
MUSIC_LUFS = -20  # the synthesized bed.wav's level, which MUSIC_VOLUME in Episode.tsx was tuned against
_run = lambda *a: subprocess.run([FFMPEG, "-hide_banner", *a], capture_output=True, text=True, check=True).stderr


def measure_loudness(path):
    """First loudnorm pass: input loudness stats of any audio/video file."""
    log = _run("-i", str(path), "-vn", "-af", f"loudnorm={LOUDNESS}:print_format=json", "-f", "null", "-")
    return json.loads(log[log.rindex("{"):log.rindex("}") + 1])


def loudnorm(mp4):
    """YouTube turns loud videos down but never quiet ones up: two-pass loudnorm to -14 LUFS, video stream copied."""
    run = _run
    m = measure_loudness(mp4)
    af = (f"loudnorm={LOUDNESS}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    tmp = mp4.with_suffix(".norm.mp4")
    run("-y", "-i", str(mp4), "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "320k", str(tmp))
    tmp.replace(mp4)
    print(f"loudness: {m['input_i']} LUFS -> {LOUDNESS.split(':')[0][2:]} LUFS")


TRANSITION_FRAMES = 12  # matches Episode.tsx: scenes overlap this much unless the transition is a hard cut


def srt(scenes, per_cue):
    """YouTube CC file: each scene's speech split into cues of `per_cue` words, spread evenly over it."""
    def ts(frame):
        ms = round(frame * 1000 / FPS)
        return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"

    cues, start = [], 0
    for i, s in enumerate(scenes):
        if i:
            start += scenes[i - 1]["frames"] - (0 if s["transition"] == "cut" else TRANSITION_FRAMES)
        words = s["text"].split()
        groups = [words[j:j + per_cue] for j in range(0, len(words), per_cue)]
        speech = s["frames"] - int(PAD_SECONDS * FPS)
        for g, chunk in enumerate(groups):
            a = start + speech * g // len(groups)
            b = start + speech * (g + 1) // len(groups)
            cues.append(f"{len(cues) + 1}\n{ts(a)} --> {ts(b)}\n{' '.join(chunk)}\n")
    return "\n".join(cues)


def audit_monetization(script, scenes=None):
    """Print non-fatal CTR, watch-time, and YPP 'Inauthentic Content' readiness warnings."""
    warnings = []
    lang_code = script.get("lang", "en")
    rate = LANGS.get(lang_code, LANGS["en"])["rate"]
    words = count_words(script.get("scenes", []))
    if scenes:
        total_frames = sum(s["frames"] - (0 if i == 0 or s.get("transition") == "cut" else TRANSITION_FRAMES) for i, s in enumerate(scenes))
        minutes = total_frames / FPS / 60
    else:
        minutes = words / rate

    if minutes < 8.0:
        warnings.append(f"Duration is ~{minutes:.1f} min (< 8.0 min): mid-roll ads disabled; expand to 10-14 min (~1,550+ words) for 4,000h watch-time velocity.")
    title = script.get("title", "")
    if title and title == title.upper() and any(c.isalpha() for c in title):
        warnings.append("Title is ALL CAPS: switch to natural Title Case (matches high-CTR documentary channels).")

    raw_scenes = script.get("scenes", [])
    diagrams = [s["diagram"] for s in raw_scenes if isinstance(s.get("diagram"), dict)]
    docs = [s["doc"] for s in raw_scenes if isinstance(s.get("doc"), dict)]
    if len(diagrams) + len(docs) < 4:
        warnings.append(f"Only {len(diagrams)} diagrams + {len(docs)} doc cards: add 6-12 episode-specific visuals to avoid YPP 'templated/inauthentic content' flags.")
    generic_flow = sum(1 for d in diagrams if d.get("type") in ("data_flow", "code_crash") and not d.get("nodes"))
    if generic_flow:
        warnings.append(f"{generic_flow} data_flow/code_crash diagram(s) lack custom 'nodes' and will fall back to CrowdStrike defaults.")

    thumb = script.get("meta", {}).get("thumbnail", {})
    thumb_words = len((thumb.get("title", "") + " " + thumb.get("subtitle", "") + " " + thumb.get("stat", "")).split())
    if thumb_words > 6:
        warnings.append(f"Thumbnail text has {thumb_words} words (> 6): trim to 2-4 punchy words for mobile legibility.")

    print(f"[Monetization Audit] words={words} | est_duration={minutes:.1f}m | diagrams={len(diagrams)} | docs={len(docs)} | thumb_words={thumb_words}")
    for w in warnings:
        print(f"  [WARN] {w}")
    return warnings


def youtube_pack(script, scenes):
    """Build ready-to-paste YouTube metadata (Title, Description, exact MM:SS Chapters, Pinned Comment)."""
    meta = script.get("meta", {})
    starts = [0]
    for i, s in enumerate(scenes[1:], 1):
        starts.append(starts[-1] + scenes[i - 1]["frames"] - (0 if s.get("transition") == "cut" else TRANSITION_FRAMES))

    def fmt_ts(frame):
        sec = max(0, round(frame / FPS))
        return f"{sec // 60:02d}:{sec % 60:02d}"

    chapters = []
    for c in meta.get("chapters", []):
        idx = c.get("scene", 0)
        if 0 <= idx < len(starts):
            chapters.append(f"{fmt_ts(starts[idx])} {c.get('title', 'Chapter')}")
    if not chapters:
        chapters.append("00:00 Introduction")

    desc = meta.get("description", "").strip()
    facts = meta.get("factCheck")
    sources_block = ""
    if isinstance(facts, list) and facts:
        sources_block = "\n\nSources & Verification:\n" + "\n".join(f"- {f}" for f in facts)
    elif isinstance(facts, dict) and facts:
        sources_block = "\n\nSources & Verification:\n" + "\n".join(f"- {k}: {v}" for k, v in facts.items())

    lines = [
        f"TITLE:\n{script.get('title', '')}",
        "",
        "DESCRIPTION:",
        desc + sources_block,
        "",
        "CHAPTERS:",
        *chapters,
        "",
        "PINNED COMMENT:",
        "Which single failure in this chain surprised you most — the hidden legacy flaw or the panic fix? Let me know below.",
        "",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    main()
