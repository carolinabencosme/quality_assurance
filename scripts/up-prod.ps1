$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env.prod'

if (-not (Test-Path $envFile)) {
  throw "Missing .env.prod. Copy .env.prod.example to .env.prod and set production values."
}

Set-Location $root
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml --env-file .env.prod up -d --build
