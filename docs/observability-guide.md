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

| Dashboard | File | Purpose |
|---|---|---|
| Inventory API Overview | `inventory-api.json` | HTTP, latency, API up, heap, logs |
| Inventory Infra | `inventory-infra.json` | JVM memory, threads, CPU, Hikari, uptime |
| Inventory Business | `inventory-business.json` | Product gauges, inventory value, stock movement rate and business traffic |
| Inventory Security | `inventory-security.json` | 401/403, protected 5xx, user/endpoint logs and Keycloak login logs |

The app dashboard also reads `/api/v1/observability/system-metrics` for CPU, heap, threads, HTTP count/error/p95 and Hikari active/idle/max/pending.

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
{container=~"inventory-backend.*"}
```

Errors:

```logql
{container=~"inventory-.*"} |= "ERROR"
```

Access denied:

```logql
{container=~"inventory-.*"} |= "Access denied"
```

Authenticated API request logs:

```logql
{container=~"inventory-.*backend.*|inventory-api.*"} |= "user=" |= "endpoint="
```

Keycloak login audit:

```logql
{container=~".*keycloak.*"} |= "LOGIN"
```

## Tempo

Use Grafana Explore with the Tempo datasource. Start from a trace id in logs or inspect recent traces emitted through Alloy.

## Alerts

Configured alerts include `InventoryApiDown`, `HighLatencyP95`, `HighErrorRate`, `HighCpuUsage`, `HighAuthFailureRate`, `GrafanaDown`, `LokiDown`, `TempoDown` and `HighJvmMemoryUsage`.

PostgreSQL down alert is documented as a limitation because no PostgreSQL exporter is currently provisioned.

## Smoke

```powershell
.\tests\observability\smoke.ps1
```

## Defense Screenshots

Capture Grafana app, infra, business and security dashboards, Prometheus targets, Alertmanager alerts, a Loki query with backend logs and Tempo Explore.
