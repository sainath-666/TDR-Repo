#!/usr/bin/env bash
# Start Hyperledger Fabric locally (Ubuntu / WSL — requires Docker)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bash "$ROOT/fabric/scripts/bootstrap.sh"
