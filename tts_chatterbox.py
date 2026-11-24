"""Standalone Chatterbox voice-cloning narrator for DocuEngine (24kHz mono float32 WAV)."""
import json
from pathlib import Path
import sys
import numpy as np
import soundfile as sf
import torch
from chatterbox.tts import ChatterboxTTS

TARGET_SR = 24000


def prepare_ref_wav(src: Path, dest: Path) -> None:
    audio, sr = sf.read(str(src), dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if sr != TARGET_SR:
        new_len = int(len(audio) * TARGET_SR / sr)
        audio = np.interp(np.linspace(0, len(audio) - 1, new_len), np.arange(len(audio)), audio).astype(np.float32)
    dest.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(dest), audio, TARGET_SR)


def synthesize(ref_wav: Path, blocks: list[str], device: str) -> np.ndarray:
    print(f"[chatterbox] Loading model on device={device} ({len(blocks)} blocks)...")
    model = ChatterboxTTS.from_pretrained(device=device)
    breath = np.zeros(int(0.25 * TARGET_SR), dtype=np.float32)
    tail = np.zeros(int(2.0 * TARGET_SR), dtype=np.float32)
    chunks = []
    for idx, text in enumerate(blocks, 1):
        print(f"[chatterbox] Block {idx}/{len(blocks)}: {text[:55]}...")
        wav = model.generate(
            text.strip(),
            audio_prompt_path=str(ref_wav),
            exaggeration=0.45,
            cfg_weight=0.5,
        )
        arr = wav.squeeze().detach().cpu().numpy().astype(np.float32)
        if model.sr != TARGET_SR:
            new_len = int(len(arr) * TARGET_SR / model.sr)
            arr = np.interp(np.linspace(0, len(arr) - 1, new_len), np.arange(len(arr)), arr).astype(np.float32)
        chunks.append(arr)
        chunks.append(tail if idx == len(blocks) else breath)
    return np.concatenate(chunks)


def main():
    if len(sys.argv) != 4:
        raise SystemExit("Usage: tts_chatterbox.py <ref_audio> <blocks_json> <out_wav>")
    ref_src = Path(sys.argv[1])
    blocks_path = Path(sys.argv[2])
    out_wav = Path(sys.argv[3])

    blocks = json.loads(blocks_path.read_text(encoding="utf-8"))
    ref_wav = out_wav.parent / "_chatterbox_ref.wav"
    prepare_ref_wav(ref_src, ref_wav)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    try:
        audio = synthesize(ref_wav, blocks, device)
    except (torch.cuda.OutOfMemoryError, RuntimeError) as err:
        if device == "cuda" and ("out of memory" in str(err).lower() or isinstance(err, torch.cuda.OutOfMemoryError)):
            print(f"[chatterbox] CUDA OOM ({err}); retrying on cpu...")
            torch.cuda.empty_cache()
            audio = synthesize(ref_wav, blocks, "cpu")
        else:
            raise

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(out_wav), audio, TARGET_SR)
    print(f"[chatterbox] Saved narration: {out_wav} ({len(audio) / TARGET_SR:.2f}s @ {TARGET_SR}Hz)")


if __name__ == "__main__":
    main()
