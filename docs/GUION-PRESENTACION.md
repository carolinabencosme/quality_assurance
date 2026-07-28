# Guion de presentacion — Cub Inventory QAS

> Texto para **hablar** en la defensa (25–30 min).  
> Companion de estudio: [`GUIA-PROYECTO-FINAL-V3.md`](./GUIA-PROYECTO-FINAL-V3.md).  
> Diagramas: [`architecture.md`](./architecture.md).  
> Scripts: [`SCRIPTS-DEMO.md`](./SCRIPTS-DEMO.md).

**Como usar este guion:** cada bloque tiene **que abrir**, **que decir**, **referencias de codigo** (si el profesor pregunta *donde / como / quien maneja*) y **si preguntan**. Ensaya en voz alta una vez; marca con ✓ lo que ya viste vivo.

**Prefijo comun backend:** `backend/src/main/java/com/company/inventory/`  
En oral di el nombre corto del archivo (`ReportService`, `SecurityConfig`) y abre la ruta si piden verlo.

---

## Checklist 10 minutos antes

| ✓ | Accion | Donde |
|---|--------|-------|
| | Stack local (obs/Jenkins/Sonar) | `docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d` |
| | Calentar trafico | `.\scripts\warmup-demo-traffic.ps1` |
| | Datos demo | `.\scripts\seed-demo-data.ps1` |
| | App cloud o local | https://cub-inventory-qas.vercel.app **o** http://localhost:3000 |
| | Grafana Home | http://localhost:3030/d/cub-home |
| | Alertmanager | http://localhost:9093 |
| | Sonar | http://localhost:9001 → `/dashboard?id=inventory-qas` |
| | Jenkins | http://localhost:8082 → `cub-inventory-qas` |
| | GitHub Actions | pestana Actions del repo |
| | IDE | `Permission.java`, `ProductController`, `pom.xml`, dashboards JSON |
| | Credenciales | Cub `admin/admin123` · `viewer/viewer123` · Grafana/Jenkins `admin/admin` · Sonar tu password |

---

## 0. Apertura (2 min)

**Abrir:** `docs/architecture.md` (C4 L1) o pantallazo del diagrama.

**Decir:**

> “Cub es un sistema de gestion de inventarios full stack. No es solo un CRUD: demostramos funcionalidad, seguridad con Keycloak, piramide de pruebas, observabilidad con Grafana/Prometheus/Loki/Tempo, y CI/CD con GitHub Actions, Jenkins y SonarQube.  
> Arquitectura: el usuario entra por Next.js, se autentica en Keycloak con PKCE, el backend Spring Boot valida JWT y permisos, persiste en PostgreSQL con Flyway y auditoria Envers, y exporta telemetria al stack de observabilidad.”

**Senalar en L2:** Browser → Keycloak → API → Postgres; Alloy → Prometheus/Loki/Tempo → Grafana/Alertmanager.

### Referencias de codigo (arquitectura / arranque)

| Pregunta tipica | Archivo / ruta | Que mirar |
|-----------------|----------------|-----------|
| Donde arranca la API | `backend/.../InventoryApplication.java` | `@SpringBootApplication` |
| Puerto / actuator | `backend/src/main/resources/application.yml` | `server.port`, `management.endpoints` |
| Perfil prod | `application-prod.yml` | datasource, JWT issuer, Flyway |
| Migraciones DB | `backend/src/main/resources/db/migration/V*.sql` | Flyway versionado |
| Compose app | `docker-compose.dev.yml` | API, Postgres, Keycloak, frontend |
| Compose obs | `docker-compose.observability.yml` | Prom, Loki, Tempo, Alloy, Grafana, AM |
| Compose tooling | `docker-compose.staging.yml` | Sonar :9001 + Jenkins :8082 |
| C4 | `docs/architecture.md` | L1 contexto, L2 contenedores, L3 componentes |
| Monorepo layout | `README.md` · `scripts/verify-monorepo-structure.ps1` | Estructura del repo |

