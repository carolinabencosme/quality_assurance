# Guion de presentacion — Cub Inventory QAS

> Texto para **hablar** en la defensa (25–30 min).  
> Companion de estudio: [`GUIA-PROYECTO-FINAL-V3.md`](./GUIA-PROYECTO-FINAL-V3.md).  
> Diagramas: [`architecture.md`](./architecture.md).

**Como usar este guion:** cada bloque tiene **que abrir**, **que decir** (casi literal) y **si preguntan**. Ensaya en voz alta una vez; marca con ✓ lo que ya viste vivo.

---

## Checklist 10 minutos antes

| ✓ | Accion | Donde |
|---|--------|-------|
| | Stack local (si vas a obs/Jenkins/Sonar) | `docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d` |
| | Calentar trafico | `.\scripts\warmup-demo-traffic.ps1` |
| | App cloud o local abierta | https://cub-inventory-qas.vercel.app **o** http://localhost:3000 |
| | Grafana Home | http://localhost:3030/d/cub-home |
| | Alertmanager con heartbeat | http://localhost:9093 |
| | Sonar | http://localhost:9001 |
| | Jenkins job | http://localhost:8082 → `cub-inventory-qas` |
| | GitHub Actions (pestana Actions) | repo en browser |
| | IDE con rutas listas | `Permission.java`, `ProductController`, `pom.xml`, piramide en guia |
| | Credenciales a mano | admin/admin123 · viewer/viewer123 · Grafana/Jenkins/Sonar admin/admin |

---

## 0. Apertura (2 min)

**Abrir:** `docs/architecture.md` (C4 L1) o pantallazo del diagrama.

**Decir:**

> “Cub es un sistema de gestion de inventarios full stack. No es solo un CRUD: demostramos funcionalidad, seguridad con Keycloak, piramide de pruebas, observabilidad con Grafana/Prometheus/Loki/Tempo, y CI/CD con GitHub Actions, Jenkins y SonarQube.  
> Arquitectura: el usuario entra por Next.js, se autentica en Keycloak con PKCE, el backend Spring Boot valida JWT y permisos, persiste en PostgreSQL con Flyway y auditoria Envers, y exporta telemetria al stack de observabilidad.”

**Senalar en L2 (si hay tiempo):** Browser → Keycloak → API → Postgres; Alloy → Prometheus/Loki/Tempo → Grafana/Alertmanager.

**Si preguntan “por que monorepo”:** “Un solo repo para app, tests, observability y pipelines; la evidencia y el codigo van juntos.”

---

## 1. Funcionalidad (4–5 min) — 15%

**Abrir:** app logueada como `admin` / `admin123` → Dashboard → Productos → Stock → Audit.

### 1.1 Dashboard

**Decir:**

> “Al entrar vemos el dashboard: KPIs de productos activos/inactivos, stock critico y top de productos movidos. Eso sale de `/api/v1/reports/dashboard` en `ReportService`. Top sold lo modelamos como salidas OUT de los ultimos 30 dias, porque no hay modulo de ventas.”

**Donde en codigo (si piden):** `backend/.../report/service/ReportService.java` · UI `frontend/app/(app)/dashboard/page.tsx`.

### 1.2 Productos + soft delete

**Hacer:** crear o editar un producto; luego inactivar (no “borrar fisico”).

**Decir:**

> “El DELETE es soft delete: marca el producto `INACTIVE`. Asi no rompemos el historial de stock ni las tablas de auditoria Envers. Cada endpoint exige un permiso concreto con `@PreAuthorize`, por ejemplo `product:manage`.”

**Donde:** `ProductController.java` (anotacion soft delete) · `Product.java` → `markInactive`.

### 1.3 Stock

**Hacer:** un movimiento IN o OUT corto.

**Decir:**

> “Los movimientos son IN, OUT y ADJUSTMENT. En OUT el servicio no permite stock negativo. Queda registrado el usuario y el correlation id para trazabilidad.”

**Donde:** `StockController` + `stock/service/`.

### 1.4 Auditoria Envers

**Abrir:** UI `/audit` (o mencionar tablas `*_AUD`).

**Decir:**

> “Los cambios de entidades auditadas quedan en revisiones Hibernate Envers. La pantalla de auditoria exige el permiso `audit:view`. Eso demuestra trazabilidad: quien cambio que y cuando.”

**Donde:** `AuditController` · entidades `@Audited`.

---

## 2. Seguridad (4 min) — 10%

