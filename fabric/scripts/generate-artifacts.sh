#!/usr/bin/env bash
# Generate crypto material + genesis block + channel tx (Docker-based, no local Fabric binaries)
set -euo pipefail

NETWORK_DIR="$(cd "$(dirname "$0")/../network" && pwd)"
cd "$NETWORK_DIR"

mkdir -p channel-artifacts crypto-config wallet/admin

echo "=== Generating Fabric crypto material ==="
docker run --rm \
  -v "${NETWORK_DIR}:/data" \
  -w /data \
  hyperledger/fabric-tools:2.5 \
  cryptogen generate --config=./crypto-config.yaml --output="crypto-config"

# cryptogen runs as root in the container — fix ownership so wallet copy and peer mounts work
if command -v sudo >/dev/null 2>&1; then
  sudo chown -R "$(id -u):$(id -g)" crypto-config channel-artifacts 2>/dev/null || true
fi
chmod -R u+rwX crypto-config 2>/dev/null || true

echo "=== Generating genesis block + channel transaction ==="
docker run --rm \
  -v "${NETWORK_DIR}:/data" \
  -w /data \
  -e FABRIC_CFG_PATH=/data \
  hyperledger/fabric-tools:2.5 \
  configtxgen -profile APCRDAGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

docker run --rm \
  -v "${NETWORK_DIR}:/data" \
  -w /data \
  -e FABRIC_CFG_PATH=/data \
  hyperledger/fabric-tools:2.5 \
  configtxgen -profile TDRChannel -outputCreateChannelTx ./channel-artifacts/tdr-channel.tx -channelID tdr-channel

# Copy Admin identity to wallet for the Node.js Gateway
ADMIN_CERT="$(find crypto-config/peerOrganizations/apcrda/users/Admin@apcrda/msp/signcerts -name '*.pem' | head -1)"
ADMIN_KEY="$(find crypto-config/peerOrganizations/apcrda/users/Admin@apcrda/msp/keystore -name '*_sk' | head -1)"

cp "$ADMIN_CERT" wallet/admin/cert.pem
cp "$ADMIN_KEY" wallet/admin/key.pem

echo "✓ Artifacts ready in fabric/network/"
echo "  wallet/admin/cert.pem"
echo "  wallet/admin/key.pem"