**Si preguntan “por que monorepo”:** “Un solo repo para app, tests, observability y pipelines; la evidencia y el codigo van juntos.”

---

## 1. Funcionalidad (4–5 min) — 15%

**Abrir:** app logueada como `admin` / `admin123` → Dashboard → Productos → Stock → Audit.

### 1.1 Dashboard

**Decir:**

> “Al entrar vemos el dashboard: KPIs de productos activos/inactivos, stock critico y top de productos movidos. Eso sale de `/api/v1/reports/dashboard` en `ReportService`. Top sold lo modelamos como salidas OUT de los ultimos 30 dias, porque no hay modulo de ventas.”

| Pieza | Ruta completa | Como lo manejan |
|-------|---------------|-----------------|
| API reportes | `.../report/controller/ReportController.java` | `GET /api/v1/reports/dashboard` + `@PreAuthorize(report:view)` |
| Logica KPIs | `.../report/service/ReportService.java` | Agrega activos/inactivos, criticos, top OUT 30d |
| DTOs | `.../report/dto/DashboardResponse.java`, `DashboardKpiResponse.java`, `TopMovedProductSummary.java` | Contrato JSON del dashboard |
| Metricas in-app | `.../observability/ObservabilityController.java` | `GET /observability/system-metrics` |
| UI | `frontend/app/(app)/dashboard/page.tsx` | Primera pantalla post-login |
| Layout app | `frontend/app/(app)/layout.tsx` | Shell autenticado / nav |

### 1.2 Productos + soft delete

**Hacer:** crear o editar; luego inactivar (no borrar fisico).

**Decir:**

> “El DELETE es soft delete: marca el producto `INACTIVE`. Asi no rompemos el historial de stock ni las tablas de auditoria Envers. Cada endpoint exige un permiso concreto con `@PreAuthorize`, por ejemplo `product:manage`.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| REST | `.../product/controller/ProductController.java` | CRUD + soft delete; `@PreAuthorize` + `@Operation` |
| Dominio | `.../product/entity/Product.java` | `markInactive()` → status `INACTIVE` |
| Estado | `.../product/entity/ProductStatus.java` | enum ACTIVE / INACTIVE |
| Servicio | `.../product/service/ProductService.java` | Reglas de negocio del catalogo |
| Repo | `.../product/repository/ProductRepository.java` | Spring Data JPA |
| Specs filtro | `.../product/repository/ProductSpecifications.java` | Filtros de listado |
| Mapper | `.../product/mapper/ProductMapper.java` | Entity ↔ DTO |
| Categorias API | `.../product/controller/CategoryController.java` | CRUD categorias |
| Categorias entity | `.../product/entity/Category.java` | Clasificacion |
| UI productos | `frontend/app/(app)/products/` | Pantallas Next.js |

### 1.3 Stock

**Hacer:** un movimiento IN o OUT corto.

**Decir:**

> “Los movimientos son IN, OUT y ADJUSTMENT. En OUT el servicio no permite stock negativo. Queda registrado el usuario y el correlation id para trazabilidad.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| REST | `.../stock/controller/StockController.java` | Niveles + `POST .../movements` |
| Reglas | `.../stock/service/StockService.java` | OUT rechaza negativo; guarda `correlationId` |
| Entidad movimiento | `.../stock/entity/StockMovement.java` | Tipo, cantidad, usuario, correlation |
| DTOs | `.../stock/dto/StockMovementRequest.java`, `StockMovementResponse.java`, `StockLevelResponse.java` | Contrato API |
| Mappers | `.../stock/mapper/StockMovementMapper.java`, `StockLevelMapper.java` | Mapping |
| UI | `frontend/app/(app)/stock/` | Formulario de movimiento |

### 1.4 Auditoria Envers

**Abrir:** UI `/audit`.

**Decir:**

