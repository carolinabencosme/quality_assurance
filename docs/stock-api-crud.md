# API Stock — movimientos y reglas de negocio (QA-23)

Ticket **QA-23** — RF-04, RF-05, RF-09 (stock crítico).

Complementa [`data-model.md`](data-model.md) y el módulo `backend/.../stock/`.

## Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/api/v1/stock` | `stock:view` | Existencias de productos activos |
| `GET` | `/api/v1/stock/movements` | `stock:view` | Historial paginado de movimientos |
| `POST` | `/api/v1/stock/movements` | `stock:manage` | Registrar IN, OUT o ADJUSTMENT |

### Filtros `GET /api/v1/stock`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | Nombre o SKU (case-insensitive) |
| `critical` | boolean | `true` → solo productos con `quantity <= min_stock` |
| `page`, `size`, `sort` | paginación | Por defecto `size=20`, orden `name` ASC |

### Filtros `GET /api/v1/stock/movements`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | long | Filtrar por producto |
| `type` | enum | `IN`, `OUT`, `ADJUSTMENT` |
| `page`, `size`, `sort` | paginación | Por defecto `createdAt` DESC |

## Tipos de movimiento

| Tipo | Campo requerido | Efecto |
|------|-----------------|--------|
| `IN` | `quantity` ≥ 1 | Suma al stock actual |
| `OUT` | `quantity` ≥ 1 | Resta; **409** si el resultado sería negativo |
| `ADJUSTMENT` | `newQuantity` ≥ 0 | Fija la cantidad exacta (inventario físico) |

> En la API y BD el ajuste se denomina `ADJUSTMENT` (equivalente al ADJUST del ticket).

## Reglas de negocio (RF-STK)

1. **Sin stock negativo** — una salida (`OUT`) que deje `quantity < 0` responde **409 Conflict** con mensaje `Insufficient stock`.
2. **Trazabilidad** — cada operación persiste una fila en `stock_movements` con `previous_qty`, `new_qty`, `delta`, `user_id`, `observations` y `correlation_id`.
3. **Stock crítico** — un producto es crítico cuando `quantity <= min_stock`; visible en `GET /api/v1/stock?critical=true` (`critical: true` en la respuesta).

Restricciones adicionales:

- Solo productos con `status = ACTIVE` admiten movimientos (**400** si está inactivo).
- `products.quantity >= 0` reforzado por CHECK en Flyway V2.

## DTOs

### `StockMovementRequest` (POST)

```json
{
  "productId": 1,
  "type": "IN",
  "quantity": 10,
  "newQuantity": null,
  "observations": "Recepción proveedor",
  "userId": "warehouse-1"
}
```

| Campo | Validación |
|-------|------------|
| `productId` | Obligatorio |
| `type` | Obligatorio (`IN`, `OUT`, `ADJUSTMENT`) |
| `quantity` | ≥ 1 cuando aplica IN/OUT (validado en servicio) |
| `newQuantity` | ≥ 0 cuando aplica ADJUSTMENT (validado en servicio) |
| `observations` | Máx. 500 caracteres |
| `userId` | Máx. 100 caracteres (opcional) |

### `StockMovementResponse` (201 Created)

Incluye `id`, datos del producto (`productSku`, `productName`), cantidades (`previousQty`, `newQty`, `delta`), `correlationId` y `createdAt`.

### `StockLevelResponse` (GET stock)

Incluye `productId`, `sku`, `name`, `quantity`, `minStock`, `critical`, `status`.

## Códigos de error

| HTTP | Caso |
|------|------|
| 400 | Producto inactivo; IN/OUT sin `quantity`; ADJUSTMENT sin `newQuantity` |
| 404 | `productId` inexistente |
| 409 | Salida que excede stock disponible |

Formato JSON estándar: [`common-error-response.md`](common-error-response.md).

## Ejemplos

```bash
# Entrada de stock
curl -X POST http://localhost:8080/api/v1/stock/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"type":"IN","quantity":20,"observations":"Compra"}'

# Productos en alerta crítica
curl "http://localhost:8080/api/v1/stock?critical=true" \
  -H "Authorization: Bearer $TOKEN"
```

## Observabilidad

Log estructurado: `event=stock_movement_registered` con `productId`, `type`, cantidades y `correlationId`. Ver [`observability-correlation-logging.md`](observability-correlation-logging.md).

## Pruebas

```powershell
cd backend
.\mvnw.cmd test "-Dtest=StockServiceTest,StockMovementMapperTest"
.\mvnw.cmd test "-Dtest=StockApiIntegrationTest"   # requiere Docker
```

## Trazabilidad

| Requisito | Implementación |
|-----------|----------------|
| RF-04 | `StockService.registerMovement`, `StockController` |
| RF-05 | Validación OUT en `StockService.applyMovement` |
| RF-09 | `Product.isCritical()`, filtro `critical` en `findStockLevels` |
