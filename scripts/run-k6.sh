#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="${K6_SCRIPT_PATH:-tests/performance/k6/load-api.js}"
SUMMARY_PATH="${K6_SUMMARY_PATH:-docs/qa-evidence/k6-load-summary.txt}"
SUMMARY_FULL_PATH="${ROOT}/${SUMMARY_PATH}"

mkdir -p "$(dirname "${SUMMARY_FULL_PATH}")"

if command -v k6 >/dev/null 2>&1; then
  echo "Running k6 from local installation"
  k6 run "${ROOT}/${SCRIPT_PATH}" 2>&1 | tee "${SUMMARY_FULL_PATH}"
  exit "${PIPESTATUS[0]}"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "SKIP: k6 and Docker are not available. Performance test was not executed."
  exit 0
fi

echo "Running k6 with Docker"
docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -e BASE_URL="${BASE_URL:-http://host.docker.internal:8080}" \
  -e KEYCLOAK_URL="${KEYCLOAK_URL:-http://host.docker.internal:8081}" \
  -e K6_USERNAME="${K6_USERNAME:-}" \
  -e K6_PASSWORD="${K6_PASSWORD:-}" \
  -v "${ROOT}:/work" \
  -w /work \
  grafana/k6:0.54.0 run "${SCRIPT_PATH}" 2>&1 | tee "${SUMMARY_FULL_PATH}"
exit "${PIPESTATUS[0]}"
