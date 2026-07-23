#!/usr/bin/env bash
# Post-deploy smoke — Fase 6 (QA-8)
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8080}"
KEYCLOAK_BASE="${KEYCLOAK_BASE:-http://localhost:8081}"
FRONTEND_BASE="${FRONTEND_BASE:-http://localhost:3000}"
GRAFANA_BASE="${GRAFANA_BASE:-http://localhost:3030}"
PROMETHEUS_BASE="${PROMETHEUS_BASE:-http://localhost:9090}"
MAX_WAIT="${SMOKE_MAX_WAIT:-180}"

echo "=== Post-deploy smoke (Inventory QAS) ==="

wait_http() {
  local url="$1"
  local name="$2"
  local elapsed=0
  while [ "$elapsed" -lt "$MAX_WAIT" ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "OK  $name"
      return 0
    fi
    sleep 5
    elapsed=$((elapsed + 5))
  done
  echo "FAIL $name — timeout ${MAX_WAIT}s ($url)"
  return 1
}

wait_http "$API_BASE/actuator/health" "Backend health"
wait_http "$FRONTEND_BASE" "Frontend"
wait_http "$KEYCLOAK_BASE/realms/inventory-realm" "Keycloak realm"
wait_http "$GRAFANA_BASE/api/health" "Grafana"
wait_http "$PROMETHEUS_BASE/-/healthy" "Prometheus"

echo "=== Auth + API protegida ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/v1/products")
if [ "$HTTP_CODE" = "401" ]; then
  echo "OK  API sin token -> 401"
else
  echo "FAIL API sin token -> $HTTP_CODE (esperado 401)"
  exit 1
fi

TOKEN=$(curl -sf -X POST "$KEYCLOAK_BASE/realms/inventory-realm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=inventory-frontend&username=viewer&password=viewer123" \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "FAIL No se obtuvo token de Keycloak"
  exit 1
fi
echo "OK  Token Keycloak"

DASH_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/api/v1/reports/dashboard")
if [ "$DASH_CODE" = "200" ]; then
  echo "OK  Dashboard API -> 200"
else
  echo "FAIL Dashboard API -> $DASH_CODE"
  exit 1
fi

ADMIN_TOKEN=$(curl -sf -X POST "$KEYCLOAK_BASE/realms/inventory-realm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=inventory-frontend&username=admin&password=admin123&scope=openid profile email product:view product:manage stock:view stock:manage report:view user:manage audit:view" \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

python - "$ADMIN_TOKEN" <<'PY'
import base64
import json
import sys

token = sys.argv[1]
payload = token.split(".")[1]
payload += "=" * (-len(payload) % 4)
data = json.loads(base64.urlsafe_b64decode(payload.encode()))
scopes = set(data.get("scope", "").split())
required = {"product:view", "stock:manage", "report:view", "user:manage", "audit:view"}
missing = sorted(required - scopes)
if missing:
    raise SystemExit(f"Admin token missing scopes: {', '.join(missing)}")
PY
echo "OK  Admin token includes business scopes"

USERS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_BASE/api/v1/users")
if [ "$USERS_CODE" = "200" ]; then
  echo "OK  Users API -> 200"
else
  echo "FAIL Users API -> $USERS_CODE"
  exit 1
fi

if curl -sf "$PROMETHEUS_BASE/api/v1/query?query=up%7Bjob%3D%22inventory-api%22%7D" >/dev/null; then
  echo "OK  Prometheus query inventory-api"
else
  echo "FAIL Prometheus query inventory-api"
  exit 1
fi

if [ "${RUN_OBSERVABILITY_SMOKE:-true}" = "true" ]; then
  if [ -f tests/observability/smoke.ps1 ] && command -v pwsh >/dev/null 2>&1; then
    pwsh -File tests/observability/smoke.ps1 || true
  elif curl -sf "http://localhost:9090/-/healthy" >/dev/null 2>&1; then
    echo "OK  Prometheus healthy"
  fi
fi

echo "=== Post-deploy smoke: PASS ==="
