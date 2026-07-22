param(
  [string]$SonarHostUrl = $(if ($env:SONAR_HOST_URL) { $env:SONAR_HOST_URL } else { 'http://localhost:9000' }),
  [string]$SonarToken = $env:SONAR_TOKEN,
  [string]$ProjectKey = 'inventory-qas',
  [string]$OutputPath = 'docs/qa-evidence/sonar-summary.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($SonarToken) -or $SonarToken -eq 'replace_with_local_token') {
  throw 'SONAR_TOKEN must contain a real local or SonarCloud analysis token.'
}

$ready = $false
for ($attempt = 1; $attempt -le 60; $attempt++) {
  try {
    $status = Invoke-RestMethod -Uri "$SonarHostUrl/api/system/status" -TimeoutSec 10
    if ($status.status -eq 'UP') { $ready = $true; break }
  } catch {
    Start-Sleep -Seconds 5
  }
}
if (-not $ready) {
  throw "SonarQube did not become ready at $SonarHostUrl."
}

Push-Location (Join-Path $root 'backend')
try {
  .\mvnw.cmd -B verify sonar:sonar `
    "-Dsonar.projectKey=$ProjectKey" `
    "-Dsonar.host.url=$SonarHostUrl" `
    "-Dsonar.token=$SonarToken" `
    '-Dsonar.qualitygate.wait=true' `
    '-Dsonar.qualitygate.timeout=300'
  if ($LASTEXITCODE -ne 0) { throw "Sonar analysis failed with exit code $LASTEXITCODE." }
} finally {
  Pop-Location
}

$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${SonarToken}:"))
$headers = @{ Authorization = "Basic $basic" }
$metricKeys = 'coverage,bugs,vulnerabilities,code_smells,duplicated_lines_density'
$measures = Invoke-RestMethod -Uri "$SonarHostUrl/api/measures/component?component=$ProjectKey&metricKeys=$metricKeys" -Headers $headers
$gate = Invoke-RestMethod -Uri "$SonarHostUrl/api/qualitygates/project_status?projectKey=$ProjectKey" -Headers $headers
$values = @{}
foreach ($measure in $measures.component.measures) { $values[$measure.metric] = $measure.value }
$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

$content = @"
# Sonar Quality Summary

Generated at: $generatedAt  
Project: ``$ProjectKey``  
Server: ``$SonarHostUrl``  
Quality gate: **$($gate.projectStatus.status)**

| Metric | Value |
|---|---:|
| Coverage | $($values.coverage)% |
| Bugs | $($values.bugs) |
| Vulnerabilities | $($values.vulnerabilities) |
| Code smells | $($values.code_smells) |
| Duplicated lines | $($values.duplicated_lines_density)% |

The token is never written to this evidence file. The Maven scan waits for the quality gate and fails on a non-green gate.
"@

$outputFullPath = Join-Path $root $OutputPath
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputFullPath) | Out-Null
Set-Content -LiteralPath $outputFullPath -Value $content -Encoding UTF8
Write-Host "OK: Sonar quality gate passed and summary written to $OutputPath."
