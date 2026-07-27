# Guia de estudio — Proyecto Final V3 (Cub Inventory QAS)

> Documento unico para **leer, estudiar y explicar** en la defensa.  
> Diagramas C4: [`architecture.md`](./architecture.md).  
> Evidencias QA (reportes/capturas): [`qa-evidence/`](./qa-evidence/).  
> Rubro: Sistema de Gestion de Inventarios con Full Stack Testing, Observabilidad y DevSecOps.

Como usar esta guia: cada area del PDF tiene **que demostrar**, **por que importa**, **donde esta en el codigo** (rutas concretas) y **como mostrarlo en vivo**.

---

## 1. Que es Cub (elevator pitch)

Cub es un monorepo que demuestra un inventario empresarial de punta a punta:

1. **Funcionalidad** — productos, stock, dashboard, soft delete, auditoria Envers, Swagger.  
2. **Seguridad** — Keycloak (roles + permisos + scopes + policies), JWT, PKCE, 401/403, gestion de usuarios.  
3. **Full Stack Testing** — piramide completa + evidencias versionadas.  
4. **Observabilidad** — Prometheus, Loki, Tempo, Alloy, Grafana (≥4 dashboards), Alertmanager.  
5. **CI/CD DevSecOps** — GitHub Actions + Jenkins + SonarQube (JaCoCo ≥60%).

**Stack:** Spring Boot 3.4 / Java 21 · Next.js · PostgreSQL · Flyway · Hibernate Envers · Keycloak 26 · Docker Compose.

---

## 2. Levantar el stack y links de demo

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
.\scripts\warmup-demo-traffic.ps1
```

| Que | URL | Credenciales |
|-----|-----|--------------|
| App Cub | http://localhost:3000 | `admin` / `admin123` (tambien viewer/warehouse/clerk) |
| Swagger | http://localhost:8080/swagger-ui.html | Bearer JWT |
| Keycloak Admin | http://localhost:8081 | `admin` / `admin` |
| Grafana Home | http://localhost:3030/d/cub-home | `admin` / `admin` |
| Prometheus | http://localhost:9090/targets | — |
| Alertmanager | http://localhost:9093 | debe mostrar `CubStackHeartbeat` |
| SonarQube | http://localhost:9001 | `admin` / `admin` (primer login) |
| Jenkins | http://localhost:8082 | `admin` / `admin` — job `cub-inventory-qas` |

Usuarios del realm (demo):

| Usuario | Password | Que puede hacer |
|---------|----------|-----------------|
| admin | admin123 | todo (`user:manage` incluido) |
| warehouse | warehouse123 | productos + stock + reportes |
| clerk | clerk123 | stock operativo |
| viewer | viewer123 | solo lectura (ideal para demo 403) |

---

## 3. Mapa del PDF (rubrica) → repo

| Area PDF | % | Que demuestras | Donde ir en el repo |
|----------|--:|----------------|---------------------|
| Funcionalidad | 15 | CRUD, stock, dashboard, soft delete, Swagger | Controllers + UI (§4) |
| Testing | 20 | Piramide + evidencias | `tests/`, `backend/src/test`, `docs/qa-evidence/` (§5) |
| Seguridad | 10 | Keycloak, scopes, policies, 401/403, users | realm + `Permission` + `@PreAuthorize` (§6) |
| Observabilidad | 15 | ≥4 dashboards, logs, trazas, alertas | `observability/` + Grafana (§7) |
| CI/CD | 15 | Actions + Jenkins + staging post-tests | `.github/workflows`, `Jenkinsfile`, `Jenkinsfile.demo` (§8) |
| Calidad | 10 | Sonar gate + JaCoCo ≥60% | `backend/pom.xml` + Sonar UI (§9) |
| Documentacion | 10 | Esta guia + C4 + evidencias | `docs/` |
| Presentacion | 5 | Demo viva | orden §11 |

---

## 4. Funcionalidad (15%) — codigo para explicar

### 4.1 Productos (CRUD + soft delete)

| Pieza | Ruta |
|-------|------|
| API REST | `backend/src/main/java/com/company/inventory/product/controller/ProductController.java` |
| Dominio / soft delete | `.../product/entity/Product.java` (`markInactive` → `ProductStatus.INACTIVE`) |
| Estado | `.../product/entity/ProductStatus.java` |
| Categorias | `.../product/controller/CategoryController.java` |
| UI | `frontend/app/(app)/products/` |

**Que decir en defensa**

- `DELETE` no borra filas: marca `INACTIVE` para no romper historial de stock ni auditoria Envers.  
- Cada endpoint declara permiso con `@PreAuthorize` (no “solo autenticado”).

```105:106:backend/src/main/java/com/company/inventory/product/controller/ProductController.java
    @PreAuthorize("hasAuthority('" + Permission.PRODUCT_MANAGE + "') or hasAuthority('SCOPE_" + Permission.PRODUCT_MANAGE + "')")
    @Operation(summary = "Inactivar producto", description = "Soft delete: status INACTIVE")
