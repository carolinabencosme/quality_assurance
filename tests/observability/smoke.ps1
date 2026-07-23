# QA-7 - smoke del stack de observabilidad (stack completo en marcha)
$ErrorActionPreference = 'Stop'

$checks = @(
  @{ Name = 'Prometheus'; Url = 'http://localhost:9090/-/healthy'; MaxWaitSec = 60 },
  @{ Name = 'Grafana'; Url = 'http://localhost:3030/api/health'; MaxWaitSec = 60 },
  @{ Name = 'Loki'; Url = 'http://localhost:3100/ready'; MaxWaitSec = 90 },
  @{ Name = 'Tempo'; Url = 'http://localhost:3200/ready'; MaxWaitSec = 90 },
  @{ Name = 'Alloy'; Url = 'http://localhost:12345/-/healthy'; MaxWaitSec = 60 },
  @{ Name = 'Alertmanager'; Url = 'http://localhost:9093/-/healthy'; MaxWaitSec = 60 },
  @{ Name = 'Actuator Prometheus'; Url = 'http://localhost:8080/actuator/prometheus'; MaxWaitSec = 60 }
)

function Test-ObsEndpoint {
  param(
    [string]$Name,
    [string]$Url,
    [int]$MaxWaitSec = 60
  )

  $intervalSec = 5
  $elapsed = 0
  $lastError = 'sin respuesta'

  while ($elapsed -lt $MaxWaitSec) {
    try {
      $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
        Write-Host ('OK  ' + $Name) -ForegroundColor Green
        return $true
      }
      $lastError = "HTTP $($r.StatusCode)"
    } catch {
      $lastError = $_.Exception.Message
    }

    Start-Sleep -Seconds $intervalSec
    $elapsed += $intervalSec
  }

  Write-Host ('FAIL ' + $Name + " ($lastError)") -ForegroundColor Red
  return $false
}

Write-Host '=== Observability smoke (QA-7) ===' -ForegroundColor Cyan
foreach ($c in $checks) {
  $maxWait = if ($c.MaxWaitSec) { [int]$c.MaxWaitSec } else { 60 }
  if (-not (Test-ObsEndpoint -Name $c.Name -Url $c.Url -MaxWaitSec $maxWait)) {
    Write-Host ''
    Write-Host "Sugerencia: docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml ps loki tempo" -ForegroundColor Yellow
    exit 1
  }
}

Write-Host ''
Write-Host 'Prometheus target inventory-api:' -ForegroundColor Cyan
$targets = Invoke-RestMethod 'http://localhost:9090/api/v1/targets'
$job = $targets.data.activeTargets | Where-Object { $_.labels.job -eq 'inventory-api' }
if ($job.health -eq 'up') {
  Write-Host 'OK  scrape inventory-api UP' -ForegroundColor Green
} else {
  Write-Host ('WARN inventory-api target health=' + $job.health) -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== PASS ===' -ForegroundColor Green
