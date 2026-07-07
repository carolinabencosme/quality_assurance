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

# Resumen de tests Surefire
$surefireDir = "backend/target/surefire-reports"
if (Test-Path $surefireDir) {
    $xml = Get-ChildItem $surefireDir -Filter "TEST-*.xml" | Select-Object -First 1
    if ($xml) {
        [xml]$doc = Get-Content $xml.FullName
        $tests = $doc.testsuite
        @"
# Resumen de pruebas - $(Get-Date -Format 'yyyy-MM-dd HH:mm')

| Metrica | Valor |
|---------|-------|
| Tests ejecutados | $($tests.tests) |
| Fallos | $($tests.failures) |
| Errores | $($tests.errors) |
| Omitidos | $($tests.skipped) |
| Tiempo (s) | $($tests.time) |

Comando: ``cd backend && .\mvnw.cmd verify``
Reporte JaCoCo: ``backend/target/site/jacoco/index.html``
Umbral minimo: **60% lineas** (``jacoco-check`` en pom.xml)
"@ | Set-Content "$outDir/test-execution-summary.md" -Encoding UTF8
    }
}

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
Write-Host "  - $shotDir/"
