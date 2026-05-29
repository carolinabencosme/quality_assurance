# Módulo Stock — consultas GET (QA-24)

Ticket: **QA-24** — `GET /api/v1/stock` y `GET /api/v1/stock/movements`.

## Endpoints de consulta

| Método | Ruta | DTO de respuesta |
|--------|------|------------------|
| GET | `/api/v1/stock` | `Page<StockLevelResponse>` |
| GET | `/api/v1/stock/movements` | `Page<StockMovementResponse>` |

## Capas

```
StockController → StockService → ProductRepository / StockMovementRepository
              ↘ StockLevelMapper.toResponse(Product)
              ↘ StockMovementMapper.toResponse(StockMovement)
```

Las entidades JPA **no** se serializan al cliente; solo records DTO.

Documentación: [`docs/stock-get-api.md`](../../../../docs/stock-get-api.md).

## Pruebas

```powershell
cd backend
.\mvnw.cmd test "-Dtest=StockLevelMapperTest,StockServiceTest"
.\mvnw.cmd test "-Dtest=StockGetApiIntegrationTest"
```
