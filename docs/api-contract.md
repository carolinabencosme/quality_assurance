# Contrato API REST — OpenAPI, endpoints y estándares

API versionada bajo `/api/v1/`, documentada con OpenAPI 3 y Swagger UI, protegida con Bearer JWT.

---

## 1. Estándares generales

| Aspecto | Convención |
|---------|------------|
| Base path | `/api/v1` |
| Formato | JSON (`Content-Type: application/json`) |
| Autenticación | `Authorization: Bearer <JWT>` |
| Paginación | Query: `page` (0-based), `size`, `sort` (ej. `name,asc`) |
| Fechas | ISO-8601 UTC (`2026-05-18T20:10:31Z`) |
| IDs | `Long` numérico en path |
| Validación | Bean Validation en request DTOs |
| Documentación | springdoc-openapi; Swagger en `dev` y `staging` |

---

## 2. Esquema de seguridad OpenAPI

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
```

---

## 3. Catálogo de endpoints

### 3.1 Productos

| Método | Ruta | Permiso | Descripción | Status |
|--------|------|---------|-------------|--------|
| GET | `/api/v1/products` | product:view | Lista paginada con filtros | 200 |
| GET | `/api/v1/products/{id}` | product:view | Detalle | 200, 404 |
| POST | `/api/v1/products` | product:manage | Crear | 201, 400, 409 |
| PUT | `/api/v1/products/{id}` | product:manage | Actualizar | 200, 400, 404, 409 |
| DELETE | `/api/v1/products/{id}` | product:manage | Inactivar | 204, 404 |

**Query params (GET lista):**

- `search` — texto en nombre/SKU
- `categoryId` — filtro categoría
- `status` — ACTIVE / INACTIVE
- `page`, `size`, `sort`

### 3.2 Stock

| Método | Ruta | Permiso | Descripción | Status |
|--------|------|---------|-------------|--------|
| GET | `/api/v1/stock` | stock:view | Existencias actuales | 200 |
| GET | `/api/v1/stock/movements` | stock:view | Historial paginado | 200 |
| POST | `/api/v1/stock/movements` | stock:manage | Registrar movimiento | 201, 400, 404 |

**Body POST movimiento:**

```json
{
  "productId": 1,
  "type": "IN",
  "quantity": 10,
  "observations": "Recepción proveedor"
}
```

`type`: `IN` | `OUT` | `ADJUST`

### 3.3 Reportes

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/v1/reports/dashboard` | report:view | KPIs agregados |
| GET | `/api/v1/reports/critical-products` | report:view | Productos bajo mínimo |

### 3.4 Auditoría

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/v1/audit` | audit:view | Eventos / revisiones paginadas |

### 3.5 Actuator (público)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/actuator/health` | No | Health para Docker/K8s |

---

## 4. DTOs de ejemplo

### ProductRequest

```json
{
  "name": "Laptop Pro 15",
  "sku": "SKU-LAP-001",
  "description": "Equipo portátil",
  "categoryId": 1,
  "price": 1299.99,
  "quantity": 50,
  "minStock": 10,
  "status": "ACTIVE"
}
```

### ProductResponse

```json
{
  "id": 1,
  "name": "Laptop Pro 15",
  "sku": "SKU-LAP-001",
  "categoryName": "Electrónica",
  "price": 1299.99,
  "quantity": 50,
  "minStock": 10,
  "critical": false,
  "status": "ACTIVE",
  "createdAt": "2026-05-18T10:00:00Z",
  "updatedAt": "2026-05-18T10:00:00Z"
}
```

### DashboardResponse

```json
{
  "totalProducts": 120,
  "activeProducts": 115,
  "criticalProducts": 8,
  "movementsToday": 24,
  "recentMovements": []
}
```

---

## 5. Formato estándar de error

Todas las excepciones de negocio y validación deben retornar:

```json
{
  "timestamp": "2026-05-18T20:10:31Z",
  "status": 409,
  "error": "Conflict",
  "message": "SKU already exists",
  "path": "/api/v1/products",
  "correlationId": "req-789xyz"
}
```

### Implementación (GlobalExceptionHandler)

| Excepción | HTTP | error |
|-----------|------|-------|
| MethodArgumentNotValidException | 400 | Bad Request |
| EntityNotFoundException | 404 | Not Found |
| DuplicateSkuException | 409 | Conflict |
| InsufficientStockException | 400 o 409 | Bad Request / Conflict |
| AccessDeniedException | 403 | Forbidden |
| AuthenticationException | 401 | Unauthorized |

El header `X-Correlation-Id` se acepta del cliente o se genera en servidor.

---

## 6. Paginación estándar

Respuesta tipo Spring `Page`:

```json
{
  "content": [],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

---

## 7. Status codes esperados

| Código | Uso |
|--------|-----|
| 200 | OK, consultas y updates |
| 201 | Recurso creado |
| 204 | Delete/inactivate sin body |
| 400 | Validación fallida |
| 401 | No autenticado |
| 403 | Sin permiso |
| 404 | Recurso no encontrado |
| 409 | Conflicto (SKU duplicado) |
| 500 | Error no controlado (evitar en flujo normal) |

---

## 8. Contract testing

### RestAssured

```java
given()
    .auth().oauth2(tokenWithProductView)
.when()
    .get("/api/v1/products")
.then()
    .statusCode(200)
    .body("content", not(empty()));
```

### Schemathesis

Validar que todas las operaciones OpenAPI cumplen schema contra instancia en staging:

```bash
schemathesis run http://localhost:8080/v3/api-docs \
  --header "Authorization: Bearer $TOKEN"
```

---

## 9. Swagger UI — uso en defensa

1. Abrir `http://localhost:8080/swagger-ui.html`
2. Click **Authorize** → pegar JWT (sin prefijo "Bearer" según UI)
3. Ejecutar `POST /api/v1/products` con usuario Admin
4. Repetir con token de Employee → demostrar 403 en endpoint manage

---

## 10. Versionado futuro

Si se requiere `/api/v2/`:

- Mantener v1 durante periodo de deprecación
- Documentar breaking changes en CHANGELOG
- Actualizar Schemathesis y colección Postman

---

## 11. Referencias

- [security-model.md](./security-model.md)
- [data-model.md](./data-model.md)
- [testing-guide.md](./testing-guide.md)
