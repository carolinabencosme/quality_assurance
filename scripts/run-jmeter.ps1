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
$resultsPath = Join-Path $outDir 'results.jtl'
$reportDir = Join-Path $outDir 'report'
$runLogPath = Join-Path $outDir 'jmeter-run.log'
$summaryPath = Join-Path $root 'docs\qa-evidence\jmeter-summary.txt'

foreach ($generatedPath in @($resultsPath, $reportDir, $runLogPath)) {
  if (Test-Path -LiteralPath $generatedPath) {
    Remove-Item -LiteralPath $generatedPath -Recurse -Force
  }
}

if (Get-Command jmeter -ErrorAction SilentlyContinue) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  jmeter -n -t $plan -l $resultsPath -e -o $reportDir `
    "-JapiBase=$apiBase" "-JkeycloakBase=$keycloakBase" "-Jusername=$username" "-Jpassword=$password" 2>&1 |
    Tee-Object -FilePath $runLogPath
  $runnerExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
} else {
  $dockerApiBase = $apiBase -replace '://localhost', '://host.docker.internal' -replace '://127\.0\.0\.1', '://host.docker.internal'
  $dockerKeycloakBase = $keycloakBase -replace '://localhost', '://host.docker.internal' -replace '://127\.0\.0\.1', '://host.docker.internal'
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  docker run --rm `
    --add-host=host.docker.internal:host-gateway `
    -v "${root}:/work" `
    -w /work `
    alpine/jmeter:5.6.3 `
    -n -t tests/performance/jmeter/inventory-load.jmx `
    -l docs/qa-evidence/jmeter/results.jtl `
    -e -o docs/qa-evidence/jmeter/report `
    "-JapiBase=$dockerApiBase" `
    "-JkeycloakBase=$dockerKeycloakBase" `
    "-Jusername=$username" `
    "-Jpassword=$password" 2>&1 |
    Tee-Object -FilePath $runLogPath
  $runnerExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
}

if ($runnerExitCode -ne 0) {
  exit $runnerExitCode
}
if (-not (Test-Path -LiteralPath $resultsPath)) {
  throw "JMeter results were not generated: $resultsPath"
}

$samples = @(Import-Csv -LiteralPath $resultsPath)
$failures = @($samples | Where-Object { $_.success -ne 'true' }).Count
$averageMs = if ($samples.Count -gt 0) { [Math]::Round(($samples | Measure-Object elapsed -Average).Average, 2) } else { 0 }
$maxMs = if ($samples.Count -gt 0) { ($samples | Measure-Object elapsed -Maximum).Maximum } else { 0 }
$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
@"
JMeter 5.6.3 live summary
Generated at: $generatedAt
Samples: $($samples.Count)
Failures: $failures
Average response time: $averageMs ms
Maximum response time: $maxMs ms
Raw HTML report (local/CI artifact, not committed): docs/qa-evidence/jmeter/report/index.html
"@ | Set-Content -LiteralPath $summaryPath -Encoding UTF8

if ($samples.Count -lt 1 -or $failures -ne 0) {
  throw "JMeter gate failed: samples=$($samples.Count) failures=$failures"
}

Write-Host "OK: JMeter samples=$($samples.Count) failures=0 average=${averageMs}ms max=${maxMs}ms"
