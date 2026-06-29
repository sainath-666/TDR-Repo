#!/usr/bin/env bash
# Run Cerbos PDP without Docker (Linux / WSL / macOS)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/.bin"
VER="0.38.1"
ARCH="Linux_x86_64"
URL="https://github.com/cerbos/cerbos/releases/download/v${VER}/cerbos_${VER}_${ARCH}.tar.gz"

mkdir -p "$BIN" "$ROOT/cerbos/cerbos_logs"

if [ ! -x "$BIN/cerbos" ]; then
  echo "Downloading Cerbos ${VER}..."
  curl -fsSL "$URL" -o "$BIN/cerbos.tgz"
  tar -xzf "$BIN/cerbos.tgz" -C "$BIN" cerbos
  chmod +x "$BIN/cerbos"
fi

echo "Starting Cerbos PDP on :3592 (HTTP) :3593 (gRPC)..."
cd "$ROOT/cerbos"
exec "$BIN/cerbos" server --config=./config.local.yaml
