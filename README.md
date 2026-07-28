# Cub - Enterprise Inventory QAS

Cub es el Proyecto Final V3: inventario + Full Stack Testing + observabilidad + DevSecOps.

## Ambientes en la nube (sin Docker en tu PC)

| Ambiente | App (Vercel) | API | Keycloak |
|----------|--------------|-----|----------|
| **Staging** | https://cub-inventory-qas.vercel.app | https://cub-api.onrender.com | https://cub-keycloak.onrender.com |
| **Production** | https://cub-inventory-qas-prod.vercel.app | https://cub-api.onrender.com | https://cub-keycloak.onrender.com |

Usuarios demo: `admin/admin123`, `viewer/viewer123`, `warehouse/warehouse123`, `clerk/clerk123`.

> Render free duerme tras inactividad: la primera carga puede tardar ~1 minuto.

### Activar / redesplegar el backend cloud (Render)

1. Abre [Render Blueprint](https://dashboard.render.com/select-repo?type=blueprint) y conecta este repo (rama `presentacion`).
2. Usa el archivo `render.yaml` (crea Postgres + `cub-keycloak` + `cub-api`).
3. Cuando esten Live, redespliega frontends:

```powershell
$env:CLOUD_API_URL = "https://cub-api.onrender.com"
$env:CLOUD_KC_URL = "https://cub-keycloak.onrender.com"
.\scripts\deploy-vercel-cloud.ps1
```

## Documentacion

| Documento | Contenido |
|-----------|-----------|
| [`docs/GUIA-PROYECTO-FINAL-V3.md`](docs/GUIA-PROYECTO-FINAL-V3.md) | Guia de estudio / defensa (mapa PDF ↔ codigo) |
| [`docs/architecture.md`](docs/architecture.md) | Diagramas C4 L1/L2/L3 |
| [`docs/qa-evidence/`](docs/qa-evidence/) | Evidencias de sellado |
| [`docs/CLOUD-STAGING-PROD.md`](docs/CLOUD-STAGING-PROD.md) | Staging + Production en la nube |

## Local (opcional, desarrollo)

```powershell
copy .env.example .env
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
.\scripts\warmup-demo-traffic.ps1
```

| Servicio local | URL |
|---|---|
| App | http://localhost:3000 |
| API / Swagger | http://localhost:8080/swagger-ui.html |
| Keycloak | http://localhost:8081 |
| Grafana | http://localhost:3030 |
| SonarQube | http://localhost:9001 |
| Jenkins | http://localhost:8082 |

## Tests

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
```

## Stack

Spring Boot 3.4, Java 21, PostgreSQL, Flyway, Envers, Next.js, Keycloak 26, Prometheus, Loki, Tempo, Alloy, Grafana, Alertmanager, GitHub Actions, Jenkins, SonarQube, Vercel, Render.
