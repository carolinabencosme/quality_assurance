$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$plan = Join-Path $root 'tests\performance\jmeter\inventory-load.jmx'
$outDir = Join-Path $root 'docs\qa-evidence\jmeter'

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Set-Location $root

$apiBase = if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:8080' }
$keycloakBase = if ($env:KEYCLOAK_URL) { $env:KEYCLOAK_URL } else { 'http://localhost:8081' }
$username = if ($env:JMETER_USERNAME) { $env:JMETER_USERNAME } else { 'viewer' }
$password = if ($env:JMETER_PASSWORD) { $env:JMETER_PASSWORD } else { 'viewer123' }

if (Get-Command jmeter -ErrorAction SilentlyContinue) {
  jmeter -n -t $plan -l "$outDir\results.jtl" -e -o "$outDir\report" `
    -JapiBase=$apiBase -JkeycloakBase=$keycloakBase -Jusername=$username -Jpassword=$password
  exit $LASTEXITCODE
}

docker run --rm `
  --add-host=host.docker.internal:host-gateway `
  -v "${root}:/work" `
  -w /work `
  justb4/jmeter:5.6.3 `
  -n -t tests/performance/jmeter/inventory-load.jmx `
  -l docs/qa-evidence/jmeter/results.jtl `
  -e -o docs/qa-evidence/jmeter/report `
  -JapiBase=$apiBase `
  -JkeycloakBase=$keycloakBase `
  -Jusername=$username `
  -Jpassword=$password
