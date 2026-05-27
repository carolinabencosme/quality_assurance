# Observabilidad — Grafana stack

| Componente | Config |
|------------|--------|
| Grafana Alloy | `alloy/config.alloy` |
| Prometheus | `prometheus/prometheus.yml` |
| Loki | `loki/loki.yaml` |
| Tempo | `tempo/tempo.yaml` |
| Grafana | `grafana/provisioning/` |
| Alertmanager | `alertmanager/alertmanager.yml` |

Levantar con:

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d
```

Guía: [`docs/observability-guide.md`](../docs/observability-guide.md).
