# Verificación checklist Avance Proyecto V3 — ejecutar desde la raíz del monorepo
# Uso: .\scripts\verify-avance-v3.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Avance V3 — verificación automatizada ===" -ForegroundColor Cyan

$script:results = @()

function Test-Step($Name, $ScriptBlock) {
    try {
        & $ScriptBlock
        $script:results += [PSCustomObject]@{ Criterio = $Name; Estado = "OK" }
        Write-Host "[OK] $Name" -ForegroundColor Green
    } catch {
        $script:results += [PSCustomObject]@{ Criterio = $Name; Estado = "FALLO: $($_.Exception.Message)" }
        Write-Host "[FAIL] $Name — $($_.Exception.Message)" -ForegroundColor Red
    }
}

Test-Step "README existe" { if (-not (Test-Path README.md)) { throw "README.md no encontrado" } }
Test-Step "Docker Compose dev" { if (-not (Test-Path docker-compose.dev.yml)) { throw "compose dev ausente" } }
Test-Step "Keycloak realm export" { if (-not (Test-Path keycloak/realm-export.json)) { throw "realm ausente" } }
Test-Step "Flyway migrations (>=4)" {
    $count = (Get-ChildItem backend/src/main/resources/db/migration/*.sql).Count
    if ($count -lt 4) { throw "Solo $count migraciones" }
}
Test-Step "Postman >=10 escenarios" {
    $json = Get-Content tests/api/inventory-qas.postman_collection.json -Raw | ConvertFrom-Json
    if ($json.item.Count -lt 10) { throw "Solo $($json.item.Count) escenarios" }
}
Test-Step "Playwright specs" {
    $specs = @(Get-ChildItem tests/e2e/specs/*.spec.ts)
    if ($specs.Count -lt 2) { throw "Faltan specs E2E" }
}
Test-Step "Grafana dashboard JSON" {
    if (-not (Test-Path observability/grafana/provisioning/dashboards/json/inventory-api.json)) {
        throw "dashboard ausente"
    }
}
Test-Step "Jenkinsfile" { if (-not (Test-Path Jenkinsfile)) { throw "Jenkinsfile ausente" } }
Test-Step "GitHub Actions CI" { if (-not (Test-Path .github/workflows/ci.yml)) { throw "ci.yml ausente" } }

Write-Host "`n--- Backend mvn verify (puede tardar) ---" -ForegroundColor Yellow
Push-Location backend
try {
    .\mvnw.cmd -q -B verify
    $script:results += [PSCustomObject]@{ Criterio = "mvn verify + JaCoCo 60%"; Estado = "OK" }
    Write-Host "[OK] mvn verify + JaCoCo" -ForegroundColor Green
} catch {
    $script:results += [PSCustomObject]@{ Criterio = "mvn verify + JaCoCo 60%"; Estado = "FALLO" }
    Write-Host "[FAIL] mvn verify" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host "`n--- Frontend build ---" -ForegroundColor Yellow
Push-Location frontend
try {
    if (-not (Test-Path node_modules)) { npm ci 2>$null; if ($LASTEXITCODE -ne 0) { npm install } }
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "build falló" }
    $script:results += [PSCustomObject]@{ Criterio = "npm run build"; Estado = "OK" }
    Write-Host "[OK] frontend build" -ForegroundColor Green
} catch {
    $script:results += [PSCustomObject]@{ Criterio = "npm run build"; Estado = "FALLO" }
    Write-Host "[FAIL] frontend build" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host "`n=== Resumen ===" -ForegroundColor Cyan
$script:results | Format-Table -AutoSize
$fail = ($script:results | Where-Object { $_.Estado -notlike "OK" }).Count
if ($fail -gt 0) { exit 1 }
