# Herramientas externas — Cub QAS

Guia profesional del stack externo (observabilidad, calidad, identidad, CI).  
Links listos para demo: [`docs/defensa/LINKS-DEMO-PROFESOR.md`](../docs/defensa/LINKS-DEMO-PROFESOR.md).

## Mapa

| Herramienta | Rol | Puerto | Config |
|-------------|-----|-------:|--------|
| Grafana | Dashboards + Explore | 3030 | `observability/grafana/provisioning/` |
| Prometheus | Metricas + reglas | 9090 | `observability/prometheus/` |
| Loki | Logs | 3100 | `observability/loki/` |
| Tempo | Trazas | 3200 | `observability/tempo/` |
| Alloy | Collector OTLP | 4317/4318 | `observability/alloy/` |
| Alertmanager | Alertas | 9093 | `observability/alertmanager/` |
| Keycloak | IdP | 8081 | `keycloak/realm-export.json` |
| SonarQube | Quality gate | 9001 | `docker-compose.staging.yml` (host 9001 → container 9000) |
| Jenkins | Pipeline visual | 8082 | `Jenkinsfile` + staging compose |

## Dashboards Grafana (provisionados)

| UID | Nombre | Proposito |
|-----|--------|-----------|
| `cub-home` | Cub — Home Observabilidad | Entrada, salud del stack, instrucciones |
| `inventory-api-overview` | API Overview | Throughput, latencia, errores, logs |
| `inventory-infra` | Infra | CPU, JVM, Hikari pool |
| `inventory-business` | Business | Gauges de inventario + trafico dominio |
| `inventory-security` | Security | 401/403, MDC user/endpoint, LOGIN Keycloak |

Cada dashboard incluye panel markdown **Que mirar aqui** para la defensa oral.

## Correlacion logs ↔ trazas

Datasource Loki define `derivedFields` hacia Tempo (`traceId`).  
En Grafana Explore: log → click TraceID → spans HTTP + JDBC.

## Alertas Prometheus

Archivo: `observability/prometheus/rules/inventory-alerts.yml`  
UI: http://localhost:9093

Incluye: API down, error rate, latencia p95, CPU alta, auth failures, JVM heap, Grafana/Loki/Tempo down.

## SonarQube

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d sonarqube
# UI: http://localhost:9001  (SONAR_PORT default 9001)
$env:SONAR_HOST_URL = 'http://localhost:9001'
$env:SONAR_TOKEN = '<token>'
.\scripts\run-sonar-local.ps1
```

Evidencia: `docs/qa-evidence/sonar-summary.md`.

## Arranque completo demo

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
.\scripts\warmup-demo-traffic.ps1
.\tests\observability\smoke.ps1
```
