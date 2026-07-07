# Ejecuta la bateria de tests desde la raiz del repo (rutas correctas).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Raiz: $root ===" -ForegroundColor Cyan

# Testcontainers en Windows: Maven/Java no usa el mismo socket que `docker compose`.
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = '//./pipe/docker_engine'

Write-Host "`n[1/5] Backend mvn verify..." -ForegroundColor Cyan
Push-Location backend
.\mvnw.cmd verify
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "`n[2/5] API Newman..." -ForegroundColor Cyan
Push-Location tests\api
if (-not (Test-Path node_modules)) { npm install }
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=$sku"
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "`n[3/5] E2E Playwright..." -ForegroundColor Cyan
Push-Location tests\e2e
if (-not (Test-Path node_modules)) { npm install }
npx playwright install chromium
$env:E2E_BASE_URL = 'http://localhost:3000'
npm test
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "`n[4/5] Security smoke..." -ForegroundColor Cyan
& "$root\tests\security\auth-smoke.ps1"

Write-Host "`n[5/6] Observability smoke..." -ForegroundColor Cyan
& "$root\tests\observability\smoke.ps1"

Write-Host "`n[6/6] k6 performance smoke (optional)..." -ForegroundColor Cyan
if ($env:RUN_K6_SMOKE -eq 'true') {
    & "$root\scripts\run-k6.ps1"
} else {
    Write-Host "SKIP: set RUN_K6_SMOKE=true to execute k6." -ForegroundColor Yellow
}

Write-Host "`n=== TODOS LOS TESTS OK ===" -ForegroundColor Green
