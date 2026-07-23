# Verifica que el monorepo cumple la estructura del plan tecnico (QA-10).
# Uso: .\scripts\verify-monorepo-structure.ps1
# Exit 0 = OK, 1 = faltan rutas

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root "README.md"))) {
    $root = Get-Location
}

$requiredDirs = @(
    "backend",
    "frontend",
    "docker",
    "keycloak",
    "observability",
    "tests",
    "docs",
    ".github/workflows"
)

$requiredFiles = @(
    "README.md",
    ".env.example",
    ".gitignore",
    "Jenkinsfile",
    "docker-compose.dev.yml",
    "docker-compose.staging.yml",
    "docker-compose.test.yml",
    "sonar-project.properties",
    "keycloak/realm-export.json",
    ".github/workflows/ci.yml",
    "backend/pom.xml",
    "frontend/package.json",
    "docs/monorepo-structure.md"
)

$missing = @()

foreach ($d in $requiredDirs) {
    $path = Join-Path $root $d
    if (-not (Test-Path $path)) { $missing += "DIR  $d" }
}

foreach ($f in $requiredFiles) {
    $path = Join-Path $root $f
    if (-not (Test-Path $path)) { $missing += "FILE $f" }
}

if ($missing.Count -gt 0) {
    Write-Host "FALTA estructura monorepo (QA-10):" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  $_" }
    exit 1
}

Write-Host "OK: estructura monorepo conforme al plan tecnico (QA-10)" -ForegroundColor Green
Write-Host "Raiz: $root"
exit 0
