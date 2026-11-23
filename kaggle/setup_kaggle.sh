#!/bin/bash
set -e

echo "=== [1/4] Installing Node.js 20, FFmpeg & Chromium dependencies ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs ffmpeg libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2

echo "=== [2/4] Installing Python dependencies ==="
pip install -q "kokoro>=0.9.4" faster-whisper soundfile edge-tts pillow numpy

echo "=== [3/4] Installing Node packages ==="
npm install

echo "=== [4/4] Ensuring Remotion Chromium Browser ==="
npx remotion browser ensure

echo "=== Environment Ready for Rendering! ==="
