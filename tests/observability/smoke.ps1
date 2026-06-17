# QA-7 - smoke del stack de observabilidad (stack completo en marcha)
$ErrorActionPreference = 'Stop'

$checks = @(
  @{ Name = 'Prometheus'; Url = 'http://localhost:9090/-/healthy' },
  @{ Name = 'Grafana'; Url = 'http://localhost:3030/api/health' },
  @{ Name = 'Loki'; Url = 'http://localhost:3100/ready' },
  @{ Name = 'Tempo'; Url = 'http://localhost:3200/ready' },
  @{ Name = 'Alloy'; Url = 'http://localhost:12345/-/healthy' },
  @{ Name = 'Alertmanager'; Url = 'http://localhost:9093/-/healthy' },
  @{ Name = 'Actuator Prometheus'; Url = 'http://localhost:8080/actuator/prometheus' }
)

Write-Host '=== Observability smoke (QA-7) ===' -ForegroundColor Cyan
foreach ($c in $checks) {
  $ok = $false
  for ($i = 1; $i -le 3; $i++) {
    try {
      $r = Invoke-WebRequest -Uri $c.Url -UseBasicParsing -TimeoutSec 20
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
        $ok = $true
        break
      }
    } catch {
      if ($i -lt 3) { Start-Sleep -Seconds 5 }
    }
  }
  if ($ok) {
    Write-Host ('OK  ' + $c.Name) -ForegroundColor Green
  } else {
    Write-Host ('FAIL ' + $c.Name) -ForegroundColor Red
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
