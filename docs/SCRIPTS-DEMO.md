# Catalogo de scripts Cub — Proyecto Final V3
# Uso: abre esta guia, elige el bloque, copia el comando PowerShell y corre.
#
# Prerequisito tipico (local):
#   docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d
#
# Sonar en este proyecto: http://localhost:9001  (no 9000)
# JaCoCo gate: ≥60% lineas (backend/pom.xml → jacoco.line.minimum.covered.ratio)

---

## 0. Orden recomendado para la demo / ensayo

| # | Que | Comando |
|---|-----|---------|
| 1 | Levantar stack | ver §1 |
| 2 | Datos de prueba | `.\scripts\seed-demo-data.ps1` |
| 3 | Calentar Grafana | `.\scripts\warmup-demo-traffic.ps1` |
| 4 | Auth 401/403 | `.\tests\security\auth-smoke.ps1` |
| 5 | Obs smoke | `.\tests\observability\smoke.ps1` |
| 6 | JaCoCo + evidencias | `.\scripts\generate-qa-evidence.ps1` |
| 7 | Sonar profesional | `.\scripts\setup-sonar-and-scan.ps1` |
| 8 | Bateria tests (opcional, largo) | `.\scripts\run-all-tests.ps1` |
| 9 | Cloud redirects / realm (si hace falta) | ver §8 |

---

## 1. Arranque del stack

### Compose completo (app + obs + Sonar + Jenkins)

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
```

| Para que sirve |
|----------------|
| Levanta Postgres, Keycloak, API, Frontend, Grafana/Prom/Loki/Tempo/AM, Sonar (:9001) y Jenkins (:8082) |

### Solo produccion local

| Script | Para que sirve |
|--------|----------------|
| `.\scripts\up-prod.ps1` | Levanta `docker-compose.prod.yml` (+ obs si el script lo incluye) para demo “prod academica” local |

---

## 2. De GitHub Actions → local (mapa completo)

Cada workflow de `.github/workflows/` tiene equivalente local. Corre **en este orden** si quieres reproducir CI de punta a punta (incluye JaCoCo).

| # | Workflow GitHub | Que hace en CI | Equivalente local |
|---|-----------------|----------------|-------------------|
| 1 | `ci.yml` → job **backend** | `mvn verify` + gate JaCoCo ≥60% + IT Keycloak | §3 JaCoCo |
| 2 | `ci.yml` → job **frontend** | `npm ci` + lint + build + audit | §4 Frontend |
| 3 | `ci.yml` → job **sonar** | `mvn verify` + `sonar:sonar` + Quality Gate | §5 Sonar |
| 4 | `api-postman.yml` | Newman contra stack real | §6 Newman |
| 5 | `e2e-playwright.yml` | Playwright (incl. visual) | §6 Playwright |
| 6 | `api-schemathesis.yml` | Fuzz/contrato OpenAPI | `.\scripts\run-schemathesis.ps1` |
| 7 | `security-zap.yml` | OWASP ZAP baseline | `.\scripts\run-zap-baseline.ps1` |
| 8 | `security-deps.yml` | OWASP Dependency-Check | Maven en `backend` (CI) |
| 9 | `performance-k6.yml` | Carga k6 | `.\scripts\run-k6.ps1` |
| 10 | `performance-jmeter.yml` | Carga JMeter | `.\scripts\run-jmeter.ps1` |
| 11 | `full-qa-pipeline.yml` | Orquesta casi todo | `.\scripts\run-all-tests.ps1` |
| 12 | `deploy-staging.yml` / `deploy-production.yml` | Compose + smoke + Newman/E2E | `.\scripts\deploy-staging.ps1` / `.\scripts\up-prod.ps1` + smokes |

### One-shot local (lo mas cercano a Full QA + evidencias)

```powershell
# 1) Stack
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build

# 2) Datos + humo
.\scripts\seed-demo-data.ps1
.\scripts\warmup-demo-traffic.ps1
.\tests\security\auth-smoke.ps1
.\tests\observability\smoke.ps1

