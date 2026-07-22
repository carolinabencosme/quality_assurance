param(
    [string]$ScriptPath = "tests/performance/k6/load-api.js",
    [string]$SummaryPath = "docs/qa-evidence/k6-load-summary.txt"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$summaryFullPath = Join-Path $root $SummaryPath
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $summaryFullPath) | Out-Null

if (Get-Command k6 -ErrorAction SilentlyContinue) {
    Write-Host "Running k6 from local installation"
    k6 run $ScriptPath 2>&1 | Tee-Object -FilePath $summaryFullPath
    exit $LASTEXITCODE
}

try {
    docker version *> $null
} catch {
    Write-Warning "SKIP: k6 and Docker are not available. Performance test was not executed."
    exit 0
}
if ($LASTEXITCODE -ne 0) {
    Write-Warning "SKIP: k6 and Docker are not available. Performance test was not executed."
    exit 0
}

Write-Host "Running k6 with Docker"
$baseUrl = if ([string]::IsNullOrWhiteSpace($env:BASE_URL)) { "http://host.docker.internal:8080" } else { $env:BASE_URL }
$keycloakUrl = if ([string]::IsNullOrWhiteSpace($env:KEYCLOAK_URL)) { "http://host.docker.internal:8081" } else { $env:KEYCLOAK_URL }
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
docker run --rm `
    --add-host=host.docker.internal:host-gateway `
    -e BASE_URL=$baseUrl `
    -e KEYCLOAK_URL=$keycloakUrl `
    -e K6_USERNAME=${env:K6_USERNAME} `
    -e K6_PASSWORD=${env:K6_PASSWORD} `
    -v "${root}:/work" `
    -w /work `
    grafana/k6:0.54.0 run $ScriptPath 2>&1 |
    Tee-Object -FilePath $summaryFullPath
$dockerExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference

exit $dockerExitCode
