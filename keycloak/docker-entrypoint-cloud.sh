#!/bin/sh
set -eu

# Render inyecta PORT (p.ej. 10000). Keycloak debe escuchar ahi en 0.0.0.0.
HTTP_PORT="${PORT:-${KC_HTTP_PORT:-8080}}"
export KC_HTTP_PORT="$HTTP_PORT"

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
      # Keycloak espera jdbc:postgresql://...
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

echo "Starting Keycloak on 0.0.0.0:${HTTP_PORT} (db=${KC_DB:-dev-file})"

exec /opt/keycloak/bin/kc.sh start-dev \
  --import-realm \
  --http-port="${HTTP_PORT}" \
  --hostname-strict=false
