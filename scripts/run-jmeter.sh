#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p docs/qa-evidence/jmeter

API_BASE="${BASE_URL:-http://localhost:8080}"
KEYCLOAK_BASE="${KEYCLOAK_URL:-http://localhost:8081}"
USERNAME="${JMETER_USERNAME:-viewer}"
PASSWORD="${JMETER_PASSWORD:-viewer123}"

if command -v jmeter >/dev/null 2>&1; then
  jmeter -n -t tests/performance/jmeter/inventory-load.jmx \
    -l docs/qa-evidence/jmeter/results.jtl \
    -e -o docs/qa-evidence/jmeter/report \
    -JapiBase="$API_BASE" \
    -JkeycloakBase="$KEYCLOAK_BASE" \
    -Jusername="$USERNAME" \
    -Jpassword="$PASSWORD"
  exit $?
fi

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$ROOT:/work" \
  -w /work \
  justb4/jmeter:5.6.3 \
  -n -t tests/performance/jmeter/inventory-load.jmx \
  -l docs/qa-evidence/jmeter/results.jtl \
  -e -o docs/qa-evidence/jmeter/report \
  -JapiBase="$API_BASE" \
  -JkeycloakBase="$KEYCLOAK_BASE" \
  -Jusername="$USERNAME" \
  -Jpassword="$PASSWORD"
