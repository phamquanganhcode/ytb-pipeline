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
echo "Using Python: $PY ($($PY --version))"
"$PY" -m pip install -q "kokoro>=0.9.4" faster-whisper soundfile edge-tts pillow numpy
"$PY" -c "import kokoro, faster_whisper, soundfile, PIL; print('Python deps OK!')"

echo "=== [3/4] Installing Node packages ==="
npm install --no-audit --no-fund

echo "=== [4/4] Ensuring Remotion Chromium Browser ==="
npx remotion browser ensure

echo "=== Environment Ready for Rendering! ==="
