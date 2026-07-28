# Catalogo de scripts Cub — Proyecto Final V3
# Uso: abre esta guia, elige el bloque, copia el comando PowerShell y corre.
#
# Prerequisito tipico (local):
#   docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d
#
# Sonar en este proyecto: http://localhost:9001  (no 9000)

---

## 0. Orden recomendado para la demo / ensayo

| # | Que | Comando |
|---|-----|---------|
| 1 | Levantar stack | ver §1 |
| 2 | Datos de prueba | `.\scripts\seed-demo-data.ps1` |
| 3 | Calentar Grafana | `.\scripts\warmup-demo-traffic.ps1` |
| 4 | Auth 401/403 | `.\tests\security\auth-smoke.ps1` |
| 5 | Obs smoke | `.\tests\observability\smoke.ps1` |
| 6 | Sonar profesional | `.\scripts\setup-sonar-and-scan.ps1` |
| 7 | Bateria tests (opcional, largo) | `.\scripts\run-all-tests.ps1` |
| 8 | Cloud redirects / realm (si hace falta) | ver §5 |

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

## 2. Datos y trafico de demo

| Script | Comando | Para que sirve |
|--------|---------|----------------|
| Seed demo | `.\scripts\seed-demo-data.ps1` | Crea productos extra + movimientos IN/OUT/ADJUSTMENT para probar dashboard/stock |
| Warmup Grafana | `.\scripts\warmup-demo-traffic.ps1` | Genera trafico admin/viewer para llenar paneles Grafana y metricas |
| Post-deploy smoke | `.\scripts\post-deploy-smoke.ps1` | Humo rapido tras un deploy (health + basicos) |

---

## 3. Seguridad y observabilidad (humo rapido)

| Script / test | Comando | Para que sirve |
|---------------|---------|----------------|
| Auth smoke | `.\tests\security\auth-smoke.ps1` | Demuestra **401** sin token y **403** con viewer |
| Obs smoke | `.\tests\observability\smoke.ps1` | Comprueba Grafana, Prometheus, Alertmanager vivos |
| Verify obs evidence | `.\scripts\verify-observability-evidence.ps1` | Valida que hay evidencia de observabilidad documentada |
| Verify Keycloak realm | `.\scripts\verify-keycloak-realm.ps1` | Comprueba que el realm local esta importado/OK |
| Keycloak admin secret | `.\scripts\set-keycloak-admin-secret.ps1` | Configura/rota secret del client admin API |

---

## 4. SonarQube (dejarlo profesional)

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
| `generate-jacoco-summary.ps1` | Escribe resumen de cobertura en `docs/qa-evidence/jacoco-summary.md` |

**Despues del scan abre:** http://localhost:9001/dashboard?id=inventory-qas  
Debes ver Coverage, Bugs, Vulnerabilities, Code Smells y Quality Gate **Passed**.

---

## 5. Cloud (Vercel + Render)

| Script | Comando | Para que sirve |
|--------|---------|----------------|
| Import realm cloud | `.\scripts\import-keycloak-realm-cloud.ps1` | Si Keycloak cloud esta Live pero falta `inventory-realm` |
| Fix redirect Vercel | `.\scripts\fix-keycloak-vercel-redirects.js` | Arregla `Invalid parameter: redirect_uri` |
| Redeploy frontends | `.\scripts\deploy-vercel-cloud.ps1` | Redespliega staging+prod en Vercel apuntando a API/KC cloud |

```powershell
$env:CLOUD_API_URL = "https://cub-api.onrender.com"
$env:CLOUD_KC_URL = "https://cub-keycloak.onrender.com"
.\scripts\deploy-vercel-cloud.ps1
node .\scripts\fix-keycloak-vercel-redirects.js
```

---

## 6. Testing (piramide)

### Todo junto (largo)

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
```

| Para que sirve |
|----------------|
| Orquesta la bateria local de tests del monorepo (unit/IT y demas pasos del script) |

### Por tipo

| Script | Comando | Para que sirve |
|--------|---------|----------------|
| Schemathesis | `.\scripts\run-schemathesis.ps1` | Fuzz/contrato desde OpenAPI |
| ZAP baseline | `.\scripts\run-zap-baseline.ps1` | Scan OWASP ZAP basico de seguridad |
| k6 load | `.\scripts\run-k6.ps1` | Prueba de carga k6 |
| k6 stress | `.\scripts\run-k6-stress.ps1` | Estres k6 |
| JMeter | `.\scripts\run-jmeter.ps1` | Carga JMeter |
| Keycloak IT report | `.\scripts\verify-keycloak-it-report.ps1` | Verifica evidencia del IT de Keycloak |
| Surefire summary | `.\scripts\generate-surefire-summary.ps1` | Resume resultados Maven Surefire |
| QA evidence pack | `.\scripts\generate-qa-evidence.ps1` | Genera/actualiza paquete de evidencias |
| Flyway validate | `.\scripts\validate-flyway-migrations.ps1` | Valida que existen las migraciones esperadas |
| Flyway repair | `.\scripts\repair-flyway-checksums.ps1` | Repara checksums Flyway si se desalinean |
| Monorepo structure | `.\scripts\verify-monorepo-structure.ps1` | Comprueba estructura minima del repo |
| Avance V3 | `.\scripts\verify-avance-v3.ps1` | Checklist tecnico de avance del proyecto |

### E2E Playwright (desde carpeta tests)

```powershell
cd tests\e2e
npm ci
npx playwright test
```

| Para que sirve |
|----------------|
| Pruebas end-to-end en browser (login, CRUD, permisos, etc.) |

### API Postman / Newman

```powershell
cd tests\api
npm ci
# segun README de tests/api (coleccion inventory-qas)
```

| Para que sirve |
|----------------|
| Regresion de API por coleccion Postman |

---

## 7. Deploy staging local (Compose)

| Script | Para que sirve |
|--------|----------------|
| `.\scripts\deploy-staging.ps1` | Flujo de deploy/smoke staging local documentado en el repo |

---

## 8. Jenkins (sin script — UI)

1. http://localhost:8082 → `admin` / `admin`  
2. Job `cub-inventory-qas` → Build Now  
3. Ver Build History + stages  

| Para que sirve |
|----------------|
| Mostrar CI visual del PDF con historial de builds |

---

## 9. Links rapidos

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

Usuarios Cub: `admin/admin123`, `viewer/viewer123`, `warehouse/warehouse123`, `clerk/clerk123`.

---

## 10. Documentacion companion

| Doc | Contenido |
|-----|-----------|
| [`GUIA-PROYECTO-FINAL-V3.md`](./GUIA-PROYECTO-FINAL-V3.md) | Estudio / Como-Por que-Para que |
| [`GUION-PRESENTACION.md`](./GUION-PRESENTACION.md) | Texto hablado |
| [`CLOUD-STAGING-PROD.md`](./CLOUD-STAGING-PROD.md) | Vercel + Render |
| [`qa-evidence/`](./qa-evidence/) | Evidencias selladas |