**Abrir:** (A) logout → login `viewer` / `viewer123` · (B) opcional Keycloak Admin · (C) IDE `Permission.java`.

### 2.1 Roles y 403

**Hacer:** como viewer intentar escribir producto o entrar a Admin Users.

**Decir:**

> “Keycloak emite un JWT con roles y scopes. Spring no valida solo ‘estas autenticado’: convierte el token en authorities de permiso — `product:view`, `product:manage`, etc. — en `KeycloakJwtAuthoritiesConverter`, y cada controller usa `@PreAuthorize`.  
> El viewer solo lee: al intentar gestionar productos o usuarios recibimos 403. Sin token seria 401. Eso lo automatizamos con `tests/security/auth-smoke.ps1`.”

**Donde:** `Permission.java` · `RealmRolePermissions.java` · `SecurityConfig.java` · realm `keycloak/realm-export.json` · frontend `frontend/lib/auth.ts` (PKCE).

### 2.2 Users admin

**Hacer:** volver a `admin` → `/admin/users` (listar / roles).

**Decir:**

> “La gestion de usuarios no es decorativa: el backend habla con la Admin API de Keycloak para listar, activar y asignar roles. Solo quien tiene `user:manage`.”

**Si preguntan scopes/policies:** “En el realm hay clients, roles de recurso y policies; el converter tambien mapea `SCOPE_<permiso>` para alinear con OAuth2 de Spring.”

---

## 3. Swagger (1–2 min)

**Abrir:** http://localhost:8080/swagger-ui.html (o Swagger cloud).

**Hacer:** Authorize con Bearer JWT → llamar un GET protegido.

**Decir:**

> “La API esta documentada con OpenAPI. Autenticamos con el mismo JWT de Keycloak y podemos ejercitar endpoints protegidos. Aqui se ve, por ejemplo, que inactivar producto es soft delete.”

---

## 4. Observabilidad (4–5 min) — 15%

**Abrir en orden:** Grafana Home → Business o API → Security → Infra → Alertmanager.

**Decir (Home):**

> “El stack de observabilidad esta en Docker Compose: Prometheus scrapea metricas, Loki guarda logs, Tempo las trazas, Alloy recibe OTLP, Grafana muestra paneles provisionados como codigo, y Alertmanager las alertas. Cumplimos mas de cuatro dashboards.”

**Decir (paneles):**

> “API: latencia, RPS y errores. Business: KPIs de inventario desde Micrometer en `BusinessMetricsRegistrar`. Security: 401/403. Infra: JVM. Los datasources enlazan logs y trazas para hacer drill-down.”

**Decir (Alertmanager):**

> “En Alertmanager no esta vacio: tenemos `CubStackHeartbeat` cuando el API esta UP, mas reglas de caida, error y latencia en `inventory-alerts.yml`. Antes de la demo calentamos trafico con `warmup-demo-traffic.ps1`.”

**Donde:** `observability/grafana/provisioning/dashboards/json/` · `observability/prometheus/rules/inventory-alerts.yml` · compose `docker-compose.observability.yml`.

**Si preguntan “logs vs trazas”:** “Logs = eventos en Loki; trazas = camino del request en Tempo; metricas = series en Prometheus; Grafana los une.”

---

## 5. Calidad Sonar + JaCoCo (2 min) — 10%

**Abrir:** http://localhost:9001 (Quality Gate) + IDE `backend/pom.xml` (buscar `0.60`).

**Decir:**

> “La calidad no es opinion: JaCoCo exige al menos 60% de cobertura de lineas; si no, el build falla. SonarQube corre el Quality Gate sobre el proyecto — bugs, smells, cobertura — con base Postgres, no H2 embebido. La evidencia tambien esta en `docs/qa-evidence/sonar-summary.md`.”

---

## 6. CI/CD (3–4 min) — 15%

### 6.1 GitHub Actions

**Abrir:** pestana Actions del repo.

**Decir:**

> “En la nube, GitHub Actions corre CI base, full QA, E2E Playwright, Postman, Schemathesis, k6/JMeter, ZAP/Snyk y deploys de staging/production. Cada workflow esta en `.github/workflows/`.”

### 6.2 Jenkins

**Abrir:** http://localhost:8082 → job `cub-inventory-qas` → Build History / stages.

**Decir:**

> “En local tenemos Jenkins provisionado con CasC y un job sembrado al arrancar. El historial muestra stages: backend, tests, frontend, smokes de API, E2E, observabilidad y Sonar.  
> Hay dos pipelines: `Jenkinsfile` es el CI completo con Maven/Node/Docker; `Jenkinsfile.demo` replica el mapa de stages contra el stack ya levantado, ideal para la defensa.”

