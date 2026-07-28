#!/bin/sh
set -eu

normalize_https() {
  value=$1
  case "$value" in
    http://*|https://*) echo "$value" ;;
    "") echo "" ;;
    *) echo "https://$value" ;;
  esac
}

# Render inyecta PORT (tipico 10000). Spring tarda 1-3 min en free tier.
# Si abrimos $PORT con socat crudo, Render hace healthcheck a /actuator/health
# mientras 8080 aun no escucha → Connection refused / pending eterno.
# Solucion: cloud-port-gate.py responde 200 en /actuator/health durante el boot
# y luego hace proxy a Spring en INTERNAL_PORT.
PUBLIC_PORT="${PORT:-10000}"
INTERNAL_PORT="${INTERNAL_PORT:-8080}"
export PORT="$PUBLIC_PORT"
export INTERNAL_PORT
export SERVER_PORT="$INTERNAL_PORT"

# Railway/Render deliver postgres:// or postgresql:// — Spring needs jdbc:postgresql://
if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    postgres://*|postgresql://*)
      without_scheme=${DATABASE_URL#*://}
      userinfo=${without_scheme%%@*}
      hostpath=${without_scheme#*@}
      user=${userinfo%%:*}
      pass=${userinfo#*:}
      hostport=${hostpath%%/*}
      dbpath=${hostpath#*/}
      dbname=${dbpath%%\?*}
      query=
      case "$dbpath" in
        *\?*) query="?${dbpath#*\?}" ;;
      esac
      export DATABASE_URL="jdbc:postgresql://${hostport}/${dbname}${query}"
      export DATABASE_USERNAME="${DATABASE_USERNAME:-$user}"
      export DATABASE_PASSWORD="${DATABASE_PASSWORD:-$pass}"
      ;;
  esac
fi

if [ -n "${KEYCLOAK_PUBLIC_URL:-}" ]; then
  base=$(normalize_https "$KEYCLOAK_PUBLIC_URL" | sed 's:/*$::')
  export KEYCLOAK_PUBLIC_URL="$base"
  export KEYCLOAK_ISSUER_URI="${KEYCLOAK_ISSUER_URI:-${base}/realms/inventory-realm}"
  export KEYCLOAK_JWKS_URI="${KEYCLOAK_JWKS_URI:-${base}/realms/inventory-realm/protocol/openid-connect/certs}"
  export KEYCLOAK_ADMIN_URL="${KEYCLOAK_ADMIN_URL:-$base}"
fi

echo "Port gate: 0.0.0.0:${PUBLIC_PORT} -> 127.0.0.1:${INTERNAL_PORT} (Spring)"
echo "Issuer: ${KEYCLOAK_ISSUER_URI:-unset}"

python3 /app/cloud-port-gate.py &
GATE_PID=$!

cleanup() {
  kill "$GATE_PID" 2>/dev/null || true
  if [ -n "${JAVA_PID:-}" ]; then
    kill "$JAVA_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

java ${JAVA_OPTS:--Xms64m -Xmx384m -XX:+UseG1GC} \
  -Dserver.address=127.0.0.1 \
  -Dserver.port="${INTERNAL_PORT}" \
  -jar /app/app.jar &
JAVA_PID=$!

# Prefer the JVM as the main process status; if it dies, container exits.
wait "$JAVA_PID"
EXIT_CODE=$?
cleanup
exit "$EXIT_CODE"
