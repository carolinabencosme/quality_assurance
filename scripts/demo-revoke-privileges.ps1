# Demo oral: quitar privilegios a un usuario y ver 200 -> 403 en la terminal.
# Uso:
#   .\scripts\demo-revoke-privileges.ps1
#   .\scripts\demo-revoke-privileges.ps1 -Username warehouse
#   .\scripts\demo-revoke-privileges.ps1 -Username clerk -NoRestore
#
# Por defecto degrada a inventory-viewer, prueba endpoints, y RESTAURA el rol original.

param(
  [string]$Username = 'warehouse',
  [string]$Password = '',
  [string]$DemoteTo = 'inventory-viewer',
  [switch]$NoRestore
)

$ErrorActionPreference = 'Stop'
$Api = if ($env:API_BASE) { $env:API_BASE } else { 'http://localhost:8080' }
$Keycloak = if ($env:KEYCLOAK_BASE) { $env:KEYCLOAK_BASE } else { 'http://localhost:8081' }

$passwords = @{
  admin     = 'admin123'
  warehouse = 'warehouse123'
  clerk     = 'clerk123'
  viewer    = 'viewer123'
}
if (-not $Password) {
  if (-not $passwords.ContainsKey($Username)) {
    throw "Password requerido para usuario '$Username' (o usa -Password)."
  }
  $Password = $passwords[$Username]
}

$managedRoles = @('inventory-admin', 'warehouse-manager', 'inventory-clerk', 'inventory-viewer')
if ($managedRoles -notcontains $DemoteTo) {
  throw "DemoteTo debe ser uno de: $($managedRoles -join ', ')"
}

function Write-Step([string]$Title) {
  Write-Host ''
  Write-Host ('=' * 64) -ForegroundColor DarkCyan
  Write-Host " $Title" -ForegroundColor Cyan
  Write-Host ('=' * 64) -ForegroundColor DarkCyan
}

