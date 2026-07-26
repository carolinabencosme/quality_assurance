# Guia de estudio, pruebas y presentacion — Cub V3

> Documento maestro de la rama `defensa`.  
> Para cada tema: **para que sirve**, **donde esta en codigo**, **como se usa / prueba**, **que decir** en la defensa.

Complementos:

- Guion con tiempos: `GUIA-PRESENTACION-FINAL-V3.md`
- C4: `docs/architecture.md`
- Evidencias: `docs/qa-evidence/`

---

## Parte A — Como probar todo (checklist practico)

### A1. Levantar stack

```powershell
cd C:\Users\Josvier\Desktop\quality_assurance
git checkout defensa
git pull
copy .env.example .env   # si no existe
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

Espera healthy (~2–3 min). Comprueba URLs del README de defensa.

### A2. Bateria completa local

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
```

Esperado: `TODOS LOS TESTS OK`.

### A3. Por capa (si quieres estudiar una sola)

| Capa | Comando | Evidencia |
|------|---------|-----------|
| Backend + IT Keycloak + JaCoCo | `cd backend; .\mvnw.cmd verify` | `docs/qa-evidence/jacoco-summary.md` |
| Newman API | `cd tests/api; npm test` | consola / CI |
| Playwright E2E | `cd tests/e2e; npm test` | `docs/qa-evidence/playwright-report/` |
| Auth smoke | `.\tests\security\auth-smoke.ps1` | 401/403/200 |
| Observabilidad | `.\tests\observability\smoke.ps1` | Grafana/Loki/Tempo up |
| Realm Keycloak | `.\scripts\verify-keycloak-realm.ps1` | scopes/policies |
| Schemathesis | `.\scripts\run-schemathesis.ps1` | `schemathesis-report.txt` |
| ZAP | `.\scripts\run-zap-baseline.ps1` | `zap-report.html` |
| k6 load | `.\scripts\run-k6.ps1` | `k6-load-summary.txt` |
| k6 stress | `.\scripts\run-k6-stress.ps1` | `k6-stress-summary.txt` |
| JMeter | `.\scripts\run-jmeter.ps1` | `jmeter-summary.txt` |

### A4. Checklist manual UI (15 min)

1. Login `admin` → dashboard (KPIs, criticos, top sold, metricas sistema).  
2. Productos: crear / editar / soft-delete / buscar.  
3. Stock: IN, OUT, historial.  
4. `/admin/permissions` y `/admin/users`.  
5. Auditoria `/audit`.  
6. Logout → `viewer`: sin Users/Audit; manage bloqueado.  
7. Swagger: probar un GET con token.  
8. Grafana: 4 dashboards + un log con `user`/`endpoint`.

### A5. Staging / CI (remoto)

En GitHub → Actions: CI, Newman, E2E, `deploy-staging` (tests **despues** del deploy).  
Doc: `.github/workflows/deploy-staging.yml`.

---

## Parte B — Mapa del sistema (para que / donde / como)

### B1. Vision general

| Capa | Tecnologia | Carpeta raiz | Para que |
|------|------------|--------------|----------|
| Frontend | Next.js 16 | `frontend/` | UI Cub, login PKCE, consume API |
| Backend | Spring Boot 3.4 | `backend/` | API REST, reglas de negocio, seguridad JWT |
| Identidad | Keycloak 26 | `keycloak/` | Roles, scopes, policies, tema login |
| Datos | PostgreSQL + Flyway | `backend/.../db/migration/` | Esquema versionado + Envers |
| Observabilidad | Grafana stack | `observability/` + `docker-compose.observability.yml` | Metricas, logs, trazas, alertas |
| Pruebas | JUnit/Newman/Playwright/... | `backend/src/test`, `tests/` | Full Stack Testing |
| CI/CD | Actions + Jenkins | `.github/workflows/`, `Jenkinsfile` | Build, test, deploy |
| Evidencias | Markdown/HTML | `docs/qa-evidence/` | Defensa documentada |

---

### B2. Funcionalidad de inventario

#### Productos

