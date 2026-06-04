# GET Stock — existencias y movimientos (QA-24)

Ticket **QA-24** — endpoints de consulta con paginación y DTOs (sin serializar entidades JPA).

## Endpoints

| Método | Ruta | Permiso | Respuesta |
|--------|------|---------|-----------|
| `GET` | `/api/v1/stock` | `stock:view` | `Page<StockLevelResponse>` |
| `GET` | `/api/v1/stock/movements` | `stock:view` | `Page<StockMovementResponse>` |

## Paginación

Ambos endpoints aceptan parámetros estándar de Spring Data:

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `page` | `0` | Índice de página (0-based) |
| `size` | `20` | Elementos por página |
| `sort` | `name` (stock) / `createdAt` (movements) | Campo de ordenación |
| `direction` | `ASC` (stock) / `DESC` (movements) | Dirección |

Ejemplo: `GET /api/v1/stock?page=0&size=10&sort=sku,asc`

### Formato de respuesta paginada

```json
{
  "content": [ /* DTOs */ ],
  "totalElements": 4,
  "totalPages": 1,
  "size": 20,
  "number": 0,
  "first": true,
  "last": true,
  "empty": false
}
```

## DTOs (sin entidades JPA)

Los controladores **nunca** devuelven `Product`, `StockMovement` ni relaciones lazy. El mapeo ocurre en servicio:

```
GET /stock          → StockService.findStockLevels  → StockLevelMapper.toResponse(Product)
GET /stock/movements → StockService.findMovements   → StockMovementMapper.toResponse(StockMovement)
```

### `StockLevelResponse`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `productId` | long | ID del producto |
| `sku` | string | SKU |
| `name` | string | Nombre |
| `quantity` | int | Existencia actual |
| `minStock` | int | Stock mínimo |
| `critical` | boolean | `quantity <= minStock` |
| `status` | enum | Siempre `ACTIVE` en este listado |

No incluye: `category`, `price`, `description`, ni objetos anidados JPA.

### `StockMovementResponse`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | long | ID del movimiento |
| `productId` | long | ID del producto |
| `productSku` | string | SKU aplanado |
| `productName` | string | Nombre aplanado |
| `userId` | string | Usuario (nullable) |
| `type` | enum | `IN`, `OUT`, `ADJUSTMENT` |
| `previousQty` | int | Cantidad anterior |
| `newQty` | int | Cantidad nueva |
| `delta` | int | Diferencia |
| `observations` | string | Notas (nullable) |
| `correlationId` | string | Trazabilidad (nullable) |
| `createdAt` | instant | Timestamp |

No incluye: objeto `product` anidado ni proxies Hibernate.

## Filtros

### `GET /api/v1/stock`

| Parámetro | Descripción |
|-----------|-------------|
| `search` | Filtra por nombre o SKU |
| `critical` | `true` → solo productos en alerta crítica |

### `GET /api/v1/stock/movements`

| Parámetro | Descripción |
|-----------|-------------|
| `productId` | Filtra por producto |
| `type` | `IN`, `OUT` o `ADJUSTMENT` |

## Implementación

| Artefacto | Ruta |
|-----------|------|
| Controller | `backend/.../stock/controller/StockController.java` |
| Service | `backend/.../stock/service/StockService.java` |
| Mappers | `StockLevelMapper`, `StockMovementMapper` |
| Repositorio | `StockMovementRepository` con `@EntityGraph(product)` en listados |

## Pruebas

```powershell
cd backend
.\mvnw.cmd test "-Dtest=StockLevelMapperTest,StockServiceTest"
.\mvnw.cmd test "-Dtest=StockGetApiIntegrationTest"   # requiere Docker
```

## Trazabilidad

| Requisito QA-24 | Implementación |
|-----------------|----------------|
| Paginación | `Pageable` + `@PageableDefault` en controller |
| DTOs | `StockLevelResponse`, `StockMovementResponse` |
| Sin entidades JPA al cliente | Mappers en capa servicio; tests verifican ausencia de campos anidados |