# 3) JaCoCo + Surefire + Keycloak IT + resumen markdown
.\scripts\generate-qa-evidence.ps1

# 4) Sonar (Quality Gate con cobertura)
.\scripts\setup-sonar-and-scan.ps1

# 5) Bateria completa (Newman + Playwright + smokes; k6 opcional)
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
# Opcional k6 dentro de run-all-tests:
# $env:RUN_K6_SMOKE = 'true'; .\scripts\run-all-tests.ps1
```

---

## 3. JaCoCo (cobertura — mismo gate que GitHub)

**Gate academico:** ≥ **60%** lineas (`backend/pom.xml` → `jacoco.line.minimum.covered.ratio`).  
Si no llega, `mvn verify` **falla** (igual que el job `backend` de `ci.yml`).

### Correr tests + cobertura (comando CI)

```powershell
cd backend
.\mvnw.cmd verify
cd ..
.\scripts\verify-keycloak-it-report.ps1
```

| Artefacto | Ruta |
|-----------|------|
| HTML JaCoCo | `backend/target/site/jacoco/index.html` |
| CSV JaCoCo | `backend/target/site/jacoco/jacoco.csv` |
| Surefire XML | `backend/target/surefire-reports/` |

### Scripts de evidencia JaCoCo

| Script | Comando | Para que sirve |
|--------|---------|----------------|
| QA evidence pack | `.\scripts\generate-qa-evidence.ps1` | Corre `mvn verify`, escribe path HTML, resumen JaCoCo + Surefire, verifica IT Keycloak |
| JaCoCo summary | `.\scripts\generate-jacoco-summary.ps1` | Solo markdown en `docs/qa-evidence/jacoco-summary.md` (requiere CSV previo) |
| Surefire summary | `.\scripts\generate-surefire-summary.ps1` | Resume `TEST-*.xml` de Maven |
| Keycloak IT report | `.\scripts\verify-keycloak-it-report.ps1` | Exige evidencia del IT real de Keycloak (mismo check que CI) |

```powershell
# Flujo minimo cobertura + evidencia (como artefact jacoco-report de GitHub)
cd backend
.\mvnw.cmd verify
cd ..
.\scripts\generate-jacoco-summary.ps1
.\scripts\generate-surefire-summary.ps1
.\scripts\verify-keycloak-it-report.ps1
# Abrir informe:
start backend\target\site\jacoco\index.html
```

---

## 4. Frontend (job `frontend` de `ci.yml`)

```powershell
cd frontend
npm ci
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
cd ..
```

| Para que sirve |
|----------------|
| Mismo checklist que GitHub Actions: lint, build y audit de produccion |

---

## 5. SonarQube (dejarlo profesional + cobertura)

**URL:** http://localhost:9001  
**Login demo:** `admin` / `CubSonar2026!` (el script la aplica si Sonar aun esta en default).

No uses “Create from GitHub”. Usa el one-shot:

```powershell
# Crea proyecto inventory-qas, genera token, corre verify+sonar, espera Quality Gate
.\scripts\setup-sonar-and-scan.ps1
```

Si en el browser **ya cambiaste** el password de admin (error 401):

```powershell
$env:SONAR_ADMIN_PASSWORD = 'el-password-que-pusiste'
.\scripts\setup-sonar-and-scan.ps1
```

| Script | Para que sirve |
|--------|----------------|
| `setup-sonar-and-scan.ps1` | Deja Sonar con proyecto Cub, analisis Maven+JaCoCo y Quality Gate visible en la UI |
| `run-sonar-local.ps1` | Solo re-analiza si ya tienes `$env:SONAR_TOKEN` (puerto tipico 9001) |

**Despues del scan abre:** http://localhost:9001/dashboard?id=inventory-qas  
Debes ver Coverage, Bugs, Vulnerabilities, Code Smells y Quality Gate **Passed**.

---

## 6. Testing (piramide) — scripts y carpetas

### Todo junto (largo) ≈ `full-qa-pipeline.yml` + `run-all-tests.ps1`

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
```

