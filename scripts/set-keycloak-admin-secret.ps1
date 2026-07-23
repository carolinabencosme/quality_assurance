param(
  [string]$KeycloakBase = $(if ($env:KEYCLOAK_PUBLIC_URL) { $env:KEYCLOAK_PUBLIC_URL } else { 'http://localhost:8081' }),
  [string]$Realm = $(if ($env:KEYCLOAK_REALM) { $env:KEYCLOAK_REALM } else { 'inventory-realm' }),
  [string]$ClientId = $(if ($env:KEYCLOAK_ADMIN_CLIENT_ID) { $env:KEYCLOAK_ADMIN_CLIENT_ID } else { 'inventory-admin-api' }),
  [string]$AdminUser = $(if ($env:KEYCLOAK_ADMIN) { $env:KEYCLOAK_ADMIN } else { 'admin' }),
  [string]$AdminPassword = $(if ($env:KEYCLOAK_ADMIN_PASSWORD) { $env:KEYCLOAK_ADMIN_PASSWORD } else { '' }),
  [string]$ClientSecret = $env:KEYCLOAK_ADMIN_CLIENT_SECRET
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
  throw 'KEYCLOAK_ADMIN_PASSWORD is required.'
}
if ([string]::IsNullOrWhiteSpace($ClientSecret)) {
  throw 'KEYCLOAK_ADMIN_CLIENT_SECRET is required.'
}
if ($ClientSecret -eq 'inventory-admin-secret-change-me' -or $ClientSecret -like 'SET_IN_ENV_*') {
  throw 'Refusing to use the development placeholder as a production client secret.'
}

$tokenBody = @{
  grant_type = 'password'
  client_id = 'admin-cli'
  username = $AdminUser
  password = $AdminPassword
}
$adminToken = (Invoke-RestMethod -Method Post `
  -Uri "$KeycloakBase/realms/master/protocol/openid-connect/token" `
  -ContentType 'application/x-www-form-urlencoded' -Body $tokenBody).access_token
$headers = @{ Authorization = "Bearer $adminToken" }

$clients = Invoke-RestMethod -Method Get `
  -Uri "$KeycloakBase/admin/realms/$Realm/clients?clientId=$([uri]::EscapeDataString($ClientId))" `
  -Headers $headers
if (@($clients).Count -ne 1) {
  throw "Expected exactly one Keycloak client named $ClientId; found $(@($clients).Count)."
}

$client = @($clients)[0]
$client.secret = $ClientSecret
$payload = $client | ConvertTo-Json -Depth 30
Invoke-RestMethod -Method Put `
  -Uri "$KeycloakBase/admin/realms/$Realm/clients/$($client.id)" `
  -Headers $headers -ContentType 'application/json' -Body $payload | Out-Null

$probe = Invoke-RestMethod -Method Post `
  -Uri "$KeycloakBase/realms/$Realm/protocol/openid-connect/token" `
  -ContentType 'application/x-www-form-urlencoded' `
  -Body @{ grant_type = 'client_credentials'; client_id = $ClientId; client_secret = $ClientSecret }
if ([string]::IsNullOrWhiteSpace($probe.access_token)) {
  throw 'Client credentials verification did not return an access token.'
}

Write-Host "OK: Keycloak client secret rotated and client_credentials verified for $ClientId."
