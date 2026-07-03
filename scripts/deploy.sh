#!/usr/bin/env bash
# Deploy APCRDA TDR on Linux VM.
# Usage: npm run deploy   OR   bash scripts/deploy.sh [--seed]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.vm.yml --env-file .env.production"
RUN_SEED=false

for arg in "$@"; do
  case "$arg" in
    --seed) RUN_SEED=true ;;
    -h|--help)
      echo "Usage: bash scripts/deploy.sh [--seed]"
      exit 0
      ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

echo "=== APCRDA TDR — Deploy ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Install Docker, or run: sudo bash scripts/deploy.sh"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running."
  exit 1
fi

if [ ! -f .env.production ]; then
  echo "ERROR: Create .env.production first (see DEPLOY.md)"
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env.production && set +a

for var in POSTGRES_PASSWORD HMAC_SECRET AADHAAR_ENCRYPTION_KEY NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  if [ -z "${!var:-}" ] || [[ "${!var}" == *"change-me"* ]] || [[ "${!var}" == *"your-"* ]]; then
    echo "ERROR: Set a real value for $var in .env.production"
    exit 1
  fi
done

if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp || true
fi

echo "[1/3] Validating Cerbos policies..."
docker run --rm -v "$(pwd)/cerbos/policies:/policies" \
  ghcr.io/cerbos/cerbos:0.38.0 compile /policies

echo "[2/3] Building and starting stack..."
$COMPOSE up -d --build

echo "[3/3] Waiting for health check..."
VM_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
for i in $(seq 1 36); do
  if curl -sf "http://localhost/api/health" >/dev/null 2>&1; then
    echo ""
    echo "=== Deploy complete ==="
    $COMPOSE ps
    echo ""
    echo "App:    http://${VM_IP:-localhost}/"
    echo "Health: curl http://localhost/api/health"
    echo "Logs:   npm run deploy:logs"
    break
  fi
  sleep 5
  if [ "$i" -eq 36 ]; then
    echo "Health check failed. Run: npm run deploy:logs"
    exit 1
  fi
done

if [ "$RUN_SEED" = true ]; then
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB:-apcrda_tdr}"
  if command -v node >/dev/null 2>&1; then
    [ ! -d node_modules ] && npm ci
    npx prisma db seed
    echo "Database seeded."
  else
    echo "Install Node 20 to seed: npx prisma db seed"
  fi
fi
