#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Levantando stack staging..."
docker compose \
  -f docker-compose.dev.yml \
  -f docker-compose.observability.yml \
  -f docker-compose.staging.yml \
  up -d --build

echo "Esperando servicios..."
sleep 90

chmod +x scripts/post-deploy-smoke.sh
./scripts/post-deploy-smoke.sh
