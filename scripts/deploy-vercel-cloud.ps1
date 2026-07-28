# Deploy Vercel staging + production (frontends) against cloud API/Keycloak.
# Usage (PowerShell):
#   $env:CLOUD_API_URL="https://cub-api.onrender.com"
#   $env:CLOUD_KC_URL="https://cub-keycloak.onrender.com"
#   .\scripts\deploy-vercel-cloud.ps1

param(
  [string]$ApiUrl = $env:CLOUD_API_URL,
  [string]$KeycloakUrl = $env:CLOUD_KC_URL,
  [string]$Scope = "josvierrs-projects"
)

$ErrorActionPreference = "Stop"
if (-not $ApiUrl -or -not $KeycloakUrl) {
  Write-Error "Set CLOUD_API_URL and CLOUD_KC_URL (e.g. Render https://cub-api.onrender.com)."
}

$ApiUrl = $ApiUrl.TrimEnd("/")
$KeycloakUrl = $KeycloakUrl.TrimEnd("/")
$front = Join-Path $PSScriptRoot "..\frontend" | Resolve-Path

function Deploy-Cub([string]$Project, [string]$AppUrl) {
  Write-Host "Deploying $Project -> $AppUrl"
  Push-Location $front
  try {
    npx --yes vercel link --yes --project $Project --scope $Scope | Out-Host
    npx --yes vercel --prod --yes --scope $Scope `
      --build-env "NEXT_PUBLIC_API_URL=$ApiUrl/api/v1" `
      --build-env "NEXT_PUBLIC_KEYCLOAK_URL=$KeycloakUrl" `
      --build-env "NEXT_PUBLIC_KEYCLOAK_REALM=inventory-realm" `
      --build-env "NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=inventory-frontend" `
      --build-env "NEXT_PUBLIC_KEYCLOAK_API_CLIENT_ID=inventory-api" `
      --build-env "NEXT_PUBLIC_APP_URL=$AppUrl" `
      --env "NEXT_PUBLIC_API_URL=$ApiUrl/api/v1" `
      --env "NEXT_PUBLIC_KEYCLOAK_URL=$KeycloakUrl" `
      --env "NEXT_PUBLIC_KEYCLOAK_REALM=inventory-realm" `
      --env "NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=inventory-frontend" `
      --env "NEXT_PUBLIC_KEYCLOAK_API_CLIENT_ID=inventory-api" `
      --env "NEXT_PUBLIC_APP_URL=$AppUrl" | Out-Host
  } finally {
    Pop-Location
  }
}

Deploy-Cub "cub-inventory-qas" "https://cub-inventory-qas.vercel.app"
Deploy-Cub "cub-inventory-qas-prod" "https://cub-inventory-qas-prod.vercel.app"
Write-Host "Done. Staging + Production frontends updated."