| | |
|--|--|
| **Para que** | CRUD con paginacion, busqueda, filtros, soft delete |
| **Backend** | `backend/src/main/java/com/company/inventory/product/` (`ProductController`, `ProductService`, entity, repo) |
| **Frontend** | `frontend/app/(app)/products/` |
| **Como se usa** | UI Productos o `POST/PUT/GET/DELETE /api/v1/products` |
| **Que decir** | Delete no borra fisico: deja `INACTIVE` para no perder historial ni auditoria |

#### Stock

| | |
|--|--|
| **Para que** | Entradas, salidas, ajustes e historial |
| **Backend** | `backend/.../stock/` (`StockController`, `StockService`) |
| **Frontend** | `frontend/app/(app)/stock/movements/` |
| **Como se usa** | `POST /api/v1/stock/movements` con tipo IN/OUT/ADJUSTMENT |
| **Que decir** | OUT rechaza stock negativo; cada movimiento guarda usuario y correlationId |

#### Dashboard / reportes

| | |
|--|--|
| **Para que** | KPIs, criticos, mas vendidos, recientes, metricas sistema |
| **Backend** | `report/service/ReportService.java`, `report/controller/ReportController.java` |
| **Metricas sistema** | `observability/ObservabilityController.java` → `/api/v1/observability/system-metrics` |
| **Frontend** | `frontend/app/(app)/dashboard/page.tsx` |
| **Que decir** | Top sold = proxy por movimientos OUT 30 dias (no modulo de ventas) |

#### Auditoria Envers

| | |
|--|--|
| **Para que** | Historial de cambios de entidades |
| **Backend** | `backend/.../audit/`, migraciones `*_AUD` |
| **Frontend** | `frontend/app/(app)/audit/page.tsx` |
| **Permiso** | `audit:view` |
| **Que decir** | Hibernate Envers + revision entity propia |

#### API OpenAPI

| | |
|--|--|
| **Para que** | API empresarial documentada |
| **Donde** | `common/config/OpenApiConfig.java`, Swagger en `:8080/swagger-ui.html` |
| **Que decir** | Misma API que prueba Newman/Schemathesis |

---

### B3. Seguridad (Keycloak, scopes, policies, users)

#### Login OIDC + PKCE

| | |
|--|--|
| **Para que** | Auth empresarial sin client secret en el SPA |
| **Frontend** | `frontend/lib/auth.ts`, `oidc-config.ts`, `pkce.ts`, callback `AuthCallbackClient.tsx` |
| **Realm** | `keycloak/realm-export.json`, tema `keycloak/themes/cub/` |
| **Que decir** | Authorization Code + PKCE; refresh token; access token en peticiones Bearer |

#### Permisos granulares

| | |
|--|--|
| **Para que** | No autorizar solo por nombre de rol (exigencia PDF) |
| **Constantes** | `backend/.../security/Permission.java` |
| **Enforcement** | `@PreAuthorize("hasAuthority('...')")` en controllers |
| **JWT → authorities** | `KeycloakJwtAuthoritiesConverter.java` (roles + claim `scope` → `SCOPE_*`) |
| **UI filtro** | `frontend/lib/permissions.ts`, `navigation.ts`, `DockNav.tsx` |
| **Que decir** | Cada operacion critica verifica el permiso concreto |

#### Scopes y policies

| | |
|--|--|
| **Para que** | Modelo ERP: scopes OAuth2 + Authorization Services |
| **Donde** | `keycloak/realm-export.json` → `clientScopes` + `authorizationSettings` |
| **OIDC pide scopes** | `frontend/lib/oidc-config.ts` + `BUSINESS_SCOPES` |
| **Que decir** | Keycloak define resources/policies; Spring enforcea con el JWT |

#### Gestion de usuarios (`user:manage`)

| | |
|--|--|
| **Para que** | Gestionar usuarios/roles reales (no solo matriz read-only) |
| **Backend** | `backend/.../user/UserController.java`, `UserService.java`, `KeycloakAdminClientConfig.java` |
| **Frontend** | `frontend/app/(app)/admin/users/page.tsx`, `frontend/lib/api/users.ts` |
| **Matriz** | `SecurityController` + `frontend/app/(app)/admin/permissions/page.tsx` |
| **Que decir** | Backend usa cliente confidencial `inventory-admin-api` (client credentials) |

#### Demo viva seguridad

