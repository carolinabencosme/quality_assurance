# TASK — Completar Proyecto Final V3 (Cub / quality_assurance)

> **Para:** Codex / GPT implementador  
> **Repo:** `quality_assurance` (monorepo PUCMM — Aseguramiento de Calidad de Software)  
> **Rama de trabajo:** `presentacion` (sincronizar luego con `main` y `develop`)  
> **Referencia rubro:** `Proyecto_Final_V3.pdf` (raíz del repo o `c:\Users\Josvier\Desktop\Proyecto_Final_V3.pdf`)

---

## Prompt corto (copiar y pegar en Codex)

```
Implementa TODAS las tareas pendientes del archivo docs/TASK-CODEX-COMPLETAR-PROYECTO-FINAL-V3.md
en el monorepo quality_assurance (rama presentacion).

Reglas:
- NO romper lo que ya pasa: run-all-tests.ps1, GitHub Actions (CI, Newman, E2E, deploy-staging).
- Cambios minimos y alineados con convenciones existentes (Spring Boot 3.4, Next.js 15, Keycloak 26).
- Sin acentos en scripts PowerShell (.ps1) ni mensajes de consola (encoding Windows).
- Al finalizar: ejecutar verificacion completa y dejar evidencias en docs/qa-evidence/.
- Commits con Conventional Commits (feat:, fix:, docs:, test:, ci:).
- No hardcodear secretos; usar .env.example.
```

---

## 1. Contexto del proyecto

### 1.1 Qué es Cub

Sistema de gestión de inventarios empresarial con:

| Capa | Tecnología |
|------|------------|
| Backend | Spring Boot 3.4, Java 21, PostgreSQL, Flyway, Envers |
| Frontend | Next.js 15, React 19, TypeScript |
| Auth | Keycloak 26, OAuth2, JWT, Authorization Code + PKCE |
| Infra | Docker Compose (dev, test, observability, staging) |
| Observabilidad | OpenTelemetry, Prometheus, Loki, Tempo, Alloy, Grafana, Alertmanager |

### 1.2 Comandos que DEBEN seguir pasando

```powershell
# Stack
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build

# Bateria local (5 bloques)
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
```

**Resultado esperado actual:** BUILD SUCCESS backend, Newman 14/29 OK, Playwright 9/9, security smoke PASS, observability smoke PASS.

### 1.3 GitHub Actions (ya configurados en `presentacion`)

| Workflow | Archivo |
|----------|---------|
| CI (backend + frontend) | `.github/workflows/ci.yml` |
| Newman API | `.github/workflows/api-postman.yml` |
| E2E Playwright | `.github/workflows/e2e-playwright.yml` |
| Deploy staging smoke | `.github/workflows/deploy-staging.yml` |

Ramas trigger: `main`, `develop`, `presentacion`, `feature/**`, `fix/**`.

### 1.4 Config Docker critica (NO revertir)

- `NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081` (navegador directo a Keycloak)
- `KEYCLOAK_JWKS_URI=http://keycloak:8080/...` (red interna Docker)
- `KC_HOSTNAME=http://localhost:8081`
- E2E usa `docker-compose.dev.yml` + `docker-compose.test.yml`

---

## 2. Inventario — LO QUE YA ESTA HECHO (no romper)

### 2.1 Funcionalidad implementada

| Modulo | Evidencia |
|--------|-----------|
| Productos CRUD API | `backend/.../product/controller/ProductController.java` |
| Productos UI | `frontend/app/(app)/products/` |
| Stock movimientos | `backend/.../stock/`, `frontend/app/(app)/stock/movements/` |
| Dashboard KPIs | `ReportService.getDashboard()`, `frontend/app/(app)/dashboard/page.tsx` |
| Productos criticos | `GET /api/v1/reports/critical-products` |
| Auditoria Envers | `audit/`, `frontend/app/(app)/audit/page.tsx`, migracion V5 |
| Swagger/OpenAPI | `http://localhost:8080/swagger-ui.html` |
| Soft delete productos | DELETE inactiva (no hard delete) |

### 2.2 Seguridad implementada

