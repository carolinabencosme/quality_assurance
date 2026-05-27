# Observabilidad — Fase 5 (QA-7)

Stack según Plan v3.0: **OpenTelemetry → Alloy → Prometheus / Loki / Tempo → Grafana → Alertmanager**.

## Arquitectura

```
Spring Boot (inventory-api)
  ├─ Métricas Micrometer → /actuator/prometheus → Prometheus (scrape)
  └─ Trazas OTLP (HTTP) → Alloy :4318 → Tempo

Contenedores Docker (inventory-*)
  └─ Alloy (loki.source.docker) → Loki

Prometheus → reglas → Alertmanager
Grafana ← Prometheus, Loki, Tempo (dashboards provisionados)
```

## Arranque

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

Espera ~2 min (Keycloak + backend + Grafana).

## URLs

| Servicio | URL | Credenciales |
|----------|-----|----------------|
| Grafana | http://localhost:3001 | admin / admin (`.env`) |
| Prometheus | http://localhost:9090 | — |
| Alertmanager | http://localhost:9093 | — |
| Tempo | http://localhost:3200 | — |
| Loki | http://localhost:3100 | — |
| Alloy UI | http://localhost:12345 | — |
| Métricas API | http://localhost:8080/actuator/prometheus | — |

Dashboard provisionado: carpeta **Inventory QAS** → **Inventory API — Overview**.

## Variables (backend)

| Variable | Descripción |
|----------|-------------|
| `OTEL_SERVICE_NAME` | Nombre del servicio en trazas |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | p. ej. `http://alloy:4318/v1/traces` |
| `OTEL_TRACES_SAMPLER_PROBABILITY` | `1.0` en dev |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` | Grafana |

Perfil Spring `observability` (incluido en `dev`): expone `prometheus`, OTLP tracing y histogramas HTTP.

## Verificación

```powershell
.\tests\observability\smoke.ps1
```

1. En Grafana → Explore → Tempo: buscar trazas tras llamar a `GET /api/v1/products` (con JWT).
2. En Grafana → Explore → Loki: `{container=~"inventory-.*"}`.
3. En Prometheus → Alerts: reglas `InventoryApiDown`, `HighHttpErrorRate`.
4. En Alertmanager: estado de alertas (dev sin webhook).

## Sin stack de observabilidad

Solo desarrollo core:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

El backend sigue con métricas en `/actuator/prometheus`; las trazas OTLP fallarán en segundo plano si Alloy no está (sin bloquear el arranque).

## Estructura

```
observability/
  alloy/config.alloy
  prometheus/prometheus.yml + rules/
  loki/loki.yaml
  tempo/tempo.yaml
  grafana/provisioning/
  alertmanager/alertmanager.yml
docker-compose.observability.yml
```
