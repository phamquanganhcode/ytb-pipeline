#!/bin/bash
set -e

echo "=== [1/4] Installing Node.js 20, FFmpeg, espeak-ng & Chromium deps ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi
apt-get install -y -qq ffmpeg espeak-ng libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2
apt-get install -y -qq libasound2t64 || apt-get install -y -qq libasound2 || true

echo "Node: $(node -v) | NPM: $(npm -v) | FFmpeg: $(ffmpeg -version | head -n1)"

echo "=== [2/4] Installing Python dependencies ==="
PY="${PYTHON_BIN:-$(which python3)}"
echo "System Python: $PY ($($PY --version))"
if "$PY" -c "import sys; exit(0 if sys.version_info < (3, 13) else 1)"; then
  TARGET_PY="$PY"
  "$TARGET_PY" -m pip install -q faster-whisper soundfile edge-tts pillow numpy "kokoro>=0.9.4"
else
  echo "Python 3.13+ detected: provisioning Python 3.12 venv at /tmp/py312 for Kokoro TTS..."
  "$PY" -m pip install -q uv
  "$PY" -m uv venv /tmp/py312 --python 3.12 --seed
  TARGET_PY="/tmp/py312/bin/python"
  if command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi >/dev/null 2>&1; then
    "$PY" -m uv pip install --python "$TARGET_PY" torch
  else
    "$PY" -m uv pip install --python "$TARGET_PY" --index-url https://download.pytorch.org/whl/cpu torch
  fi
  "$PY" -m uv pip install --python "$TARGET_PY" \
    faster-whisper soundfile edge-tts pillow numpy "kokoro>=0.9.4" \
    https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
fi
"$TARGET_PY" -c "import faster_whisper, soundfile, edge_tts, PIL, kokoro; print('Python + Kokoro deps OK!')"

echo "=== [3/4] Installing Node packages ==="
npm install --no-audit --no-fund

echo "=== [4/4] Ensuring Remotion Chromium Browser ==="
npx remotion browser ensure

echo "=== Environment Ready for Rendering! ==="
