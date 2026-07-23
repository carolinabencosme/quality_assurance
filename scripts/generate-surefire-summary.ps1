param(
  [string]$ReportsPath = 'backend/target/surefire-reports',
  [string]$OutputPath = 'docs/qa-evidence/test-execution-summary.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$reportsFullPath = Join-Path $root $ReportsPath
$files = @(Get-ChildItem -LiteralPath $reportsFullPath -Filter 'TEST-*.xml')
if ($files.Count -eq 0) { throw "No Surefire XML reports found in $ReportsPath." }

$tests = 0
$failures = 0
$errors = 0
$skipped = 0
$seconds = 0.0
foreach ($file in $files) {
  [xml]$report = Get-Content -Raw -LiteralPath $file.FullName
  $tests += [int]$report.testsuite.tests
  $failures += [int]$report.testsuite.failures
  $errors += [int]$report.testsuite.errors
  $skipped += [int]$report.testsuite.skipped
  $seconds += [double]$report.testsuite.time
}

if ($tests -lt 1 -or $failures -ne 0 -or $errors -ne 0 -or $skipped -ne 0) {
  throw "Surefire gate failed: tests=$tests failures=$failures errors=$errors skipped=$skipped"
}

$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$content = @"
# Surefire Test Summary

Generated at: $generatedAt

| Suites | Tests | Failures | Errors | Skipped | Seconds |
|---:|---:|---:|---:|---:|---:|
| $($files.Count) | $tests | $failures | $errors | $skipped | $([Math]::Round($seconds, 2)) |

Seal rule: all Surefire XML suites are aggregated and skips are not accepted.
"@
$outputFullPath = Join-Path $root $OutputPath
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputFullPath) | Out-Null
Set-Content -LiteralPath $outputFullPath -Value $content -Encoding UTF8
Write-Host "OK: Surefire suites=$($files.Count) tests=$tests failures=0 errors=0 skipped=0."
