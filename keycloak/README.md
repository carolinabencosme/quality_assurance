# Keycloak — realm de inventario (QA-29)

| Archivo | Descripción |
|---------|-------------|
| `realm-export.json` | Realm `inventory-realm` importado al arrancar el contenedor |
| `realm-export.version` | Versión semver del export (actual: ver archivo) |
| `themes/cub/` | Tema de login oscuro alineado con la marca Cub |

## Arranque

```powershell
docker compose -f docker-compose.dev.yml up -d keycloak
```

Comando del contenedor: `start-dev --import-realm`  
Montaje: `./keycloak/realm-export.json` → `/opt/keycloak/data/import/realm-export.json`

Puerto host: **8081** → contenedor **8080**.

## Validación

```powershell
.\scripts\verify-keycloak-realm.ps1
```

## Secret del cliente administrativo

El export contiene exclusivamente el valor academico de dev/test `inventory-admin-secret-change-me`; Keycloak no interpola variables de entorno dentro del JSON importado. Produccion debe definir `KEYCLOAK_ADMIN_CLIENT_SECRET` y rotarlo despues del import con:

```powershell
$env:KEYCLOAK_ADMIN_CLIENT_SECRET = '<secret-real-no-versionado>'
.\scripts\set-keycloak-admin-secret.ps1
```

El script no imprime ni guarda el secret.

Documentación completa: [`docs/keycloak-realm.md`](../docs/keycloak-realm.md)  
Usuarios y roles: [`docs/security-model.md`](../docs/security-model.md)
