$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

& "$root\scripts\run-k6.ps1" `
  -ScriptPath "tests/performance/k6/stress.js" `
  -SummaryPath "docs/qa-evidence/k6-stress-summary.txt"
