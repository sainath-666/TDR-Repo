#!/usr/bin/env bash
# Deploy tdr-bond-cc chaincode to tdr-channel (Fabric 2.5 lifecycle)
set -euo pipefail

CHANNEL_NAME="${FABRIC_CHANNEL_NAME:-tdr-channel}"
CC_NAME="${FABRIC_CHAINCODE_NAME:-tdr-bond-cc}"
CC_VERSION="${FABRIC_CHAINCODE_VERSION:-1.0}"
CC_SEQUENCE="${FABRIC_CHAINCODE_SEQUENCE:-1}"
CC_LABEL="${CC_NAME}_${CC_VERSION}"
CC_SRC_PATH="/opt/chaincode/tdr-bond-cc"

NETWORK_DIR="$(cd "$(dirname "$0")/../network" && pwd)"
cd "$NETWORK_DIR"

ORDERER_CA="/etc/hyperledger/fabric/crypto-config/ordererOrganizations/apcrda/orderers/orderer.apcrda/msp/tlscacerts/tlsca.apcrda-cert.pem"
PEER_TLS_CA="/etc/hyperledger/fabric/crypto-config/peerOrganizations/apcrda/peers/peer0.apcrda/tls/ca.crt"

peer_cmd() {
  docker compose exec -T cli peer "$@"
}

echo "=== Packaging chaincode ${CC_NAME} ==="
peer_cmd lifecycle chaincode package "${CC_NAME}.tar.gz" \
  --path "${CC_SRC_PATH}" \
  --lang node \
  --label "${CC_LABEL}"

echo "=== Installing chaincode on peer0 ==="
peer_cmd lifecycle chaincode install "${CC_NAME}.tar.gz"

PACKAGE_ID="$(peer_cmd lifecycle chaincode queryinstalled | grep "Label: ${CC_LABEL}" | sed -n 's/^Package ID: \(.*\), Label:.*/\1/p' | head -1)"
if [ -z "$PACKAGE_ID" ]; then
  echo "ERROR: Could not resolve package ID for ${CC_LABEL}"
  peer_cmd lifecycle chaincode queryinstalled
  exit 1
fi
echo "Package ID: ${PACKAGE_ID}"

echo "=== Approving chaincode for APCRDAMSP ==="
peer_cmd lifecycle chaincode approveformyorg \
  -o orderer.apcrda:7050 \
  --channelID "${CHANNEL_NAME}" \
  --name "${CC_NAME}" \
  --version "${CC_VERSION}" \
  --package-id "${PACKAGE_ID}" \
  --sequence "${CC_SEQUENCE}" \
  --tls \
  --cafile "${ORDERER_CA}" \
  --peerAddresses peer0.apcrda:7051 \
  --tlsRootCertFiles "${PEER_TLS_CA}"

echo "=== Checking commit readiness ==="
peer_cmd lifecycle chaincode checkcommitreadiness \
  --channelID "${CHANNEL_NAME}" \
  --name "${CC_NAME}" \
  --version "${CC_VERSION}" \
  --sequence "${CC_SEQUENCE}" \
  --output json

echo "=== Committing chaincode ==="
peer_cmd lifecycle chaincode commit \
  -o orderer.apcrda:7050 \
  --channelID "${CHANNEL_NAME}" \
  --name "${CC_NAME}" \
  --version "${CC_VERSION}" \
  --sequence "${CC_SEQUENCE}" \
  --tls \
  --cafile "${ORDERER_CA}" \
  --peerAddresses peer0.apcrda:7051 \
  --tlsRootCertFiles "${PEER_TLS_CA}"

echo "=== Verifying chaincode ==="
peer_cmd lifecycle chaincode querycommitted --channelID "${CHANNEL_NAME}" --name "${CC_NAME}"

echo "✓ Chaincode ${CC_NAME} deployed on ${CHANNEL_NAME}"
