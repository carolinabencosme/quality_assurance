# QA Evidence — Plan v3.0 §17

Ticket: **QA-9** — Fase 7: Documentación final y defensa.  
Consolida evidencias de **QA-2** a **QA-8** y checklist de aceptación para la presentación.

**Rama:** `feature/qa-9-fase-7-documentacion-defensa`  
**Última actualización:** 2026-05-27

---

## 1. Resumen por fase

| Fase | Ticket | Entregable principal | Evidencia |
|------|--------|----------------------|-----------|
| 0 | QA-2 | Repo, Docker dev, README | `docker-compose.dev.yml`, `.env.example` |
| 1 | QA-3 | API productos/stock, Flyway | Swagger, tests API |
| 2 | QA-4 | Keycloak + permisos | `docs/security-model.md`, `ApiSecurityMvcTest` |
| 3 | QA-5 | Dashboard + Envers | `/dashboard`, `/audit`, `ReportApiIntegrationTest` |
| 4 | QA-6 | Testing full stack | JaCoCo, Playwright, k6, `docs/testing-guide.md` |
| 5 | QA-7 | Observabilidad | `observability/`, `docs/observability-guide.md` |
| 6 | QA-8 | CI/CD | `.github/workflows/`, `Jenkinsfile`, `docs/ci-cd-guide.md` |
| 7 | QA-9 | Docs + defensa | Este documento, `docs/defensa/` |
| — | QA-10 | Estructura monorepo plan técnico | `docs/monorepo-structure.md`, `verify-monorepo-structure.ps1` |

---

## 2. Pruebas automatizadas

| Suite | Comando | Resultado | Fecha |
|-------|---------|-----------|-------|
| Backend unit + security | `cd backend && .\mvnw.cmd test` | **13 passed**, 4 skipped (Testcontainers sin Docker activo) | 2026-05-27 |
| Backend verify + JaCoCo | `cd backend && .\mvnw.cmd verify` | Ejecutar antes de defensa; reporte en `backend/target/site/jacoco/index.html` | |
| Frontend build | `cd frontend && npm ci && npm run build` | Pendiente local / CI | |
| Playwright E2E | `cd tests/e2e && npm test` | Requiere stack Docker; ver `docs/testing-guide.md` | |
| k6 smoke | `k6 run tests/performance/k6/smoke.js` | Health `/actuator/health` | |
| Security smoke | `.\tests\security\auth-smoke.ps1` | Token Keycloak + endpoints protegidos | |
| Observability smoke | `.\tests\observability\smoke.ps1` | Prometheus/Grafana up | |
| Post-deploy smoke | `.\scripts\post-deploy-smoke.ps1` | Tras staging (QA-8) | |

### Clases de prueba backend (8 suites, 17 casos)

| Clase | Tipo | Casos |
|-------|------|-------|
| `ProductServiceTest` | Unit | 3 |
| `StockServiceTest` | Unit | 2 |
| `ReportServiceTest` | Unit | 1 |
| `KeycloakJwtAuthoritiesConverterTest` | Unit | 1 |
| `ApiSecurityMvcTest` | Security MVC | 6 |
| `InventoryApplicationTests` | Integration (TC) | 1 (skip sin Docker) |
| `ProductApiIntegrationTest` | API (TC) | 2 (skip sin Docker) |
| `ReportApiIntegrationTest` | API (TC) | 1 (skip sin Docker) |

Con **Docker Desktop** en ejecución, `mvnw.cmd verify` ejecuta las 17 pruebas contra PostgreSQL en Testcontainers.

---

## 3. Charters de prueba exploratoria

| Charter | Alcance | Estado |
|---------|---------|--------|
| CT-01 Login y roles | `viewer`, `admin`, `warehouse` en http://localhost:3000 | Checklist defensa |
| CT-02 Stock crítico | Dashboard KPIs + movimientos IN/OUT | Checklist defensa |
| CT-03 Auditoría Envers | Solo `audit:view` (admin), historial producto | Checklist defensa |
| CT-04 Observabilidad | Grafana dashboards, trace en Tempo | Fase 5 |
| CT-05 Pipeline CI | PR a `develop`, jobs backend/frontend/sonar | Fase 6 |

Detalle operativo: [`docs/defensa/checklist-defensa.md`](defensa/checklist-defensa.md).

---

## 4. Bugs encontrados y corregidos

| ID | Descripción | Fix | Fase |
|----|-------------|-----|------|
| BUG-01 | Sesión expirada / 401 tras login | Issuer JWT `http://localhost:8081` alineado en backend y proxy Next.js | 2–4 |
| BUG-02 | HTTP 500 login en contenedor frontend | `KEYCLOAK_PROXY_TARGET` hacia Keycloak en red Docker | 2 |
| BUG-03 | Backend sin métricas OTLP en compose observability | `SPRING_PROFILES_ACTIVE=dev,observability` en overlay | 5 |

---

## 5. CI/CD y calidad (QA-8)

| Artefacto | Ubicación |
|-----------|-----------|
| GitHub Actions CI | `.github/workflows/ci.yml` |
| Deploy staging | `.github/workflows/deploy-staging.yml` |
| Jenkins pipeline | `Jenkinsfile` |
| SonarQube | `sonar-project.properties` |
| Staging compose | `docker-compose.staging.yml` |
| Guía | `docs/ci-cd-guide.md` |

---

## 6. Observabilidad (QA-7)

Stack: OpenTelemetry → Grafana Alloy → Prometheus / Loki / Tempo → Grafana + Alertmanager.

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

Guía: [`docs/observability-guide.md`](observability-guide.md).

---

## 7. Evidencia de aceptación final

- [ ] Demo Docker: login → dashboard → productos → auditoría (admin)
- [ ] Capturas en `docs/qa-evidence/screenshots/` (ver [`CHECKLIST-CAPTURAS.md`](qa-evidence/CHECKLIST-CAPTURAS.md))
- [ ] Ensayo presentación (~15 min) con [`docs/defensa/guion-presentacion.md`](defensa/guion-presentacion.md)
- [ ] PR `feature/qa-9-fase-7-documentacion-defensa` → `develop` con checklist completado
- [ ] Documentos finales: `architecture.md`, `requirements.md`, README fases 0–7

### Usuarios de prueba (Keycloak)

| Usuario | Contraseña | Rol típico |
|---------|------------|------------|
| viewer | viewer123 | Solo lectura |
| admin | admin123 | Gestión + auditoría |
| warehouse | warehouse123 | Stock |

---

## 8. Referencias

- [`docs/testing-guide.md`](testing-guide.md) — Fase 4
- [`docs/security-model.md`](security-model.md) — Fase 2
- [`docs/deployment-guide.md`](deployment-guide.md) — Despliegue
- [`docs/GUIA_IMPLEMENTACION.md`](GUIA_IMPLEMENTACION.md) — Guía del equipo
