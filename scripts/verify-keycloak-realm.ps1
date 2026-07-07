# Valida estructura minima de keycloak/realm-export.json (QA-29)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$exportPath = Join-Path $root 'keycloak\realm-export.json'
$versionPath = Join-Path $root 'keycloak\realm-export.version'

if (-not (Test-Path $exportPath)) {
  Write-Error "No existe: $exportPath"
}

$realm = Get-Content $exportPath -Raw | ConvertFrom-Json

if ($realm.realm -ne 'inventory-realm') {
  Write-Error "realm debe ser inventory-realm, encontrado: $($realm.realm)"
}

$requiredPermissions = @(
  'product:view', 'product:manage', 'stock:view', 'stock:manage',
  'report:view', 'audit:view', 'user:manage'
)

$apiRoles = $realm.roles.client.'inventory-api'
if (-not $apiRoles) {
  Write-Error "Faltan client roles en inventory-api"
}

$roleNames = $apiRoles | ForEach-Object { $_.name }
foreach ($perm in $requiredPermissions) {
  if ($roleNames -notcontains $perm) {
    Write-Error "Falta permiso client role: $perm"
  }
}

$clientIds = $realm.clients | ForEach-Object { $_.clientId }
foreach ($expected in @('inventory-frontend', 'inventory-api')) {
  if ($clientIds -notcontains $expected) {
    Write-Error "Falta cliente: $expected"
  }
}

$frontend = $realm.clients | Where-Object { $_.clientId -eq 'inventory-frontend' } | Select-Object -First 1
if (-not $frontend.publicClient) {
  Write-Error "inventory-frontend debe ser publicClient"
}
if ($frontend.attributes.'pkce.code.challenge.method' -ne 'S256') {
  Write-Error "inventory-frontend debe usar PKCE S256"
}

$apiClient = $realm.clients | Where-Object { $_.clientId -eq 'inventory-api' } | Select-Object -First 1
if (-not $apiClient.bearerOnly) {
  Write-Error "inventory-api debe ser bearerOnly (resource server)"
}

$compositeRoles = @('inventory-admin', 'warehouse-manager', 'inventory-clerk', 'inventory-viewer')
$realmRoleNames = $realm.roles.realm | ForEach-Object { $_.name }
foreach ($r in $compositeRoles) {
  if ($realmRoleNames -notcontains $r) {
    Write-Error "Falta rol compuesto realm: $r"
  }
}

if (-not (Test-Path $versionPath)) {
  Write-Error "Falta archivo de version: $versionPath"
}

$version = (Get-Content $versionPath -Raw).Trim()
Write-Host "OK realm-export.json v$version - realm inventory-realm, clientes y permisos validados."
