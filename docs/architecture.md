# Arquitectura — Inventory QAS

Documento final **Fase 7 (QA-9)**. Alineado con Plan de implementación v3.0.

## Decisión principal

**Monolito modular empresarial** (no microservicios): una API Spring Boot 3 (Java 21) con paquetes por dominio y un frontend **Next.js 15** (App Router).

```
                    ┌─────────────────────────────────────────┐
                    │              Usuario (browser)           │
                    └────────────────────┬────────────────────┘
                                         │ HTTPS
                    ┌────────────────────▼────────────────────┐
                    │  Next.js — UI, middleware JWT, proxies   │
                    │  /api → backend   /keycloak → Keycloak   │
                    └────────────┬──────────────┬──────────────┘
                                 │              │
              ┌──────────────────▼──┐    ┌──────▼──────────────┐
              │  Spring Boot API     │    │  Keycloak 26        │
              │  OAuth2 Resource     │◄───│  realm inventory    │
              │  Server (JWT)        │    └─────────────────────┘
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   PostgreSQL 16    Flyway migrations   Hibernate Envers
   (productos,      (versionado schema)  (auditoría)
    stock, etc.)

              Telemetría (perfil observability)
                         │
              OpenTelemetry SDK → Grafana Alloy
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   Prometheus         Loki            Tempo
         └───────────────┼───────────────┘
                         ▼
                    Grafana + Alertmanager
```

## Módulos backend

| Paquete | Responsabilidad |
|---------|-----------------|
| `product` | CRUD productos, SKU único, paginación y filtros |
| `stock` | Existencias, movimientos IN/OUT/ADJUSTMENT, validaciones |
| `report` | Dashboard KPIs, productos críticos |
| `audit` | Consulta revisiones Envers (`audit:view`) |
| `security` | JWT, `KeycloakJwtAuthoritiesConverter`, `@PreAuthorize` |
| `common` | Excepciones, DTOs, manejo de errores HTTP |

## Frontend

| Área | Detalle |
|------|---------|
| Rutas | `/`, `/login`, `/dashboard`, `/products`, `/audit` |
| Auth | Password grant vía proxy Keycloak; tokens en cookie; refresh |
| API | Cliente fetch a `/api/v1/*` con Bearer desde cookie |

## Seguridad

- Todos los endpoints `/api/v1/*` requieren JWT válido.
- Permisos granulares: `product:view`, `product:manage`, `stock:view`, `stock:manage`, `report:view`, `audit:view`, `user:manage`.
- **Issuer alignment:** el `iss` del token debe coincidir con `KEYCLOAK_ISSUER_URI` del backend (típicamente `http://localhost:8081/realms/inventory-realm` en desarrollo).

Ver [security-model.md](security-model.md).

## Persistencia

- **PostgreSQL 16** con esquema gestionado por **Flyway**.
- **Envers** audita entidades de producto; consulta vía módulo `audit`.
- Soft delete de productos (estado inactivo).

## Observabilidad

- Perfil Spring `observability`: export OTLP, métricas Actuator/Prometheus.
- **Grafana Alloy** recibe OTLP y reenvía a Prometheus, Loki y Tempo.
- Dashboards y alertas en `observability/grafana/`.

Ver [observability-guide.md](observability-guide.md).

## CI/CD y despliegue

| Entorno | Compose | Notas |
|---------|---------|-------|
| Desarrollo | `docker-compose.dev.yml` | Hot path local |
| + Observabilidad | `+ docker-compose.observability.yml` | Stack Grafana |
| Staging | `+ docker-compose.staging.yml` | Nginx, Sonar opcional |

Pipelines: GitHub Actions (`.github/workflows/`), Jenkins (`Jenkinsfile`). Ver [ci-cd-guide.md](ci-cd-guide.md) y [deployment-guide.md](deployment-guide.md).

## Calidad y pruebas

- Pirámide: unit (Mockito) → integración (Testcontainers) → E2E (Playwright) → smoke (k6, PowerShell).
- Cobertura: JaCoCo en `mvn verify`.
- Evidencias consolidadas en [qa-evidence.md](qa-evidence.md).

## Evolución futura (fuera de alcance MVP)

- Microservicios solo si el dominio crece y el equipo lo justifica.
- E2E en CI con servicios efímeros (Testcontainers Keycloak).
- Despliegue en cloud (Kubernetes / managed Postgres).
