# Deja SonarQube local profesional: crea proyecto Cub, genera token, corre analisis + Quality Gate.
# URL esperada: http://localhost:9001
#
# Uso:
#   .\scripts\setup-sonar-and-scan.ps1
#
# Si en el browser cambiaste el password de admin:
#   $env:SONAR_ADMIN_PASSWORD = 'TuPasswordNuevo'
#   .\scripts\setup-sonar-and-scan.ps1
#
# Password demo recomendada (documentada): CubSonar2026!
#   (si aun es admin/admin, este script la cambia automaticamente)

param(
  [string]$SonarHostUrl = $(if ($env:SONAR_HOST_URL) { $env:SONAR_HOST_URL } else { 'http://localhost:9001' }),
  [string]$AdminUser = $(if ($env:SONAR_ADMIN_USER) { $env:SONAR_ADMIN_USER } else { 'admin' }),
  [string]$AdminPassword = $(if ($env:SONAR_ADMIN_PASSWORD) { $env:SONAR_ADMIN_PASSWORD } else { '' }),
  [string]$DemoPassword = $(if ($env:SONAR_DEMO_PASSWORD) { $env:SONAR_DEMO_PASSWORD } else { 'CubSonar2026!' }),
  [string]$ProjectKey = 'inventory-qas',
  [string]$ProjectName = 'Cub Inventory QAS',
  [string]$OutputPath = 'docs/qa-evidence/sonar-summary.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Sonar setup + scan ===" -ForegroundColor Cyan
Write-Host "Host: $SonarHostUrl"
Write-Host "Project: $ProjectKey ($ProjectName)"

function Get-BasicAuthHeader([string]$User, [string]$Pass) {
  $pair = "{0}:{1}" -f $User, $Pass
  $bytes = [Text.Encoding]::ASCII.GetBytes($pair)
  return @{ Authorization = "Basic $([Convert]::ToBase64String($bytes))" }
}

function Test-SonarLogin([string]$Url, [string]$User, [string]$Pass) {
  if ([string]::IsNullOrWhiteSpace($Pass)) { return $false }
  try {
    $h = Get-BasicAuthHeader $User $Pass
    $v = Invoke-RestMethod -Uri "$Url/api/authentication/validate" -Headers $h -TimeoutSec 15
    return [bool]$v.valid
  } catch {
    return $false
  }
}

function Invoke-SonarForm([string]$Method, [string]$Url, [hashtable]$Headers, [hashtable]$Body) {
  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -Body $Body -ContentType 'application/x-www-form-urlencoded' -TimeoutSec 45
}

$ready = $false
for ($i = 1; $i -le 60; $i++) {
  try {
    $st = Invoke-RestMethod -Uri "$SonarHostUrl/api/system/status" -TimeoutSec 10
    if ($st.status -eq 'UP') { $ready = $true; break }
  } catch {}
  Write-Host "Waiting Sonar UP... ($i/60)"
  Start-Sleep -Seconds 5
}
if (-not $ready) { throw "SonarQube no esta UP en $SonarHostUrl. Levanta staging compose primero." }

# Resolver password admin (sin adivinar secretos del usuario)
$resolvedPassword = $null
$candidates = @()
if (-not [string]::IsNullOrWhiteSpace($AdminPassword)) { $candidates += $AdminPassword }
$candidates += @($DemoPassword, 'admin')

foreach ($cand in $candidates | Select-Object -Unique) {
  if (Test-SonarLogin $SonarHostUrl $AdminUser $cand) {
    $resolvedPassword = $cand
    Write-Host "OK login Sonar con usuario $AdminUser"
    break
  }
}

# Primera instalacion: admin/admin suele obligar a cambiar password.
# Si admin/admin responde invalid pero el change_password acepta previousPassword=admin, fijamos demo.
if (-not $resolvedPassword) {
  Write-Host "Login default fallido. Intentando fijar password demo ($DemoPassword) desde admin/admin..."
  try {
    $tmpHeaders = Get-BasicAuthHeader $AdminUser 'admin'
    Invoke-SonarForm -Method Post -Url "$SonarHostUrl/api/users/change_password" -Headers $tmpHeaders -Body @{
      login            = $AdminUser
      previousPassword = 'admin'
      password         = $DemoPassword
    } | Out-Null
  } catch {
    # Puede fallar si ya no es admin/admin; se maneja abajo.
  }
  if (Test-SonarLogin $SonarHostUrl $AdminUser $DemoPassword) {
    $resolvedPassword = $DemoPassword
    Write-Host "OK password demo aplicada: $DemoPassword"
  }
}

if (-not $resolvedPassword) {
  throw @"
No se pudo autenticar en Sonar ($AdminUser).

Causa tipica: en el browser cambiaste el password de admin y ya no es 'admin'.

Solucion A (recomendada):
  `$env:SONAR_ADMIN_PASSWORD = 'el-password-que-pusiste-en-el-browser'
  .\scripts\setup-sonar-and-scan.ps1

Solucion B (reset limpio Sonar, borra datos de analisis previos):
  docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml stop sonarqube sonar-db
  docker volume rm quality_assurance_sonarqube_data quality_assurance_sonar_db_data 2>`$null
  docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d sonar-db sonarqube
  # espera ~1-2 min a que este UP, luego:
  .\scripts\setup-sonar-and-scan.ps1
"@
}

# Si aun es admin/admin, forzar password demo documentada (Sonar lo exige en primer uso)
if ($resolvedPassword -eq 'admin' -and $DemoPassword -ne 'admin') {
  Write-Host "Cambiando password admin -> demo documentada ($DemoPassword)..."
  $changeHeaders = Get-BasicAuthHeader $AdminUser 'admin'
  try {
    Invoke-SonarForm -Method Post -Url "$SonarHostUrl/api/users/change_password" -Headers $changeHeaders -Body @{
      login            = $AdminUser
      previousPassword = 'admin'
      password         = $DemoPassword
    } | Out-Null
    if (Test-SonarLogin $SonarHostUrl $AdminUser $DemoPassword) {
      $resolvedPassword = $DemoPassword
      Write-Host "OK password demo: admin / $DemoPassword"
    }
  } catch {
    Write-Host "WARN: no se pudo cambiar password (se continua con la actual). $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

$headers = Get-BasicAuthHeader $AdminUser $resolvedPassword

# Crear proyecto si no existe (idempotente)
$projectExists = $false
try {
  $exists = Invoke-RestMethod -Uri "$SonarHostUrl/api/components/show?component=$ProjectKey" -Headers $headers -TimeoutSec 20
  if ($exists.component) {
    $projectExists = $true
    Write-Host "OK proyecto ya existe: $ProjectKey"
  }
} catch {
  $projectExists = $false
}

if (-not $projectExists) {
  Write-Host "Creando proyecto $ProjectKey..."
  Invoke-SonarForm -Method Post -Url "$SonarHostUrl/api/projects/create" -Headers $headers -Body @{
    project    = $ProjectKey
    name       = $ProjectName
    mainBranch = 'main'
  } | Out-Null
  Write-Host "OK proyecto creado"
}

# Token de analisis (nombre unico)
$tokenName = "cub-local-$(Get-Date -Format 'yyyyMMddHHmmss')"
$tokenResp = Invoke-SonarForm -Method Post -Url "$SonarHostUrl/api/user_tokens/generate" -Headers $headers -Body @{
  name = $tokenName
  type = 'PROJECT_ANALYSIS_TOKEN'
  projectKey = $ProjectKey
}
# Fallback si la edicion no acepta PROJECT_ANALYSIS_TOKEN
if ([string]::IsNullOrWhiteSpace($tokenResp.token)) {
  $tokenResp = Invoke-SonarForm -Method Post -Url "$SonarHostUrl/api/user_tokens/generate" -Headers $headers -Body @{
    name = $tokenName
  }
}
$sonarToken = $tokenResp.token
if ([string]::IsNullOrWhiteSpace($sonarToken)) { throw 'Sonar no devolvio token de analisis.' }
Write-Host "OK token generado: $tokenName"
$env:SONAR_TOKEN = $sonarToken
$env:SONAR_HOST_URL = $SonarHostUrl
$env:SONAR_ADMIN_PASSWORD = $resolvedPassword

# Analisis Maven (tests + JaCoCo + sonar + quality gate wait)
Push-Location (Join-Path $root 'backend')
try {
  Write-Host "Ejecutando mvn verify sonar:sonar (puede tardar varios minutos)..." -ForegroundColor Yellow
  $env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = '//./pipe/docker_engine'
  $env:TESTCONTAINERS_RYUK_DISABLED = 'true'
  .\mvnw.cmd -B verify sonar:sonar `
    "-Dsonar.projectKey=$ProjectKey" `
    "-Dsonar.projectName=$ProjectName" `
    "-Dsonar.host.url=$SonarHostUrl" `
    "-Dsonar.token=$sonarToken" `
    '-Dsonar.qualitygate.wait=true' `
    '-Dsonar.qualitygate.timeout=600'
  if ($LASTEXITCODE -ne 0) { throw "Sonar/Maven fallo con exit code $LASTEXITCODE" }
} finally {
  Pop-Location
}

# Resumen evidencia
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${sonarToken}:"))
$th = @{ Authorization = "Basic $basic" }
$metricKeys = 'coverage,bugs,vulnerabilities,code_smells,duplicated_lines_density'
$measures = Invoke-RestMethod -Uri "$SonarHostUrl/api/measures/component?component=$ProjectKey&metricKeys=$metricKeys" -Headers $th
$gate = Invoke-RestMethod -Uri "$SonarHostUrl/api/qualitygates/project_status?projectKey=$ProjectKey" -Headers $th
$values = @{}
foreach ($m in $measures.component.measures) { $values[$m.metric] = $m.value }
$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

$content = @"
# Sonar Quality Summary

Generated at: $generatedAt  
Project: ``$ProjectKey`` ($ProjectName)  
Server: ``$SonarHostUrl``  
Quality gate: **$($gate.projectStatus.status)**

| Metric | Value |
|---|---:|
| Coverage | $($values.coverage)% |
| Bugs | $($values.bugs) |
| Vulnerabilities | $($values.vulnerabilities) |
| Code smells | $($values.code_smells) |
| Duplicated lines | $($values.duplicated_lines_density)% |

Dashboard: $SonarHostUrl/dashboard?id=$ProjectKey

Login UI: ``admin`` / ``$DemoPassword`` (si usaste el flujo demo del script)
"@

$out = Join-Path $root $OutputPath
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $out) | Out-Null
Set-Content -LiteralPath $out -Value $content -Encoding UTF8

Write-Host ""
Write-Host "=== Sonar listo (profesional) ===" -ForegroundColor Green
Write-Host "Quality Gate: $($gate.projectStatus.status)"
Write-Host "Dashboard:    $SonarHostUrl/dashboard?id=$ProjectKey"
Write-Host "UI login:     admin / $resolvedPassword"
Write-Host "Evidence:     $OutputPath"
Write-Host "Abre el dashboard en el browser (no la pantalla Create project)."
