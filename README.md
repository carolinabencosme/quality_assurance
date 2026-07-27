# Cub - Enterprise Inventory QAS

Cub es el Proyecto Final V3: inventario + Full Stack Testing + observabilidad + DevSecOps.

## Documentacion (solo lo esencial)

| Documento | Contenido |
|-----------|-----------|
| [`docs/GUIA-PROYECTO-FINAL-V3.md`](docs/GUIA-PROYECTO-FINAL-V3.md) | Guia general: que tenemos, como probar, que presentar, mapa de codigo |
| [`docs/architecture.md`](docs/architecture.md) | Diagramas C4 L1/L2/L3 |
| [`docs/qa-evidence/`](docs/qa-evidence/) | Evidencias y reportes de sellado |

## Quick Start

```powershell
copy .env.example .env
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
.\scripts\warmup-demo-traffic.ps1
```

| Servicio | URL |
|---|---|
| App Cub | http://localhost:3000 |
| API / Swagger | http://localhost:8080/swagger-ui.html |
| Keycloak | http://localhost:8081 (`admin` / `admin`) |
| Grafana | http://localhost:3030 (`admin` / `admin`) — home `/d/cub-home` |
| Prometheus | http://localhost:9090 |
| Alertmanager | http://localhost:9093 |
| SonarQube | http://localhost:9001 (`admin` / `admin`) |

Usuarios Cub: `admin/admin123`, `viewer/viewer123`, `warehouse/warehouse123`, `clerk/clerk123`.

## Tests

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
```

## Stack

Spring Boot 3.4, Java 21, PostgreSQL, Flyway, Envers, Next.js, Keycloak 26, Prometheus, Loki, Tempo, Alloy, Grafana, Alertmanager, GitHub Actions, Jenkins, SonarQube.