| Paso interno | Equivalente GitHub |
|--------------|--------------------|
| `[1/6] mvn verify` + Keycloak IT | `ci.yml` backend + JaCoCo |
| `[2/6] Newman` | `api-postman.yml` |
| `[3/6] Playwright` | `e2e-playwright.yml` |
| `[4/6] auth-smoke` | security smoke / deploy |
| `[5/6] obs smoke` | full-qa observability |
| `[6/6] k6` (si `RUN_K6_SMOKE=true`) | `performance-k6.yml` |

### Por tipo (scripts)

| Script | Comando | Workflow / uso |
|--------|---------|----------------|
| Schemathesis | `.\scripts\run-schemathesis.ps1` | `api-schemathesis.yml` |
| ZAP baseline | `.\scripts\run-zap-baseline.ps1` | `security-zap.yml` |
| k6 load | `.\scripts\run-k6.ps1` | `performance-k6.yml` |
| k6 stress | `.\scripts\run-k6-stress.ps1` | Estres local (extra) |
| JMeter | `.\scripts\run-jmeter.ps1` | `performance-jmeter.yml` |
| Post-deploy smoke | `.\scripts\post-deploy-smoke.ps1` | `deploy-*.yml` smoke |
| Flyway validate | `.\scripts\validate-flyway-migrations.ps1` | Sanity migraciones |
| Flyway repair | `.\scripts\repair-flyway-checksums.ps1` | Repara checksums |
| Monorepo structure | `.\scripts\verify-monorepo-structure.ps1` | Checklist estructura |
| Avance V3 | `.\scripts\verify-avance-v3.ps1` | Checklist tecnico avance |
| Verify obs evidence | `.\scripts\verify-observability-evidence.ps1` | Evidencia obs documentada |
| Verify Keycloak realm | `.\scripts\verify-keycloak-realm.ps1` | Realm local OK |
| Keycloak admin secret | `.\scripts\set-keycloak-admin-secret.ps1` | Secret client admin API |
| Demo revoke privileges | `.\scripts\demo-revoke-privileges.ps1` | Oral: 200 → 403 al quitar rol |
| Demo API usuario externo | `.\scripts\demo-api-external-user.ps1` | Terminal: viewer lee 200 / escribe 403 (+ `-ShowToken` para Swagger) |

### E2E Playwright (≈ `e2e-playwright.yml`)

```powershell
cd tests\e2e
npm ci
npx playwright install chromium
$env:E2E_BASE_URL = 'http://localhost:3000'
npm test
# Visual (como en CI):
# $env:RUN_VISUAL_SNAPSHOTS = 'true'; npx playwright test specs/visual-snapshots.spec.ts
cd ..\..
```

### API Postman / Newman (≈ `api-postman.yml`)

```powershell
cd tests\api
npm ci
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
npm test -- --env-var baseUrl=http://localhost:8080 --env-var keycloakUrl=http://localhost:8081 --env-var sku=$sku
cd ..\..
```

### Seguridad y observabilidad (humo rapido)

| Script / test | Comando | Para que sirve |
|---------------|---------|----------------|
| Auth smoke | `.\tests\security\auth-smoke.ps1` | Demuestra **401** sin token y **403** con viewer |
| Obs smoke | `.\tests\observability\smoke.ps1` | Comprueba Grafana, Prometheus, Alertmanager vivos |

---

## 7. Datos y trafico de demo

| Script | Comando | Para que sirve |
|--------|---------|----------------|
| Seed demo | `.\scripts\seed-demo-data.ps1` | Productos extra + movimientos IN/OUT/ADJUSTMENT |
| Warmup Grafana | `.\scripts\warmup-demo-traffic.ps1` | Trafico admin/viewer para paneles Grafana |
| Revoke privileges | `.\scripts\demo-revoke-privileges.ps1` | Demo oral de perdida de permisos |
| API usuario externo | `.\scripts\demo-api-external-user.ps1` | Viewer en terminal: lectura 200, escritura/admin 403 |

---

## 8. Cloud (Vercel + Render)