| Item | Evidencia |
|------|-----------|
| Keycloak realm | `keycloak/realm-export.json` (`loginTheme: cub`) |
| Permisos granulares | `Permission.java`, `@PreAuthorize` en controllers |
| Matriz permisos | product:view/manage, stock:view/manage, report:view, audit:view, user:manage |
| Roles compuestos | inventory-admin, warehouse-manager, inventory-clerk, inventory-viewer |
| JWT + PKCE frontend | `frontend/lib/auth.ts` |
| Refresh token | `refreshAccessToken()` en auth.ts |
| Tema login Keycloak | `keycloak/themes/cub/` |
| CORS | `SecurityConfig.java` |

### 2.3 Testing implementado

| Tipo | Ubicacion | Estado |
|------|-----------|--------|
| Unit + Mockito | `backend/src/test/java/**/*Test.java` | ~73 tests (38 skipped sin Docker en Windows) |
| Integration Testcontainers | `*IntegrationTest.java`, `*RepositoryTest.java` | OK en CI Linux |
| JaCoCo 60% | `backend/pom.xml` | Gate activo |
| Newman | `tests/api/inventory-qas.postman_collection.json` | 14 requests, 29 assertions |
| Playwright E2E | `tests/e2e/specs/` | 9 tests |
| Security smoke | `tests/security/auth-smoke.ps1` | 401/403 |
| Observability smoke | `tests/observability/smoke.ps1` | 7 endpoints |
| k6 smoke basico | `tests/performance/k6/smoke.js` | Existe, NO en run-all-tests |
| Flyway validate | `scripts/validate-flyway-migrations.ps1` | V1-V7 |

### 2.4 Observabilidad implementada

- Compose: `docker-compose.observability.yml`
- Alloy OTLP + logs Docker → Loki
- Dashboard Grafana: `observability/grafana/provisioning/dashboards/json/inventory-api.json`
- Alertas basicas: `observability/prometheus/rules/inventory-alerts.yml` (API down, 5xx rate)

### 2.5 CI/CD implementado

- GitHub Actions (4 workflows)
- Jenkinsfile: checkout, mvn verify, frontend build, Sonar opcional, deploy staging opcional
- `docker-compose.staging.yml`: SonarQube 9000, Jenkins 8082
- `scripts/post-deploy-smoke.sh` / `.ps1`

### 2.6 Documentacion existente

- `README.md`
- `docs/testing-guide.md`
- `docs/defensa/preguntas-defensa-completa.md`
- `docs/defensa/guion-presentacion-manana.md`
- `docs/qa-evidence/screenshots/` (5 PNG)
- `docs/qa-evidence/playwright-report/`

---

## 3. Inventario — LO QUE FALTA (implementar)

Prioridad: **P0** (obligatorio PDF) → **P1** (alto impacto nota) → **P2** (completitud)

---

### FASE A — Funcionalidad (P0)

#### A1. Productos mas vendidos en dashboard

**Requisito PDF:** Dashboard debe incluir "productos mas vendidos".

**Estado:** `DashboardResponse` solo tiene `criticalProducts` y `recentMovements`.

**Implementar:**

