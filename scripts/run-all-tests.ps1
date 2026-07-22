# Ejecuta la bateria de tests desde la raiz del repo (rutas correctas).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Raiz: $root ===" -ForegroundColor Cyan

# Testcontainers en Windows: Maven/Java no usa el mismo socket que `docker compose`.
$env:DOCKER_HOST = 'npipe:////./pipe/docker_engine'
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = '//./pipe/docker_engine'
# Docker Desktop + named pipes cannot mount the Ryuk cleanup socket reliably.
# JUnit still stops the declared containers; Ryuk remains enabled in Linux CI.
$env:TESTCONTAINERS_RYUK_DISABLED = 'true'

function Invoke-CheckedNative {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    # PowerShell 5.1 promotes some native stderr lines to ErrorRecord objects.
    # Merge stderr inside cmd.exe so warnings cannot abort this orchestrator.
    & cmd.exe /d /s /c "$Command 2>&1"
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "Native command failed with exit code ${exitCode}: $Command"
    }
}

Write-Host "`n[1/6] Backend mvn verify..." -ForegroundColor Cyan
Push-Location backend
Invoke-CheckedNative '.\mvnw.cmd verify'
Pop-Location
& "$root\scripts\verify-keycloak-it-report.ps1"

Write-Host "`n[2/6] API Newman..." -ForegroundColor Cyan
Push-Location tests\api
if (-not (Test-Path node_modules)) {
    Invoke-CheckedNative 'npm install'
}
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
Invoke-CheckedNative "npm test -- --env-var baseUrl=http://localhost:8080 --env-var keycloakUrl=http://localhost:8081 --env-var sku=$sku"
Pop-Location

Write-Host "`n[3/6] E2E Playwright..." -ForegroundColor Cyan
Push-Location tests\e2e
if (-not (Test-Path node_modules)) {
    Invoke-CheckedNative 'npm install'
}
Invoke-CheckedNative 'npx playwright install chromium'
$env:E2E_BASE_URL = 'http://localhost:3000'
Invoke-CheckedNative 'npm test'
Pop-Location

Write-Host "`n[4/6] Security smoke..." -ForegroundColor Cyan
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