> “Los cambios de entidades auditadas quedan en revisiones Hibernate Envers. La pantalla de auditoria exige el permiso `audit:view`.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| REST | `.../audit/controller/AuditController.java` | Historial por entidad + `@PreAuthorize(audit:view)` |
| Servicio | `.../audit/service/AuditService.java` | Lee revisiones Envers |
| Revision entity | `.../audit/InventoryRevisionEntity.java` | Cabecera de revision |
| Listener | `.../audit/InventoryRevisionListener.java` | Quien hizo el cambio |
| DTO | `.../audit/dto/AuditEventResponse.java` | Respuesta UI |
| Entidades | `Product.java` (y otras) con `@Audited` | Generan tablas `*_AUD` |
| UI | `frontend/app/(app)/audit/` | Lista legible |

---

## 2. Seguridad (4 min) — 10%

**Abrir:** logout → `viewer` / `viewer123` · IDE `Permission.java`.

### 2.1 Roles y 403

**Hacer:** viewer intenta escribir producto o Admin Users.

**Decir:**

> “Keycloak emite un JWT con roles y scopes. Spring convierte el token en authorities de permiso — `product:view`, `product:manage` — en `KeycloakJwtAuthoritiesConverter`, y cada controller usa `@PreAuthorize`. Sin token 401; sin permiso 403. Lo automatizamos con `tests/security/auth-smoke.ps1`.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| Permisos (fuente de verdad) | `.../security/Permission.java` | Constantes `recurso:accion` |
| JWT → authorities | `.../security/KeycloakJwtAuthoritiesConverter.java` | Roles realm/client + scopes → `GrantedAuthority` |
| Rol → set permisos | `.../security/RealmRolePermissions.java` | admin/warehouse/clerk/viewer |
| Filter chain | `.../security/SecurityConfig.java` | Resource server JWT, CORS, filtros |
| Rutas publicas | `.../security/PublicApiPaths.java` | `/actuator/health`, etc. |
| Matriz / me | `.../security/SecurityController.java` + `SecurityMatrixService.java` | Inspeccion de permisos en vivo |
| DTOs seguridad | `.../security/dto/SecurityMeResponse.java`, `PermissionsMatrixResponse.java` | Respuestas de matriz |
| Errores API | `.../common/exception/GlobalExceptionHandler.java` | 401/403/4xx con correlation id |
| Realm | `keycloak/realm-export.json` | Users, roles, clients, policies, redirects |
| Frontend PKCE | `frontend/lib/auth.ts` | Authorization Code + PKCE |
| Login E2E helper | `tests/e2e/helpers/keycloak-login.ts` | Login automatizado Playwright |
| Smoke 401/403 | `tests/security/auth-smoke.ps1` | Demo en 30s |
| IT Keycloak real | `backend/src/test/java/.../security/KeycloakContainerIntegrationTest.java` | Testcontainers |

### 2.2 Users admin

**Hacer:** `admin` → `/admin/users`.

**Decir:**

> “El backend habla con la Admin API de Keycloak para listar, activar y asignar roles. Solo quien tiene `user:manage`.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| REST users | `.../user/UserController.java` | Listar / enable / roles |
| Servicio | `.../user/UserService.java` | Orquesta Admin API |
| Config client | `.../user/KeycloakAdminClientConfig.java` | Cliente HTTP admin |
| Props | `.../user/KeycloakAdminProperties.java` | URL, realm, client secret |
| UI | `frontend/app/(app)/admin/users/` | Gestion de usuarios |
| E2E | `tests/e2e/specs/admin-users.spec.ts` | Regresion admin users |

**Si preguntan scopes/policies:** “En el realm hay clients, roles de recurso y policies; el converter tambien mapea `SCOPE_<permiso>`.”

---

## 3. Swagger (1–2 min)

**Abrir:** http://localhost:8080/swagger-ui.html (o cloud).

**Decir:**

> “OpenAPI documenta la API. Authorize con el mismo JWT de Keycloak. En las anotaciones se ve, por ejemplo, que inactivar es soft delete.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| Config OpenAPI | `.../common/config/OpenApiConfig.java` | Bean SpringDoc / seguridad Bearer |
| Anotaciones | `@Operation` en controllers (`ProductController`, etc.) | Resumen por endpoint |
| Dependencia | `backend/pom.xml` → springdoc | Genera `/v3/api-docs` + UI |

