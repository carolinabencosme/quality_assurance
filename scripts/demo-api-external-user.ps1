# Probar la API REST en terminal con un usuario externo (solo lectura).
# Por defecto usa viewer/viewer123 (rol inventory-viewer).
#
# Uso:
#   .\scripts\demo-api-external-user.ps1
#   .\scripts\demo-api-external-user.ps1 -Username viewer
#   .\scripts\demo-api-external-user.ps1 -ShowToken   # imprime JWT para pegar en Swagger
#   $env:API_BASE='https://cub-api.onrender.com'; $env:KEYCLOAK_BASE='https://cub-keycloak.onrender.com'
#   .\scripts\demo-api-external-user.ps1
#
# Visual:
#   Swagger  -> http://localhost:8080/swagger-ui.html  (Authorize + Bearer token)
#   App UI   -> http://localhost:3000  (login viewer/viewer123)

param(
  [string]$Username = 'viewer',
  [string]$Password = '',
  [switch]$ShowToken
)

$ErrorActionPreference = 'Stop'
$Api = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost:8080' }
$Keycloak = if ($env:KEYCLOAK_BASE) { $env:KEYCLOAK_BASE.TrimEnd('/') } else { 'http://localhost:8081' }

$passwords = @{
  admin     = 'admin123'
  warehouse = 'warehouse123'
  clerk     = 'clerk123'
  viewer    = 'viewer123'
}
if (-not $Password) {
  if (-not $passwords.ContainsKey($Username)) {
    throw "Password requerido para usuario '$Username' (usa -Password)."
  }
  $Password = $passwords[$Username]
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

function Invoke-Probe {
  param(
    [string]$Method,
    [string]$Path,
    [hashtable]$Headers,
    [string]$Body = $null,
    [int]$Expected,
    [string]$Note = ''
  )
  $url = "$Api$Path"
  $code = 0
  $snippet = ''
  try {
    $params = @{
      Method          = $Method
      Uri             = $url
      Headers         = $Headers
      UseBasicParsing = $true
      TimeoutSec      = 20
    }
    if ($null -ne $Body -and $Body -ne '') {
      $params.ContentType = 'application/json'
      $params.Body = $Body
    }
    $r = Invoke-WebRequest @params
    $code = [int]$r.StatusCode
    $snippet = if ($r.Content.Length -gt 120) { $r.Content.Substring(0, 120) + '...' } else { $r.Content }
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.StatusCode) {
      $code = [int]$resp.StatusCode
    } else {
      throw
    }
  }

  $ok = ($code -eq $Expected)
  $color = if ($ok) { 'Green' } else { 'Yellow' }
  $mark = if ($ok) { 'OK ' } else { '!! ' }
  $label = "{0} {1}" -f $Method, $Path
  $extra = if ($Note) { "  ($Note)" } else { '' }
  Write-Host ("  {0}{1,-48} -> HTTP {2}  (esperado {3}){4}" -f $mark, $label, $code, $Expected, $extra) -ForegroundColor $color
  if ($ok -and $snippet -and $code -ge 200 -and $code -lt 300 -and $snippet.Trim().StartsWith('{')) {
    Write-Host ("      body: {0}" -f ($snippet -replace '\s+', ' ')) -ForegroundColor DarkGray
  }
  return $ok
}

Write-Host ''
Write-Host 'API externa (usuario solo lectura)' -ForegroundColor White
Write-Host ("  API:      {0}" -f $Api)
Write-Host ("  Keycloak: {0}" -f $Keycloak)
Write-Host ("  Usuario:  {0}" -f $Username)

$productsPath = '/api/v1/products?page=0' + '&' + 'size=3'
$stockPath = '/api/v1/stock?page=0' + '&' + 'size=3'
$auditPath = '/api/v1/audit?page=0' + '&' + 'size=5'

Write-Step '1. Sin token (anonimo) - esperado 401'
$null = Invoke-Probe -Method 'GET' -Path $productsPath -Headers @{} -Expected 401 -Note 'no autenticado'

