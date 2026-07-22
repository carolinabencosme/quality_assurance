# Genera artefactos de evidencia para Avance V3
# Uso: .\scripts\generate-qa-evidence.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$outDir = "docs/qa-evidence"
$shotDir = "$outDir/screenshots"
New-Item -ItemType Directory -Force -Path $shotDir | Out-Null

Write-Host "Generando evidencias en $outDir ..." -ForegroundColor Cyan

# JaCoCo
Push-Location backend
.\mvnw.cmd -q -B verify
$jacocoHtml = "target/site/jacoco/index.html"
$jacocoReport = "$outDir/jacoco-report-path.txt"
"JaCoCo HTML: backend/$jacocoHtml`nGenerado: $(Get-Date -Format o)" | Set-Content $jacocoReport -Encoding UTF8
Pop-Location
& "$root\scripts\generate-jacoco-summary.ps1"
& "$root\scripts\generate-surefire-summary.ps1"
& "$root\scripts\verify-keycloak-it-report.ps1"

# Resumen de tests Surefire
# The aggregate summary above reads every TEST-*.xml file and rejects skips.

# Capturas E2E (requiere stack en localhost:3000)
if (Test-Path tests/e2e/package.json) {
    Push-Location tests/e2e
    if (-not (Test-Path node_modules)) { npm install }
    $env:EVIDENCE_DIR = (Resolve-Path "../../$shotDir").Path
    try {
        npx playwright test specs/capture-evidence.spec.ts --reporter=line 2>&1
        Write-Host "Capturas E2E generadas en $shotDir" -ForegroundColor Green
    } catch {
        Write-Host "Capturas E2E omitidas (levantar Docker dev primero): $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Pop-Location
}

Write-Host "Listo. Revisar:" -ForegroundColor Green
Write-Host "  - $outDir/test-execution-summary.md"
Write-Host "  - $outDir/jacoco-report-path.txt"
Write-Host "  - $outDir/jacoco-summary.md"
Write-Host "  - $shotDir/"
