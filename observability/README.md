# Observability stack

Config under this folder. Dashboards: `grafana/provisioning/dashboards/json/`.

Guia unica del proyecto: [`docs/GUIA-PROYECTO-FINAL-V3.md`](../docs/GUIA-PROYECTO-FINAL-V3.md)  
C4: [`docs/architecture.md`](../docs/architecture.md)

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d
.\scripts\warmup-demo-traffic.ps1
```

Grafana home: http://localhost:3030/d/cub-home
