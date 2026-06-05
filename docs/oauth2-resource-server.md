# Spring Security OAuth2 Resource Server (JWT) — QA-30

API protegida como **OAuth2 Resource Server** con tokens JWT emitidos por Keycloak (`inventory-realm`).

## Configuración JWT

| Propiedad | Variable | Valor por defecto (dev) |
|-----------|----------|-------------------------|
| `issuer-uri` | `KEYCLOAK_ISSUER_URI` | `http://localhost:8081/realms/inventory-realm` |
| `jwk-set-uri` | `KEYCLOAK_JWKS_URI` | `.../protocol/openid-connect/certs` |

Definidas en:

- `backend/src/main/resources/application.yml` (base)
- `backend/src/main/resources/application-dev.yml` (Docker: JWKS vía `host.docker.internal`)

El `issuer` del JWT debe coincidir exactamente con `issuer-uri` o la validación falla con **401**.

## Rutas públicas

Centralizadas en `PublicApiPaths`:

| Grupo | Rutas |
|-------|--------|
| Actuator | `/actuator/health`, `/actuator/info`, `/actuator/prometheus` |
| OpenAPI | `/swagger-ui/**`, `/api-docs/**`, `/v3/api-docs/**` |
| API | `/api/v1/**` → **autenticado** (JWT) |
| Resto | **403 Forbidden** (`denyAll`) |

## Permisos en el token

Roles granulares en `resource_access.inventory-backend.roles` (ver `KeycloakJwtAuthoritiesConverter`).

`@PreAuthorize("hasAuthority('product:view')")` en controladores.

## Desactivar seguridad (solo tests)

```properties
inventory.security.enabled=false
```

Activa `SecurityDisabledConfig` (permitAll).

## Pruebas

| Clase | Alcance |
|-------|---------|
| `ApiSecurityMvcTest` | WebMvcTest — 401/403 por endpoint |
| `ResourceServerSecurityIntegrationTest` | SpringBootTest + JWT mock — rutas públicas y API |
| `KeycloakJwtAuthoritiesConverterTest` | Extracción de roles del JWT |

```powershell
cd backend
.\mvnw.cmd -B verify
```

## Referencias

- [`docs/security-model.md`](security-model.md)
- [`keycloak/realm-export.json`](../keycloak/realm-export.json)
