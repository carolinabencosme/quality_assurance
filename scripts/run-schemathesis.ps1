param(
    [string]$SchemaUrl = $env:SCHEMATHESIS_SCHEMA_URL,
    [string]$ReportPath = "docs/qa-evidence/schemathesis-report.txt",
    [string]$Token = $env:SCHEMATHESIS_TOKEN,
    [string]$KeycloakUrl = $(if ($env:SCHEMATHESIS_KEYCLOAK_URL) { $env:SCHEMATHESIS_KEYCLOAK_URL } else { 'http://localhost:8081' })
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

if ([string]::IsNullOrWhiteSpace($Token)) {
    $username = if ($env:SCHEMATHESIS_USERNAME) { $env:SCHEMATHESIS_USERNAME } else { 'admin' }
    $password = if ($env:SCHEMATHESIS_PASSWORD) { $env:SCHEMATHESIS_PASSWORD } else { 'admin123' }
    $scope = 'openid profile email product:view product:manage stock:view stock:manage report:view user:manage audit:view'
    $tokenResponse = Invoke-RestMethod -Method Post `
        -Uri "$KeycloakUrl/realms/inventory-realm/protocol/openid-connect/token" `
        -ContentType 'application/x-www-form-urlencoded' `
        -Body @{ grant_type = 'password'; client_id = 'inventory-frontend'; username = $username; password = $password; scope = $scope }
    $Token = $tokenResponse.access_token
}
if ([string]::IsNullOrWhiteSpace($Token)) {
    throw 'Schemathesis could not obtain an access token.'
}

Write-Host "Running Schemathesis against $SchemaUrl"
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
docker run --rm `
    --add-host=host.docker.internal:host-gateway `
    schemathesis/schemathesis:stable `
    run $SchemaUrl `
    --header "Authorization: Bearer $Token" `
    --phases coverage,fuzzing `
    --checks not_a_server_error `
    --exclude-path-regex '^/api/v1/demo/errors/' `
    --generation-with-security-parameters=false `
    --generation-deterministic `
    --suppress-health-check=filter_too_much `
    --request-retries=2 `
    --max-examples=20 `
    --no-color 2>&1 |
    Tee-Object -FilePath $reportFullPath
$dockerExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference

if ($dockerExitCode -ne 0) {
    exit $dockerExitCode
}

Write-Host "Schemathesis report generated at $ReportPath"
