#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env.prod ]; then
  echo "Missing .env.prod. Copy .env.prod.example to .env.prod and set production values." >&2
  exit 1
fi

docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml --env-file .env.prod up -d --build
