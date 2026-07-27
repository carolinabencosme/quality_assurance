# Observability - Grafana Stack

| Component | Config |
|---|---|
| Grafana Alloy | `alloy/config.alloy` |
| Prometheus | `prometheus/prometheus.yml` |
| Loki | `loki/loki.yaml` |
| Tempo | `tempo/tempo.yaml` |
| Grafana | `grafana/provisioning/` |
| Alertmanager | `alertmanager/alertmanager.yml` |

Start with:

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d
.\scripts\warmup-demo-traffic.ps1
```

## Provisioned dashboards

| Dashboard | UID | Purpose |
|---|---|---|
| Cub Home | `cub-home` | Entry point, stack health, defense notes |
| API Overview | `inventory-api-overview` | Throughput, latency percentiles, errors, logs |
| Infra | `inventory-infra` | CPU, JVM, Hikari pool (idle/active/pending/max/timeouts) |
| Business | `inventory-business` | Inventory gauges + domain traffic |
| Security | `inventory-security` | 401/403, MDC user/endpoint, Keycloak LOGIN |

Direct URLs (Grafana on port 3030):

- http://localhost:3030/d/cub-home
- http://localhost:3030/d/inventory-api-overview
- http://localhost:3030/d/inventory-infra
- http://localhost:3030/d/inventory-business
- http://localhost:3030/d/inventory-security

Guides:

- [`docs/observability-guide.md`](../docs/observability-guide.md)
- [`docs/EXTERNAL-TOOLS.md`](../docs/EXTERNAL-TOOLS.md)
- [`docs/defensa/LINKS-DEMO-PROFESOR.md`](../docs/defensa/LINKS-DEMO-PROFESOR.md)
