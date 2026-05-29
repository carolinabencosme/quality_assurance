# Valida migraciones Flyway V1-V7 contra PostgreSQL efímero (QA-17).
# Requiere: Docker Desktop
# Uso: .\scripts\validate-flyway-migrations.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$migrations = Join-Path $root "backend\src\main\resources\db\migration"

$versions = @(
    "V1__create_categories_table.sql",
    "V2__create_products_table.sql",
    "V3__create_stock_movements_table.sql",
    "V4__create_users_profile_table.sql",
    "V5__create_envers_audit_tables.sql",
    "V6__seed_initial_catalog.sql",
    "V7__add_indexes_and_constraints.sql"
)

foreach ($v in $versions) {
    if (-not (Test-Path (Join-Path $migrations $v))) {
        Write-Host "FALTA: $v" -ForegroundColor Red
        exit 1
    }
}

$extra = Get-ChildItem $migrations -Filter "V*.sql" | Where-Object {
    $versions -notcontains $_.Name
}
if ($extra) {
    Write-Host "FALTA: archivos SQL no permitidos (solo V1-V7):" -ForegroundColor Red
    $extra | ForEach-Object { Write-Host "  $($_.Name)" }
    exit 1
}

Write-Host "OK: estructura V1-V7 presente" -ForegroundColor Green

$dockerOk = $true
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) { $dockerOk = $false }
} catch {
    $dockerOk = $false
}
if (-not $dockerOk) {
    Write-Host "AVISO: Docker no disponible; omitiendo migrate (inicie Docker Desktop y vuelva a ejecutar)" -ForegroundColor Yellow
    exit 0
}

$pg = "inventory-flyway-pg-qa17"
$network = "inventory-flyway-net-qa17"
$db = "inventory"
$user = "inventory_user"
$pass = "inventory_password"

function Cleanup {
    $ErrorActionPreference = "SilentlyContinue"
    docker rm -f $pg | Out-Null
    docker network rm $network | Out-Null
    $ErrorActionPreference = "Stop"
}

Cleanup
docker network create $network | Out-Null

Write-Host "Iniciando PostgreSQL..."
docker run -d --name $pg --network $network `
    -e POSTGRES_DB=$db -e POSTGRES_USER=$user -e POSTGRES_PASSWORD=$pass `
    postgres:16-alpine | Out-Null

$ready = $false
for ($i = 0; $i -lt 45; $i++) {
    docker exec $pg pg_isready -U $user -d $db 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Cleanup
    Write-Host "PostgreSQL no arranco a tiempo" -ForegroundColor Red
    exit 1
}

$mount = $migrations -replace '\\', '/'
if ($mount -match '^[A-Za-z]:') {
    $mount = "/$($mount.Substring(0,1).ToLower())$($mount.Substring(2))"
}

Write-Host "Ejecutando Flyway migrate..."
docker run --rm --network $network `
    -v "${mount}:/flyway/sql:ro" `
    -e "FLYWAY_URL=jdbc:postgresql://${pg}:5432/${db}" `
    -e "FLYWAY_USER=$user" `
    -e "FLYWAY_PASSWORD=$pass" `
    -e "FLYWAY_LOCATIONS=filesystem:/flyway/sql" `
    -e "FLYWAY_CONNECT_RETRIES=10" `
    flyway/flyway:10-alpine migrate

$flywayOk = $LASTEXITCODE -eq 0
Cleanup

if (-not $flywayOk) {
    Write-Host "FALTA: Flyway migrate fallo" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Flyway V1-V7 aplicadas correctamente (QA-17)" -ForegroundColor Green
exit 0
