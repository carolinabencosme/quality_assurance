# Seed demo data: productos extras + movimientos IN/OUT/ADJUSTMENT para probar bien.
# Requiere stack local arriba (API :8080, Keycloak :8081).
# Uso: .\scripts\seed-demo-data.ps1

$ErrorActionPreference = 'Stop'
$Api = if ($env:API_BASE) { $env:API_BASE } else { 'http://localhost:8080' }
$Keycloak = if ($env:KEYCLOAK_BASE) { $env:KEYCLOAK_BASE } else { 'http://localhost:8081' }

Write-Host '=== Seed demo data (productos + movimientos) ===' -ForegroundColor Cyan

function Get-AdminToken {
  $scope = 'openid profile email product:view product:manage stock:view stock:manage report:view user:manage audit:view'
  $body = "grant_type=password&client_id=inventory-frontend&username=admin&password=admin123&scope=$([uri]::EscapeDataString($scope))"
  $tok = Invoke-RestMethod -Method Post -Uri "$Keycloak/realms/inventory-realm/protocol/openid-connect/token" `
    -ContentType 'application/x-www-form-urlencoded' -Body $body -TimeoutSec 45
  if (-not $tok.access_token) { throw 'No access_token from Keycloak' }
  return $tok.access_token
}

function Wait-Healthy {
  for ($i = 1; $i -le 36; $i++) {
    try {
      $h = Invoke-RestMethod -Uri "$Api/actuator/health" -TimeoutSec 10
      if ($h.status -eq 'UP') { Write-Host 'OK API UP'; return }
    } catch {}
    Start-Sleep -Seconds 5
  }
  throw 'API not healthy in time'
}

Wait-Healthy
$token = Get-AdminToken
$headers = @{
  Authorization = "Bearer $token"
  'Content-Type' = 'application/json'
}

# Categorias existentes (Flyway V6): 1 Electronics, 2 Office, 3 General
$newProducts = @(
  @{ name = 'Teclado Mecanico'; sku = 'SKU-KEY-101'; description = 'Switch blue RGB'; categoryId = 1; price = 79.99; quantity = 25; minStock = 5 },
  @{ name = 'Monitor 27'; sku = 'SKU-MON-102'; description = 'IPS 144Hz'; categoryId = 1; price = 299.00; quantity = 12; minStock = 3 },
  @{ name = 'Silla Ergonomica'; sku = 'SKU-CHAIR-201'; description = 'Lumbar support'; categoryId = 2; price = 189.50; quantity = 6; minStock = 2 },
  @{ name = 'Resma Papel Carta'; sku = 'SKU-PAPER-202'; description = '500 hojas'; categoryId = 2; price = 5.25; quantity = 200; minStock = 40 },
  @{ name = 'Cable HDMI 2m'; sku = 'SKU-HDMI-301'; description = '4K HDMI'; categoryId = 3; price = 9.99; quantity = 80; minStock = 15 },
  @{ name = 'Webcam HD'; sku = 'SKU-CAM-103'; description = '1080p autofocus'; categoryId = 1; price = 49.00; quantity = 4; minStock = 5 }
)

$createdIds = @()
foreach ($p in $newProducts) {
  $sku = $p.sku
  $existing = Invoke-RestMethod -Uri "$Api/api/v1/products?search=$sku&size=5" -Headers $headers -TimeoutSec 30
  $hit = @($existing.content | Where-Object { $_.sku -eq $sku }) | Select-Object -First 1
  if ($hit) {
    Write-Host ("SKIP product exists " + $sku + " id=" + $hit.id)
    $createdIds += [long]$hit.id
    continue
  }
  $body = $p | ConvertTo-Json -Compress
  $created = Invoke-RestMethod -Method Post -Uri "$Api/api/v1/products" -Headers $headers -Body $body -TimeoutSec 30
  Write-Host ("OK product " + $created.sku + " id=" + $created.id)
  $createdIds += [long]$created.id
}

# Incluir catalogo seed Flyway (ids tipicos 1..4) si existen
$catalog = Invoke-RestMethod -Uri "$Api/api/v1/products?size=50" -Headers $headers -TimeoutSec 30
$allIds = @($catalog.content | ForEach-Object { [long]$_.id }) | Select-Object -Unique
Write-Host ("Catalog products: " + ($allIds -join ', '))

function Post-Movement($productId, $type, $quantity, $newQuantity, $obs) {
  $payload = @{
    productId = $productId
    type = $type
    quantity = $quantity
    observations = $obs
    userId = 'demo-admin'
  }
  if ($null -ne $newQuantity) { $payload.newQuantity = $newQuantity }
  $json = $payload | ConvertTo-Json -Compress
  try {
    $m = Invoke-RestMethod -Method Post -Uri "$Api/api/v1/stock/movements" -Headers $headers -Body $json -TimeoutSec 30
    Write-Host ("OK move " + $type + " product=" + $productId + " -> qty=" + $m.newQuantity)
  } catch {
    Write-Host ("WARN move " + $type + " product=" + $productId + ": " + $_.Exception.Message) -ForegroundColor Yellow
  }
}

# Movimientos de prueba sobre productos del catalogo
$targets = @($allIds | Select-Object -First 8)
if ($targets.Count -eq 0) { throw 'No products available for movements' }

# Entradas
Post-Movement $targets[0] 'IN' 15 $null 'Demo IN: reposicion semanal'
Post-Movement $targets[1] 'IN' 10 $null 'Demo IN: compra proveedor'
if ($targets.Count -gt 2) { Post-Movement $targets[2] 'IN' 40 $null 'Demo IN: lote oficina' }

# Salidas
Post-Movement $targets[0] 'OUT' 5 $null 'Demo OUT: entrega area TI'
Post-Movement $targets[1] 'OUT' 3 $null 'Demo OUT: prestamo laboratorio'
if ($targets.Count -gt 3) { Post-Movement $targets[3] 'OUT' 8 $null 'Demo OUT: consumo interno' }

# Ajustes (inventario fisico)
if ($targets.Count -gt 4) { Post-Movement $targets[4] 'ADJUSTMENT' 1 75 'Demo ADJUSTMENT: conteo fisico' }
if ($targets.Count -gt 5) { Post-Movement $targets[5] 'ADJUSTMENT' 1 2 'Demo ADJUSTMENT: producto critico bajo minimo' }

# Mas historial reciente para dashboard / Grafana
foreach ($id in ($targets | Select-Object -First 4)) {
  Post-Movement $id 'IN' 2 $null 'Demo IN: trafico warmup'
  Post-Movement $id 'OUT' 1 $null 'Demo OUT: trafico warmup'
}

$movements = Invoke-RestMethod -Uri "$Api/api/v1/stock/movements?size=20" -Headers $headers -TimeoutSec 30
$dash = Invoke-RestMethod -Uri "$Api/api/v1/reports/dashboard" -Headers $headers -TimeoutSec 30

Write-Host ''
Write-Host '=== Seed complete ===' -ForegroundColor Green
Write-Host ("Products listed: " + $catalog.totalElements)
Write-Host ("Recent movements page size: " + @($movements.content).Count + " / total=" + $movements.totalElements)
Write-Host ("Dashboard critical: " + @($dash.criticalProducts).Count)
Write-Host 'UI:        http://localhost:3000'
Write-Host 'Stock:     http://localhost:3000/stock/movements'
Write-Host 'Products:  http://localhost:3000/products'
Write-Host 'Dashboard: http://localhost:3000/dashboard'
Write-Host 'Swagger:   http://localhost:8080/swagger-ui.html'
