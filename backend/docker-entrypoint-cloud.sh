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

# Render inyecta PORT; Spring Boot lee SERVER_PORT (no PORT).
export SERVER_PORT="${PORT:-${SERVER_PORT:-8080}}"

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

echo "Starting inventory-api on 0.0.0.0:${SERVER_PORT}"
echo "Issuer: ${KEYCLOAK_ISSUER_URI:-unset}"

exec java ${JAVA_OPTS:--Xms128m -Xmx400m} -jar /app/app.jar
