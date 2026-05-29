# CorrelationId, MDC y logging estructurado — QA-19

Ticket: **QA-19** — Propagar `correlationId` en operaciones críticas y preparar integración con trazas OTEL.

## Componentes

| Clase | Responsabilidad |
|-------|-----------------|
| `CorrelationIdFilter` | Header `X-Correlation-Id`, MDC, `X-Trace-Id` si OTEL activo |
| `ObservabilityMdc` | Claves MDC: `correlationId`, `traceId`, `spanId` |
| `application-observability.yml` | Logs JSON Logstash + sampling OTLP |

## Flujo

```
Request → CorrelationIdFilter
            ├─ MDC: correlationId (+ traceId/spanId si Tracer presente)
            ├─ Response: X-Correlation-Id, X-Trace-Id
            └─ Operaciones críticas (ProductService, StockService) logean event=...
         → GlobalExceptionHandler incluye correlationId en JSON error
         → Tempo/Grafana correlaciona por traceId
```

## Headers HTTP

| Header | Origen |
|--------|--------|
| `X-Correlation-Id` | Cliente o generado (`req-…`) o traceId OTEL |
| `X-Trace-Id` | Span Micrometer Tracing (perfil observability) |

## Logging estructurado

Con perfil `observability`:

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d
docker compose logs backend | Select-String "stock_movement_registered"
```

Salida consola en formato **Logstash JSON** con campos MDC.

Operaciones críticas registradas:

- `event=product_created`
- `event=product_updated`
- `event=product_deactivated`
- `event=stock_movement_registered`

Cada movimiento de stock persiste `correlation_id` en tabla `stock_movements`.

## Pruebas

```powershell
cd backend
.\mvnw.cmd test -Dtest=CorrelationIdFilterTest
```

Ver también [`observability-guide.md`](observability-guide.md) y [`common-error-response.md`](common-error-response.md).
