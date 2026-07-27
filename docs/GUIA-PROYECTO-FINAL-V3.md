# Guia general — Proyecto Final V3 (Cub Inventory QAS)

> Documento unico de estudio y presentacion.  
> Diagramas C4: [`architecture.md`](./architecture.md).  
> Evidencias QA (reportes/capturas): carpeta [`qa-evidence/`](./qa-evidence/).  
> Rubro: Sistema de Gestion de Inventarios con Full Stack Testing, Observabilidad y DevSecOps.

---

## 1. Que es Cub

Cub es un monorepo academico/profesional que demuestra:

1. **Funcionalidad** de inventario (productos, stock, dashboard, auditoria).  
2. **Seguridad** granular con Keycloak (roles, permisos, scopes, policies, JWT, PKCE).  
3. **Full Stack Testing** (unit, integration Testcontainers/Keycloak, API, E2E, security, performance, data, exploratory).  
4. **Observabilidad** (Prometheus, Loki, Tempo, Alloy, Grafana, Alertmanager + OpenTelemetry).  
5. **CI/CD DevSecOps** (GitHub Actions + Jenkins + SonarQube).

Stack: Spring Boot 3.4 / Java 21, Next.js, PostgreSQL, Flyway, Hibernate Envers, Keycloak 26, Docker Compose.

---

## 2. Como levantarlo y links de demo

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
.\scripts\warmup-demo-traffic.ps1
```

| Que | URL | Credenciales |
|-----|-----|--------------|
| App Cub | http://localhost:3000 | `admin/admin123` (tambien viewer/warehouse/clerk) |
| Swagger | http://localhost:8080/swagger-ui.html | Bearer JWT |
| Keycloak Admin | http://localhost:8081 | `admin` / `admin` |
| Grafana Home | http://localhost:3030/d/cub-home | `admin` / `admin` |
| Prometheus | http://localhost:9090/targets | — |
| Alertmanager | http://localhost:9093 | debe mostrar `CubStackHeartbeat` |
| SonarQube | http://localhost:9001 | `admin` / `admin` (primer login) |
| Jenkins | http://localhost:8082 | staging opcional |

Usuarios Cub (realm):

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | admin123 | todo |
| warehouse | warehouse123 | productos+stock+reportes |
| clerk | clerk123 | stock operativo |
| viewer | viewer123 | solo lectura |

---

## 3. Que presentamos (mapa del PDF)

| Area PDF | % | Que demuestras | Donde |
|----------|--:|----------------|-------|
| Funcionalidad | 15 | CRUD, stock, dashboard, soft delete, Swagger | UI + API |
| Testing | 20 | Piramide completa + evidencias | `tests/`, `backend/src/test`, `docs/qa-evidence/` |
| Seguridad | 10 | Keycloak, scopes, policies, 401/403, users | realm + `@PreAuthorize` |
| Observabilidad | 15 | 4+ dashboards, logs, trazas, alertas | Grafana stack |
| CI/CD | 15 | Actions + Jenkins + deploy staging post-tests | `.github/workflows`, `Jenkinsfile` |
| Calidad | 10 | Sonar gate + JaCoCo 60% | Sonar + `pom.xml` |
| Documentacion | 10 | Este doc + C4 + evidencias | `docs/` |
| Presentacion | 5 | Demo viva | esta guia |

---

## 4. Arquitectura (resumen; detalle en C4)

Ver **Level 1 / 2 / 3** en [`architecture.md`](./architecture.md).

Flujo:

```text
Usuario → Next.js (PKCE) → Keycloak (JWT scopes/roles)
       → Spring API (@PreAuthorize) → PostgreSQL (Flyway + Envers)
       → OTEL → Alloy → Prometheus / Loki / Tempo → Grafana / Alertmanager