---

## 4. Observabilidad (4–5 min) — 15%

**Abrir en orden:** Grafana Home → Business o API → Security → Infra → Alertmanager.

**Decir (Home):**

> “Prometheus scrapea metricas, Loki guarda logs, Tempo las trazas, Alloy recibe OTLP, Grafana muestra paneles provisionados como codigo, Alertmanager las alertas. Cumplimos mas de cuatro dashboards.”

**Decir (paneles):**

> “API: latencia/RPS/errores. Business: KPIs Micrometer en `BusinessMetricsRegistrar`. Security: 401/403. Infra: JVM. Datasources enlazan logs y trazas.”

**Decir (Alertmanager):**

> “Tenemos `CubStackHeartbeat` cuando el API esta UP, mas reglas de caida, error y latencia. Antes calentamos con `warmup-demo-traffic.ps1`.”

### Stack (compose + config)

| Componente | Donde se define | Puerto | Rol |
|------------|-----------------|-------:|-----|
| Compose obs | `docker-compose.observability.yml` | — | Levanta todo el stack |
| Prometheus | `observability/prometheus/` (prometheus.yml + rules) | 9090 | Scraping + alert rules |
| Alert rules | `observability/prometheus/rules/inventory-alerts.yml` | — | `CubStackHeartbeat`, down, 5xx, latency |
| Alertmanager | `observability/alertmanager/` (si existe en compose) | 9093 | UI de alertas firing |
| Loki | compose obs | 3100 | Logs |
| Tempo | compose obs | 3200 | Trazas |
| Alloy / OTLP | compose `:4317` / `:4318` | ingest unificado |
| Grafana | `observability/grafana/provisioning/` | 3030 | UI |

### Grafana (provisioning as code)

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| Datasources | `observability/grafana/provisioning/datasources/datasources.yml` | Prometheus, Loki, Tempo (+ links) |
| Dashboard provider | `observability/grafana/provisioning/dashboards/dashboards.yml` | Carga automatica de JSON |
| Cub Home | `.../dashboards/json/cub-home.json` | URL `/d/cub-home` — puerta de entrada |
| API | `.../json/inventory-api.json` | Latencia, RPS, errores |
| Business | `.../json/inventory-business.json` | KPIs inventario |
| Security | `.../json/inventory-security.json` | 401/403 / auth |
| Infra | `.../json/inventory-infra.json` | JVM / recursos |

### Codigo Java que alimenta la obs

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| Metricas negocio | `.../observability/BusinessMetricsRegistrar.java` | Gauges/counters Micrometer (stock critico, etc.) |
| System metrics API | `.../observability/ObservabilityController.java` | JSON salud para la UI |
| Correlation ID | `.../observability/CorrelationIdFilter.java` | Header + MDC por request |
| MDC helpers | `.../observability/ObservabilityMdc.java` | Labels en logs |
| JDBC tracing | `.../observability/JdbcTracingConfig.java` | Spans DB (si activo) |
| Actuator metrics | `application.yml` + `application-observability.yml` | `/actuator/prometheus`, health |
| Export OTLP | `application-observability.yml` | Endpoint traces/metrics hacia Alloy |

### Scripts / smoke

| Script | Para que |
|--------|----------|
| `.\scripts\warmup-demo-traffic.ps1` | Llenar paneles Grafana |
| `.\tests\observability\smoke.ps1` | Comprobar Grafana/Prom/AM vivos |
| `.\scripts\verify-observability-evidence.ps1` | Evidencia documentada |

**Si preguntan “logs vs trazas vs metricas”:** “Logs = Loki; trazas = Tempo (camino del request); metricas = Prometheus; Grafana los une con datasources.”

---

## 5. Calidad Sonar + JaCoCo (2 min) — 10%

