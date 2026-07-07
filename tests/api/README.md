# API Tests - Newman and Schemathesis

## Newman

The Postman collection contains 24 scenarios covering health, auth, validation, product CRUD, duplicate SKU, dashboard `topSoldProducts`, stock IN/OUT, stock movement paging, audit permissions and `user:manage` permissions matrix.

```powershell
cd tests/api
npm install
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=$sku"
```

Tokens are obtained from Keycloak for `warehouse`, `viewer` and `admin` demo users.

## Schemathesis

```powershell
.\scripts\run-schemathesis.ps1
```

Default schema URL: `http://host.docker.internal:8080/v3/api-docs`.

Report: `docs/qa-evidence/schemathesis-report.txt`.

## CI

- `.github/workflows/api-postman.yml`
- `.github/workflows/api-schemathesis.yml`
