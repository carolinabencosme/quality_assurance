param(
    [string]$SchemaUrl = $env:SCHEMATHESIS_SCHEMA_URL,
    [string]$ReportPath = "docs/qa-evidence/schemathesis-report.txt"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ([string]::IsNullOrWhiteSpace($SchemaUrl)) {
    $SchemaUrl = "http://host.docker.internal:8080/v3/api-docs"
}

try {
    docker version *> $null
} catch {
    Write-Warning "SKIP: Docker is not available. Schemathesis was not executed."
    exit 0
}
if ($LASTEXITCODE -ne 0) {
    Write-Warning "SKIP: Docker is not available. Schemathesis was not executed."
    exit 0
}

$reportFullPath = Join-Path $root $ReportPath
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $reportFullPath) | Out-Null

Write-Host "Running Schemathesis against $SchemaUrl"
docker run --rm schemathesis/schemathesis:stable `
    run $SchemaUrl --checks all --hypothesis-max-examples=50 2>&1 |
    Tee-Object -FilePath $reportFullPath

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Schemathesis report generated at $ReportPath"