**Abrir:** http://localhost:9001/dashboard?id=inventory-qas + IDE `backend/pom.xml` (buscar `0.60`).

**Decir:**

> “JaCoCo exige ≥60% de cobertura de lineas; si no, el build falla. SonarQube corre el Quality Gate — bugs, smells, cobertura — con Postgres, no H2. Evidencia en `docs/qa-evidence/sonar-summary.md`.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| Umbral 60% | `backend/pom.xml` → `jacoco.line.minimum.covered.ratio` = `0.60` | Gate Maven |
| Plugin JaCoCo | mismo `pom.xml` → `jacoco-maven-plugin` / `jacoco-check` | Falla `mvn verify` |
| Plugin Sonar | `sonar-maven-plugin` en `pom.xml` | Analisis estatico |
| Compose Sonar | `docker-compose.staging.yml` → `sonarqube` + `sonar-db` | UI :9001 |
| Script one-shot | `scripts/setup-sonar-and-scan.ps1` | Crea proyecto + scan + QG |
| Re-scan | `scripts/run-sonar-local.ps1` | Con `SONAR_TOKEN` |
| Evidencia | `docs/qa-evidence/sonar-summary.md` | Resumen versionado |
| Resumen JaCoCo | `scripts/generate-jacoco-summary.ps1` | Markdown de cobertura |

---

## 6. CI/CD (3–4 min) — 15%

### 6.1 GitHub Actions

**Abrir:** pestana Actions.

**Decir:**

> “En la nube Actions corre CI, full QA, E2E, Postman, Schemathesis, k6/JMeter, ZAP/Snyk y deploys. Cada workflow esta en `.github/workflows/`.”

| Workflow | Archivo | Que demuestra |
|----------|---------|---------------|
| CI base | `.github/workflows/ci.yml` | Gate push/PR |
| Full QA | `full-qa-pipeline.yml` | Bateria larga |
| E2E | `e2e-playwright.yml` | Browser en CI |
| Postman | `api-postman.yml` | Contrato API |
| Schemathesis | `api-schemathesis.yml` | Fuzz OpenAPI |
| k6 | `performance-k6.yml` | Carga |
| JMeter | `performance-jmeter.yml` | Carga alternativa |
| ZAP | `security-zap.yml` | Scan seguridad |
| Snyk | `security-snyk.yml` | Deps vulnerables |
| Deps | `security-deps.yml` | Dependencias |
| Deploy staging | `deploy-staging.yml` | Entrega staging |
| Deploy prod | `deploy-production.yml` | Entrega production |

### 6.2 Jenkins

**Abrir:** http://localhost:8082 → `cub-inventory-qas`.

**Decir:**

> “Jenkins local con CasC y job sembrado al arrancar. `Jenkinsfile` es CI completo; `Jenkinsfile.demo` replica stages contra el stack vivo para la defensa.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| Imagen | `jenkins/Dockerfile` | Plugins + CasC en imagen |
| CasC | `jenkins/casc/jenkins.yaml` | Config as Code |
| Seed job | `jenkins/init.groovy.d/01-seed-cub-job.groovy` (o similar bajo `jenkins/`) | Crea job al boot |
| Pipeline full | `Jenkinsfile` | Maven/Node/Docker |
| Pipeline demo | `Jenkinsfile.demo` | Stages visuales + smoke |
| Compose | `docker-compose.staging.yml` → servicio `jenkins` | Puerto 8082 |

### 6.3 Staging / Production (cloud)

**Decir:**

> “Frontend en Vercel; API + Keycloak + Postgres en Render (`render.yaml`). Podemos demostrar sin Docker en la PC.”

