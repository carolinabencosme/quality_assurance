# Guia de presentacion final — Proyecto Final V3 (Cub)

> Documento unico para la defensa oral.  
> Rama: `defensa` · Sistema: Cub Inventory QAS · Rubro: `Proyecto_Final_V3.pdf`  
> Diagramas C4: `docs/architecture.md` (no duplicar aqui; abrirlos en pantalla).

---

## 0. Antes de empezar (checklist de setup)

### 0.1 Tiempo sugerido

| Bloque | Minutos | Contenido |
|--------|--------:|-----------|
| Apertura + arquitectura C4 | 3–4 | Que es Cub, L1/L2 |
| Funcionalidad demo | 5–6 | Productos, stock, dashboard |
| Seguridad | 5–6 | Keycloak, scopes, users, 403 |
| Testing + evidencias | 4–5 | Piramide, reportes QA |
| Observabilidad | 4–5 | Grafana, Loki, Tempo, alertas |
| CI/CD + calidad | 3–4 | Actions, Jenkins, Sonar |
| Cierre + preguntas | 3+ | Mensaje final |

Total objetivo: **25–30 min** + preguntas.

### 0.2 Levantar el stack (manana de defensa)

```powershell
cd C:\Users\Josvier\Desktop\quality_assurance
git checkout defensa
git pull
copy .env.example .env   # si falta
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

Esperar healthy de backend y Keycloak (~2–3 min). Verificar:

| Servicio | URL |
|----------|-----|
| App Cub | http://localhost:3000 |
| Swagger | http://localhost:8080/swagger-ui.html |
| Keycloak | http://localhost:8081 |
| Grafana | http://localhost:3030 |

Usuarios demo:

| Usuario | Password | Rol |
|---------|----------|-----|
| `admin` | `admin123` | Todo |
| `warehouse` | `warehouse123` | Productos + stock + reportes |
| `clerk` | `clerk123` | Stock operativo |
| `viewer` | `viewer123` | Solo lectura |

### 0.3 Pestanas listas (recomendado)

1. Cub app (3000)  
2. Swagger (8080)  
3. Grafana (3030)  
4. GitHub Actions (repo)  
5. `docs/architecture.md` (C4)  
6. `docs/qa-evidence/FINAL-CHECKLIST.md`  
7. VS Code / IntelliJ en `Permission.java` o un controller con `@PreAuthorize`

### 0.4 Si algo falla

- Keycloak lento: esperar import realm; no usar proxy `/keycloak` en navegador.  
- Backend 401: JWKS interno = `http://keycloak:8080/...` (Docker).  
- Flyway checksum: `scripts/repair-flyway-checksums.ps1`.  
- Testcontainers Windows: `$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"`.

---

## 1. Apertura (30–45 s)

**Que decir:**

> Cub es un sistema de gestion de inventarios empresarial. No es solo un CRUD: demuestra Full Stack Testing, DevSecOps, observabilidad con OpenTelemetry y autorizacion granular con Keycloak, scopes y policies, como pide el Proyecto Final V3.

**Mostrar:** landing Cub en http://localhost:3000.

**Frase puente:**

> Primero la arquitectura C4, luego demos en vivo de funcionalidad, seguridad, pruebas, monitoreo y CI/CD.

---

## 2. Arquitectura C4 (3–4 min)

**Abrir:** `docs/architecture.md` — seccion **C4 diagrams**.

### Orden de explicacion

1. **L1 System Context** — Usuarios (admin/warehouse/clerk/viewer) + QA/docente. Sistema Cub. Externos: Keycloak e CI/CD (GitHub Actions + Jenkins).  
2. **L2 Containers** — Frontend Next.js, Backend Spring Boot, PostgreSQL, Keycloak, Alloy, Prometheus, Loki, Tempo, Alertmanager, Grafana.  
3. **L3 Backend (opcional si hay tiempo)** — Products, Stock, Reports, Audit, Users, Security JWT, Observability.  
4. **L3 Frontend (opcional)** — Auth PKCE, navegacion por permisos, dashboard, admin.  
5. **CI/CD supporting** — Workflows, Jenkins, suites de test, carpeta `docs/qa-evidence`.

