# Fase 4 — comprobaciones rápidas de seguridad (sin token / con token)
$ErrorActionPreference = 'Stop'
$Api = if ($env:API_BASE) { $env:API_BASE } else { 'http://localhost:8080' }
$Keycloak = if ($env:KEYCLOAK_BASE) { $env:KEYCLOAK_BASE } else { 'http://localhost:8081' }

Write-Host "=== Sin token (esperado 401) ==="
try {
  Invoke-WebRequest -Uri "$Api/api/v1/products" -UseBasicParsing | Out-Null
  Write-Host "FAIL: products sin token debería ser 401"
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) {
    Write-Host "OK: GET /products -> 401"
  } else {
    throw
  }
}

Write-Host "=== Token viewer ==="
$body = "grant_type=password&client_id=inventory-frontend&username=viewer&password=viewer123"
$token = (Invoke-RestMethod -Method Post -Uri "$Keycloak/realms/inventory-realm/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" -Body $body).access_token

$headers = @{ Authorization = "Bearer $token" }
$dash = Invoke-WebRequest -Uri "$Api/api/v1/reports/dashboard" -Headers $headers -UseBasicParsing
if ($dash.StatusCode -eq 200) { Write-Host "OK: dashboard con report:view -> 200" }
else { Write-Host "FAIL: dashboard -> $($dash.StatusCode)"; exit 1 }

Write-Host "=== Auditoría sin permiso (esperado 403) ==="
try {
  Invoke-WebRequest -Uri "$Api/api/v1/audit" -Headers $headers -UseBasicParsing | Out-Null
  Write-Host "FAIL: viewer no debería acceder a /audit"
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) {
    Write-Host "OK: GET /audit -> 403"
  } else {
    throw
  }
}

Write-Host "=== Seguridad smoke: PASS ==="
