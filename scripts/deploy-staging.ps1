# Deploy staging - Inventory QAS (QA-8)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host 'Levantando stack staging (dev + observabilidad + staging)...' -ForegroundColor Cyan
docker compose `
  -f docker-compose.dev.yml `
  -f docker-compose.observability.yml `
  -f docker-compose.staging.yml `
  up -d --build

Write-Host 'Esperando servicios...' -ForegroundColor Cyan
Start-Sleep -Seconds 90

& "$Root\scripts\post-deploy-smoke.ps1"
