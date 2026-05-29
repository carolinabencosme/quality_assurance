# Tests — fuera de `backend/src/test`

| Carpeta | Herramienta | Cuándo ejecutar |
|---------|-------------|-----------------|
| `e2e/` | Playwright | Stack Docker (`docker-compose.test.yml`) |
| `performance/k6/` | k6 | Smoke de health/API |
| `security/` | PowerShell | Token Keycloak + endpoints |
| `observability/` | PowerShell | Prometheus/Grafana up |

Guía detallada: [`docs/testing-guide.md`](../docs/testing-guide.md).
