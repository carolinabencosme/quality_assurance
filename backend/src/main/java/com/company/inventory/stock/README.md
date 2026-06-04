# Módulo Stock — movimientos y reglas de negocio (QA-23)

Ticket: **QA-23** — RF-04, RF-05, RF-09.

Incluye también **QA-24** para consultas `GET /api/v1/stock` y `GET /api/v1/stock/movements` con DTOs paginados.

## Responsabilidad

Gestión de existencias y trazabilidad de movimientos: entradas (`IN`), salidas (`OUT`) y ajustes (`ADJUSTMENT`).

## Capas

```
StockController → StockService → ProductRepository / StockMovementRepository
              ↘ StockLevelMapper.toResponse(Product)
              ↘ StockMovementMapper.toResponse(StockMovement)
```

Las entidades JPA **no** se serializan al cliente; solo DTOs.

## Reglas de negocio

| Regla | Implementación |
|-------|----------------|
| Sin stock negativo en OUT | `StockService.applyMovement` → `ApiException.conflict` |
| Trazabilidad obligatoria | Fila en `stock_movements` por cada cambio |
| Stock crítico (`quantity <= min_stock`) | `Product.isCritical()` + filtro `critical` en `findStockLevels` |
| Solo productos activos | `ensureActive()` antes de modificar stock |

## Endpoints

| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/api/v1/stock` | `stock:view` |
| GET | `/api/v1/stock/movements` | `stock:view` |
| POST | `/api/v1/stock/movements` | `stock:manage` |

Documentación detallada:
- [`docs/stock-api-crud.md`](../../../../docs/stock-api-crud.md)
- [`docs/stock-get-api.md`](../../../../docs/stock-get-api.md)

## Pruebas

```powershell
cd backend
.\mvnw.cmd test "-Dtest=StockLevelMapperTest,StockServiceTest"
.\mvnw.cmd test "-Dtest=StockGetApiIntegrationTest"
.\mvnw.cmd test "-Dtest=StockServiceTest,StockMovementMapperTest"
.\mvnw.cmd test "-Dtest=StockApiIntegrationTest"
```
