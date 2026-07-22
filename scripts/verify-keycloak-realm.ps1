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

$clientScopes = $realm.clientScopes | ForEach-Object { $_.name }
foreach ($scope in @('web-origins', 'acr', 'roles', 'profile', 'email') + $requiredPermissions) {
  if ($clientScopes -notcontains $scope) {
    Write-Error "Falta client scope OIDC/OAuth2: $scope"
  }
}

$clientIds = $realm.clients | ForEach-Object { $_.clientId }
foreach ($expected in @('inventory-frontend', 'inventory-api', 'inventory-admin-api')) {
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
if (-not $apiClient.authorizationServicesEnabled) {
  Write-Error "inventory-api debe tener Authorization Services habilitado"
}
if (-not $apiClient.authorizationSettings) {
  Write-Error "inventory-api debe exportar authorizationSettings"
}
$permissionPolicies = $apiClient.authorizationSettings.policies | Where-Object { $_.type -in @('scope', 'resource') }
if (@($permissionPolicies).Count -lt 1) {
  Write-Error "Authorization Services debe exportar permisos dentro de policies"
}
if ($apiClient.authorizationSettings.PSObject.Properties.Name -contains 'permissions') {
  Write-Error "Keycloak 26 no acepta authorizationSettings.permissions; usar policies"
}

$adminClient = $realm.clients | Where-Object { $_.clientId -eq 'inventory-admin-api' } | Select-Object -First 1
if (-not $adminClient.serviceAccountsEnabled) {
  Write-Error "inventory-admin-api debe tener service account habilitado"
}
if ($adminClient.secret -ne 'inventory-admin-secret-change-me') {
  Write-Error "inventory-admin-api debe usar el secret reproducible de dev/test"
}
$serviceAccount = $realm.users | Where-Object { $_.serviceAccountClientId -eq 'inventory-admin-api' } | Select-Object -First 1
$serviceRoles = @($serviceAccount.clientRoles.'realm-management')
foreach ($role in @('query-users', 'view-users', 'manage-users', 'view-realm', 'manage-realm')) {
  if ($serviceRoles -notcontains $role) {
    Write-Error "Falta rol realm-management en service account: $role"
  }
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
Write-Host "OK realm-export.json v$version - realm inventory-realm, clients, scopes and policies validated."