| Pieza | Ruta | Como lo manejan |
|-------|------|-----------------|
| Blueprint | `render.yaml` | DB + `cub-keycloak` + `cub-api` |
| API image | `backend/Dockerfile.cloud` | Build jar + runtime |
| Entrypoint API | `backend/docker-entrypoint-cloud.sh` | JDBC URL, issuer, **socat** `$PORT`→8080 |
| KC image | `keycloak/Dockerfile.cloud` | KC 26 + import realm |
| Entrypoint KC | `keycloak/docker-entrypoint-cloud.sh` | Bind a `$PORT` Render |
| Realm | `keycloak/realm-export.json` | Users + redirect URIs Vercel |
| Import fallback | `scripts/import-keycloak-realm-cloud.ps1` | Admin API si falta realm |
| Fix redirects | `scripts/fix-keycloak-vercel-redirects.js` | `redirect_uri` exactos |
| Deploy fronts | `scripts/deploy-vercel-cloud.ps1` | Staging + prod Vercel |
| Front config | `frontend/next.config.ts`, `frontend/vercel.json` | Adaptacion Vercel |
| CORS | `SecurityConfig.java` + `INVENTORY_CORS_ORIGINS` | `*.vercel.app` |
| Guia cloud | `docs/CLOUD-STAGING-PROD.md` | Checklist operativo |

**URLs:** staging Vercel · prod Vercel · `cub-api.onrender.com/actuator/health` · `cub-keycloak.onrender.com`.

---

## 7. Testing (3–4 min) — 20%

**Abrir:** piramide (guia §5) + `docs/qa-evidence/` + un spec E2E.

**Decir:**

> “Piramide completa: unit/IT con Testcontainers y Keycloak real; Postman/Schemathesis; E2E Playwright; auth smoke; k6/JMeter; smoke de obs. Evidencias en `docs/qa-evidence/`.”

| Nivel | Ruta | Como se corre / demuestra |
|-------|------|---------------------------|
| Unit + IT | `backend/src/test/java/com/company/inventory/` | `mvn -B verify` |
| Keycloak IT | `.../security/KeycloakContainerIntegrationTest.java` | Contenedor real |
| Security MVC | `.../security/ResourceServerSecurityIntegrationTest.java`, `ApiSecurityMvcTest.java` | 401/403 en tests |
| Postman | `tests/api/` (coleccion JSON) | `api-postman.yml` / Newman |
| Schemathesis | `tests/api/schemathesis/` | `.\scripts\run-schemathesis.ps1` |
| E2E specs | `tests/e2e/specs/*.spec.ts` | Playwright |
| Login helper | `tests/e2e/helpers/keycloak-login.ts` | PKCE en tests |
| Auth smoke | `tests/security/auth-smoke.ps1` | 401/403 rapido |
| ZAP | `scripts/run-zap-baseline.ps1` | Baseline OWASP |
| k6 | `tests/performance/k6/` + `scripts/run-k6.ps1` | Carga |
| k6 stress | `scripts/run-k6-stress.ps1` | Estres |
| JMeter | `scripts/run-jmeter.ps1` | Carga JMeter |
| Obs smoke | `tests/observability/smoke.ps1` | Stack vivo |
| Bateria | `scripts/run-all-tests.ps1` | Orquesta |
| Evidencias | `docs/qa-evidence/` | Reportes versionados |
| Pack evidencias | `scripts/generate-qa-evidence.ps1` | Regenerar pack |

### Specs E2E que citar

| Spec | Demuestra |
|------|-----------|
| `login-dashboard.spec.ts` | Login + dashboard |
| `product-crud.spec.ts` | CRUD + soft delete UI |
| `stock-movement.spec.ts` | IN/OUT |
| `permissions-ui.spec.ts` | UI por rol (viewer vs admin) |
| `admin-users.spec.ts` | User management |
| `a11y-smoke.spec.ts` | Accesibilidad basica |
| `visual-snapshots.spec.ts` | Regresion visual |

**Si piden ejemplo:** abrir `tests/e2e/specs/permissions-ui.spec.ts`.

---

## 8. Cierre (1–2 min)

**Decir:**

> “Cub demuestra inventario operable, autorizacion fina, auditoria, observabilidad (metricas/logs/trazas/alertas), Sonar + JaCoCo 60%, Actions + Jenkins, y piramide con evidencias. No es solo un CRUD: es calidad, seguridad y DevSecOps de punta a punta. Gracias; quedamos atentos a preguntas.”

