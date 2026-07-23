#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_URL="${SCHEMATHESIS_SCHEMA_URL:-http://host.docker.internal:8080/v3/api-docs}"
REPORT_PATH="${SCHEMATHESIS_REPORT_PATH:-docs/qa-evidence/schemathesis-report.txt}"
REPORT_FULL_PATH="${ROOT}/${REPORT_PATH}"
KEYCLOAK_URL="${SCHEMATHESIS_KEYCLOAK_URL:-http://localhost:8081}"
TOKEN="${SCHEMATHESIS_TOKEN:-}"

if ! command -v docker >/dev/null 2>&1; then
  echo "SKIP: Docker is not available. Schemathesis was not executed."
  exit 0
fi

mkdir -p "$(dirname "${REPORT_FULL_PATH}")"
if [[ -z "${TOKEN}" ]]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "ERROR: jq is required to obtain the Schemathesis access token."
    exit 1
  fi
  TOKEN="$(curl -fsS -X POST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'grant_type=password' \
    --data-urlencode 'client_id=inventory-frontend' \
    --data-urlencode "username=${SCHEMATHESIS_USERNAME:-admin}" \
    --data-urlencode "password=${SCHEMATHESIS_PASSWORD:-admin123}" \
    --data-urlencode 'scope=openid profile email product:view product:manage stock:view stock:manage report:view user:manage audit:view' \
    "${KEYCLOAK_URL}/realms/inventory-realm/protocol/openid-connect/token" | jq -er '.access_token')"
fi
echo "Running Schemathesis against ${SCHEMA_URL}"
docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  schemathesis/schemathesis:stable \
  run "${SCHEMA_URL}" \
  --header "Authorization: Bearer ${TOKEN}" \
  --phases coverage,fuzzing \
  --checks not_a_server_error \
  --exclude-path-regex '^/api/v1/demo/errors/' \
  --generation-with-security-parameters=false \
  --generation-deterministic \
  --suppress-health-check=filter_too_much \
  --request-retries=2 \
  --max-examples=20 \
  --no-color 2>&1 | tee "${REPORT_FULL_PATH}"
exit "${PIPESTATUS[0]}"