```

**Demo viva:** login admin → Productos → crear / editar / inactivar → Swagger `GET/POST/PUT/DELETE /api/v1/products`.

### 4.2 Stock (movimientos + regla de negocio)

| Pieza | Ruta |
|-------|------|
| API | `backend/src/main/java/com/company/inventory/stock/controller/StockController.java` |
| Servicio / reglas | `backend/src/main/java/com/company/inventory/stock/service/` |
| UI | `frontend/app/(app)/stock/` (movimientos) |

**Que decir:** `POST /api/v1/stock/movements` con tipos IN / OUT / ADJUSTMENT; OUT no puede dejar stock negativo; queda usuario + correlationId para trazabilidad.

### 4.3 Dashboard / reportes / metricas de sistema

| Pieza | Ruta |
|-------|------|
| Reportes API | `.../report/controller/ReportController.java` |
| Logica KPIs | `.../report/service/ReportService.java` (activos/inactivos, criticos, top sold = OUT 30d) |
| Metricas UI | `.../observability/ObservabilityController.java` |
| UI dashboard | `frontend/app/(app)/dashboard/page.tsx` |

**Endpoints clave:** `/api/v1/reports/dashboard`, `/api/v1/observability/system-metrics`.

### 4.4 Auditoria Hibernate Envers

| Pieza | Ruta |
|-------|------|
| API | `.../audit/controller/AuditController.java` |
| Entidades auditadas | entidades con `@Audited` bajo `product/`, `stock/`, etc. |
| UI | `frontend/app/(app)/audit/` |
| Permiso | `audit:view` en `Permission.java` |

**Que decir:** tablas `*_AUD` + revision; UI `/audit` exige permiso; demuestra trazabilidad de cambios.

### 4.5 Swagger / OpenAPI

- UI: http://localhost:8080/swagger-ui.html  
- Anotaciones `@Operation` en controllers (ej. soft delete en `ProductController`).  
- Autenticacion: Authorize con Bearer JWT (token de Keycloak).

---

## 5. Testing (20%) — piramide y evidencias

### 5.1 Mapa de la piramide

```text
                    E2E Playwright
                 /                  \
           API (Postman/Schemathesis)   Security (auth/ZAP)
          /                                              \
   Integration (Testcontainers/Keycloak)          Performance (k6/JMeter)
                         |
                    Unit (JUnit/Mockito)
