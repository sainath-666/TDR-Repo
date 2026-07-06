#!/usr/bin/env bash
# Generate a full Fabric peer core.yaml (required for BCCSP); customize for APCRDA.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PEERCFG="$ROOT/fabric/network/peercfg/core.yaml"

mkdir -p "$(dirname "$PEERCFG")"
docker run --rm hyperledger/fabric-peer:2.5 cat /etc/hyperledger/fabric/core.yaml >"$PEERCFG"

sed -i \
  -e 's/id: jdoe/id: peer0.apcrda/' \
  -e 's/networkId: dev/networkId: apcrda-tdr/' \
  -e 's/address: 0.0.0.0:7051/address: peer0.apcrda:7051/' \
  -e 's/localMspId: SampleOrg/localMspId: APCRDAMSP/' \
  "$PEERCFG"

echo "✓ Wrote $PEERCFG"