**Donde:** `jenkins/casc/jenkins.yaml` · `Jenkinsfile` · `Jenkinsfile.demo`.

### 6.3 Staging / Production

**Decir (corto):**

> “Staging y production academicas: Compose local para tooling, y en la nube frontend en Vercel y API/Keycloak en Render (`render.yaml`). Podemos demostrar la app sin Docker en la PC, y el stack local para Grafana, Jenkins y Sonar.”

**URLs si las muestras:** staging Vercel · prod Vercel · `cub-api.onrender.com/actuator/health`.

---

## 7. Testing (3–4 min) — 20%

**Abrir:** dibujar o mostrar la piramide (guia §5) + carpeta `docs/qa-evidence/` + un spec E2E en el IDE.

**Decir:**

> “La piramide es completa. Abajo: unitarios e integracion con Testcontainers, incluyendo Keycloak real en contenedor. Luego contrato API con Postman y Schemathesis. Arriba: E2E Playwright — login, CRUD, stock, permisos, admin users, a11y y visual. Ademas auth smoke, performance k6/JMeter y smoke de observabilidad.  
> No entregamos solo ‘los tests pasan en mi maquina’: las evidencias estan versionadas en `docs/qa-evidence/`.”

**Frase de cierre del bloque:** “Full stack testing: del metodo Java al browser, pasando por seguridad y carga.”

**Si piden un ejemplo concreto:** abrir `tests/e2e/specs/permissions-ui.spec.ts` o `product-crud.spec.ts`.

---

## 8. Cierre (1–2 min)

**Decir:**

> “En resumen: Cub demuestra un inventario operable, con autorizacion fina por permisos, auditoria, observabilidad de metricas, logs, trazas y alertas, calidad con Sonar y JaCoCo al 60%, pipelines en Actions y Jenkins, y una piramide de pruebas con evidencias.  
> No es solo un CRUD: es un ejercicio de calidad, seguridad y DevSecOps de punta a punta. Gracias; quedamos atentos a preguntas.”

---

## Mapa rapido: si preguntan X, ve a Y

| Pregunta tipica | Que abrir / citar | Frase corta |
|-----------------|-------------------|-------------|
| Soft delete | `ProductController` + `Product.markInactive` | “INACTIVE; no borramos filas” |
| Permisos | `Permission.java` + converter | “Authorities `recurso:accion`, no solo rol” |
| 401 vs 403 | `auth-smoke.ps1` o demo viewer | “Sin token 401; sin permiso 403” |
| PKCE | `frontend/lib/auth.ts` | “Code + PKCE; sin secret en browser” |
| Envers | `/audit` + `@Audited` | “Revisiones en `*_AUD`” |
| Top sold | `ReportService` | “OUT 30 dias como proxy de ventas” |
| ≥4 dashboards | Grafana Home + lista JSON | “Home, API, Business, Security, Infra” |
| Alertas | Alertmanager + `CubStackHeartbeat` | “Heartbeat + reglas de falla” |
| Cobertura 60% | `pom.xml` jacoco ratio | “Gate que falla el build” |
| Jenkins vs Actions | ambas UIs | “Actions en nube; Jenkins historial local” |
| Evidencias | `docs/qa-evidence/` | “Reportes y capturas versionados” |
| Fuera de alcance | guia §14 | “Sin billing/compras/multi-tenant” |

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

Si te comes el tiempo: **salta Swagger detallado** y **acorta Testing** a piramide + una evidencia; no saltes Seguridad ni Observabilidad (pesan en rubrica y se ven bien en vivo).

---

## Variante corta (15 min)

1. Pitch + C4 (1 min).  
2. Admin: producto + soft delete + stock (3).  
3. Viewer 403 + citar `Permission` (2).  
4. Grafana Home + Alertmanager (3).  
5. Sonar gate + `0.60` (1).  
6. Actions + Jenkins history (2).  
7. Piramide + `qa-evidence` (2).  
8. Cierre (1).

---

## Notas de oratoria

- Habla en **presente** y senala la pantalla: “aqui”, “este panel”, “esta anotacion”.  
- No leas rutas largas: di el **nombre del archivo** y abrelo.  
- Si algo falla: ten plan B cloud (Vercel) para funcionalidad y local solo para Grafana/Jenkins/Sonar.  
- Tras cada bloque, una frase de valor: *por que importa para un inventario real*.