1. JWT admin: claim `scope` + `/api/v1/security/me`.  
2. Viewer → `/api/v1/users` = **403**.  
3. Admin → `/admin/users` lista realm.  
4. Script: `tests/security/auth-smoke.ps1`.

---

### B4. Observabilidad

| Pieza | Para que | Donde |
|-------|----------|-------|
| Alloy | Collector OTLP + logs Docker | `observability/alloy/config.alloy` |
| Prometheus | Metricas + alertas | `observability/prometheus/` |
| Loki | Logs | compose + Loki |
| Tempo | Trazas HTTP/JDBC | compose + `JdbcTracingConfig.java` |
| Grafana | 4 dashboards | `observability/grafana/.../json/` |
| Alertmanager | Alertas | rules `inventory-alerts.yml` |
| MDC user/endpoint | Logs exigidos por PDF | `ObservabilityMdc.java`, `ObservabilitySecurityFilter.java` |
| Metricas negocio | Gauges inventario | `BusinessMetricsRegistrar.java` |

**Como probar:** `.\tests\observability\smoke.ps1` + Grafana `:3030`.  
**Que decir:** metricas, logs y trazas correlacionados por `traceId` / `correlationId`.

---

### B5. Full Stack Testing (mapa)

| Tipo PDF | Donde en repo | Para que |
|----------|---------------|----------|
| Unit | `backend/src/test/.../*Test.java` | Logica aislada |
| Integration DB | `*IntegrationTest`, repos Testcontainers | Postgres real |
| Integration Keycloak | `KeycloakContainerIntegrationTest.java` | Token real 401/403/200 |
| Constraints BD | `ProductRepositoryConstraintTest.java` | Unique/FK negativas |
| API | `tests/api/inventory-qas.postman_collection.json` | Escenarios HTTP |
| Contrato | Schemathesis scripts | OpenAPI fuzz |
| E2E | `tests/e2e/specs/*.spec.ts` | Flujos UI + roles |
| a11y | `a11y-smoke.spec.ts` | axe critical/serious = 0 |
| Snapshots | `visual-snapshots.spec.ts` + baselines | Regresion visual |
| Security | ZAP, Dependency Check, Snyk, auth-smoke | DevSecOps |
| Perf | `tests/performance/k6/`, `jmeter/` | Load + stress |
| Exploratory | `docs/qa-evidence/EXPLORATORY-TESTING.md` | Charters manuales |
| Coverage | JaCoCo gate 60% en `pom.xml` | Quality gate |

**Que decir:** piramide completa; staging prueba el sistema **ya desplegado**.

---

### B6. CI/CD y entornos

| Ambiente | Compose / workflow | Para que |
|----------|--------------------|----------|
| Dev | `docker-compose.dev.yml` | Desarrollo |
| Observabilidad | `docker-compose.observability.yml` | Overlay telemetria |
| Staging | `deploy-staging.yml` + test compose | Preview + tests post-deploy |
| Prod local | `docker-compose.prod.yml`, `scripts/up-prod.ps1` | Demo academica |
| Actions | `.github/workflows/*.yml` | Automatizacion |
| Jenkins | `Jenkinsfile` | Pipeline visual |

**Que decir:** produccion del PDF se demuestra con Compose local integrado, no cloud endurecido.

---

### B7. Documentacion y evidencias

| Doc | Uso en estudio |
|-----|----------------|
| `docs/requirements.md` | RF/RNF vs PDF |
| `docs/installation.md` | Instalar |
| `docs/maintenance.md` | Operar |
| `docs/architecture.md` | C4 + ADRs |
| `docs/testing-guide.md` | Como correr cada prueba |
| `docs/observability-guide.md` | Como leer Grafana/Loki/Tempo |
| `docs/qa-evidence/FINAL-CHECKLIST.md` | Sellado |
| `docs/qa-evidence/*-summary.*` | Numeros para citar |

---

## Parte C — Guion de presentacion (con codigo a senalar)

Usa tiempos de `GUIA-PRESENTACION-FINAL-V3.md`. Aqui el **que decir** + **archivo a abrir**.

### C1. Apertura (30 s)

> Cub no es solo un inventario: es Full Stack Testing, DevSecOps y observabilidad aplicados.