**Que decir en L2:**

> El navegador habla con Next.js. Next.js autentica con Keycloak por Authorization Code + PKCE y llama al API con JWT. El API valida el token, habla con PostgreSQL y exporta telemetria a Alloy. Grafana consume Prometheus, Loki y Tempo.

**Puertos a mencionar si preguntan:** 3000 app, 8080 API, 8081 Keycloak, 3030 Grafana.

**No leer el Mermaid en voz alta.** Senalar cajas y flechas.

---

## 3. Funcionalidad (5–6 min)

Rubro PDF: productos, stock, dashboard, API, UI.

### Demo A — Productos (admin)

1. Login `admin` / `admin123`.  
2. Ir a **Productos**: listado, busqueda, filtros, paginacion.  
3. Crear o editar un producto (SKU, categoria, precio, stock minimo).  
4. Soft delete: explicar que DELETE pone `INACTIVE` (trazabilidad + Envers). Doc: `docs/requirements.md`.

**Codigo de apoyo:** `backend/.../product/`, UI `frontend/app/(app)/products/`.

### Demo B — Stock

1. **Movimientos**: entrada IN, salida OUT (rechaza negativo), ajuste.  
2. Mostrar historial (fecha, usuario, tipo, cantidades, observaciones).

**Codigo:** `backend/.../stock/`, UI `frontend/app/(app)/stock/movements/`.

### Demo C — Dashboard

1. KPIs (activos, criticos, unidades, valor, movimientos).  
2. Productos criticos.  
3. Mas vendidos = proxy OUT ultimos 30 dias (explicar honestamente).  
4. Movimientos recientes.  
5. **Metricas del sistema** (CPU/heap/threads/pool) desde `/api/v1/observability/system-metrics`.

### Demo D — API empresarial

Abrir Swagger: CRUD, stock, reportes, audit, users, security.

**Frase:**

> La misma logica que usa la UI esta documentada en OpenAPI y la consumen Newman y Schemathesis.

### Demo E — Auditoria Envers (si hay tiempo)

UI `/audit` con permiso `audit:view`. Cambiar un producto y mostrar revision.

---

## 4. Seguridad (5–6 min)

Rubro PDF: Keycloak, OAuth2, JWT, roles, permisos, scopes, policies; matriz granular; refresh; `user:manage`.

### 4.1 Login OIDC

1. Logout → Login → pantalla Keycloak tema Cub.  
2. Explicar: cliente publico, **PKCE**, access + refresh token.  
3. Archivos: `frontend/lib/auth.ts`, `frontend/lib/oidc-config.ts`, `keycloak/themes/cub/`.

### 4.2 Matriz de permisos (no roles simples)

Mostrar tabla (o UI `/admin/permissions`):

| Permiso | Uso |
|---------|-----|
| `product:view` / `product:manage` | Ver / CRUD productos |
| `stock:view` / `stock:manage` | Ver / movimientos |
| `report:view` | Dashboard y reportes |
| `user:manage` | Usuarios y matriz |
| `audit:view` | Auditoria |

Roles: `inventory-admin`, `warehouse-manager`, `inventory-clerk`, `inventory-viewer` = combinaciones de permisos.

**Codigo:** `Permission.java`, `@PreAuthorize` en controllers, `keycloak/realm-export.json`.

### 4.3 Scopes + policies

1. JWT de admin (DevTools o jwt.io): claim `scope` con permisos de negocio.  
2. `/api/v1/security/me`: authorities `product:view` y/o `SCOPE_product:view`.  
3. Realm: client scopes + `authorizationSettings` (resources Products/Stock/Reports/Users/Audit + policies por rol).  
4. Enforcement en API: `KeycloakJwtAuthoritiesConverter` + `@PreAuthorize`.

