# Actualiza redirect URIs del client inventory-frontend en Keycloak cloud
# (arregla "Invalid parameter: redirect_uri" desde Vercel).
#
#   .\scripts\fix-keycloak-vercel-redirects.ps1

param(
  [string]$KeycloakUrl = $(if ($env:CLOUD_KC_URL) { $env:CLOUD_KC_URL } else { 'https://cub-keycloak.onrender.com' }),
  [string]$AdminUser = 'admin',
  [string]$AdminPassword = 'admin'
)

$ErrorActionPreference = 'Stop'
$KeycloakUrl = $KeycloakUrl.TrimEnd('/')

Write-Host "=== Fix Vercel redirect_uri on $KeycloakUrl ===" -ForegroundColor Cyan

$tokenBody = "grant_type=password&client_id=admin-cli&username=$AdminUser&password=$AdminPassword"
$tok = Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" `
  -ContentType 'application/x-www-form-urlencoded' -Body $tokenBody -TimeoutSec 60
$headers = @{ Authorization = "Bearer $($tok.access_token)"; 'Content-Type' = 'application/json' }

$clients = Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/inventory-realm/clients?clientId=inventory-frontend" -Headers $headers -TimeoutSec 45
if (-not $clients -or $clients.Count -lt 1) { throw 'Client inventory-frontend not found' }
$cid = $clients[0].id
$client = Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/inventory-realm/clients/$cid" -Headers $headers -TimeoutSec 45

$uris = @(
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/*',
  'http://127.0.0.1:3000/auth/callback',
  'http://127.0.0.1:3000/*',
  'https://cub-inventory-qas.vercel.app/auth/callback',
  'https://cub-inventory-qas.vercel.app/*',
  'https://cub-inventory-qas-prod.vercel.app/auth/callback',
  'https://cub-inventory-qas-prod.vercel.app/*',
  'https://*.vercel.app/auth/callback',
  'https://*.vercel.app/*'
)
$origins = @(
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://cub-inventory-qas.vercel.app',
  'https://cub-inventory-qas-prod.vercel.app',
  'https://*.vercel.app',
  '+'
)

$client.redirectUris = $uris
$client.webOrigins = $origins
$client.attributes.'post.logout.redirect.uris' = '+'

$body = $client | ConvertTo-Json -Depth 30 -Compress
# PowerShell ConvertTo-Json can break nested structures; use Node if available
$tmp = Join-Path $env:TEMP 'kc-client-vercel.json'
node -e @"
const fs=require('fs');
const c=JSON.parse(process.argv[1]);
c.redirectUris=$(ConvertTo-Json $uris -Compress);
c.webOrigins=$(ConvertTo-Json $origins -Compress);
if(!c.attributes) c.attributes={};
c.attributes['post.logout.redirect.uris']='+';
fs.writeFileSync(process.argv[2], JSON.stringify(c));
"@ ($client | ConvertTo-Json -Depth 30 -Compress) $tmp 2>$null

if (-not (Test-Path $tmp) -or ((Get-Item $tmp).Length -lt 50)) {
  # Fallback: rebuild minimal PUT via fetching raw and patching with node only
  $rawPath = Join-Path $env:TEMP 'kc-client-raw.json'
  Invoke-WebRequest -Uri "$KeycloakUrl/admin/realms/inventory-realm/clients/$cid" -Headers @{ Authorization = "Bearer $($tok.access_token)" } -OutFile $rawPath -TimeoutSec 45
  node -e @"
const fs=require('fs');
const c=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
c.redirectUris=$(ConvertTo-Json $uris -Compress);
c.webOrigins=$(ConvertTo-Json $origins -Compress);
if(!c.attributes) c.attributes={};
c.attributes['post.logout.redirect.uris']='+';
fs.writeFileSync(process.argv[2], JSON.stringify(c));
"@ $rawPath $tmp
}

Invoke-RestMethod -Method Put -Uri "$KeycloakUrl/admin/realms/inventory-realm/clients/$cid" `
  -Headers $headers -InFile $tmp -ContentType 'application/json' -TimeoutSec 60 | Out-Null

$check = Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/inventory-realm/clients/$cid" -Headers $headers -TimeoutSec 45
Write-Host 'OK redirectUris:' -ForegroundColor Green
$check.redirectUris | ForEach-Object { Write-Host "  $_" }
Write-Host 'Retry login: https://cub-inventory-qas.vercel.app'
