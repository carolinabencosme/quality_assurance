# Respuesta de error estándar — módulo common (QA-18)

## Formato JSON

Todos los errores HTTP gestionados por `GlobalExceptionHandler` devuelven:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | ISO-8601 instant | Momento del error |
| `status` | int | Código HTTP |
| `error` | string | Frase HTTP (ej. `Not Found`) |
| `message` | string | Detalle para el cliente |
| `path` | string | URI solicitada |
| `correlationId` | string | Trazabilidad (`X-Correlation-Id`) |

## Ejemplo 404

```json
{
  "timestamp": "2026-05-28T18:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Product not found: 99",
  "path": "/api/v1/products/99",
  "correlationId": "req-a1b2c3d4e5f6"
}
```

## Componentes

| Clase | Paquete |
|-------|---------|
| `ApiErrorResponse` | `common.exception` |
| `ApiException` | `common.exception` |
| `GlobalExceptionHandler` | `common.exception` (`@RestControllerAdvice`) |
| `CorrelationIdFilter` | `common.web` |

## Prueba local

```powershell
cd backend
.\mvnw.cmd test -Dtest=GlobalExceptionHandlerTest
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
curl -H "X-Correlation-Id: demo-1" http://localhost:8080/api/v1/demo/errors/not-found
```