Write-Step "2. Login Keycloak (password grant) - $Username"
$token = Get-Token $Username $Password
$headers = @{ Authorization = "Bearer $token" }
Write-Host '  JWT obtenido OK' -ForegroundColor Green
if ($ShowToken) {
  Write-Host ''
  Write-Host '  --- Pegar en Swagger > Authorize > Bearer ---' -ForegroundColor Yellow
  Write-Host $token
  Write-Host '  ------------------------------------------------' -ForegroundColor Yellow
}

Write-Step '3. Quien soy - GET /security/me'
$me = Invoke-RestMethod -Uri "$Api/api/v1/security/me" -Headers $headers -TimeoutSec 20
$auth = @($me.authorities) | Where-Object { $_ -match '^(product|stock|report|audit|user):' } | Sort-Object
Write-Host ("  username: {0}" -f $me.username) -ForegroundColor Gray
Write-Host ("  subject:  {0}" -f $me.subject) -ForegroundColor DarkGray
if ($auth.Count -eq 0) {
  Write-Host '  permissions: (ninguna de negocio visible)' -ForegroundColor DarkYellow
} else {
  Write-Host ("  permissions: {0}" -f ($auth -join ', ')) -ForegroundColor White
  Write-Host '  (viewer tipico: product:view, stock:view, report:view - sin :manage)' -ForegroundColor DarkGray
}

Write-Step '4. Lectura permitida - esperado 200'
$allOk = $true
$allOk = (Invoke-Probe -Method 'GET' -Path $productsPath -Headers $headers -Expected 200 -Note 'product:view') -and $allOk
$allOk = (Invoke-Probe -Method 'GET' -Path $stockPath -Headers $headers -Expected 200 -Note 'stock:view') -and $allOk
$allOk = (Invoke-Probe -Method 'GET' -Path '/api/v1/reports/dashboard' -Headers $headers -Expected 200 -Note 'report:view') -and $allOk
$allOk = (Invoke-Probe -Method 'GET' -Path '/api/v1/reports/critical-products' -Headers $headers -Expected 200) -and $allOk
$allOk = (Invoke-Probe -Method 'GET' -Path '/api/v1/categories' -Headers $headers -Expected 200) -and $allOk
$allOk = (Invoke-Probe -Method 'GET' -Path '/api/v1/observability/system-metrics' -Headers $headers -Expected 200) -and $allOk

Write-Step '5. Escritura / admin denegados - esperado 403'
$sku = "EXT-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$createBody = "{`"name`":`"Bloqueado externo`",`"sku`":`"$sku`",`"price`":9.99,`"quantity`":1,`"minStock`":1,`"categoryId`":1}"
$stockBody = '{"productId":1,"type":"IN","quantity":1,"observations":"externo-no-debe"}'

$allOk = (Invoke-Probe -Method 'POST' -Path '/api/v1/products' -Headers $headers -Body $createBody -Expected 403 -Note 'sin product:manage') -and $allOk
$allOk = (Invoke-Probe -Method 'POST' -Path '/api/v1/stock/movements' -Headers $headers -Body $stockBody -Expected 403 -Note 'sin stock:manage') -and $allOk
$allOk = (Invoke-Probe -Method 'GET' -Path '/api/v1/users' -Headers $headers -Expected 403 -Note 'sin user:manage') -and $allOk
$allOk = (Invoke-Probe -Method 'GET' -Path $auditPath -Headers $headers -Expected 403 -Note 'sin audit:view') -and $allOk
$allOk = (Invoke-Probe -Method 'GET' -Path '/api/v1/security/permissions-matrix' -Headers $headers -Expected 403) -and $allOk

Write-Host ''
if ($allOk) {
  Write-Host '=== Demo API usuario externo: PASS ===' -ForegroundColor Green
} else {
  Write-Host '=== Demo API usuario externo: hay diferencias (revisa !!) ===' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Visual (mismo usuario):' -ForegroundColor Cyan
Write-Host "  App:     http://localhost:3000   -> login $Username / $Password"
Write-Host '  Swagger: http://localhost:8080/swagger-ui.html'
Write-Host '           Authorize -> Bearer <token>  (re-ejecuta con -ShowToken)'
Write-Host '  Cloud:   https://cub-inventory-qas.vercel.app  + Swagger en Render'
Write-Host ''
Write-Host 'Oral: JWT de viewer trae solo :view; Spring @PreAuthorize deja leer y bloquea escribir (403).' -ForegroundColor White
