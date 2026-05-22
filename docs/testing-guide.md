# Guía de pruebas — Fase 4 (QA-6)

Alineada con **Plan v3.0** y ticket **QA-6**: unit, integration, API, E2E, security, performance y JaCoCo.

## Estructura

| Tipo | Ubicación | Herramienta |
|------|-----------|-------------|
| Unit | `backend/src/test/java/**/service/*Test.java` | JUnit 5 + Mockito |
| Integration / API | `backend/src/test/java/**/api/*IntegrationTest.java` | Spring Boot + Testcontainers + MockMvc |
| Seguridad API | `backend/.../security/ApiSecurityMvcTest.java` | `@WebMvcTest` + JWT mock |
| E2E | `tests/e2e/specs/` | Playwright |
| Performance | `tests/performance/k6/` | k6 |
| Seguridad smoke | `tests/security/auth-smoke.ps1` | PowerShell + Keycloak |

## Requisitos

- **Java 21**, Maven (`backend/mvnw.cmd`)
- **Docker Desktop** (Testcontainers PostgreSQL)
- **Node 22** (frontend build, Playwright)
- **k6** (opcional): https://k6.io/docs/get-started/installation/

## Backend — unit + integration + cobertura

```powershell
cd backend
.\mvnw.cmd verify
```

- `test`: unit + integration + contexto (Testcontainers)
- `verify`: genera reporte JaCoCo en `backend/target/site/jacoco/index.html`

Sin Docker, el test de contexto e integración se omiten (`disabledWithoutDocker = true`).

## Frontend

```powershell
cd frontend
npm ci
npm run build
npm run lint
```

## E2E (Playwright)

Con el stack levantado (`docker compose -f docker-compose.dev.yml up -d`):

```powershell
cd tests/e2e
npm install
npx playwright install chromium
$env:E2E_BASE_URL = "http://localhost:3000"
npm test
```

Reporte HTML: `docs/qa-evidence/playwright-report/`

## Performance (k6)

```powershell
# Solo health (sin JWT)
k6 run tests/performance/k6/smoke.js

# Con token viewer (opcional)
$token = (Invoke-RestMethod ...).access_token
k6 run -e ACCESS_TOKEN=$token tests/performance/k6/smoke.js
```

## Seguridad

```powershell
.\tests\security\auth-smoke.ps1
```

## CI (GitHub Actions)

- Job `backend`: `mvn -B verify` + artefacto JaCoCo
- Job `frontend`: `npm ci` + `npm run build`

E2E no corre en CI por dependencia del stack completo; ejecutar localmente antes del PR.

## Definición de hecho (QA-6)

- [ ] `mvn verify` en verde con Docker
- [ ] JaCoCo generado y referenciado en `docs/qa-evidence.md`
- [ ] Playwright: login + dashboard OK
- [ ] `auth-smoke.ps1` OK
- [ ] k6 smoke sin errores de umbral
- [ ] Evidencias actualizadas en `docs/qa-evidence.md`
