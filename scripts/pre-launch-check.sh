#!/usr/bin/env bash
set -euo pipefail

echo "=== APCRDA TDR Pre-Launch Check ==="

echo "[1/5] TypeScript..."
npx tsc --noEmit

echo "[2/5] Cerbos policy tests..."
docker run --rm \
  -v "$(pwd)/cerbos/policies:/policies" \
  -v "$(pwd)/cerbos/tests:/tests" \
  ghcr.io/cerbos/cerbos:0.38.0 compile /policies --tests=/tests

echo "[3/5] Environment variables..."
required=(DATABASE_URL NEXT_PUBLIC_SUPABASE_URL HMAC_SECRET AADHAAR_ENCRYPTION_KEY)
for var in "${required[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "WARNING: $var is not set"
  fi
done

echo "[4/5] Unit tests..."
npm test

echo "[5/5] Build..."
npm run build

echo "=== Pre-launch check complete ==="