| Script | Comando | Para que sirve |
|--------|---------|----------------|
| Import realm cloud | `.\scripts\import-keycloak-realm-cloud.ps1` | Si Keycloak cloud esta Live pero falta `inventory-realm` |
| Fix redirect Vercel | `.\scripts\fix-keycloak-vercel-redirects.ps1` / `.js` | Arregla `Invalid parameter: redirect_uri` |
| Redeploy frontends | `.\scripts\deploy-vercel-cloud.ps1` | Redespliega staging+prod en Vercel apuntando a API/KC cloud |

```powershell
$env:CLOUD_API_URL = "https://cub-api.onrender.com"
$env:CLOUD_KC_URL = "https://cub-keycloak.onrender.com"
.\scripts\deploy-vercel-cloud.ps1
node .\scripts\fix-keycloak-vercel-redirects.js
```

---

## 9. Deploy staging local (Compose)

| Script | Para que sirve |
|--------|----------------|
| `.\scripts\deploy-staging.ps1` | Flujo de deploy/smoke staging local (espejo de `deploy-staging.yml`) |

---

## 10. Jenkins (sin script — UI)

1. http://localhost:8082 → `admin` / `admin`  
2. Job `cub-inventory-qas` → Build Now  
3. Ver Build History + stages  

| Para que sirve |
|----------------|
| Mostrar CI visual del PDF con historial de builds (paralelo a GitHub Actions) |

---

## 11. Checklist “probar correctamente todo” (GitHub → JaCoCo)

Copia y marca:

```text
[ ] Stack compose up (dev + obs + staging)
[ ] seed-demo-data.ps1
[ ] warmup-demo-traffic.ps1
[ ] auth-smoke.ps1  (401/403)
[ ] observability/smoke.ps1
[ ] backend: mvnw verify  → JaCoCo HTML + gate 60%
[ ] verify-keycloak-it-report.ps1
[ ] generate-jacoco-summary.ps1
[ ] generate-surefire-summary.ps1   (o generate-qa-evidence.ps1 de un golpe)
[ ] frontend: npm ci / lint / build
[ ] Newman (tests/api)
[ ] Playwright (tests/e2e)
[ ] setup-sonar-and-scan.ps1 → Quality Gate Passed + Coverage
[ ] (opcional) run-schemathesis / zap / k6 / jmeter
[ ] (opcional) run-all-tests.ps1
```

---

## 12. Links rapidos

| Servicio | URL |
|----------|-----|
| App local | http://localhost:3000 |
| Staging cloud | https://cub-inventory-qas.vercel.app |
| Prod cloud | https://cub-inventory-qas-prod.vercel.app |
| API local / Swagger | http://localhost:8080/swagger-ui.html |
| API cloud | https://cub-api.onrender.com/actuator/health |
| Keycloak local | http://localhost:8081 |
| Keycloak cloud | https://cub-keycloak.onrender.com |
| Grafana | http://localhost:3030/d/cub-home |
| Alertmanager | http://localhost:9093 |
| Sonar | http://localhost:9001 |
| Jenkins | http://localhost:8082 |
| JaCoCo HTML (tras verify) | `backend/target/site/jacoco/index.html` |
| GitHub Actions | `.github/workflows/` (`ci.yml`, `full-qa-pipeline.yml`, …) |

Usuarios Cub: `admin/admin123`, `viewer/viewer123`, `warehouse/warehouse123`, `clerk/clerk123`.

---

## 13. Documentacion companion

| Doc | Contenido |
|-----|-----------|
| [`GUIA-PROYECTO-FINAL-V3.md`](./GUIA-PROYECTO-FINAL-V3.md) | Estudio / Como-Por que-Para que |
| [`GUION-PRESENTACION.md`](./GUION-PRESENTACION.md) | Texto hablado |
| [`CLOUD-STAGING-PROD.md`](./CLOUD-STAGING-PROD.md) | Vercel + Render |
| [`qa-evidence/`](./qa-evidence/) | Evidencias selladas (`jacoco-summary.md`, etc.) |
