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
```

Provisioned dashboards:

- `inventory-api.json`
- `inventory-infra.json`
- `inventory-business.json`
- `inventory-security.json`

Guide: [`docs/observability-guide.md`](../docs/observability-guide.md).
