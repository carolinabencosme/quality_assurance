#!/bin/sh
set -eu

# Render inyecta PORT. Keycloak tarda minutos en bindear HTTP (build/providers/DB).
# Abrimos $PORT al instante con cloud-port-gate.py (health `/` = 200) y Keycloak
# escucha en INTERNAL_PORT; cuando responde HTTP, el gate hace proxy.
PUBLIC_PORT="${PORT:-10000}"
INTERNAL_PORT="${INTERNAL_PORT:-8080}"
export PORT="$PUBLIC_PORT"
export INTERNAL_PORT
export KC_HTTP_PORT="$INTERNAL_PORT"
export KC_HTTP_HOST="0.0.0.0"

normalize_jdbc() {
  value=$1
  case "$value" in
    postgres://*|postgresql://*)
      without_scheme=${value#*://}
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
      echo "jdbc:postgresql://${hostport}/${dbname}${query}"
      export KC_DB_USERNAME="${KC_DB_USERNAME:-$user}"
      export KC_DB_PASSWORD="${KC_DB_PASSWORD:-$pass}"
      ;;
    *)
      echo "$value"
      ;;
  esac
}

if [ -n "${KC_DB_URL:-}" ]; then
  export KC_DB_URL="$(normalize_jdbc "$KC_DB_URL")"
  export KC_DB="${KC_DB:-postgres}"
elif [ -n "${DATABASE_URL:-}" ]; then
  export KC_DB_URL="$(normalize_jdbc "$DATABASE_URL")"
  export KC_DB="${KC_DB:-postgres}"
fi

echo "Port gate: 0.0.0.0:${PUBLIC_PORT} -> 127.0.0.1:${INTERNAL_PORT} (Keycloak)"
echo "Starting Keycloak optimized on ${INTERNAL_PORT} (db=${KC_DB:-dev-file})"

python3 /opt/keycloak/cloud-port-gate.py &
GATE_PID=$!

cleanup() {
  kill "$GATE_PID" 2>/dev/null || true
  if [ -n "${KC_PID:-}" ]; then
    kill "$KC_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# --optimized: imagen ya hizo `kc.sh build --db=postgres` (mucho mas rapido que start-dev).
# --import-realm: importa realm-export.json si el realm no existe.
/opt/keycloak/bin/kc.sh start \
  --optimized \
  --import-realm \
  --http-port="${INTERNAL_PORT}" \
  --http-host=0.0.0.0 \
  --hostname-strict=false &
KC_PID=$!

wait "$KC_PID"
EXIT_CODE=$?
cleanup
exit "$EXIT_CODE"
