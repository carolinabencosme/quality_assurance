# CRUD API productos — QA-21 / RF-PROD

Ticket: **QA-21** — DTOs, mapper, validaciones y endpoints `/api/v1/products`.

## Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/v1/products` | `product:view` | Lista paginada + filtros |
| GET | `/api/v1/products/{id}` | `product:view` | Detalle |
| POST | `/api/v1/products` | `product:manage` | Crear (201) |
| PUT | `/api/v1/products/{id}` | `product:manage` | Actualizar |
| DELETE | `/api/v1/products/{id}` | `product:manage` | Inactivar (204) |

## Query params (GET lista)

| Param | Tipo | Descripción |
|-------|------|-------------|
| `search` | string | Nombre o SKU (contains, case-insensitive) |
| `categoryId` | long | Filtrar por categoría |
| `status` | ACTIVE \| INACTIVE | Estado |
| `critical` | boolean | Stock ≤ mínimo |
| `page`, `size`, `sort` | Pageable | Ej. `sort=name,asc` |

## DTOs y validaciones (RF-PROD)

| DTO | Validaciones |
|-----|--------------|
| `ProductRequest` | `@NotBlank` name/sku, `@DecimalMin(0)` price, `@PositiveOrZero` quantity, `@Min(0)` minStock |
| `ProductUpdateRequest` | Igual sin quantity (stock vía movimientos) |
| `ProductResponse` | Incluye categoryId, categoryName, critical, timestamps |

## Reglas de negocio

| Regla | HTTP |
|-------|------|
| SKU duplicado | **409 Conflict** + JSON error estándar |
| Precio o stock negativo | **400 Bad Request** |
| Categoría inexistente | **404 Not Found** |
| Producto inexistente | **404 Not Found** |

## Capas

```
ProductController → ProductService → ProductRepository
                 ↘ ProductMapper.toResponse
                 ↘ StockService (stock inicial en POST)
```

## Pruebas

```powershell
cd backend
.\mvnw.cmd test "-Dtest=ProductServiceTest,ProductMapperTest,ProductApiIntegrationTest"
```

Con Docker: integración CRUD completa en `ProductApiIntegrationTest`.

## Ejemplo POST

```json
{
  "name": "Wireless Mouse",
  "sku": "SKU-NEW-001",
  "categoryId": 1,
  "price": 29.99,
  "quantity": 10,
  "minStock": 2,
  "status": "ACTIVE"
}
```

Ver Swagger: http://localhost:8080/swagger-ui.html
