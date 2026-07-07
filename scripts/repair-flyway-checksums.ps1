# Repara checksums Flyway cuando el volumen Postgres conserva historial antiguo.
# Uso: .\scripts\repair-flyway-checksums.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$migrations = Join-Path $root 'backend\src\main\resources\db\migration'
$mount = $migrations -replace '\\', '/'
if ($mount -match '^[A-Za-z]:') {
  $mount = "/$($mount.Substring(0,1).ToLower())$($mount.Substring(2))"
}

Write-Host 'Flyway repair en red inventory-qas_inventory-net...' -ForegroundColor Cyan
docker run --rm --network inventory-qas_inventory-net `
  -v "${mount}:/flyway/sql:ro" `
  -e FLYWAY_URL=jdbc:postgresql://postgres:5432/inventory `
  -e FLYWAY_USER=inventory_user `
  -e FLYWAY_PASSWORD=inventory_password `
  -e FLYWAY_LOCATIONS=filesystem:/flyway/sql `
  flyway/flyway:10-alpine repair

Write-Host 'OK: flyway repair completado. Reinicia backend si seguia en error.' -ForegroundColor Green
