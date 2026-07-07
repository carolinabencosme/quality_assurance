param(
    [string]$Target = $env:ZAP_TARGET,
    [string]$ReportPath = "docs/qa-evidence/zap-report.html"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ([string]::IsNullOrWhiteSpace($Target)) {
    $Target = "http://host.docker.internal:3000"
}

try {
    docker version *> $null
} catch {
    Write-Warning "SKIP: Docker is not available. ZAP baseline was not executed."
    exit 0
}
if ($LASTEXITCODE -ne 0) {
    Write-Warning "SKIP: Docker is not available. ZAP baseline was not executed."
    exit 0
}

$reportFullPath = Join-Path $root $ReportPath
$reportDir = Split-Path -Parent $reportFullPath
$reportName = Split-Path -Leaf $reportFullPath
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

Write-Host "Running OWASP ZAP baseline against $Target"
docker run --rm `
    -v "${reportDir}:/zap/wrk" `
    ghcr.io/zaproxy/zaproxy:stable `
    zap-baseline.py -t $Target -r $reportName -I

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "ZAP report generated at $ReportPath"
