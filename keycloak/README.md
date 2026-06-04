# Keycloak — realm de inventario (QA-29)

| Archivo | Descripción |
|---------|-------------|
| `realm-export.json` | Realm `inventory-realm` importado al arrancar el contenedor |
| `realm-export.version` | Versión semver del export (actual: ver archivo) |

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

Documentación completa: [`docs/keycloak-realm.md`](../docs/keycloak-realm.md)  
Usuarios y roles: [`docs/security-model.md`](../docs/security-model.md)
