# Post-deploy smoke - Fase 6 (QA-8) - Windows
$ErrorActionPreference = 'Stop'
$Api = if ($env:API_BASE) { $env:API_BASE } else { 'http://localhost:8080' }
$Keycloak = if ($env:KEYCLOAK_BASE) { $env:KEYCLOAK_BASE } else { 'http://localhost:8081' }
$Frontend = if ($env:FRONTEND_BASE) { $env:FRONTEND_BASE } else { 'http://localhost:3000' }
$MaxWait = if ($env:SMOKE_MAX_WAIT) { [int]$env:SMOKE_MAX_WAIT } else { 180 }

function Wait-Http($Url, $Name) {
  $elapsed = 0
  while ($elapsed -lt $MaxWait) {
    try {
      $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
        Write-Host ('OK  ' + $Name) -ForegroundColor Green
        return
      }
    } catch { }
    Start-Sleep -Seconds 5
    $elapsed += 5
  }
  throw "$Name timeout ($Url)"
}

Write-Host '=== Post-deploy smoke ===' -ForegroundColor Cyan
Wait-Http "$Api/actuator/health" 'Backend health'
Wait-Http $Frontend 'Frontend'
Wait-Http "$Keycloak/realms/inventory-realm" 'Keycloak'

try {
  Invoke-WebRequest -Uri "$Api/api/v1/products" -UseBasicParsing | Out-Null
  throw 'API sin token deberia ser 401'
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) {
    Write-Host 'OK  API sin token -> 401' -ForegroundColor Green
  } else { throw }
}

$body = 'grant_type=password&client_id=inventory-frontend&username=viewer&password=viewer123'
$token = (Invoke-RestMethod -Method Post -Uri "$Keycloak/realms/inventory-realm/protocol/openid-connect/token" `
  -ContentType 'application/x-www-form-urlencoded' -Body $body).access_token
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "$Api/api/v1/reports/dashboard" -Headers $headers | Out-Null
Write-Host 'OK  Dashboard API -> 200' -ForegroundColor Green

if (Test-Path 'tests\observability\smoke.ps1') {
  & '.\tests\observability\smoke.ps1'
}

Write-Host '=== PASS ===' -ForegroundColor Green
