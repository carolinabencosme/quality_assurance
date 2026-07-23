param(
  [string]$ReportPath = 'backend/target/surefire-reports/TEST-com.company.inventory.security.KeycloakContainerIntegrationTest.xml',
  [string]$OutputPath = 'docs/qa-evidence/keycloak-it-summary.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not [IO.Path]::IsPathRooted($ReportPath)) {
  $ReportPath = Join-Path $root $ReportPath
}
if (-not (Test-Path -LiteralPath $ReportPath)) {
  throw "Keycloak IT report not found: $ReportPath"
}

[xml]$report = Get-Content -Raw -LiteralPath $ReportPath
$suite = $report.testsuite
$tests = [int]$suite.tests
$skipped = [int]$suite.skipped
$failures = [int]$suite.failures
$errors = [int]$suite.errors

if ($tests -lt 1 -or $skipped -ne 0 -or $failures -ne 0 -or $errors -ne 0) {
  throw "Keycloak IT is not sealed: tests=$tests skipped=$skipped failures=$failures errors=$errors"
}

$outputFullPath = if ([IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $root $OutputPath }
$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$duration = if ($suite.time) { $suite.time } else { 'n/a' }
$content = @"
# Keycloak Integration Test Summary

Generated at: $generatedAt

| Suite | Tests | Skipped | Failures | Errors | Seconds |
|---|---:|---:|---:|---:|---:|
| KeycloakContainerIntegrationTest | $tests | $skipped | $failures | $errors | $duration |

Seal rule: at least one real container test and exactly zero skips, failures, and errors.
Source: ``backend/target/surefire-reports/TEST-com.company.inventory.security.KeycloakContainerIntegrationTest.xml``.
"@
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputFullPath) | Out-Null
Set-Content -LiteralPath $outputFullPath -Value $content -Encoding UTF8

Write-Host "OK: KeycloakContainerIntegrationTest tests=$tests skipped=0 failures=0 errors=0."
Write-Host "OK: Keycloak evidence written to $OutputPath."
