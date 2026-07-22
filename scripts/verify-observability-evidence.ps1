param(
  [string]$ApiBase = $(if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:8080' }),
  [string]$KeycloakBase = $(if ($env:KEYCLOAK_URL) { $env:KEYCLOAK_URL } else { 'http://localhost:8081' }),
  [string]$LokiBase = 'http://localhost:3100',
  [string]$TempoBase = 'http://localhost:3200',
  [string]$Username = 'admin',
  [string]$Password = 'admin123',
  [string]$OutputPath = 'docs/qa-evidence/observability-live-summary.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$createdId = $null

try {
  $tokenForm = @{
    grant_type = 'password'
    client_id = 'inventory-frontend'
    username = $Username
    password = $Password
  }
  $token = (Invoke-RestMethod -Method Post `
      -Uri "$KeycloakBase/realms/inventory-realm/protocol/openid-connect/token" `
      -Body $tokenForm -ContentType 'application/x-www-form-urlencoded').access_token
  $headers = @{ Authorization = "Bearer $token" }

  $sku = "OBS-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
  $payload = @{
    name = 'Observability evidence'
    sku = $sku
    description = 'Disposable trace evidence'
    categoryId = 1
    price = 1.0
    quantity = 1
    minStock = 0
    status = 'ACTIVE'
  } | ConvertTo-Json
  $created = Invoke-RestMethod -Method Post -Uri "$ApiBase/api/v1/products" `
    -Headers $headers -Body $payload -ContentType 'application/json'
  $createdId = $created.id

  $logLine = $null
  for ($attempt = 1; $attempt -le 12 -and -not $logLine; $attempt++) {
    Start-Sleep -Seconds 2
    $query = [Uri]::EscapeDataString("{service_name=`"backend`"} |= `"$sku`"")
    $end = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $start = $end - 300
    $response = Invoke-RestMethod `
      "$LokiBase/loki/api/v1/query_range?query=$query&start=$($start)000000000&end=$($end)000000000&limit=5&direction=backward"
    if ($response.data.result.Count -gt 0) {
      $logLine = $response.data.result[0].values[0][1] | ConvertFrom-Json
    }
  }
  if (-not $logLine -or -not $logLine.traceId) {
    throw 'Loki did not return the correlated backend log.'
  }
  foreach ($field in @('user', 'endpoint', 'correlationId', 'traceId', 'spanId')) {
    if ([string]::IsNullOrWhiteSpace($logLine.$field)) {
      throw "Loki evidence is missing field: $field"
    }
  }

  $trace = $null
  for ($attempt = 1; $attempt -le 12 -and -not $trace; $attempt++) {
    try {
      $trace = Invoke-RestMethod "$TempoBase/api/traces/$($logLine.traceId)"
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  if (-not $trace) { throw 'Tempo did not return the correlated trace.' }

  $spans = @($trace.batches | ForEach-Object {
      $_.scopeSpans | ForEach-Object { $_.spans }
    })
  $databaseSpans = @($spans | Where-Object {
      $_.name -match '^(SELECT|INSERT|UPDATE|DELETE|HikariDataSource)'
    })
  if ($databaseSpans.Count -eq 0) {
    throw 'Tempo trace contains no JDBC database spans.'
  }

  $generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  $databaseSpanNames = ($databaseSpans.name | Sort-Object -Unique | ForEach-Object { "- ``$_``" }) -join "`n"
  $content = @"
# Observability Live Summary

Generated at: $generatedAt  
Loki stream: ``{service_name="backend"}``  
Authenticated user: ``$($logLine.user)``  
Endpoint: ``$($logLine.endpoint)``  
Correlation ID: ``$($logLine.correlationId)``  
Trace ID: ``$($logLine.traceId)``  
Root log span ID: ``$($logLine.spanId)``  
Tempo spans: $($spans.Count)  
Database spans: $($databaseSpans.Count)

## Database span names

$databaseSpanNames

The verifier creates and deactivates one disposable product. No access token or password is written to this file.
"@
  $outputFullPath = Join-Path $root $OutputPath
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputFullPath) | Out-Null
  Set-Content -LiteralPath $outputFullPath -Value $content -Encoding UTF8
  Write-Host "OK: Loki fields and Tempo JDBC spans verified."
} finally {
  if ($createdId -and $headers) {
    try {
      Invoke-RestMethod -Method Delete -Uri "$ApiBase/api/v1/products/$createdId" `
        -Headers $headers | Out-Null
    } catch {
      Write-Warning "Could not deactivate disposable evidence product $createdId."
    }
  }
}
