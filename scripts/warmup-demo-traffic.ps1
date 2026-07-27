# Warmup demo traffic - genera metricas/logs para Grafana
$ErrorActionPreference = 'Continue'
$Api = if ($env:API_BASE) { $env:API_BASE } else { 'http://localhost:8080' }
$Keycloak = if ($env:KEYCLOAK_BASE) { $env:KEYCLOAK_BASE } else { 'http://localhost:8081' }
$Frontend = if ($env:FRONTEND_BASE) { $env:FRONTEND_BASE } else { 'http://localhost:3000' }

Write-Host '=== Warmup demo traffic ===' -ForegroundColor Cyan

function Get-Token([string]$User, [string]$Pass) {
  $body = "grant_type=password&client_id=inventory-frontend&username=$User&password=$Pass"
  try {
    return (Invoke-RestMethod -Method Post -Uri "$Keycloak/realms/inventory-realm/protocol/openid-connect/token" `
      -ContentType 'application/x-www-form-urlencoded' -Body $body -TimeoutSec 30).access_token
  } catch {
    Write-Host ("WARN: no token for " + $User + " - " + $_.Exception.Message) -ForegroundColor Yellow
    return $null
  }
}

try { Invoke-WebRequest -Uri "$Frontend/" -UseBasicParsing -TimeoutSec 15 | Out-Null; Write-Host 'OK  frontend' } catch { Write-Host 'WARN frontend' -ForegroundColor Yellow }
try { Invoke-WebRequest -Uri "$Api/actuator/health" -UseBasicParsing -TimeoutSec 15 | Out-Null; Write-Host 'OK  health' } catch { Write-Host 'WARN health' -ForegroundColor Yellow }

# 401 sin token (security dashboard)
try { Invoke-WebRequest -Uri "$Api/api/v1/products" -UseBasicParsing -TimeoutSec 10 | Out-Null } catch { Write-Host 'OK  expected 401 without token' }

$admin = Get-Token 'admin' 'admin123'
$viewer = Get-Token 'viewer' 'viewer123'

if ($admin) {
  $h = @{ Authorization = "Bearer $admin" }
  foreach ($i in 1..8) {
    try { Invoke-RestMethod -Uri "$Api/api/v1/reports/dashboard" -Headers $h -TimeoutSec 20 | Out-Null } catch {}
    try { Invoke-RestMethod -Uri "$Api/api/v1/observability/system-metrics" -Headers $h -TimeoutSec 20 | Out-Null } catch {}
    try { Invoke-RestMethod -Uri "$Api/api/v1/products?page=0&size=10" -Headers $h -TimeoutSec 20 | Out-Null } catch {}
    try { Invoke-RestMethod -Uri "$Api/api/v1/stock/movements?page=0&size=10" -Headers $h -TimeoutSec 20 | Out-Null } catch {}
    try { Invoke-RestMethod -Uri "$Api/api/v1/reports/critical-products" -Headers $h -TimeoutSec 20 | Out-Null } catch {}
  }
  try { Invoke-RestMethod -Uri "$Api/api/v1/users" -Headers $h -TimeoutSec 20 | Out-Null; Write-Host 'OK  admin users 200' } catch { Write-Host 'WARN admin users' -ForegroundColor Yellow }
  Write-Host 'OK  admin traffic sent'
}

if ($viewer) {
  $vh = @{ Authorization = "Bearer $viewer" }
  try { Invoke-RestMethod -Uri "$Api/api/v1/reports/dashboard" -Headers $vh -TimeoutSec 20 | Out-Null } catch {}
  try {
    Invoke-WebRequest -Uri "$Api/api/v1/users" -Headers $vh -UseBasicParsing -TimeoutSec 15 | Out-Null
  } catch {
    Write-Host 'OK  viewer users expected 403'
  }
  try {
    Invoke-WebRequest -Uri "$Api/api/v1/audit/products?page=0&size=5" -Headers $vh -UseBasicParsing -TimeoutSec 15 | Out-Null
  } catch {
    Write-Host 'OK  viewer audit expected 403'
  }
}

Write-Host '=== Warmup done - open Grafana dashboards ===' -ForegroundColor Green
Write-Host 'Home:      http://localhost:3030/d/cub-home'
Write-Host 'Business:  http://localhost:3030/d/inventory-business'
Write-Host 'Security:  http://localhost:3030/d/inventory-security'
Write-Host 'Links doc: docs/defensa/LINKS-DEMO-PROFESOR.md'
