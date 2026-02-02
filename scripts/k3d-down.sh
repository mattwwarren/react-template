#!/usr/bin/env bash
set -euo pipefail

# Source .env if it exists (for CLUSTER_NAME override)
if [ -f .env ]; then
  set -a; source .env; set +a
fi

cluster_name="${CLUSTER_NAME:-react_template}"

if ! command -v k3d >/dev/null 2>&1; then
  echo "k3d is required but not installed." >&2
  exit 1
fi

k3d cluster delete "${cluster_name}"