### 4.4 Demo 403 vs 200

1. Como **viewer**: no ver Usuarios/Auditoria en nav; llamar users o audit → **403**.  
2. Como **admin**: `/admin/users` lista usuarios reales de Keycloak; explicar Admin API + `inventory-admin-api`.

Script corto: `docs/defensa/guion-sellado-v3.md` demos 1–2.  
Smoke: `tests/security/auth-smoke.ps1`.

---

## 5. Full Stack Testing (4–5 min)

Rubro PDF: unit, integration Testcontainers, API, E2E, security, performance, data, exploratory.

### Piramide (decir en este orden)

| Nivel | Herramienta | Donde |
|-------|-------------|-------|
| Unit | JUnit + Mockito | `backend/src/test` |
| Integration | Testcontainers Postgres + Keycloak | `*IntegrationTest`, `KeycloakContainerIntegrationTest` |
| API / contrato | Newman + Schemathesis | `tests/api/` |
| E2E | Playwright | `tests/e2e/specs/` (roles, stock, responsive, a11y, snapshots) |
| Security | ZAP, Dependency Check, Snyk, auth-smoke | workflows + scripts |
| Performance | k6 load/stress + JMeter | `tests/performance/` |
| Data | Flyway + constraint tests | migrations + `ProductRepositoryConstraintTest` |
| Exploratory | Charters + defects | `docs/qa-evidence/EXPLORATORY-TESTING.md`, `DEFECTS.md` |

### Que mostrar en pantalla

1. `docs/qa-evidence/FINAL-CHECKLIST.md` (sellado live).  
2. Una carpeta de evidencia: JaCoCo, Newman resumen, Playwright report, ZAP, Sonar, k6.  
3. Indice: `docs/qa-evidence.md`.

**Frase clave PDF staging:**

> Las pruebas de staging en GitHub Actions corren contra el sistema ya desplegado, no solo en el build. Ver `deploy-staging.yml`.

Comando local (no hace falta correrlo en vivo si hay evidencia):

```powershell
.\scripts\run-all-tests.ps1
```

---

## 6. Observabilidad (4–5 min)

Rubro PDF: Prometheus, Tempo, Loki, Alloy, Grafana, Alertmanager, OTEL; metricas; logs con user/endpoint; 4 dashboards; alertas.

### Demo

1. Grafana → dashboards **Inventory API**, **Infra**, **Business**, **Security**.  
2. Loki: filtro por backend y campos `user`, `endpoint`, `correlationId`, `traceId`.  
3. Tempo: abrir `traceId` → spans HTTP + JDBC.  
4. Alertas: mencionar `HighCpuUsage`, error rate, latencia, servicios caidos, fallos auth (`observability/prometheus/rules/inventory-alerts.yml`).

**Codigo:** `ObservabilityMdc`, `ObservabilitySecurityFilter`, `BusinessMetricsRegistrar`, `JdbcTracingConfig`, `application-observability.yml`.

Guias: `docs/observability-guide.md`, evidencia `docs/qa-evidence/observability-live-summary.md`.

---

## 7. CI/CD y calidad de codigo (3–4 min)

### GitHub Actions

Abrir pestana Actions. Mencionar workflows:

- CI (build + JaCoCo)  
- Newman, Playwright, Schemathesis  
- ZAP, Dependency Check, Snyk  
- k6, JMeter  
- Deploy staging / production  
- Full QA pipeline  

### Jenkins

Abrir `Jenkinsfile`: stages visuales checkout → build → tests → deploy → scans → Sonar.

### SonarQube

Mostrar `docs/qa-evidence/sonar-summary.md`: Quality Gate OK, coverage, 0 bugs/vulns.

### Buenas practicas

- Conventional Commits / PRs: `CONTRIBUTING.md`  
- Secrets en env: `.env.example`, `.env.prod.example`  
- Branch protection documentado: `docs/branch-protection.md`

