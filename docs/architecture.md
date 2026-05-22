# Arquitectura — Inventory QAS

> Borrador Fase 0. Se completa en fases 1–3 según Plan v3.0.

## Decisión principal

**Monolito modular empresarial** (no microservicios): una API Spring Boot con paquetes por dominio y un frontend React.

```
[Usuario] → [React] → [Spring Boot API] → [PostgreSQL + Flyway + Envers]
                              ↓
                        [Keycloak JWT]
                              ↓
              [OpenTelemetry → Alloy → Prometheus/Loki/Tempo → Grafana]
```

## Módulos backend (previstos)

| Módulo | Responsabilidad |
|--------|-----------------|
| `product` | CRUD productos, SKU, paginación |
| `stock` | Movimientos, alertas stock mínimo |
| `report` | Dashboard y KPIs |
| `audit` | Consulta auditoría (Envers) |
| `security` | JWT, permisos granulares |
| `observability` | correlationId, logs, métricas |
| `common` | Excepciones, respuestas estándar |

## Permisos granulares (Fase 2)

`product:view`, `product:manage`, `stock:view`, `stock:manage`, `report:view`, `audit:view`, `user:manage`

Ver [security-model.md](security-model.md).