---

## Mapa Q&A tecnico — si preguntan X, cita Y

> Usa esta tabla en el Q&A. Di el **nombre del archivo** y abre la ruta si piden “enseñame el codigo”.

### Funcionalidad / dominio

| Pregunta | Abrir / citar | Frase corta |
|----------|---------------|-------------|
| Soft delete | `ProductController` + `Product.markInactive` + `ProductStatus` | “INACTIVE; no borramos filas” |
| Donde se valida stock negativo | `StockService` | “OUT rechaza cantidad imposible” |
| Top sold / KPIs | `ReportService` + `ReportController` | “OUT 30 dias como proxy de ventas” |
| Quien llama al dashboard | UI `dashboard/page.tsx` → `/api/v1/reports/dashboard` | “Frontend consume el reporte” |
| Envers / auditoria | `AuditController` + `@Audited` + `InventoryRevisionEntity` | “Revisiones en `*_AUD`” |
| Quien quedo en la revision | `InventoryRevisionListener` | “Listener Envers con usuario” |
| Correlation id en stock | `StockService` + `CorrelationIdFilter` | “Cada movimiento lleva correlationId” |
| Categorias | `CategoryController` + `Category.java` | “Clasificacion del catalogo” |
| Errores HTTP unificados | `GlobalExceptionHandler` + `ErrorCode` | “Problem details + correlation” |
| Migraciones | `db/migration/V*.sql` | “Flyway versiona el schema” |

### Seguridad

| Pregunta | Abrir / citar | Frase corta |
|----------|---------------|-------------|
| Lista de permisos | `Permission.java` | “`recurso:accion`, una sola fuente” |
| Como el JWT vira authorities | `KeycloakJwtAuthoritiesConverter` | “Roles + scopes → GrantedAuthority” |
| Mapa rol→permisos | `RealmRolePermissions` | “admin/warehouse/clerk/viewer” |
| Filter chain / CORS | `SecurityConfig` | “Resource server + CORS Vercel” |
| Que es publico | `PublicApiPaths` | “Health/info sin token” |
| 401 vs 403 | `auth-smoke.ps1` o demo viewer | “Sin token 401; sin permiso 403” |
| PKCE en el browser | `frontend/lib/auth.ts` | “Code + PKCE; sin secret” |
| Users admin | `UserController` + `UserService` + Keycloak Admin | “Admin API, no tabla users propia” |
| Realm / policies | `keycloak/realm-export.json` | “Identidad reproducible” |
| Matriz en vivo | `SecurityController` / `/security/me` | “Inspeccionar authorities” |
| Test con Keycloak real | `KeycloakContainerIntegrationTest` | “Testcontainers, no mock ciego” |

### Observabilidad / Grafana

| Pregunta | Abrir / citar | Frase corta |
|----------|---------------|-------------|
| Donde estan los dashboards | `observability/grafana/provisioning/dashboards/json/*.json` | “Provisionados as code” |
| Como se cargan solos | `dashboards/dashboards.yml` + `datasources.yml` | “Grafana provisioning” |
| ≥4 dashboards | Home, API, Business, Security, Infra | “Cinco JSON, cumple rubrica” |
| Metricas de negocio | `BusinessMetricsRegistrar` | “Micrometer de inventario” |
| De donde scrapea Prom | `/actuator/prometheus` + `observability/prometheus/` | “Actuator + scrape config” |
| Alertas | `inventory-alerts.yml` + Alertmanager :9093 | “Heartbeat + down/5xx/latency” |
| Logs | Loki via Alloy + `CorrelationIdFilter` / MDC | “Buscar por correlation id” |
| Trazas | Tempo + OTLP (`application-observability.yml`) | “Camino del request” |
| Compose del stack | `docker-compose.observability.yml` | “Todo el stack en un archivo” |
| Calentar paneles | `warmup-demo-traffic.ps1` | “Trafico sintetico pre-demo” |