### Produccion local (si preguntan)

```powershell
.\scripts\up-prod.ps1
.\scripts\post-deploy-smoke.ps1
```

Aclarar: produccion **local de demostracion academica**, no cloud endurecido (`docs/architecture.md` Known Limitations).

---

## 8. Documentacion entregable (30 s)

Senalar sin leer todo:

| Doc | Uso |
|-----|-----|
| `docs/requirements.md` | RF / RNF vs PDF |
| `docs/installation.md` | Como instalar |
| `docs/maintenance.md` | Operacion |
| `docs/architecture.md` | C4 + ADRs |
| `docs/testing-guide.md` | Como probar |
| `docs/qa-evidence/` | Evidencias |

---

## 9. Cierre (30–45 s)

**Que decir:**

> Cub cumple el Proyecto Final V3: funcionalidad de inventario, seguridad granular con Keycloak scopes y policies, piramide completa de pruebas, observabilidad metrics-logs-traces, pipelines GitHub Actions y Jenkins, y documentacion con evidencias reproducibles. El exito no es solo que la app funcione: es calidad continua, seguridad y trazabilidad demostrables.

**Ofrecer:** preguntas tecnicas. Respaldo: `docs/defensa/preguntas-defensa-completa.md`.

---

## 10. Preguntas tipicas (respuestas cortas)

| Pregunta | Respuesta corta | Donde |
|----------|-----------------|-------|
| Por que soft delete? | Conserva historial stock y Envers | `requirements.md` |
| Scopes vs roles? | Roles agrupan; cada endpoint exige permiso/scope en JWT | converter + realm |
| Quien enforcea policies? | Keycloak las define; Spring Resource Server enforcea authorities del JWT | `architecture.md` |
| Top sold? | Proxy por OUT 30 dias, no modulo de ventas | `ReportService` |
| Testcontainers Keycloak? | IT con token real, no mock | `KeycloakContainerIntegrationTest` |
| Staging PDF? | Tests post-deploy en Actions | `deploy-staging.yml` |
| Produccion real? | Compose local academico | `docker-compose.prod.yml` |

---

## 11. Mapa rapido de demos (cheat sheet)

| # | Demo | URL / archivo |
|---|------|----------------|
| 1 | C4 | `docs/architecture.md` |
| 2 | App + dashboard | http://localhost:3000 |
| 3 | Swagger | http://localhost:8080/swagger-ui.html |
| 4 | Scopes / 403 | JWT + viewer vs admin |
| 5 | Users | `/admin/users` |
| 6 | Grafana | http://localhost:3030 |
| 7 | Evidencias | `docs/qa-evidence/FINAL-CHECKLIST.md` |
| 8 | Actions | GitHub → Actions |
| 9 | Sonar summary | `docs/qa-evidence/sonar-summary.md` |

Demos sellado detalladas: `docs/defensa/guion-sellado-v3.md`.

---

## 12. Relacion con el rubro de evaluacion

| Area PDF | % | Donde lo demuestras |
|----------|--:|---------------------|
| Funcionalidad | 15 | Seccion 3 |
| Testing | 20 | Seccion 5 |
| Seguridad | 10 | Seccion 4 |
| Observabilidad | 15 | Seccion 6 |
| CI/CD | 15 | Seccion 7 |
| Calidad de codigo | 10 | Sonar + JaCoCo |
| Documentacion | 10 | Seccion 8 |
| Presentacion | 5 | Esta guia + claridad oral |

---

## 13. Referencias cruzadas

- Arquitectura C4: `docs/architecture.md`  
- Sellado 5 demos: `docs/defensa/guion-sellado-v3.md`  
- Guion largo previo: `docs/defensa/guion-presentacion-manana.md`  
- Preguntas: `docs/defensa/preguntas-defensa-completa.md`  
- Instalacion: `docs/installation.md`  
- Checklist final: `docs/qa-evidence/FINAL-CHECKLIST.md`
