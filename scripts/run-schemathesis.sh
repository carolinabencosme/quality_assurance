#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_URL="${SCHEMATHESIS_SCHEMA_URL:-http://localhost:8080/v3/api-docs}"
REPORT_PATH="${SCHEMATHESIS_REPORT_PATH:-docs/qa-evidence/schemathesis-report.txt}"
REPORT_FULL_PATH="${ROOT}/${REPORT_PATH}"

if ! command -v docker >/dev/null 2>&1; then
  echo "SKIP: Docker is not available. Schemathesis was not executed."
  exit 0
fi

mkdir -p "$(dirname "${REPORT_FULL_PATH}")"
echo "Running Schemathesis against ${SCHEMA_URL}"
docker run --rm schemathesis/schemathesis:stable \
  run "${SCHEMA_URL}" --checks all --hypothesis-max-examples=50 2>&1 | tee "${REPORT_FULL_PATH}"
exit "${PIPESTATUS[0]}"
