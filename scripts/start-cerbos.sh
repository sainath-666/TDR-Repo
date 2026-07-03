#!/usr/bin/env bash
# Start Cerbos locally (Linux/macOS/Git Bash). Windows: npm run cerbos:start
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="0.53.0"
BIN_DIR="$ROOT/.bin"
CERBOS_BIN="$BIN_DIR/cerbos"
CONFIG="$ROOT/cerbos/config.local.yaml"

if curl -sf http://localhost:3592/_cerbos/health >/dev/null 2>&1; then
  echo "Cerbos already running on :3592"
  exit 0
fi

mkdir -p "$BIN_DIR" cerbos_logs

if [ ! -x "$CERBOS_BIN" ]; then
  echo "Downloading Cerbos v$VERSION..."
  OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64|amd64) ARCH="x86_64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) echo "Unsupported arch: $ARCH"; exit 1 ;;
  esac
  case "$OS" in
    linux)  PLATFORM="Linux" ;;
    darwin) PLATFORM="Darwin" ;;
    *) echo "Unsupported OS: $OS"; exit 1 ;;
  esac
  ZIP="cerbos_${VERSION}_${PLATFORM}_${ARCH}.tar.gz"
  URL="https://github.com/cerbos/cerbos/releases/download/v${VERSION}/${ZIP}"
  curl -fsSL "$URL" | tar -xz -C "$BIN_DIR"
  chmod +x "$CERBOS_BIN" 2>/dev/null || chmod +x "$BIN_DIR"/cerbos*
  if [ ! -x "$CERBOS_BIN" ]; then
  CERBOS_BIN="$(find "$BIN_DIR" -name cerbos -type f | head -1)"
  chmod +x "$CERBOS_BIN"
  fi
fi

echo "Compiling policies..."
"$CERBOS_BIN" compile cerbos/policies

echo ""
echo "Starting Cerbos on http://localhost:3592 (gRPC :3593)"
echo "Keep this terminal open. In another: npm run dev"
echo ""
exec "$CERBOS_BIN" server --config="$CONFIG"
