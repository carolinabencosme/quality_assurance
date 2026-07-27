# Observability Guide

## Start Stack

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

## URLs

| Component | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend health | http://localhost:8080/actuator/health |
| Swagger | http://localhost:8080/swagger-ui.html |
| Keycloak | http://localhost:8081 |
| Grafana | http://localhost:3030 |
| Prometheus | http://localhost:9090 |
| Loki | http://localhost:3100 |
| Tempo | http://localhost:3200 |
| Alertmanager | http://localhost:9093 |

Dev credentials are documented in `.env.example` and are only for local demonstration.

## Grafana Dashboards

Login Grafana: `admin` / `admin` (solo demo local). Home por defecto: **Cub — Home Observabilidad**.

| Dashboard | File / UID | Purpose |
|---|---|---|
| Cub Home | `cub-home.json` / `cub-home` | Entrada, salud del stack, instrucciones de defensa |
| Inventory API Overview | `inventory-api.json` / `inventory-api-overview` | Throughput, p50/p95/p99, error rate, top URIs, logs |
| Inventory Infra | `inventory-infra.json` / `inventory-infra` | JVM, CPU, threads, Hikari idle/active/pending/max/timeouts |
| Inventory Business | `inventory-business.json` / `inventory-business` | Gauges negocio + trafico products/stock/reports |
| Inventory Security | `inventory-security.json` / `inventory-security` | 401/403, 5xx, Access denied, user/endpoint MDC, Keycloak LOGIN |

Cada dashboard incluye un panel markdown **Que mirar aqui**. Loki tiene derived fields a Tempo (`traceId`).

Calentar datos antes de la demo:

```powershell
.\scripts\warmup-demo-traffic.ps1
```

The Cub UI dashboard also reads `/api/v1/observability/system-metrics` for CPU, heap, threads, HTTP count/error/p95 and Hikari active/idle/max/pending.

Links listos para el profesor: [`docs/defensa/LINKS-DEMO-PROFESOR.md`](./defensa/LINKS-DEMO-PROFESOR.md).

## Prometheus Queries

Latency p95:

```promql
histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{job="inventory-api"}[5m])) by (le))
```

Throughput:

```promql
sum(rate(http_server_requests_seconds_count{job="inventory-api"}[1m]))
```

Error rate:

```promql
sum(rate(http_server_requests_seconds_count{job="inventory-api",status=~"5.."}[5m]))
```

Auth failures:

```promql
sum(rate(http_server_requests_seconds_count{job="inventory-api",status=~"401|403"}[5m]))
```

Business metrics:

```promql
inventory_products_active{job="inventory-api"}
inventory_products_critical{job="inventory-api"}
inventory_inventory_value{job="inventory-api"}
rate(inventory_movements_total{job="inventory-api"}[5m])
```

## Loki Queries

Backend logs:

```logql
{service_name="backend"}
```

Errors:

```logql
{compose_project="inventory-qas"} |= "ERROR"
```

Access denied:

```logql
{compose_project="inventory-qas"} |= "Access denied"
```

Authenticated API request logs:

```logql
{service_name="backend"} | json | user != "" | endpoint != ""
```

Keycloak login audit:

```logql
{service_name="keycloak"} |= "LOGIN"
```

## Tempo

Use Grafana Explore with the Tempo datasource. Start from a `traceId` in the parsed Loki result. A product request must contain the HTTP/security spans and JDBC spans such as `SELECT inventory.products`, `INSERT inventory.products` or `UPDATE inventory.products`.

The live verifier creates and deactivates a disposable product, checks the required Loki fields, retrieves the same trace from Tempo and fails if no database span exists:

```powershell
.\scripts\verify-observability-evidence.ps1
```

Its non-secret result is stored in `docs/qa-evidence/observability-live-summary.md`.

## Alerts

Configured alerts include `InventoryApiDown`, `HighLatencyP95`, `HighErrorRate`, `HighCpuUsage`, `HighAuthFailureRate`, `GrafanaDown`, `LokiDown`, `TempoDown` and `HighJvmMemoryUsage`.

PostgreSQL down alert is documented as a limitation because no PostgreSQL exporter is currently provisioned.

## Smoke

```powershell
.\tests\observability\smoke.ps1
```

## Defense Screenshots

Capture Grafana app, infra, business and security dashboards, Prometheus targets, Alertmanager alerts, a Loki query with backend logs and Tempo Explore.
