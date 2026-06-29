#!/usr/bin/env bash
# Start Postgres + Cerbos (Docker) and the Next.js app on Ubuntu/Linux.
# Usage: npm run dev:ubuntu   OR   bash scripts/start-ubuntu.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== APCRDA TDR — Ubuntu dev stack (Supabase auth + Cerbos authorization) ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed. Install: https://docs.docker.com/engine/install/ubuntu/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running. Try: sudo systemctl start docker"
  exit 1
fi

# Prefer .env.local, fall back to .env
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: Copy .env.example to .env.local and fill in Supabase keys"
  exit 1
fi

# Ensure real Cerbos authorization (not mock)
if grep -q '^CERBOS_MOCK_MODE=true' "$ENV_FILE" 2>/dev/null; then
  sed -i 's/^CERBOS_MOCK_MODE=true/CERBOS_MOCK_MODE=false/' "$ENV_FILE"
  echo "✓ Set CERBOS_MOCK_MODE=false in $ENV_FILE"
fi

if ! grep -q '^CERBOS_MOCK_MODE=false' "$ENV_FILE" 2>/dev/null; then
  echo "CERBOS_MOCK_MODE=false" >> "$ENV_FILE"
  echo "✓ Appended CERBOS_MOCK_MODE=false to $ENV_FILE"
fi

echo ""
echo "[1/5] Starting PostgreSQL + Cerbos PDP..."
docker compose up postgres cerbos -d

echo "[2/5] Waiting for Cerbos health (gRPC :3593, HTTP :3592)..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3592/_cerbos/health >/dev/null 2>&1; then
    echo "✓ Cerbos PDP is healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Cerbos did not become healthy. Check: docker compose logs cerbos"
    exit 1
  fi
  sleep 2
done

echo "[3/5] Compiling Cerbos policies..."
docker run --rm \
  -v "$ROOT/cerbos/policies:/policies" \
  -v "$ROOT/cerbos/tests:/tests" \
  ghcr.io/cerbos/cerbos:0.38.0 compile /policies --tests=/tests

echo "[4/5] Database schema sync..."
if command -v npm >/dev/null 2>&1; then
  npx prisma db push --skip-generate 2>/dev/null || echo "  (skip db push — run manually if needed)"
fi

echo ""
echo "[5/5] Starting Next.js (Cerbos authorization ENABLED)..."
echo "  Cerbos admin:  http://localhost:3592"
echo "  App:           http://localhost:3000"
echo "  Login:         http://localhost:3000/official-login"
echo ""

export CERBOS_MOCK_MODE=false
export CERBOS_PDP_URL=localhost:3593
exec npm run dev
