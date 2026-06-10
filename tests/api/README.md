# Pruebas de API (Postman / Newman)

Colección con **12+ escenarios** sobre el API REST: salud, **401** sin token, **400** validación, **403** permisos (viewer vs `product:manage`), **404** (sonda dev), **409** conflicto SKU, **201 / 200 / 204** CRUD producto.

## Requisitos

- Backend y Keycloak en marcha (por ejemplo `docker compose -f docker-compose.dev.yml up -d`).
- `baseUrl` por defecto `http://localhost:8080`.
- `keycloakUrl` por defecto `http://localhost:8081`.

## Ejecución rápida

```bash
cd tests/api
npm install
export SKU="NM-$(date +%s)"
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=$SKU"
```

En Windows (PowerShell):

```powershell
cd tests/api
npm install
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=$sku"
```

La colección **obtiene tokens** vía *password grant* (`inventory-frontend`) para `warehouse` y `viewer`; no hace falta pasar `token` manualmente salvo que quieras sobrescribirlo.

## Informe HTML (evidencia, opcional)

Instala un reporter extra, por ejemplo:

```bash
npm install -D newman-reporter-htmlextra
npx newman run inventory-qas.postman_collection.json -r cli,htmlextra --reporter-htmlextra-export newman-report.html
```

## CI

El workflow `.github/workflows/api-postman.yml` levanta Postgres + Keycloak + backend y ejecuta Newman (puede tardar varios minutos en el primer arranque).
