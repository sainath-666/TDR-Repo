#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

echo "=== APCRDA TDR Production Setup ==="

# ── 1. Environment file ───────────────────────────────────────────────────────
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  echo "Created .env.production from template — edit it with real secrets before continuing."
  echo "Generate secrets: openssl rand -hex 32"
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env.production && set +a

for var in POSTGRES_PASSWORD HMAC_SECRET AADHAAR_ENCRYPTION_KEY NEXT_PUBLIC_SUPABASE_URL; do
  if [ -z "${!var:-}" ] || [[ "${!var}" == *"change-me"* ]] || [[ "${!var}" == *"replace-with"* ]]; then
    echo "ERROR: $var must be set to a real value in .env.production"
    exit 1
  fi
done

# ── 2. TLS certificates ───────────────────────────────────────────────────────
if [ ! -f deploy/nginx/ssl/tdr.crt ] || [ ! -f deploy/nginx/ssl/tdr.key ]; then
  echo "WARNING: TLS certs not found at deploy/nginx/ssl/tdr.{crt,key}"
  echo "         Place your APCRDA SSL certificate before going live."
  echo "         For local testing only, generate a self-signed cert:"
  echo "           openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
  echo "             -keyout deploy/nginx/ssl/tdr.key -out deploy/nginx/ssl/tdr.crt \\"
  echo "             -subj '/CN=tdr.apcrda.ap.gov.in'"
fi

# ── 3. Pre-launch checks ──────────────────────────────────────────────────────
echo "[1/4] Cerbos policy compile..."
docker run --rm \
  -v "$(pwd)/cerbos/policies:/policies" \
  ghcr.io/cerbos/cerbos:0.38.0 compile --tests /policies

echo "[2/4] Building production image..."
$COMPOSE build app

echo "[3/4] Starting stack..."
$COMPOSE up -d

echo "[4/4] Waiting for health checks..."
for i in $(seq 1 30); do
  if curl -sf http://localhost/api/health -k >/dev/null 2>&1 \
    || curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "Stack is healthy."
    $COMPOSE ps
    echo ""
    echo "=== Production deployment complete ==="
    echo "HTTPS: https://tdr.apcrda.ap.gov.in (configure DNS to point here)"
    echo "Logs:  $COMPOSE logs -f app"
    exit 0
  fi
  sleep 5
done

echo "WARNING: Health check did not pass within 150s. Check logs:"
echo "  $COMPOSE logs app postgres cerbos"
exit 1