function Get-Token([string]$User, [string]$Pass) {
  $body = "grant_type=password&client_id=inventory-frontend&username=$User&password=$Pass"
  return (Invoke-RestMethod -Method Post `
      -Uri "$Keycloak/realms/inventory-realm/protocol/openid-connect/token" `
      -ContentType 'application/x-www-form-urlencoded' `
      -Body $body -TimeoutSec 30).access_token
}

function Get-StatusCode {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [string]$Body = $null
  )
  try {
    $params = @{
      Method          = $Method
      Uri             = $Url
      Headers         = $Headers
      UseBasicParsing = $true
      TimeoutSec      = 20
    }
    if ($null -ne $Body -and $Body -ne '') {
      $params.ContentType = 'application/json'
      $params.Body = $Body
    }
    $r = Invoke-WebRequest @params
    return [int]$r.StatusCode
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.StatusCode) {
      return [int]$resp.StatusCode
    }
    throw
  }
}

function Show-Probe([string]$Label, [int]$Code, [int]$Expected) {
  $color = if ($Code -eq $Expected) { 'Green' } else { 'Yellow' }
  $mark = if ($Code -eq $Expected) { 'OK ' } else { '!! ' }
  Write-Host ("  {0}{1,-42} -> HTTP {2}  (esperado {3})" -f $mark, $Label, $Code, $Expected) -ForegroundColor $color
}

function Show-Authorities([hashtable]$Headers) {
  $me = Invoke-RestMethod -Uri "$Api/api/v1/security/me" -Headers $Headers -TimeoutSec 20
  $auth = @($me.authorities) | Where-Object { $_ -match '^(product|stock|report|audit|user):' } | Sort-Object
  if ($auth.Count -eq 0) {
    Write-Host '  (sin authorities de negocio en el JWT)' -ForegroundColor DarkYellow
  } else {
    Write-Host ("  permissions: {0}" -f ($auth -join ', ')) -ForegroundColor Gray
  }
}

Write-Step "1. Admin token + localizar usuario '$Username'"
$adminToken = Get-Token 'admin' 'admin123'
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$users = @(Invoke-RestMethod -Uri ("$Api/api/v1/users?search={0}&max=20" -f $Username) -Headers $adminHeaders)
$target = $users | Where-Object { $_.username -eq $Username } | Select-Object -First 1
if (-not $target) {
  throw "Usuario '$Username' no encontrado via /api/v1/users (Keycloak admin OK?)."
}

$originalRoles = @($target.roles)
if ($originalRoles.Count -eq 0) {
  throw "El usuario '$Username' no tiene roles gestionados; no se puede degradar."
}

Write-Host ("  id:    {0}" -f $target.id)
Write-Host ("  roles: {0}" -f ($originalRoles -join ', ')) -ForegroundColor White

Write-Step '2. ANTES - con privilegios actuales'
$userToken = Get-Token $Username $Password
$userHeaders = @{ Authorization = "Bearer $userToken" }
Show-Authorities $userHeaders

$productsUrl = "$Api/api/v1/products?page=0" + '&' + 'size=5'
$auditUrl = "$Api/api/v1/audit?page=0" + '&' + 'size=5'
$createBody = '{"name":"Demo Revoke","sku":"SKU-REVOKE-DEMO","price":1,"quantity":1,"minStock":1,"categoryId":1}'

$beforeDash = Get-StatusCode -Method 'GET' -Url "$Api/api/v1/reports/dashboard" -Headers $userHeaders
$beforeProducts = Get-StatusCode -Method 'GET' -Url $productsUrl -Headers $userHeaders
$beforeCreate = Get-StatusCode -Method 'POST' -Url "$Api/api/v1/products" -Headers $userHeaders -Body $createBody
$beforeUsers = Get-StatusCode -Method 'GET' -Url "$Api/api/v1/users" -Headers $userHeaders
$beforeAudit = Get-StatusCode -Method 'GET' -Url $auditUrl -Headers $userHeaders

Show-Probe 'GET  /reports/dashboard' $beforeDash 200
Show-Probe 'GET  /products' $beforeProducts 200

$canWrite = ($originalRoles -contains 'inventory-admin') -or
            ($originalRoles -contains 'warehouse-manager') -or
            ($originalRoles -contains 'inventory-clerk')
$expectCreateBefore = if ($canWrite) { 201 } else { 403 }
if ($beforeCreate -eq 200) { $beforeCreate = 201 }
Show-Probe 'POST /products (escribir)' $beforeCreate $expectCreateBefore
Show-Probe 'GET  /users (admin)' $beforeUsers 403
$expectAuditBefore = if ($originalRoles -contains 'inventory-admin') { 200 } else { 403 }
Show-Probe 'GET  /audit' $beforeAudit $expectAuditBefore

Write-Step "3. QUITAR privilegios -> rol '$DemoteTo'"
$rolesJson = (@{ roles = @($DemoteTo) } | ConvertTo-Json -Compress)
$updated = Invoke-RestMethod -Method Put `
  -Uri "$Api/api/v1/users/$($target.id)/roles" `
  -Headers $adminHeaders `
  -ContentType 'application/json' `
  -Body $rolesJson
Write-Host ("  roles ahora: {0}" -f (@($updated.roles) -join ', ')) -ForegroundColor Yellow
Write-Host '  (JWT viejo sigue valido hasta expirar - pedimos token NUEVO)' -ForegroundColor DarkGray

Write-Step '4. DESPUES - mismo usuario, token nuevo (sin permisos de escritura)'
Start-Sleep -Seconds 1
$newToken = Get-Token $Username $Password
$newHeaders = @{ Authorization = "Bearer $newToken" }
Show-Authorities $newHeaders

$createBody2 = '{"name":"Demo Revoke 2","sku":"SKU-REVOKE-DEMO-2","price":1,"quantity":1,"minStock":1,"categoryId":1}'
$stockBody = '{"productId":1,"type":"IN","quantity":1,"observations":"demo-revoke"}'

$afterDash = Get-StatusCode -Method 'GET' -Url "$Api/api/v1/reports/dashboard" -Headers $newHeaders
$afterProducts = Get-StatusCode -Method 'GET' -Url $productsUrl -Headers $newHeaders
$afterCreate = Get-StatusCode -Method 'POST' -Url "$Api/api/v1/products" -Headers $newHeaders -Body $createBody2
$afterUsers = Get-StatusCode -Method 'GET' -Url "$Api/api/v1/users" -Headers $newHeaders
$afterStock = Get-StatusCode -Method 'POST' -Url "$Api/api/v1/stock/movements" -Headers $newHeaders -Body $stockBody

Show-Probe 'GET  /reports/dashboard (lectura)' $afterDash 200
Show-Probe 'GET  /products (lectura)' $afterProducts 200
Show-Probe 'POST /products (escritura)' $afterCreate 403
Show-Probe 'POST /stock/movements' $afterStock 403
Show-Probe 'GET  /users' $afterUsers 403

Write-Host ''
Write-Host '  Resumen oral: degradamos el rol en Keycloak via API Cub;' -ForegroundColor White
Write-Host '  el JWT nuevo ya no trae product:manage / stock:manage -> Spring responde 403.' -ForegroundColor White

if (-not $NoRestore) {
  Write-Step ("5. RESTAURAR roles originales ({0})" -f ($originalRoles -join ', '))
  $restoreJson = (@{ roles = @($originalRoles) } | ConvertTo-Json -Compress)
  $restored = Invoke-RestMethod -Method Put `
    -Uri "$Api/api/v1/users/$($target.id)/roles" `
    -Headers $adminHeaders `
    -ContentType 'application/json' `
    -Body $restoreJson
  Write-Host ("  roles restaurados: {0}" -f (@($restored.roles) -join ', ')) -ForegroundColor Green
} else {
  Write-Host ''
  Write-Host "  -NoRestore: '$Username' se queda como '$DemoteTo'." -ForegroundColor Yellow
  Write-Host "  Para volver: PUT /api/v1/users/$($target.id)/roles con roles originales." -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== Demo revoke privileges: DONE ===' -ForegroundColor Green
Write-Host 'UI: http://localhost:3000/admin/users  (admin/admin123)'
Write-Host 'Grafana Security: http://localhost:3030/d/inventory-security'