1. Backend — nuevo DTO `TopMovedProductSummary` (productId, sku, name, totalOutQty, movementCount).
2. Query en `StockMovementRepository`: agrupar movimientos tipo `OUT` ultimos 30 dias, ORDER BY sum(ABS(delta)) DESC, LIMIT 10.
3. Extender `DashboardResponse` con `List<TopMovedProductSummary> topSoldProducts` (o nombre similar).
4. Actualizar `ReportService.getDashboard()`.
5. Test unitario `ReportServiceTest` + integracion si aplica.
6. Frontend — seccion en `dashboard/page.tsx` y opcionalmente `reports/page.tsx`.
7. Newman — assertion en escenario dashboard (nuevo request #15).

**Criterio aceptacion:** Dashboard API devuelve array `topSoldProducts`; UI muestra tabla/cards; test pasa.

**Nota defensa:** "Mas vendidos" = mas unidades salidas (OUT) en ventana 30d (inventario sin modulo ventas).

---

#### A2. Pantalla minima `user:manage`

**Requisito PDF:** permiso `user:manage` — gestionar usuarios, roles y permisos.

**Estado:** Permiso en Keycloak y `Permission.java`; **sin UI ni API**.

**Implementar (minimo viable):**

1. Backend — `GET /api/v1/security/permissions-matrix` (solo `user:manage`):
   - Devuelve roles del realm y permisos asignados (datos estaticos alineados con `realm-export.json` o leidos de config).
2. Opcional read-only: `GET /api/v1/security/me` con permisos efectivos del JWT.
3. Frontend — `frontend/app/(app)/admin/permissions/page.tsx`:
   - Tabla roles × permisos (solo lectura).
   - Visible en dock solo si `hasPermission('user:manage')`.
4. `permissions.ts` — `canManageUsers()`, `canViewAudit()`.
5. `DockNav` / `AppShell` — ocultar links `/audit` y `/admin/permissions` segun permiso.
6. E2E — login como `admin`, ver pagina permisos; login como `viewer`, no ver link admin.

**Criterio aceptacion:** Admin ve matriz; viewer recibe 403 en API admin o no ve nav.

---

#### A3. Documentar soft delete como eliminacion

**Implementar:** Parrafo en `docs/requirements.md` (seccion productos): DELETE = inactivacion (Envers conserva historial).

---

### FASE B — Testing ampliado (P0)

#### B1. OWASP ZAP baseline

**Requisito PDF:** Security testing — escaneo OWASP ZAP obligatorio.

**Implementar:**

1. `scripts/run-zap-baseline.sh` y `scripts/run-zap-baseline.ps1`:
   - Requiere stack en `localhost:3000` y `8080`.
   - Usar imagen Docker `ghcr.io/zaproxy/zaproxy:stable` o `zaproxy/zap-stable`.
   - Target: `http://host.docker.internal:3000` (Windows) / `http://localhost:3000` (Linux CI).
   - Generar `docs/qa-evidence/zap-report.html`.
2. Workflow `.github/workflows/security-zap.yml`:
   - `workflow_dispatch` + push a `presentacion`, `main`, `develop`.
   - Levantar compose frontend+backend+keycloak, ejecutar ZAP, subir artefacto.
3. Actualizar `tests/security/README.md` con instrucciones.
4. **No fallar CI** por alertas Medium si son falsos positivos de dev; documentar umbrales. Fail solo en High confirmados o configurar `-I` ignore file.

**Criterio aceptacion:** Script local genera reporte; workflow produce artefacto en GitHub Actions.

---

#### B2. OWASP Dependency Check (Maven)

**Requisito PDF:** OWASP Dependency Check / Snyk.

**Implementar:**

1. Plugin en `backend/pom.xml`:
   ```xml
   org.owasp:dependency-check-maven
   ```
2. Job en `.github/workflows/ci.yml` o nuevo `security-deps.yml`:
   - `mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=9` (solo Critical).
3. Reporte HTML en `docs/qa-evidence/dependency-check-report.html` (artefacto CI).
4. Documentar en `tests/security/README.md`.

**Criterio aceptacion:** `mvn verify` sigue pasando; dependency-check corre en CI sin bloquear por CVEs de dev tools.

---

#### B3. Schemathesis (contract testing OpenAPI)

**Implementar:**

1. `tests/api/schemathesis/` con `requirements.txt` o usar Docker:
   ```bash
   schemathesis run http://localhost:8080/v3/api-docs --checks all --hypothesis-max-examples=50
   ```
2. Script `scripts/run-schemathesis.sh` / `.ps1`.
3. Workflow opcional `api-schemathesis.yml` (push presentacion/main) con stack Docker.
4. Evidencia: `docs/qa-evidence/schemathesis-report.txt`.

**Criterio aceptacion:** Corre contra OpenAPI sin crashes; documentar endpoints que fallan si hay edge cases conocidos.

---

#### B4. Newman ampliado

**Agregar escenarios** en `tests/api/inventory-qas.postman_collection.json`:

| # | Escenario |
|---|-----------|
| 15 | GET `/api/v1/reports/dashboard` con JWT viewer → 200 + topSoldProducts |
| 16 | POST `/api/v1/stock/movements` IN con warehouse → 201 |
| 17 | GET `/api/v1/stock/movements` paginado → 200 |
| 18 | GET `/api/v1/audit` viewer → 403 |
| 19 | GET `/api/v1/audit` admin → 200 |
| 20 | GET `/api/v1/security/permissions-matrix` admin → 200 |

Actualizar conteo en docs si mencionan "14 escenarios".

---

#### B5. Playwright E2E ampliado

**Nuevos specs o tests** en `tests/e2e/specs/`:

| Test | Descripcion |
|------|-------------|
| `stock-movement.spec.ts` | Login warehouse → registrar OUT → ver en historial |
| `permissions-ui.spec.ts` | Viewer no ve link audit/admin; admin si |
| `responsive-dashboard.spec.ts` | Viewport 375x667 — dashboard renderiza KPIs |
| Actualizar `capture-evidence.spec.ts` | Captura top sold + admin permissions si aplica |

**Convencion:** usar `helpers/keycloak-login.ts`; workers=1; sin acentos en nombres de test.

**Criterio aceptacion:** `npm test` en e2e >= 13 tests, todos verdes con stack levantado.

---

#### B6. k6 performance ampliado

**Implementar:**

1. `tests/performance/k6/load-api.js` — 20-50 VUs, 2min:
   - health, dashboard con token, list products.
   - Thresholds: p95 < 800ms, error rate < 5%.
2. `scripts/run-k6.ps1` — obtiene token viewer, ejecuta load-api.js.
3. Anadir paso `[6/6] k6` opcional en `run-all-tests.ps1` (skip si `k6` no instalado, como Testcontainers).
4. Workflow `performance-k6.yml` manual o en presentacion.

---

#### B7. Pruebas exploratorias + registro defectos

**Crear documentos:**

1. `docs/qa-evidence/EXPLORATORY-TESTING.md`:
   - 3 charters (sesiones 45-60 min): productos, stock, seguridad/roles.
   - Tabla: escenario | resultado | severidad | notas.
2. `docs/qa-evidence/DEFECTS.md`:
   - Defectos encontrados y resueltos (o known issues con workaround).
   - Minimo 3 entradas reales del proyecto (ej. Keycloak proxy Windows, Testcontainers socket, Loki smoke flaky).
3. `docs/qa-evidence/CHECKLIST-CAPTURAS.md` — lista de screenshots requeridas con rutas.

---

### FASE C — Observabilidad (P1)

#### C1. Dashboards Grafana adicionales

**Crear JSON en** `observability/grafana/provisioning/dashboards/json/`:

| Dashboard | Paneles minimos |
|-----------|-----------------|
| `inventory-infra.json` | CPU JVM, heap, threads, Hikari pool (si metrica disponible) |
| `inventory-business.json` | KPIs desde logs o metricas custom (movimientos, productos activos) |
| `inventory-security.json` | Rate 401/403 HTTP (desde `http_server_requests_seconds_count`) |

Registrar en `provisioning/dashboards/dashboards.yml`.

---

#### C2. Alertas Prometheus ampliadas

**Anadir en** `observability/prometheus/rules/inventory-alerts.yml`:

| Alerta | Condicion |
|--------|-----------|
| HighLatencyP95 | histogram_quantile 0.95 > 1s por 5m |
| HighAuthFailureRate | rate 401 + 403 > umbral |
| PostgresDown | si exporter existe; si no, documentar limitacion |
| GrafanaDown / LokiDown | up{job=...} == 0 |

---

#### C3. Guia observabilidad

**Crear** `docs/observability-guide.md`:

- Como levantar stack observabilidad
- URLs y credenciales
- Queries Loki ejemplo: `{container=~"inventory-.*"}`
- Como ver trazas en Tempo
- Capturas recomendadas para defensa

Actualizar `observability/README.md` link roto.

---

#### C4. Deploy staging con observabilidad

**Modificar** `.github/workflows/deploy-staging.yml`:

- Usar `docker-compose.dev.yml` + `docker-compose.test.yml` + `docker-compose.observability.yml`.
- `RUN_OBSERVABILITY_SMOKE: true` en post-deploy (o ejecutar smoke.ps1 con pwsh en Linux runner).
- Timeout 45min → 60min si necesario.

---

### FASE D — CI/CD y entornos (P1)

#### D1. docker-compose.prod.yml

**Crear** perfil produccion:

- Sin volumenes de codigo fuente montados.
- Frontend `npm run build` + `npm start` (Dockerfile.staging o multi-stage).
- Variables de entorno sin defaults inseguros.
- Keycloak hostname configurable.
- Documentar en README seccion "Produccion".

**No desplegar cloud real** — solo compose + doc.

---

#### D2. Pipeline unificado (opcional pero recomendado)

**Crear** `.github/workflows/full-qa-pipeline.yml`:

- `workflow_dispatch` + push `presentacion`
- Jobs secuenciales: build → unit/integration → deploy compose → newman → e2e → zap → k6 smoke → observability smoke
- Artefactos: jacoco, playwright-report, zap-report, dependency-check

O extender `ci.yml` con needs entre jobs (cuidado con tiempo total < 90min).

---

#### D3. Jenkinsfile completo

**Anadir stages a** `Jenkinsfile`:

| Stage | Comando |
|-------|---------|
| API Newman | `npm test` en tests/api tras compose up |
| E2E Playwright | tests/e2e |
| ZAP | scripts/run-zap-baseline.sh |
| k6 | k6 run load-api.js |
| Docker build | `docker compose build` |

Parametros booleanos para cada stage (default false excepto build+test).

---

#### D4. SonarQube quality gate

- Documentar en README como configurar `SONAR_TOKEN`.
- En CI: si token ausente, job Sonar = skipped (actual); si presente, **fail** on quality gate failed.

---

### FASE E — Documentacion formal (P0)

#### E1. docs/requirements.md

Secciones:

1. Requisitos funcionales (RF-01..RF-n) mapeados a modulos
2. Requisitos no funcionales (RNF): seguridad, rendimiento, observabilidad, disponibilidad
3. Matriz permisos (tabla del PDF)
4. Casos de uso principales
5. Fuera de alcance explicito (ej. facturacion, multi-tenant)

---

#### E2. docs/architecture.md

Incluir:

1. Diagrama C4 nivel 1-2 (mermaid): usuario → Cub → Keycloak → API → PostgreSQL
2. Diagrama observabilidad: OTLP → Alloy → Prometheus/Loki/Tempo → Grafana
3. Diagrama CI/CD: GitHub Actions + Jenkins
4. Puertos y servicios (tabla)
5. Decisiones arquitectonicas (ADR cortas): PKCE, Envers, Testcontainers, soft delete

---

#### E3. docs/qa-evidence.md (indice maestro)

Indice con links a:

- JaCoCo report path
- Newman resultado
- Playwright report
- Screenshots checklist
- ZAP report
- Dependency check
- Schemathesis
- k6 resultados
- Exploratory + defects

Actualizar `docs/testing-guide.md` — marcar checkboxes hechos, corregir "E2E no corre en CI" (ya corre).

---

#### E4. GitHub Issue templates

Crear `.github/ISSUE_TEMPLATE/`:

- `bug_report.md`
- `feature_request.md`
- `qa_evidence.md`

---

### FASE F — Pulido (P2)

#### F1. Sin acentos en .ps1

Regla: todos los `Write-Host`, `Write-Error`, comentarios visibles en consola — solo ASCII.

#### F2. Stock movement userId desde JWT

En `StockService`, poblar `userId` desde `SecurityContext` / JWT `sub` si no viene en request.

#### F3. CORS test

Test en `ApiSecurityMvcTest` o test dedicado: preflight OPTIONS devuelve headers CORS esperados.

#### F4. Commits limpios

Evitar mensajes `"a"`; usar conventional commits descriptivos.

---

## 4. Orden de implementacion recomendado

```
Semana / sprint logico para Codex:

Dia 1 — Documentacion base + gaps funcionales
  E1 requirements.md, E2 architecture.md
  A1 top sold products (backend + frontend + test)
  A2 user:manage UI minima

Dia 2 — Testing seguridad y API
  B2 dependency-check
  B1 ZAP scripts + workflow
  B4 Newman ampliado
  B3 Schemathesis

Dia 3 — E2E + performance + evidencias
  B5 Playwright nuevos specs
  B6 k6 load
  B7 exploratory + defects + checklist capturas
  E3 qa-evidence.md

Dia 4 — Observabilidad + CI/CD
  C1-C3 dashboards, alertas, guia
  C4 deploy-staging con observabilidad
  D1 docker-compose.prod.yml
  D2/D3 pipelines ampliados

Dia 5 — Verificacion final
  run-all-tests.ps1 completo
  GitHub Actions verdes en presentacion
  Actualizar README + defensa docs con nuevos numeros
```

---

## 5. Convenciones de codigo (OBLIGATORIO)

### Backend (Java)

- Paquete base: `com.company.inventory`
- Controllers: `@PreAuthorize("hasAuthority('...')")` — verificar permiso, no rol
- DTOs como records
- Tests: JUnit 5, Mockito, `@SpringBootTest` + Testcontainers para integracion
- No bajar umbral JaCoCo 60%

### Frontend (Next.js)

- App router: `frontend/app/(app)/`
- Cliente API: axios en `frontend/lib/`
- Permisos: `frontend/lib/permissions.ts`
- Estilos: `globals.css`, variables CSS Cub (--cub-brand, etc.)
- Sin librerias UI nuevas pesadas

### Keycloak

- Cambios de realm en `keycloak/realm-export.json`
- Validar: `.\scripts\verify-keycloak-realm.ps1`
- Tema: `keycloak/themes/cub/`

### Tests E2E

- Helper login: `tests/e2e/helpers/keycloak-login.ts`
- Credenciales: viewer/viewer123, admin/admin123, warehouse/warehouse123
- `fullyParallel: false`, `workers: 1`

### PowerShell

- Sin acentos en salida consola
- `run-all-tests.ps1` es la fuente de verdad local

---

## 6. Verificacion final (checklist Codex)

Marcar cada item antes de dar por terminado:

```
[ ] .\scripts\run-all-tests.ps1 — PASS (o documentar skip k6/zap si opcional)
[ ] backend: mvn verify — BUILD SUCCESS
[ ] tests/api: npm test — 0 failed assertions (20+ escenarios)
[ ] tests/e2e: npm test — 13+ tests PASS
[ ] .\tests\security\auth-smoke.ps1 — PASS
[ ] .\tests\observability\smoke.ps1 — PASS
[ ] .\scripts\run-zap-baseline.ps1 — genera zap-report.html
[ ] backend: mvn dependency-check:check — reporte generado
[ ] docs/requirements.md existe
[ ] docs/architecture.md existe
[ ] docs/observability-guide.md existe
[ ] docs/qa-evidence.md indice completo
[ ] docs/qa-evidence/EXPLORATORY-TESTING.md existe
[ ] docs/qa-evidence/DEFECTS.md existe
[ ] Dashboard muestra top sold products
[ ] /admin/permissions visible solo para admin
[ ] Dock oculta audit sin audit:view
[ ] GitHub Actions presentacion: CI + Newman + E2E + deploy verdes
[ ] docker-compose.prod.yml documentado en README
[ ] Sin acentos en archivos .ps1
[ ] Conventional commits en todos los cambios
```

---

## 7. Archivos clave de referencia

| Proposito | Ruta |
|-----------|------|
| PDF rubro | `Proyecto_Final_V3.pdf` |
| Compose dev | `docker-compose.dev.yml` |
| Compose test | `docker-compose.test.yml` |
| Compose observability | `docker-compose.observability.yml` |
| Realm Keycloak | `keycloak/realm-export.json` |
| Permisos backend | `backend/.../security/Permission.java` |
| Permisos frontend | `frontend/lib/permissions.ts` |
| Reportes | `backend/.../report/service/ReportService.java` |
| Newman collection | `tests/api/inventory-qas.postman_collection.json` |
| Playwright config | `tests/e2e/playwright.config.ts` |
| CI principal | `.github/workflows/ci.yml` |
| Jenkins | `Jenkinsfile` |
| Guia defensa | `docs/defensa/preguntas-defensa-completa.md` |

---

## 8. Riesgos conocidos (no reintroducir)

| Problema | Solucion ya aplicada |
|----------|---------------------|
| Keycloak redirect a :8080 | `NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081` |
| JWKS 401 en API | `KEYCLOAK_JWKS_URI=http://keycloak:8080/...` |
| Proxy Keycloak 404 Windows | `KEYCLOAK_PROXY_TARGET=http://keycloak:8080` |
| Testcontainers skipped Windows | `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=//./pipe/docker_engine` |
| Loki/Tempo smoke flaky | Retries 90s en smoke.ps1 |
| YAML duplicate push en GA | Un solo bloque `push:` por workflow |

---

## 9. Criterio de exito global

El proyecto se considera **completo para Proyecto Final V3** cuando:

1. Todos los requisitos del PDF tienen **implementacion o evidencia documentada**.
2. `run-all-tests.ps1` pasa en local con Docker.
3. GitHub Actions en `presentacion` pasan (CI, Newman, E2E, staging).
4. Documentacion formal (requirements, architecture, testing, qa-evidence) esta commiteada.
5. Evidencias de seguridad (ZAP, dependency-check) y exploratorias existen en `docs/qa-evidence/`.
6. Dashboard incluye productos mas vendidos (proxy OUT).
7. Permiso `user:manage` tiene superficie UI/API demostrable.

---

*Generado para implementacion por Codex — alinear con `Proyecto_Final_V3.pdf` y rama `presentacion`.*