### Calidad / Sonar

| Pregunta | Abrir / citar | Frase corta |
|----------|---------------|-------------|
| Umbral 60% | `pom.xml` `jacoco.line.minimum.covered.ratio` | “Gate que falla el build” |
| Quality Gate | Sonar UI `inventory-qas` | “Bugs/smells/coverage” |
| Por que Postgres en Sonar | `docker-compose.staging.yml` `sonar-db` | “H2 embebido inestable” |
| Como lo corrimos | `setup-sonar-and-scan.ps1` | “Proyecto + token + analyze” |
| Evidencia | `docs/qa-evidence/sonar-summary.md` | “Resumen versionado” |

### CI/CD

| Pregunta | Abrir / citar | Frase corta |
|----------|---------------|-------------|
| Actions | `.github/workflows/*.yml` | “CI/QA/E2E/perf/sec/deploy” |
| Jenkins vs Actions | ambas UIs + `Jenkinsfile` / `Jenkinsfile.demo` | “Nube vs historial local” |
| CasC | `jenkins/casc/jenkins.yaml` | “Jenkins sin clicks” |
| Staging cloud | `render.yaml` + Vercel | “UI Vercel; API/KC Render” |
| Puerto Render | `docker-entrypoint-cloud.sh` (socat) | “`$PORT` abierto al instante” |
| Redirect Vercel | `realm-export.json` + `fix-keycloak-vercel-redirects.js` | “URIs exactas, no wildcard” |

### Testing

| Pregunta | Abrir / citar | Frase corta |
|----------|---------------|-------------|
| Piramide | guia §5 + carpetas `tests/` | “Unit → IT → API → E2E → perf/sec” |
| E2E permisos | `permissions-ui.spec.ts` | “UI segun rol” |
| Evidencias | `docs/qa-evidence/` | “Reportes versionados” |
| Un solo comando | `run-all-tests.ps1` | “Orquesta la bateria” |
| Contrato API | Postman + Schemathesis | “Happy path + fuzz” |

### Alcance / decisiones

| Pregunta | Abrir / citar | Frase corta |
|----------|---------------|-------------|
| Fuera de alcance | guia §14 | “Sin billing/compras/multi-tenant” |
| ADRs | guia §13 | “Soft delete, permisos, OUT=top sold…” |
| Scripts demo | `docs/SCRIPTS-DEMO.md` | “Que correr y para que” |

---

## Timing sugerido (reloj)

| Min | Bloque |
|----:|--------|
| 0–2 | Apertura + C4 |
| 2–7 | Funcionalidad |
| 7–11 | Seguridad |
| 11–13 | Swagger |
| 13–18 | Observabilidad |
| 18–20 | Sonar / JaCoCo |
| 20–24 | CI/CD |
| 24–28 | Testing + evidencias |
| 28–30 | Cierre + Q&A buffer |

Si te comes el tiempo: **salta Swagger detallado** y **acorta Testing** a piramide + una evidencia; no saltes Seguridad ni Observabilidad.

---

## Variante corta (15 min)

1. Pitch + C4 (1).  
2. Admin: producto + soft delete + stock (3).  
3. Viewer 403 + `Permission` (2).  
4. Grafana Home + Alertmanager (3).  
5. Sonar gate + `0.60` (1).  
6. Actions + Jenkins history (2).  
7. Piramide + `qa-evidence` (2).  
8. Cierre (1).

---

## Notas de oratoria

- Habla en **presente** y senala la pantalla: “aqui”, “este panel”, “esta anotacion”.  
- No leas rutas largas: di el **nombre del archivo** y abrelo si preguntan.  
- Si algo falla: plan B cloud (Vercel) para funcionalidad; local para Grafana/Jenkins/Sonar.  
- Tras cada bloque, una frase de valor: *por que importa para un inventario real*.  
- En Q&A tecnico: **archivo → que hace → por que esa decision** (30–45 s por respuesta).
