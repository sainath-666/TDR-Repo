#!/usr/bin/env bash
# Wipe Fabric ledger state and bootstrap a fresh channel + chaincode.
# Usage: bash fabric/scripts/reset-network.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NETWORK_DIR="$ROOT/fabric/network"
CHANNEL_NAME="${FABRIC_CHANNEL_NAME:-tdr-channel}"
CC_SEQUENCE="${FABRIC_CHAINCODE_SEQUENCE:-1}"

echo "=== APCRDA TDR — Fabric ledger reset ==="

cd "$NETWORK_DIR"

echo "=== Stopping Fabric containers ==="
docker compose down --remove-orphans 2>/dev/null || true

echo "=== Removing chaincode containers ==="
docker ps -aq --filter 'name=tdr-bond-cc' | xargs -r docker rm -f

echo "=== Removing ledger volumes ==="
for vol in network_peer0_data network_orderer_data; do
  docker volume rm -f "$vol" 2>/dev/null || true
done
for vol in $(docker volume ls -q | grep -E 'peer0_data|orderer_data'); do
  docker volume rm -f "$vol" 2>/dev/null || true
done

echo "=== Removing channel join block (ledger will be recreated) ==="
rm -f "$NETWORK_DIR/channel-artifacts/${CHANNEL_NAME}.block"

bash "$ROOT/fabric/scripts/install-peercfg.sh"

echo "=== Bootstrapping fresh network ==="
bash "$ROOT/fabric/scripts/bootstrap.sh"

echo "=== Deploying chaincode (sequence ${CC_SEQUENCE}) ==="
FABRIC_CHAINCODE_SEQUENCE="${CC_SEQUENCE}" bash "$ROOT/fabric/scripts/deploy-chaincode.sh"

echo ""
echo "✓ Fabric ledger reset complete — empty channel with fresh chaincode"
