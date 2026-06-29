#!/usr/bin/env bash
# Bootstrap local Hyperledger Fabric network (Ubuntu / WSL with Docker)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NETWORK_DIR="$ROOT/fabric/network"
CHANNEL_NAME="${FABRIC_CHANNEL_NAME:-tdr-channel}"

echo "=== APCRDA TDR — Fabric local network ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required for Fabric (peers run in containers)."
  echo "  Ubuntu: https://docs.docker.com/engine/install/ubuntu/"
  echo "  WSL2: enable Docker Desktop WSL integration or install docker.io in WSL"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running."
  exit 1
fi

cd "$NETWORK_DIR"

# Generate crypto + channel artifacts if missing
if [ ! -f channel-artifacts/genesis.block ] || [ ! -f wallet/admin/cert.pem ]; then
  bash "$ROOT/fabric/scripts/generate-artifacts.sh"
fi

echo "=== Starting Fabric orderer + peer + cli ==="
docker compose up -d orderer.apcrda peer0.apcrda cli

echo "=== Waiting for peer to start ==="
for i in $(seq 1 30); do
  if curl -sf http://localhost:9443/healthz >/dev/null 2>&1; then
    echo "✓ peer0.apcrda healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "WARN: peer health check timed out — continuing anyway"
  fi
  sleep 2
done

ORDERER_CA="/etc/hyperledger/fabric/crypto-config/ordererOrganizations/apcrda/orderers/orderer.apcrda/msp/tlscacerts/tlsca.apcrda-cert.pem"

peer_cmd() {
  docker compose exec -T cli peer "$@"
}

# Create channel if not exists
if ! peer_cmd channel list 2>/dev/null | grep -q "${CHANNEL_NAME}"; then
  echo "=== Creating channel ${CHANNEL_NAME} ==="
  peer_cmd channel create \
    -o orderer.apcrda:7050 \
    -c "${CHANNEL_NAME}" \
    -f "./channel-artifacts/${CHANNEL_NAME}.tx" \
    --outputBlock "./channel-artifacts/${CHANNEL_NAME}.block" \
    --tls \
    --cafile "${ORDERER_CA}"

  echo "=== Joining peer to channel ==="
  peer_cmd channel join -b "./channel-artifacts/${CHANNEL_NAME}.block"
else
  echo "✓ Channel ${CHANNEL_NAME} already exists"
fi

# Deploy chaincode if not committed
if ! peer_cmd lifecycle chaincode querycommitted --channelID "${CHANNEL_NAME}" 2>/dev/null | grep -q "tdr-bond-cc"; then
  bash "$ROOT/fabric/scripts/deploy-chaincode.sh"
else
  echo "✓ Chaincode tdr-bond-cc already committed"
fi

echo ""
echo "=== Fabric network ready ==="
echo "  Peer gRPC:   localhost:7051"
echo "  Peer health: http://localhost:9443/healthz"
echo "  Channel:     ${CHANNEL_NAME}"
echo ""
echo "Add to .env / .env.local:"
echo "  FABRIC_MOCK_MODE=false"
echo "  FABRIC_PEER_ENDPOINT=localhost:7051"
echo "  FABRIC_TLS_HOSTNAME=peer0.apcrda"
echo "  FABRIC_MSP_ID=APCRDAMSP"
echo "  FABRIC_CHANNEL_NAME=${CHANNEL_NAME}"
echo "  FABRIC_CHAINCODE_NAME=tdr-bond-cc"
echo "  FABRIC_CERT_PATH=./fabric/network/wallet/admin/cert.pem"
echo "  FABRIC_KEY_PATH=./fabric/network/wallet/admin/key.pem"
echo "  FABRIC_TLS_CERT_PATH=./fabric/network/crypto-config/peerOrganizations/apcrda/peers/peer0.apcrda/tls/ca.crt"
echo ""
echo "Then restart Next.js: npm run dev"
