#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${ZAP_TARGET:-http://localhost:3000}"
REPORT_PATH="${ZAP_REPORT_PATH:-docs/qa-evidence/zap-report.html}"
REPORT_FULL_PATH="${ROOT}/${REPORT_PATH}"
REPORT_DIR="$(dirname "${REPORT_FULL_PATH}")"
REPORT_NAME="$(basename "${REPORT_FULL_PATH}")"

if ! command -v docker >/dev/null 2>&1; then
  echo "SKIP: Docker is not available. ZAP baseline was not executed."
  exit 0
fi

mkdir -p "${REPORT_DIR}"
echo "Running OWASP ZAP baseline against ${TARGET}"
docker run --rm \
  -v "${REPORT_DIR}:/zap/wrk" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "${TARGET}" -r "${REPORT_NAME}" -I

echo "ZAP report generated at ${REPORT_PATH}"