**Mostrar:** http://localhost:3000  
**Abrir luego:** C4 L1/L2 en `docs/architecture.md`

### C2. Arquitectura (3 min)

Senalar L1 (usuarios + Keycloak + CI) y L2 (web, API, DB, Keycloak, Grafana stack).  
**Frase:** frontend PKCE → API JWT → Postgres; telemetria vía Alloy.

### C3. Funcionalidad (5 min)

| Demo | Abrir en IDE si preguntan |
|------|---------------------------|
| Productos | `ProductController.java` + UI products |
| Stock | `StockService.java` |
| Dashboard | `ReportService.java` + `dashboard/page.tsx` |
| Soft delete | `requirements.md` seccion Soft Delete |
| Swagger | navegador `:8080/swagger-ui.html` |

### C4. Seguridad (5 min)

| Demo | Archivo |
|------|---------|
| Permisos | `Permission.java` + un `@PreAuthorize` |
| Converter scopes | `KeycloakJwtAuthoritiesConverter.java` |
| Realm scopes/policies | `keycloak/realm-export.json` |
| Users | `UserController.java` + `/admin/users` |
| 403 viewer | auth-smoke o Network en DevTools |

### C5. Testing (4 min)

Mostrar tabla Parte B5 + `FINAL-CHECKLIST.md` + un reporte (JaCoCo/Sonar/ZAP).  
**Frase staging:** tests contra sistema desplegado en `deploy-staging.yml`.

### C6. Observabilidad (4 min)

Grafana 4 dashboards → Loki `user`/`endpoint` → Tempo JDBC.  
**Codigo:** `ObservabilityMdc.java`, `inventory-alerts.yml` (`HighCpuUsage`).

### C7. CI/CD + cierre (3 min)

Actions + `Jenkinsfile` + Sonar summary.  
**Cierre:** calidad continua, seguridad y trazabilidad demostrables, no solo CRUD.

---

## Parte D — Cheat sheet de defensa (una pagina)

| Tema | 1 frase | Path clave |
|------|---------|------------|
| Productos | Soft delete INACTIVE | `product/` |
| Stock | IN/OUT/ADJUST + historial | `stock/` |
| Dashboard | KPIs + system metrics | `ReportService` + `ObservabilityController` |
| Auth | PKCE + JWT | `auth.ts` + Keycloak |
| AuthZ | Permiso por operacion | `@PreAuthorize` + converter |
| Scopes | En JWT y realm | `realm-export.json` |
| Users | Admin API Keycloak | `user/UserService` |
| Audit | Envers | `audit/` |
| Tests | Piramide completa | `tests/` + `src/test` |
| Obs | M/L/T + alertas | `observability/` |
| CI | Actions + Jenkins | `.github/workflows` |
| Evidencia | Sellado live | `docs/qa-evidence/` |

---

## Parte E — Plan de estudio diario sugerido

### Dia 1 — Entender y probar

1. Leer este documento Partes A–B.  
2. Levantar Docker + recorrer UI admin/viewer.  
3. Abrir C4 y Swagger.  
4. Correr `run-all-tests.ps1` (o al menos Newman + auth-smoke).  
5. Abrir Grafana 10 minutos.

### Dia 2 — Ensayar presentacion

1. Ensayar Parte C en voz alta con timer (25–30 min).  
2. Preparar 5 pestanas (app, swagger, grafana, architecture, checklist).  
3. Repasar 10 preguntas de `preguntas-defensa-completa.md`.  
4. Memorizar cheat sheet Parte D.

---

## Parte F — Indice de la carpeta defensa

| Archivo | Rol |
|---------|-----|
| `README.md` | Indice de la rama |
| `GUIA-ESTUDIO-Y-PRUEBAS-V3.md` | Este documento (estudio + pruebas + guion con codigo) |
| `GUIA-PRESENTACION-FINAL-V3.md` | Guion oral con tiempos |
| `guion-sellado-v3.md` | 5 demos sellado |
| `guion-presentacion-manana.md` | Guion largo previo |
| `preguntas-defensa-completa.md` | Banco de preguntas |
| `preguntas-tecnicas-avance-v3.md` | Avances tecnicos |
