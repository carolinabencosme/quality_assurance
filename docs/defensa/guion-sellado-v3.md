# Guion de defensa: cinco demos de sellado V3

## 1. Scopes y autorizacion real

1. Obtenga un JWT de `admin` con Keycloak.
2. Muestre el claim `scope` con permisos de negocio.
3. Abra `/api/v1/security/me` y ensene las authorities `product:view` y `SCOPE_product:view`.
4. Repita `/api/v1/users` con `viewer` para demostrar `403`.

Evidencia automatica: `tests/security/auth-smoke.ps1` y `docs/qa-evidence/keycloak-it-summary.md`.

## 2. Gestion de usuarios Keycloak

1. Entre como `admin` y abra `/admin/users`.
2. Muestre los usuarios reales del realm.
3. Explique que el backend usa client credentials y que produccion rota el secret con `scripts/set-keycloak-admin-secret.ps1`.

## 3. Grafana, Loki y Tempo

1. Abra los cuatro dashboards provisionados en Grafana.
2. En Loki use `{service_name="backend"} | json | user != ""`.
3. Copie un `traceId` y abra la traza en Tempo.
4. Muestre spans `SELECT`/`INSERT` que demuestran request a base de datos.

Evidencia automatica: `scripts/verify-observability-evidence.ps1`.

## 4. Staging probado despues del deploy

Abra `deploy-staging.yml` y el ultimo run de Actions. Muestre el orden: stack desplegado, smoke, snapshots, Newman, Playwright+a11y, auth smoke y Schemathesis. Enfatice que las pruebas apuntan a los puertos del sistema ya levantado.

## 5. Sonar Quality Gate

Abra `docs/qa-evidence/sonar-summary.md`: Quality Gate `OK`, cobertura, bugs, vulnerabilidades, smells y duplicacion. Explique que el scanner espera el gate y falla cuando el resultado no es verde; el token no se archiva.
