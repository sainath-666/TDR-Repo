#!/usr/bin/env bash
# No-Docker dev stack (Windows Git Bash / WSL without Docker).
# Same as dev:ubuntu — auto-detects no Docker and uses local Cerbos + mock Fabric.
exec "$(cd "$(dirname "$0")" && pwd)/start-ubuntu.sh"
