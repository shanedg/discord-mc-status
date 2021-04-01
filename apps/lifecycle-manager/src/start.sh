#!/usr/bin/env bash

# Bash "strict mode"
set -euo pipefail

cleanup() {
  echo "done with start script"
}

# TODO: start local server
echo "starting local server!"

/Users/shanegarrity/dev-minecraft/localserver/start.sh > /dev/null 2>&1

trap cleanup EXIT
