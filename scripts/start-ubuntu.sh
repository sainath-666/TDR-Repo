#!/usr/bin/env bash
# Start dev stack on Ubuntu / WSL / Git Bash (Windows).
# With Docker:    Postgres + Cerbos + Fabric containers
# Without Docker: local Cerbos binary + your existing Postgres (Fabric stays mock)
#
# Usage: npm run dev:ubuntu   OR   npm run dev:local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== APCRDA TDR — dev stack ==="

# Prefer .env.local, fall back to .env
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: Copy .env.example to .env.local and fill in Supabase keys"
  exit 1
fi

# Portable in-place sed (GNU Linux / Git Bash vs macOS)
sed_inplace() {
  local pattern=$1
  local file=$2
  if [[ "${OSTYPE:-}" == darwin* ]]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

HAS_DOCKER=false
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  HAS_DOCKER=true
fi

if [ "$HAS_DOCKER" = true ]; then
  echo "Mode: Docker (Postgres + Cerbos + Fabric)"
else
  echo "Mode: Local — no Docker detected"
  echo "  • Cerbos: local binary (like npm run cerbos:local)"
  echo "  • Postgres: must already be running (localhost:5432)"
  echo "  • Fabric: mock mode — install Docker for real blockchain"
  echo ""
fi

# Ensure real Cerbos authorization (not mock)
if grep -q '^CERBOS_MOCK_MODE=true' "$ENV_FILE" 2>/dev/null; then
  sed_inplace 's/^CERBOS_MOCK_MODE=true/CERBOS_MOCK_MODE=false/' "$ENV_FILE"
  echo "✓ Set CERBOS_MOCK_MODE=false in $ENV_FILE"
fi

if ! grep -q '^CERBOS_MOCK_MODE=false' "$ENV_FILE" 2>/dev/null; then
  echo "CERBOS_MOCK_MODE=false" >> "$ENV_FILE"
  echo "✓ Appended CERBOS_MOCK_MODE=false to $ENV_FILE"
fi

wait_for_cerbos() {
  for i in $(seq 1 30); do
    if curl -sf http://localhost:3592/_cerbos/health >/dev/null 2>&1; then
      echo "✓ Cerbos PDP is healthy"
      return 0
    fi
    sleep 2
  done
  echo "ERROR: Cerbos did not become healthy on :3592"
  return 1
}

compile_cerbos_policies() {
  echo "Compiling Cerbos policies..."
  if [ -x "$ROOT/.bin/cerbos" ]; then
    "$ROOT/.bin/cerbos" compile "$ROOT/cerbos/policies" --tests="$ROOT/cerbos/tests"
  elif [ "$HAS_DOCKER" = true ]; then
    docker run --rm \
      -v "$ROOT/cerbos/policies:/policies" \
      -v "$ROOT/cerbos/tests:/tests" \
      ghcr.io/cerbos/cerbos:0.38.0 compile /policies --tests=/tests
  else
    echo "  (skip — run npm run cerbos:local once to download the Cerbos binary)"
  fi
}

check_postgres() {
  if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -q -h localhost -p 5432 2>/dev/null; then
      echo "✓ PostgreSQL is reachable on localhost:5432"
      return 0
    fi
  fi
  if command -v nc >/dev/null 2>&1 && nc -z localhost 5432 2>/dev/null; then
    echo "✓ PostgreSQL port 5432 is open"
    return 0
  fi
  echo "WARN: Cannot verify Postgres — ensure DATABASE_URL in $ENV_FILE is correct"
  return 0
}

start_cerbos_local() {
  if curl -sf http://localhost:3592/_cerbos/health >/dev/null 2>&1; then
    echo "✓ Cerbos already running"
    return 0
  fi
  echo "Starting Cerbos (local binary)..."
  bash "$ROOT/scripts/start-cerbos-local.sh" &
  wait_for_cerbos
}

export CERBOS_MOCK_MODE=false
export CERBOS_PDP_URL=localhost:3593

if [ "$HAS_DOCKER" = true ]; then
  if grep -q '^FABRIC_MOCK_MODE=true' "$ENV_FILE" 2>/dev/null; then
    sed_inplace 's/^FABRIC_MOCK_MODE=true/FABRIC_MOCK_MODE=false/' "$ENV_FILE"
    echo "✓ Set FABRIC_MOCK_MODE=false in $ENV_FILE"
  fi
  export FABRIC_MOCK_MODE=false

  echo ""
  echo "[1/6] Starting PostgreSQL + Cerbos (Docker)..."
  docker compose up postgres cerbos -d

  echo "[2/6] Waiting for Cerbos..."
  wait_for_cerbos

  echo "[3/6] Compiling Cerbos policies..."
  compile_cerbos_policies

  echo "[4/6] Starting Hyperledger Fabric..."
  bash "$ROOT/fabric/scripts/bootstrap.sh"

  echo "[5/6] Database schema sync..."
  npx prisma db push --skip-generate 2>/dev/null || echo "  (skip db push — run manually if needed)"

  echo ""
  echo "[6/6] Starting Next.js (Cerbos + Fabric enabled)..."
  echo "  Cerbos:  http://localhost:3592"
  echo "  Fabric:  localhost:7051"
  echo "  App:     http://localhost:3000"
else
  export FABRIC_MOCK_MODE=true

  echo ""
  echo "[1/4] Checking PostgreSQL..."
  check_postgres

  echo "[2/4] Starting Cerbos (no Docker)..."
  start_cerbos_local

  echo "[3/4] Compiling Cerbos policies..."
  compile_cerbos_policies

  echo "[4/4] Database schema sync..."
  npx prisma db push --skip-generate 2>/dev/null || echo "  (skip db push — run manually if needed)"

  echo ""
  echo "Starting Next.js (Cerbos real, Fabric mock)..."
  echo "  Cerbos:  http://localhost:3592"
  echo "  App:     http://localhost:3000"
  echo ""
  echo "For real Fabric later: install Docker, then npm run fabric:local"
fi

echo "  Login:   http://localhost:3000/official-login"
echo ""

exec npm run dev
