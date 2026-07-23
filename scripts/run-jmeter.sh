#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p docs/qa-evidence/jmeter
rm -rf docs/qa-evidence/jmeter/results.jtl docs/qa-evidence/jmeter/report

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
else
  DOCKER_API_BASE="${API_BASE/localhost/host.docker.internal}"
  DOCKER_API_BASE="${DOCKER_API_BASE/127.0.0.1/host.docker.internal}"
  DOCKER_KEYCLOAK_BASE="${KEYCLOAK_BASE/localhost/host.docker.internal}"
  DOCKER_KEYCLOAK_BASE="${DOCKER_KEYCLOAK_BASE/127.0.0.1/host.docker.internal}"
  docker run --rm \
    --add-host=host.docker.internal:host-gateway \
    -v "$ROOT:/work" \
    -w /work \
    alpine/jmeter:5.6.3 \
    -n -t tests/performance/jmeter/inventory-load.jmx \
    -l docs/qa-evidence/jmeter/results.jtl \
    -e -o docs/qa-evidence/jmeter/report \
    -JapiBase="$DOCKER_API_BASE" \
    -JkeycloakBase="$DOCKER_KEYCLOAK_BASE" \
    -Jusername="$USERNAME" \
    -Jpassword="$PASSWORD"
fi

python3 - docs/qa-evidence/jmeter/results.jtl docs/qa-evidence/jmeter-summary.txt <<'PY'
import csv
import datetime
import pathlib
import sys

results_path = pathlib.Path(sys.argv[1])
summary_path = pathlib.Path(sys.argv[2])
with results_path.open(newline="", encoding="utf-8") as handle:
    rows = list(csv.DictReader(handle))
failures = sum(row.get("success") != "true" for row in rows)
elapsed = [int(row["elapsed"]) for row in rows]
average = round(sum(elapsed) / len(elapsed), 2) if elapsed else 0
maximum = max(elapsed, default=0)
generated_at = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
summary_path.write_text(
    "JMeter 5.6.3 live summary\n"
    f"Generated at: {generated_at}\n"
    f"Samples: {len(rows)}\n"
    f"Failures: {failures}\n"
    f"Average response time: {average} ms\n"
    f"Maximum response time: {maximum} ms\n"
    "Raw HTML report (local/CI artifact, not committed): docs/qa-evidence/jmeter/report/index.html\n",
    encoding="utf-8",
)
if not rows or failures:
    raise SystemExit(f"JMeter gate failed: samples={len(rows)} failures={failures}")
print(f"OK: JMeter samples={len(rows)} failures=0 average={average}ms max={maximum}ms")
PY