```

---

## 5. Por modulo: para que, donde, como, porque

### 5.1 Productos

- **Para que:** gestionar catalogo (SKU, precio, stock min, estado).  
- **Donde:** `backend/.../product/`, `frontend/app/(app)/products/`.  
- **Como:** CRUD API `/api/v1/products`; DELETE = soft delete `INACTIVE`.  
- **Porque:** soft delete preserva historial de stock y auditoria Envers (trazabilidad empresarial).

### 5.2 Stock

- **Para que:** IN/OUT/ADJUSTMENT e historial.  
- **Donde:** `backend/.../stock/`, UI `stock/movements`.  
- **Como:** `POST /api/v1/stock/movements`; OUT rechaza negativo.  
- **Porque:** control operativo de inventario con usuario y correlationId.

### 5.3 Dashboard / reportes

- **Para que:** KPIs, criticos, top sold (OUT 30d), recientes, metricas sistema.  
- **Donde:** `ReportService`, `ObservabilityController`, `dashboard/page.tsx`.  
- **Como:** `/api/v1/reports/dashboard`, `/api/v1/observability/system-metrics`.  
- **Porque:** el PDF exige indicadores operacionales y metricas del sistema en UI.

### 5.4 Auditoria Envers

- **Para que:** historial de cambios de entidades.  
- **Donde:** `backend/.../audit/`, tablas `*_AUD`.  
- **Como:** UI `/audit` con permiso `audit:view`.  
- **Porque:** requisito PDF de auditoria Hibernate Envers o equivalente.

### 5.5 Seguridad Keycloak

- **Para que:** AuthN/AuthZ empresarial (no solo rol admin/empleado).  
- **Donde:** `keycloak/realm-export.json`, `KeycloakJwtAuthoritiesConverter`, `Permission.java`, `@PreAuthorize`, `frontend/lib/auth.ts`.  
- **Como:** OIDC PKCE → JWT con roles + scopes → authorities `product:view` / `SCOPE_*`.  
- **Porque:** PDF exige Roles, Permisos, Scopes y Policies.

### 5.6 Gestion de usuarios

- **Para que:** `user:manage` real (listar/activar/roles).  
- **Donde:** `UserController` / `UserService`, UI `/admin/users`.  
- **Como:** Keycloak Admin API con cliente `inventory-admin-api`.  
- **Porque:** el permiso no puede ser solo una matriz read-only.

### 5.7 Observabilidad

- **Para que:** metricas, logs (user/endpoint), trazas, alertas, 4 dashboards.  
- **Donde:** `observability/`, filters MDC, `BusinessMetricsRegistrar`, Grafana JSON.  
- **Como:** scrapes Prometheus; Alloy → Loki/Tempo; Home `cub-home`.  
- **Porque:** bloque obligatorio del PDF.

### 5.8 Testing

- **Para que:** calidad continua en todos los niveles.  
- **Donde:** `backend/src/test`, `tests/api`, `tests/e2e`, `tests/performance`, scripts ZAP/Schemathesis.  
- **Como:** `.\scripts\run-all-tests.ps1` + workflows CI.  
- **Porque:** 20% de la evaluacion y madurez QAS.

### 5.9 CI/CD y Sonar

- **Para que:** build, tests, scans, deploy, quality gate.  
- **Donde:** `.github/workflows/*`, `Jenkinsfile`, Sonar en staging compose (Postgres).  
- **Como:** push/PR dispara Actions; staging prueba el sistema ya desplegado.  
- **Porque:** DevSecOps + calidad de codigo del PDF.

---

## 6. Orden de presentacion (25–30 min)

1. Apertura + C4 L1/L2 (`architecture.md`).  
2. Demo UI admin (productos, stock, dashboard).  
3. Viewer 403 + JWT scopes + `/admin/users`.  
4. Swagger.  
5. Grafana Home → Business → Security → Infra; Alertmanager heartbeat.  
6. Sonar quality gate.  
7. Mencionar piramide de tests + `qa-evidence/`.  
8. Cierre: calidad, seguridad y trazabilidad, no solo CRUD.

---

## 7. Comandos utiles

```powershell
# Bateria local
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1

# Calentar Grafana
.\scripts\warmup-demo-traffic.ps1

# Humo observabilidad
.\tests\observability\smoke.ps1

# Auth 401/403
.\tests\security\auth-smoke.ps1
```

---

## 8. Decisiones clave (ADRs cortos)

| Decision | Motivo |
|----------|--------|
| Soft delete | Trazabilidad stock/Envers |
| Authorities por permiso | PDF: no validar solo por nombre de rol |
| Scopes en JWT + policies en Keycloak | Modelo ERP; Spring enforcea |
| Top sold = OUT 30d | Proxy profesional sin modulo de ventas |
| Prod = Compose local | Demostracion academica, no cloud |
| Sonar + Postgres | Evitar H2 embebido en demos |

---

## 9. Que no es el alcance

Billing, compras, multi-tenant, produccion cloud endurecida. Produccion del curso = `docker-compose.prod.yml` local integrado.
