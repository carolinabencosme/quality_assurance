param(
  [string]$CsvPath = 'backend/target/site/jacoco/jacoco.csv',
  [string]$OutputPath = 'docs/qa-evidence/jacoco-summary.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$csvFullPath = Join-Path $root $CsvPath
$outputFullPath = Join-Path $root $OutputPath

if (-not (Test-Path -LiteralPath $csvFullPath)) {
  throw "JaCoCo CSV not found: $csvFullPath. Run backend mvnw verify first."
}

$rows = Import-Csv -LiteralPath $csvFullPath
$lineMissed = ($rows | Measure-Object -Property LINE_MISSED -Sum).Sum
$lineCovered = ($rows | Measure-Object -Property LINE_COVERED -Sum).Sum
$branchMissed = ($rows | Measure-Object -Property BRANCH_MISSED -Sum).Sum
$branchCovered = ($rows | Measure-Object -Property BRANCH_COVERED -Sum).Sum

function Get-Percent([double]$covered, [double]$missed) {
  $total = $covered + $missed
  if ($total -eq 0) { return 0 }
  return [Math]::Round(($covered / $total) * 100, 2)
}

$linePercent = Get-Percent $lineCovered $lineMissed
$branchPercent = Get-Percent $branchCovered $branchMissed
$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$content = @"
# JaCoCo Summary

Generated at: $generatedAt

| Metric | Covered | Missed | Percentage |
|---|---:|---:|---:|
| Lines | $lineCovered | $lineMissed | $linePercent% |
| Branches | $branchCovered | $branchMissed | $branchPercent% |

Required line gate: 60%. Source: ``backend/target/site/jacoco/jacoco.csv``.
"@

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputFullPath) | Out-Null
Set-Content -LiteralPath $outputFullPath -Value $content -Encoding UTF8
Write-Host "OK: JaCoCo summary written to $OutputPath."
