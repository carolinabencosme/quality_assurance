# CI/CD — Fase 6 (QA-8)

Plan v3.0: **GitHub Actions** (PR + quality gate), **Jenkins**, **SonarQube**, **deploy staging** y **post-deploy smoke**.

## GitHub Actions

| Workflow | Disparador | Qué hace |
|----------|------------|----------|
| `ci.yml` | PR y push a `main`/`develop`/`feature/*` | Backend `mvn verify` + JaCoCo, frontend `npm run build`, Sonar (si hay token) |
| `deploy-staging.yml` | Push a `develop` o manual | Compose core + post-deploy smoke |

### Secrets / variables (repo)

| Nombre | Tipo | Uso |
|--------|------|-----|
| `SONAR_TOKEN` | Secret | Token de SonarQube / SonarCloud |
| `SONAR_HOST_URL` | Variable | p. ej. `http://localhost:9000` o URL SonarCloud |

Sin `SONAR_TOKEN`, el job Sonar se omite con aviso (CI sigue en verde).

## Jenkins

1. Levantar stack con Jenkins: ver staging abajo → http://localhost:8082  
2. Crear **Pipeline** job desde SCM → apunta al `Jenkinsfile` del repo.  
3. Parámetros: `DEPLOY_STAGING`, `RUN_SONAR`; credencial `SONAR_TOKEN` en Jenkins.

## SonarQube local (staging)

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.staging.yml up -d sonarqube
```

- UI: http://localhost:9000 (primer arranque: `admin` / `admin`, cambiar password).  
- Generar token → exportar `SONAR_TOKEN` y ejecutar:

```powershell
cd backend
..\mvnw.cmd verify sonar:sonar -Dsonar.host.url=http://localhost:9000 -Dsonar.token=TU_TOKEN
```

Configuración: `sonar-project.properties` en la raíz del monorepo.

## Deploy staging completo

```powershell
.\scripts\deploy-staging.ps1
```

Equivalente manual:

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
.\scripts\post-deploy-smoke.ps1
```

| Servicio | Puerto |
|----------|--------|
| Frontend (prod) | 3000 |
| Backend | 8080 |
| Grafana | 3001 |
| Prometheus | 9090 |
| SonarQube | 9000 |
| Jenkins | 8082 |

## Post-deploy smoke

Comprueba: health backend, frontend, Keycloak, 401 sin JWT, dashboard con `viewer`, opcional observabilidad.

```powershell
.\scripts\post-deploy-smoke.ps1
# Linux / CI
./scripts/post-deploy-smoke.sh
```

Variables: `API_BASE`, `KEYCLOAK_BASE`, `FRONTEND_BASE`, `SMOKE_MAX_WAIT`.

## Quality gate (definición de hecho)

- [ ] `ci.yml` en verde en el PR  
- [ ] Sonar sin bugs críticos (cuando hay servidor Sonar)  
- [ ] `post-deploy-smoke` OK tras deploy staging  
- [ ] Jenkinsfile ejecutado al menos una vez en Jenkins local o documentado en evidencias
