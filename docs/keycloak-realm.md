# Keycloak — realm `inventory-realm` versionado (QA-29)

Export declarativo en [`keycloak/realm-export.json`](../keycloak/realm-export.json), importado al arrancar el contenedor (`start-dev --import-realm`). Versión del export: [`keycloak/realm-export.version`](../keycloak/realm-export.version).

## Clientes

| Client ID | Tipo | Uso |
|-----------|------|-----|
| `inventory-frontend` | Público, **PKCE S256**, Authorization Code + password grant (dev) | Next.js — login y refresh |
| `inventory-api` | **Bearer-only** (Resource Server) | Spring Boot — roles en `resource_access.inventory-api` |

## Permisos (client roles en `inventory-api`)

| Permiso | Descripción |
|---------|-------------|
| `product:view` | Ver productos y categorías |
| `product:manage` | CRUD productos |
| `stock:view` | Ver existencias e historial |
| `stock:manage` | Entradas, salidas, ajustes |
| `report:view` | Dashboard y reportes |
| `audit:view` | Auditoría Envers |
| `user:manage` | Administración de usuarios Keycloak |

## Roles compuestos (realm)

| Rol | Permisos incluidos |
|-----|-------------------|
| `inventory-admin` | Todos |
| `warehouse-manager` | product + stock + report |
| `inventory-clerk` | product:view, stock:view, stock:manage |
| `inventory-viewer` | product:view, stock:view, report:view |

## Usuarios de prueba

Ver [`docs/security-model.md`](security-model.md).

## Verificación local

```powershell
.\scripts\verify-keycloak-realm.ps1
docker compose -f docker-compose.dev.yml up -d keycloak
.\tests\security\auth-smoke.ps1
```

Si el realm ya existía con el cliente antiguo `inventory-backend`, recrea Keycloak para reimportar:

```powershell
docker compose -f docker-compose.dev.yml down
docker volume rm inventory-qas-dev_keycloak_data 2>$null
docker compose -f docker-compose.dev.yml up -d keycloak
```

(Ajusta el nombre del volumen con `docker volume ls | Select-String keycloak`.)

## Actualizar el export desde la consola (opcional)

1. Cambios en http://localhost:8081/admin (realm `inventory-realm`).
2. **Realm settings → Action → Partial export** (clients, roles, users).
3. Reemplazar `keycloak/realm-export.json` y subir `realm-export.version` (semver).

## Alineación con el código

- Backend: `Permission.KEYCLOAK_CLIENT` = `inventory-api`
- Frontend: `NEXT_PUBLIC_KEYCLOAK_API_CLIENT_ID` (default `inventory-api`) en `lib/permissions.ts`
