#!/usr/bin/env bash

# Bash "strict mode"
set -euo pipefail

cleanup() {
  echo "done with backup script"
}

# TODO: create a backup of the server
echo "starting backup!"

trap cleanup EXIT
