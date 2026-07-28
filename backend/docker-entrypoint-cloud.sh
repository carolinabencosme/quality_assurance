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

# Render inyecta PORT (tipico 10000). Si Spring tarda ~2-3 min en bindear,
# Render ve "No open ports", luego "New primary port detected" y REINICIA el
# deploy — el segundo boot suele hacer Timed Out.
# Solucion: abrir $PORT al instante con socat y dejar Spring en 8080 interno.
PUBLIC_PORT="${PORT:-10000}"
INTERNAL_PORT="${INTERNAL_PORT:-8080}"
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

echo "Port proxy: 0.0.0.0:${PUBLIC_PORT} -> 127.0.0.1:${INTERNAL_PORT} (Spring)"
echo "Issuer: ${KEYCLOAK_ISSUER_URI:-unset}"

# Bind publico YA (evita reinicio de Render por late port detection).
socat TCP-LISTEN:"${PUBLIC_PORT}",fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:"${INTERNAL_PORT}" &
SOCAT_PID=$!

cleanup() {
  kill "$SOCAT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

exec java ${JAVA_OPTS:--Xms128m -Xmx400m} \
  -Dserver.address=0.0.0.0 \
  -Dserver.port="${INTERNAL_PORT}" \
  -jar /app/app.jar