```

| Nivel | Donde | Como se corre |
|-------|-------|---------------|
| Unit + Integration | `backend/src/test/java/...` | `mvn -B verify` (Testcontainers) |
| Keycloak IT | `.../security/KeycloakContainerIntegrationTest.java` | mismo verify |
| API Postman | `tests/api/inventory-qas.postman_collection.json` | workflow `api-postman.yml` |
| Schemathesis | `tests/api/schemathesis/` | `api-schemathesis.yml` |
| E2E | `tests/e2e/specs/*.spec.ts` | `e2e-playwright.yml` / local Playwright |
| Auth smoke | `tests/security/auth-smoke.ps1` | 401 sin token, 403 viewer |
| Perf | `tests/performance/k6/`, `tests/performance/jmeter/` | workflows k6/jmeter |
| Observability smoke | `tests/observability/smoke.ps1` | Grafana/Prom/AM vivos |
| Bateria local | `scripts/run-all-tests.ps1` | orquesta niveles |
| Evidencias selladas | `docs/qa-evidence/` | capturas, Sonar, reportes |

### 5.2 Specs E2E utiles para la oral

| Spec | Demuestra |
|------|-----------|
| `login-dashboard.spec.ts` | login + dashboard |
| `product-crud.spec.ts` | CRUD productos |
| `stock-movement.spec.ts` | movimiento de stock |
| `permissions-ui.spec.ts` | UI segun rol |
| `admin-users.spec.ts` | gestion usuarios |
| `a11y-smoke.spec.ts` | accesibilidad basica |
| `visual-snapshots.spec.ts` | regresion visual |

**Frase corta:** “No solo unitarios: hay IT con Keycloak real en contenedor, API contractual, E2E, seguridad y performance; las evidencias estan versionadas en `docs/qa-evidence/`.”

---

## 6. Seguridad (10%) — del realm al `@PreAuthorize`

### 6.1 Flujo (explicar con C4 L2)

```text
Browser (Next.js PKCE)
  → Keycloak (realm inventory-realm)
  → JWT (roles + resource_access + scope)
  → Spring Security (JwtDecoder + KeycloakJwtAuthoritiesConverter)
  → @PreAuthorize(hasAuthority('product:view') | SCOPE_...)
```

### 6.2 Archivos ancla

| Concepto | Ruta |
|----------|------|
| Constantes de permiso | `backend/.../security/Permission.java` |
| JWT → authorities | `backend/.../security/KeycloakJwtAuthoritiesConverter.java` |
| Roles compuestos → permisos | `backend/.../security/RealmRolePermissions.java` |
| Security filter chain | `backend/.../security/SecurityConfig.java` |
| Realm import | `keycloak/realm-export.json` |
| Frontend auth/PKCE | `frontend/lib/auth.ts` |
| Matriz / probe | `SecurityController.java` |
| Users Admin API | `UserController.java` + `UserService` + UI `frontend/app/(app)/admin/users/` |

Permisos del dominio (citar en oral):

```10:17:backend/src/main/java/com/company/inventory/security/Permission.java
    public static final String PRODUCT_VIEW = "product:view";
    public static final String PRODUCT_MANAGE = "product:manage";
    public static final String STOCK_VIEW = "stock:view";
    public static final String STOCK_MANAGE = "stock:manage";
    public static final String REPORT_VIEW = "report:view";
    public static final String AUDIT_VIEW = "audit:view";
    public static final String USER_MANAGE = "user:manage";
```

**Scopes / policies:** el converter lee `resource_access.inventory-api.roles` y el claim `scope`; agrega tambien `SCOPE_<permiso>` para alinear con el modelo OAuth2 de Spring.

**Demo 401/403**

```powershell
.\tests\security\auth-smoke.ps1
```

- Sin token → **401** en `/api/v1/products`.  
- Viewer sin `product:manage` / `user:manage` → **403** en escritura o `/admin/users`.

**Demo users:** Keycloak Admin (`inventory-admin-api`) via `UserController` — listar / activar / roles; no es pantalla decorativa.

---

## 7. Observabilidad (15%) — 4+ dashboards, logs, trazas, alertas

### 7.1 Stack y puertos

| Componente | Compose / config | URL |
|------------|------------------|-----|
| Prometheus | `observability/prometheus/` | :9090 |
| Loki | compose observability | :3100 |
| Tempo | compose observability | :3200 |
| Alloy (OTLP) | compose | :4317/:4318 |
| Grafana | `observability/grafana/provisioning/` | :3030 |
| Alertmanager | compose + rules | :9093 |

Compose: `docker-compose.observability.yml`.

### 7.2 Dashboards (provisionados)

| Dashboard | JSON | Para que sirve en la oral |
|-----------|------|---------------------------|
| Cub Home | `observability/grafana/provisioning/dashboards/json/cub-home.json` | puerta de entrada |
| API | `.../inventory-api.json` | latencia, RPS, errores |
| Business | `.../inventory-business.json` | KPIs de inventario |
| Security | `.../inventory-security.json` | 401/403, auth |
| Infra | `.../inventory-infra.json` | JVM/host |

Home UI: http://localhost:3030/d/cub-home

### 7.3 Codigo de metricas / logs / trazas

| Pieza | Ruta |
|-------|------|
| Metricas de negocio (Micrometer) | `backend/.../observability/BusinessMetricsRegistrar.java` |
| Endpoint metricas sistema | `ObservabilityController.java` |
| Filters MDC (user/endpoint) | paquete `observability` / filters HTTP |
| Reglas de alerta | `observability/prometheus/rules/inventory-alerts.yml` |
| Datasources (Loki→Tempo) | `observability/grafana/provisioning/datasources/` |

**Heartbeat (Alertmanager no vacio):**

```4:12:observability/prometheus/rules/inventory-alerts.yml
      - alert: CubStackHeartbeat
        expr: up{job="inventory-api"} == 1
        for: 0m
        labels:
          severity: info
        annotations:
          summary: Cub API UP (heartbeat Alertmanager)
```

**Calentar paneles antes de la demo:**

```powershell
.\scripts\warmup-demo-traffic.ps1
.\tests\observability\smoke.ps1
```

**Frase:** “No solo Grafana: hay metricas Prometheus, logs en Loki con labels de servicio, trazas Tempo enlazadas, y alertas en Alertmanager (incluye heartbeat + caidas/errores/latencia).”

---

## 8. CI/CD (15%) — GitHub Actions + Jenkins + staging

### 8.1 GitHub Actions (CI en la nube)

| Workflow | Archivo | Que prueba |
|----------|---------|------------|
| CI principal | `.github/workflows/ci.yml` | build/test base |
| Full QA | `full-qa-pipeline.yml` | bateria amplia |
| E2E | `e2e-playwright.yml` | Playwright |
| API | `api-postman.yml`, `api-schemathesis.yml` | contrato API |
| Perf | `performance-k6.yml`, `performance-jmeter.yml` | carga |
| Sec | `security-zap.yml`, `security-snyk.yml`, `security-deps.yml` | AppSec/deps |
| Deploy | `deploy-staging.yml`, `deploy-production.yml` | compose staging/prod |

### 8.2 Jenkins local (historial de builds)

| Pieza | Ruta |
|-------|------|
| Imagen con plugins + JCasC | `jenkins/Dockerfile` |
| Config CasC | `jenkins/casc/jenkins.yaml` |
| Seed del job | `jenkins/init.groovy.d/01-seed-cub-job.groovy` |
| Pipeline **demo visual** (stages PDF + smoke) | `Jenkinsfile.demo` |
| Pipeline **CI completo** (Maven/Node/Docker) | `Jenkinsfile` |
| Servicio | `docker-compose.staging.yml` → servicio `jenkins` (:8082) |

**Como explicarlo**

1. Abrir http://localhost:8082 → job **`cub-inventory-qas`**.  
2. Ver **Build History** y stages (Checkout → Backend → Tests → Frontend → Compose → smokes API/E2E/Obs/Sonar).  
3. Decir: el `Jenkinsfile` completo es el pipeline “de verdad” (mvn/npm/docker); `Jenkinsfile.demo` demuestra el mismo mapa de stages contra el stack ya levantado (ideal para defensa sin agent Maven).

**Reiniciar Jenkins si hace falta:**

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build jenkins
```

Login Jenkins: `admin` / `admin`.

### 8.3 Staging / “prod” academica

- Staging tooling: `docker-compose.staging.yml` (Sonar + Jenkins; frontend staging override).  
- Prod local del curso: `docker-compose.prod.yml` (+ observability).  
- Deploy post-tests: parametros `DEPLOY_STAGING` / `DEPLOY_PRODUCTION` en `Jenkinsfile` y workflows `deploy-*.yml`.

---

## 9. Calidad (10%) — Sonar + JaCoCo ≥60%

| Pieza | Donde |
|-------|-------|
| Umbral JaCoCo | `backend/pom.xml` → `jacoco.line.minimum.covered.ratio` = **0.60** |
| Plugin check | `jacoco-maven-plugin` goal `check` en el mismo `pom.xml` |
| Scanner | `sonar-maven-plugin` |
| Sonar staging | servicio `sonarqube` + `sonar-db` (Postgres, no H2) en `docker-compose.staging.yml` |
| Puerto | **9001** (evita choque con emuladores en 9000) |
| Evidencia | `docs/qa-evidence/sonar-summary.md` |

**Demo:** http://localhost:9001 → proyecto Cub → Quality Gate + cobertura.

---

## 10. Documentacion (10%)

| Documento | Contenido |
|-----------|-----------|
| Esta guia | mapa PDF ↔ codigo ↔ demo |
| [`architecture.md`](./architecture.md) | C4 L1 / L2 / L3 (Mermaid) |
| [`qa-evidence/`](./qa-evidence/) | sellado de pruebas y capturas |
| `README.md` | arranque rapido del monorepo |

---

## 11. Orden de presentacion (25–30 min)

1. **Apertura** — que es Cub + C4 L1/L2 (`architecture.md`).  
2. **Funcionalidad** — admin: productos, stock, dashboard; mencionar soft delete + Envers (`ProductController`, `/audit`).  
3. **Seguridad** — viewer 403; JWT scopes; `/admin/users`; citar `Permission` + converter.  
4. **Swagger** — Authorize + endpoint protegido.  
5. **Observabilidad** — Grafana Home → Business/Security/Infra; Alertmanager `CubStackHeartbeat`.  
6. **Calidad** — Sonar gate + JaCoCo 60% en `pom.xml`.  
7. **CI/CD** — Actions en GitHub + Jenkins job con historial (`cub-inventory-qas`).  
8. **Testing** — piramide + abrir `docs/qa-evidence/`.  
9. **Cierre** — calidad, seguridad y trazabilidad; no es “solo un CRUD”.

---

## 12. Comandos utiles (estudio / ensayo)

```powershell
# Bateria local (Testcontainers en Windows)
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1

# Calentar Grafana / trafico
.\scripts\warmup-demo-traffic.ps1

# Humo observabilidad + auth
.\tests\observability\smoke.ps1
.\tests\security\auth-smoke.ps1
```

---

## 13. Decisiones clave (ADRs cortos)

| Decision | Motivo |
|----------|--------|
| Soft delete (`INACTIVE`) | No romper stock ni Envers |
| Authorities por permiso | PDF: no validar solo por nombre de rol |
| Scopes en JWT + policies Keycloak | Modelo ERP; Spring enforcea en API |
| Top sold = OUT 30d | Proxy profesional sin modulo de ventas |
| Prod = Compose local | Demostracion academica, no cloud |
| Sonar + Postgres | Evitar H2 embebido en demos |
| `Jenkinsfile.demo` + `Jenkinsfile` | Historial visual en defensa + CI real documentado |

---

## 14. Fuera de alcance (si preguntan)

Billing, compras, multi-tenant, produccion cloud endurecida.  
“Produccion” del curso = `docker-compose.prod.yml` local integrado con el mismo stack de observabilidad.
