# Importa inventory-realm en Keycloak cloud si falta (Not Found en login Vercel).
# Prerequisito: servicio cub-keycloak Live en Render.
#
#   .\scripts\import-keycloak-realm-cloud.ps1
#   .\scripts\import-keycloak-realm-cloud.ps1 -KeycloakUrl https://cub-keycloak.onrender.com

param(
  [string]$KeycloakUrl = $(if ($env:CLOUD_KC_URL) { $env:CLOUD_KC_URL } else { 'https://cub-keycloak.onrender.com' }),
  [string]$AdminUser = 'admin',
  [string]$AdminPassword = 'admin',
  [string]$RealmFile = ''
)

$ErrorActionPreference = 'Stop'
$KeycloakUrl = $KeycloakUrl.TrimEnd('/')
if (-not $RealmFile) {
  $RealmFile = Join-Path $PSScriptRoot '..\keycloak\realm-export.json' | Resolve-Path
}

Write-Host '=== Keycloak realm import (cloud) ===' -ForegroundColor Cyan
Write-Host "URL:  $KeycloakUrl"
Write-Host "File: $RealmFile"

$ready = $false
for ($i = 1; $i -le 45; $i++) {
  try {
    # master token endpoint is the reliable "up" signal
    $probe = Invoke-WebRequest -Uri "$KeycloakUrl/realms/master" -UseBasicParsing -TimeoutSec 20
    if ($probe.StatusCode -lt 500) { $ready = $true; break }
  } catch {
    if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -lt 500) {
      $ready = $true
      break
    }
  }
  Write-Host "Waiting Keycloak master... ($i/45)"
  Start-Sleep -Seconds 8
}
if (-not $ready) {
  throw 'Keycloak no responde. En Render: New → Blueprint → repo/rama presentacion → Apply, espera cub-keycloak Live.'
}

try {
  $oidc = Invoke-RestMethod -Uri "$KeycloakUrl/realms/inventory-realm/.well-known/openid-configuration" -TimeoutSec 30
  if ($oidc.issuer) {
    Write-Host "OK inventory-realm ya existe: $($oidc.issuer)" -ForegroundColor Green
    exit 0
  }
} catch {
  Write-Host 'inventory-realm ausente — importando realm-export.json...'
}

$tokenBody = "grant_type=password&client_id=admin-cli&username=$AdminUser&password=$AdminPassword"
try {
  $tok = Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" `
    -ContentType 'application/x-www-form-urlencoded' -Body $tokenBody -TimeoutSec 60
} catch {
  throw "No hay token admin. Revisa KC_BOOTSTRAP_ADMIN_USERNAME/PASSWORD en Render. $($_.Exception.Message)"
}

$headers = @{
  Authorization  = "Bearer $($tok.access_token)"
  'Content-Type' = 'application/json'
}
$realmJson = Get-Content -Raw -Path $RealmFile

try {
  Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/admin/realms" -Headers $headers -Body $realmJson -TimeoutSec 180 | Out-Null
  Write-Host 'OK POST /admin/realms'
} catch {
  Write-Host "Create realm fallo ($($_.Exception.Message)). Intentando overwrite via partialImport..." -ForegroundColor Yellow
  $empty = '{"realm":"inventory-realm","enabled":true}'
  try { Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/admin/realms" -Headers $headers -Body $empty -TimeoutSec 60 | Out-Null } catch {}
  Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/admin/realms/inventory-realm/partialImport" `
    -Headers $headers -Body $realmJson -TimeoutSec 180 | Out-Null
  Write-Host 'OK partialImport'
}

$check = Invoke-RestMethod -Uri "$KeycloakUrl/realms/inventory-realm/.well-known/openid-configuration" -TimeoutSec 30
Write-Host "OK issuer=$($check.issuer)" -ForegroundColor Green
Write-Host 'Usuarios: admin/admin123 | viewer/viewer123 | warehouse/warehouse123 | clerk/clerk123'
Write-Host 'Staging: https://cub-inventory-qas.vercel.app'
Write-Host 'Prod:    https://cub-inventory-qas-prod.vercel.app'
