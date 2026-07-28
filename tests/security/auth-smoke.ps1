# Fase 4 - comprobaciones rapidas de seguridad (sin token / con token)
$ErrorActionPreference = 'Stop'
$Api = if ($env:API_BASE) { $env:API_BASE } else { 'http://localhost:8080' }
$Keycloak = if ($env:KEYCLOAK_BASE) { $env:KEYCLOAK_BASE } else { 'http://localhost:8081' }

Write-Host "=== Sin token (esperado 401) ==="
try {
  Invoke-WebRequest -Uri "$Api/api/v1/products" -UseBasicParsing | Out-Null
  Write-Host "FAIL: products sin token deberia ser 401"
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) {
    Write-Host "OK: GET /products -> 401"
  } else {
    throw
  }
}

Write-Host "=== Token viewer ==="
# Roles/permisos vienen en el JWT del usuario; no pedir scopes custom (Keycloak → invalid_scope).
$body = 'grant_type=password&client_id=inventory-frontend&username=viewer&password=viewer123'
$token = (Invoke-RestMethod -Method Post -Uri "$Keycloak/realms/inventory-realm/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" -Body $body).access_token

Write-Host "=== Token invalido (esperado 401) ==="
try {
  Invoke-WebRequest -Uri "$Api/api/v1/reports/dashboard" -Headers @{ Authorization = "Bearer invalid.token.value" } -UseBasicParsing | Out-Null
  Write-Host "FAIL: token invalido deberia ser 401"
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) {
    Write-Host "OK: token invalido -> 401"
  } else {
    throw
  }
}

$headers = @{ Authorization = "Bearer $token" }
$dash = Invoke-WebRequest -Uri "$Api/api/v1/reports/dashboard" -Headers $headers -UseBasicParsing
if ($dash.StatusCode -eq 200) { Write-Host "OK: dashboard con report:view -> 200" }
else { Write-Host "FAIL: dashboard -> $($dash.StatusCode)"; exit 1 }

$metrics = Invoke-WebRequest -Uri "$Api/api/v1/observability/system-metrics" -Headers $headers -UseBasicParsing
if ($metrics.StatusCode -eq 200) { Write-Host "OK: system-metrics viewer -> 200" }
else { Write-Host "FAIL: system-metrics -> $($metrics.StatusCode)"; exit 1 }

Write-Host "=== Auditoria sin permiso (esperado 403) ==="
try {
  Invoke-WebRequest -Uri "$Api/api/v1/audit" -Headers $headers -UseBasicParsing | Out-Null
  Write-Host "FAIL: viewer no deberia acceder a /audit"
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) {
    Write-Host "OK: GET /audit -> 403"
  } else {
    throw
  }
}

Write-Host "=== Usuarios viewer sin permiso (esperado 403) ==="
try {
  Invoke-WebRequest -Uri "$Api/api/v1/users" -Headers $headers -UseBasicParsing | Out-Null
  Write-Host "FAIL: viewer no deberia acceder a /users"
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) {
    Write-Host "OK: GET /users viewer -> 403"
  } else {
    throw
  }
}

Write-Host "=== Matriz permisos viewer (esperado 403) ==="
try {
  Invoke-WebRequest -Uri "$Api/api/v1/security/permissions-matrix" -Headers $headers -UseBasicParsing | Out-Null
  Write-Host "FAIL: viewer no deberia acceder a permissions-matrix"
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) {
    Write-Host "OK: GET /security/permissions-matrix viewer -> 403"
  } else {
    throw
  }
}

Write-Host "=== Token admin ==="
$adminBody = 'grant_type=password&client_id=inventory-frontend&username=admin&password=admin123'
$adminToken = (Invoke-RestMethod -Method Post -Uri "$Keycloak/realms/inventory-realm/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" -Body $adminBody).access_token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$matrix = Invoke-WebRequest -Uri "$Api/api/v1/security/permissions-matrix" -Headers $adminHeaders -UseBasicParsing
if ($matrix.StatusCode -eq 200) { Write-Host "OK: permissions-matrix con user:manage -> 200" }
else { Write-Host "FAIL: permissions-matrix -> $($matrix.StatusCode)"; exit 1 }

# Permisos salen de roles Keycloak → KeycloakJwtAuthoritiesConverter (no del claim OAuth "scope").
$me = Invoke-RestMethod -Uri "$Api/api/v1/security/me" -Headers $adminHeaders
$authorities = @($me.authorities)
$required = @('product:view', 'report:view', 'user:manage', 'audit:view')
foreach ($needed in $required) {
  $ok = ($authorities -contains $needed) -or ($authorities -contains "SCOPE_$needed")
  if (-not $ok) {
    Write-Host "FAIL: /security/me missing authority $needed"
    exit 1
  }
}
Write-Host "OK: /security/me exposes effective permission authorities"

$users = @(Invoke-RestMethod -Uri "$Api/api/v1/users" -Headers $adminHeaders)
if ($users.Count -lt 1 -or @($users.username) -notcontains 'admin') {
  Write-Host "FAIL: /users did not return real Keycloak users"
  exit 1
}
Write-Host "OK: /users admin -> 200 with real Keycloak users"

Write-Host "=== Seguridad smoke: PASS ==="
