# Guion de presentación — mañana (orden del profesor)

**Proyecto:** Cub — Inventario QAS · PUCMM  
**Rama:** [`presentacion`](https://github.com/carolinabencosme/quality_assurance/tree/presentacion)  
**Repo:** https://github.com/carolinabencosme/quality_assurance

Este documento sigue **exactamente el orden de evaluación** que te dieron. Para cada bloque hay: qué decir en palabras llanas, qué abrir en pantalla y enlace al código.

---

## Antes de empezar (5 minutos antes)

### Levantar el stack

```powershell
cd C:\Users\Josvier\Desktop\quality_assurance
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

Espera ~2 minutos y verifica:

```powershell
curl.exe -s -o NUL -w "app:%{http_code} api:%{http_code} kc:%{http_code} grafana:%{http_code}" `
  http://localhost:3000/ `
  http://localhost:8080/actuator/health `
  http://localhost:8081/realms/inventory-realm `
  http://localhost:3030/api/health
```

Debe salir `200` en los cuatro.

### Credenciales que usarás todo el tiempo

| Rol | Usuario | Contraseña | Para qué |
|-----|---------|------------|----------|
| Solo lectura | `viewer` | `viewer123` | Ver productos, dashboard |
| Operador almacén | `warehouse` | `warehouse123` | Crear/editar productos |
| Administrador | `admin` | `admin123` | Auditoría, todo |
| Keycloak Admin | `admin` | `admin` | Consola IdP (puerto 8081) |
| Grafana | `admin` | `admin` | Dashboards (puerto 3030) |

### Pestañas abiertas (recomendado)

1. http://localhost:3000 — app Cub  
2. http://localhost:8080/swagger-ui.html — API  
3. http://localhost:8081 — Keycloak  
4. http://localhost:3030 — Grafana  
5. GitHub → repo → Actions  
6. IDE con el proyecto abierto  

---

## 1. Seguridad

**Qué decir:** *"La seguridad está centralizada en Keycloak. El usuario inicia sesión con OAuth2; el frontend obtiene un JWT y cada llamada al API lo valida. No guardamos contraseñas en nuestra app."*

### 1.1 Keycloak funcionando

- **Demo:** abre http://localhost:8081 → realm `inventory-realm` visible.
- **Código:** [`docker-compose.dev.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/docker-compose.dev.yml) (servicio `keycloak`).
- **Realm importado:** [`keycloak/realm-export.json`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/keycloak/realm-export.json).

### 1.2 Login OAuth2 / JWT

- **Demo:** http://localhost:3000 → botón **Iniciar sesión con Keycloak** → login tema oscuro Cub → redirige al dashboard.
- **Flujo en código:**
  - [`frontend/lib/auth.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/auth.ts) — `startLogin()`, intercambio de tokens.
  - [`frontend/lib/pkce.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/pkce.ts) — PKCE (cliente público seguro).
  - [`frontend/components/AuthCallbackClient.tsx`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/components/AuthCallbackClient.tsx) — callback `/auth/callback`.
  - [`backend/.../SecurityConfig.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/security/SecurityConfig.java) — Resource Server JWT.

### 1.3 Al menos 2 usuarios

**Tenemos 4:** `viewer`, `warehouse`, `admin`, `clerk`.

- **Código:** [`realm-export.json` — sección users](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/keycloak/realm-export.json) (busca `"username"`).

### 1.4 Al menos 2 permisos

**Tenemos 6 client roles:** `product:view`, `product:manage`, `stock:view`, `stock:manage`, `report:view`, `audit:view`.

- **Código backend:** [`Permission.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/security/Permission.java).
- **Código frontend (espejo UI):** [`permissions.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/permissions.ts).

### 1.5 Endpoint protegido con permisos

- **Demo en vivo:**
  1. Sin token: `curl http://localhost:8080/api/v1/products` → **401**.
  2. Login `viewer` → puede listar productos (`product:view`).
  3. `viewer` intenta crear producto → **403** (no tiene `product:manage`).
- **Código:** [`ProductController.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/controller/ProductController.java) — líneas `@PreAuthorize` en GET vs POST.
- **Test automático:** [`ApiSecurityMvcTest.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/security/ApiSecurityMvcTest.java).

**Frase de cierre bloque 1:** *"El JWT viaja en el header Authorization; Spring convierte los roles de Keycloak en authorities y `@PreAuthorize` decide si deja pasar o devuelve 403."*

### 1.6 Scopes, policies y gestion real de usuarios

- **Scopes OAuth2:** el token puede incluir `product:view`, `stock:manage`, `report:view`, `user:manage` y `audit:view`; el backend tambien expone aliases `SCOPE_*`.
- **Policies Keycloak:** `inventory-api` tiene Authorization Services con recursos Products, Stock, Reports, Users y Audit. Las policies por rol quedan exportadas en `keycloak/realm-export.json`.
- **Enforcement:** Spring Resource Server valida JWT y aplica `@PreAuthorize`; Keycloak documenta y emite el modelo de scopes/policies.
- **Gestion real:** `/admin/users` llama `/api/v1/users`, protegido por `user:manage`, y el backend usa `inventory-admin-api` con client credentials contra Keycloak Admin API.
- **Demo rapida:** login `admin` -> Usuarios -> cambiar rol o estado; login `viewer` -> no ve Usuarios ni Permisos.

---

## 2. Base de datos

**Qué decir:** *"PostgreSQL corre en Docker. El esquema no se crea a mano: Flyway aplica migraciones versionadas cada vez que arranca el backend."*

### 2.1 Migraciones Flyway

- **Código:** [`backend/src/main/resources/db/migration/`](https://github.com/carolinabencosme/quality_assurance/tree/presentacion/backend/src/main/resources/db/migration) — `V1` a `V7`.
- **Config:** [`application.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/resources/application.yml) (`flyway.enabled: true`).

### 2.2 Mínimo 4 tablas relacionadas

| Tabla | Migración | Relación |
|-------|-----------|----------|
| `categories` | V1 | Padre de productos |
| `products` | V2 | FK → `categories` |
| `stock_movements` | V3 | FK → `products` |
| `users_profile` | V4 | Perfil local opcional |
| `revinfo` + `products_aud` | V5 | Auditoría Envers |

- **Demo SQL (opcional):**

```powershell
docker exec inventory-postgres-dev psql -U inventory_user -d inventory -c "\dt"
```

### 2.3 BD en Docker

- **Código:** [`docker-compose.dev.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/docker-compose.dev.yml) — servicio `postgres`, volumen persistente, healthcheck.

**Frase de cierre:** *"Si borro el contenedor de Postgres pero conservo el volumen, los datos siguen; si es entorno nuevo, Flyway crea todo desde cero."*

---

## 3. Funcionalidad

**Qué decir:** *"El dominio principal es Producto: listar, crear, editar e inactivar (soft delete), con validaciones en el API y en el formulario."*

### 3.1 CRUD Producto completo

| Acción | UI | API |
|--------|----|-----|
| Listar | [`products/page.tsx`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/app/(app)/products/page.tsx) | `GET /api/v1/products` |
| Crear | [`products/new/page.tsx`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/app/(app)/products/new/page.tsx) | `POST /api/v1/products` |
| Editar | [`products/[id]/edit/page.tsx`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/app/(app)/products/%5Bid%5D/edit/page.tsx) | `PUT /api/v1/products/{id}` |
| Inactivar | Botón + modal en edit | `DELETE /api/v1/products/{id}` |

- **Lógica negocio:** [`ProductService.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/service/ProductService.java).

### 3.2 Demo en vivo (2 minutos)

1. Login `warehouse` / `warehouse123`.
2. **Productos** → **Nuevo producto** → llenar y crear.
3. Editar nombre → guardar.
4. **Inactivar** → confirmar en el modal → vuelve al listado.

### 3.3 Validaciones de negocio

- **Bean Validation:** [`ProductRequest.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/dto/ProductRequest.java) — `@NotBlank`, `@Positive`, etc.
- **SKU único:** `ProductService` lanza conflicto → **409**.
- **Demo rápida en Swagger:** POST producto sin nombre → **400** `VALIDATION_ERROR`.

**Frase de cierre:** *"La UI valida para ayudar al usuario, pero la regla real está en el backend: aunque alguien llame el API directo, las validaciones se cumplen."*

---

## 4. Testing (unitarios + cobertura)

**Qué decir:** *"Tenemos pirámide de pruebas: unitarias con Mockito, integración con Testcontainers, Newman para API y Playwright para UI."*

### 4.1 Mínimo 15 pruebas unitarias

**Cumplido:** el backend tiene **35+ tests unitarios** (services, mappers, security, handlers).

Ejemplos para mostrar en IDE:

- [`ProductServiceTest.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/product/service/ProductServiceTest.java)
- [`StockServiceTest.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/stock/service/StockServiceTest.java)
- [`GlobalExceptionHandlerTest.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/common/exception/GlobalExceptionHandlerTest.java)

### 4.2 Cobertura mínima 60 %

- **Config:** [`pom.xml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/pom.xml) — `jacoco.line.minimum.covered.ratio` = **0.60**.
- **Reporte HTML:** `backend/target/site/jacoco/index.html` (se genera con `mvn verify`).

### 4.3 Evidencia de ejecución exitosa

```powershell
cd C:\Users\Josvier\Desktop\quality_assurance
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
```

O solo backend:

```powershell
cd backend
.\mvnw.cmd verify
```

**Qué mostrar:** consola con `BUILD SUCCESS` y `All coverage checks have been met`.

**Nota Windows:** si ves tests *skipped* en integración, ejecuta con la variable de Testcontainers arriba; Docker Desktop debe estar abierto.

---

## 5. GitHub

**Qué decir:** *"Trabajamos en monorepo público, con README, historial de commits y Pull Requests para revisión incremental."*

### 5.1 Repositorio público

- https://github.com/carolinabencosme/quality_assurance

### 5.2 README inicial

- [`README.md`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/README.md) — arranque rápido, URLs, usuarios, estructura.

### 5.3 Al menos 15 commits

- **Demo:** GitHub → **Commits** (el repo tiene **90+ commits**).

### 5.4 Al menos 2 Pull Requests

- **Demo:** GitHub → **Pull requests** → mostrar PRs mergeados a `main` / `develop`.

**Frase:** *"Cada avance entró por rama feature y PR; así lo aprobado en un avance se mantiene y no se rompe en el siguiente."*

---

## 6. Auditoría

**Qué decir:** *"Usamos Hibernate Envers: cada cambio en Product queda en tablas de auditoría con revisión y timestamp."*

### 6.1 Envers funcionando

- **Entidad:** [`Product.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/entity/Product.java) — `@Audited`.
- **Tablas:** [`V5__create_envers_audit_tables.sql`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/resources/db/migration/V5__create_envers_audit_tables.sql).
- **API lectura auditoría:** [`AuditController.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/audit/controller/AuditController.java) — requiere `audit:view`.

### 6.2 Evidencia en base de datos

**Opción A — UI (más fácil en presentación):**

1. Login `admin` / `admin123`.
2. Dock inferior → **Auditoría**.
3. Ver historial de cambios de productos.

**Opción B — SQL directo:**

```powershell
docker exec inventory-postgres-dev psql -U inventory_user -d inventory -c "SELECT * FROM products_aud LIMIT 5;"
docker exec inventory-postgres-dev psql -U inventory_user -d inventory -c "SELECT * FROM revinfo ORDER BY rev DESC LIMIT 5;"
```

**Frase:** *"Antes de editar un producto en vivo, anoto el id; después muestro la nueva fila en `products_aud` o en la pantalla de Auditoría."*

---

## 7. API REST

**Qué decir:** *"Documentamos con OpenAPI 3; Swagger UI permite probar endpoints con el JWT de Keycloak."*

### 7.1 Swagger funcional

- **Demo:** http://localhost:8080/swagger-ui.html
- **Anotaciones:** [`ProductController.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/controller/ProductController.java) — `@Operation`, `@ApiResponses`, `@Tag`.

### 7.2 Todos los endpoints documentados

Controllers con Swagger:

- [`ProductController`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/controller/ProductController.java)
- [`CategoryController`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/controller/CategoryController.java)
- [`StockController`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/stock/controller/StockController.java)
- [`ReportController`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/report/controller/ReportController.java)
- [`AuditController`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/audit/controller/AuditController.java)

**Demo Authorize:** en Swagger → **Authorize** → pegar `access_token` de Keycloak (o usar Newman que ya obtiene token).

---

## 8. Integration Testing

**Qué decir:** *"Las pruebas de integración levantan PostgreSQL real con Testcontainers; no es una BD en memoria inventada."*

### 8.1 Testcontainers configurado

- **Propiedades Windows:** [`.testcontainers.properties`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/resources/.testcontainers.properties).

### 8.2 PostgreSQL desde Testcontainers

Ejemplo en [`ProductApiIntegrationTest.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/product/api/ProductApiIntegrationTest.java):

```java
@Container
@ServiceConnection
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
```

### 8.3 Mínimo 5 pruebas de integración

**Tenemos 5 clases** (32+ métodos `@Test`):

| Clase | Escenarios |
|-------|------------|
| [`ProductApiIntegrationTest`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/product/api/ProductApiIntegrationTest.java) | CRUD, paginación, filtros |
| [`StockApiIntegrationTest`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/stock/api/StockApiIntegrationTest.java) | Movimientos stock |
| [`StockGetApiIntegrationTest`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/stock/api/StockGetApiIntegrationTest.java) | Consultas stock |
| [`ResourceServerSecurityIntegrationTest`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/security/ResourceServerSecurityIntegrationTest.java) | 401/403 JWT |
| [`ReportApiIntegrationTest`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/test/java/com/company/inventory/report/api/ReportApiIntegrationTest.java) | Reportes |

**Demo terminal:**

```powershell
cd backend
.\mvnw.cmd test -Dtest=ProductApiIntegrationTest
```

---

## 9. API Testing (Newman / Postman)

**Qué decir:** *"Newman ejecuta la colección Postman contra el stack real: token Keycloak, CRUD, errores 400/401/403/409."*

### 9.1 Mínimo 10 escenarios

**Tenemos 14 escenarios** en [`inventory-qas.postman_collection.json`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/api/inventory-qas.postman_collection.json):

01 Token warehouse · 02 Token viewer · 03 Health · 04 Sin JWT → 401 · 05 Categorías · 06 Listar · 07 Detalle · 08 Inválido → 400 · 09 Crear → 201 · 10 SKU duplicado → 409 · 11 Update · 12 Delete · 13 Viewer → 403 · 14 Demo 404

### 9.2 Validación de errores

Mostrar escenarios **04** (401), **08** (400), **10** (409), **14** (404).

### 9.3 Validación de permisos

Mostrar escenario **13** — `viewer` intenta POST producto → **403**.

**Ejecutar en vivo:**

```powershell
cd C:\Users\Josvier\Desktop\quality_assurance\tests\api
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=$sku"
```

Esperado: **14 requests, 0 failed**.

---

## 10. Docker

**Qué decir:** *"Todo el entorno de demo corre con Docker Compose: app, API, BD y Keycloak en contenedores con healthchecks y red compartida."*

### 10.1 Aplicación dockerizada

- Backend: [`backend/Dockerfile`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/Dockerfile) — multi-stage Maven + JRE 21.
- Frontend: [`frontend/Dockerfile`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/Dockerfile) — Node 22.

### 10.2 Base de datos dockerizada

- Servicio `postgres` en [`docker-compose.dev.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/docker-compose.dev.yml).

### 10.3 Keycloak dockerizado

- Mismo archivo, servicio `keycloak`, imagen Quay Keycloak 26.

**Demo:**

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml ps
```

Muestra todos los contenedores `healthy` / `running`.

---

## 11. GitHub Actions

**Qué decir:** *"En cada push o PR a main/develop, GitHub Actions compila, ejecuta tests y sube el reporte JaCoCo."*

### 11.1 Build automático

- [`ci.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/.github/workflows/ci.yml) — job `frontend`: `npm ci` + `npm run build`.

### 11.2 Unit Tests automáticos

- Mismo workflow, job `backend`: `mvn -B verify` (unit + JaCoCo).

### 11.3 Integration Tests automáticos

- Incluidos en `mvn verify` (Testcontainers en el runner de Ubuntu).
- Workflow adicional API: [`api-postman.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/.github/workflows/api-postman.yml) — Docker + Newman.

**Demo:** GitHub → **Actions** → workflow **CI** → último run verde.

---

## 12. Jenkins

**Qué decir:** *"Jenkins es el pipeline complementario para staging: checkout, mvn verify, build frontend y opcionalmente SonarQube y deploy."*

- **Pipeline:** [`Jenkinsfile`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/Jenkinsfile)
- **Stages:** Checkout → Backend verify → Frontend build → SonarQube (opcional) → Deploy staging (parámetro).

**Si tienes Jenkins levantado:**

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d jenkins
```

→ http://localhost:8082

**Si no hay tiempo:** muestra el `Jenkinsfile` en IDE y explica que replica lo de GHA en entorno on-prem.

---

## 13. Observabilidad

**Qué decir:** *"El backend expone métricas Prometheus; Grafana tiene un dashboard de la API; los logs van a Loki y las trazas a Tempo."*

### 13.1 Grafana configurado

- **Compose:** [`docker-compose.observability.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/docker-compose.observability.yml) — Grafana puerto **3030**.

### 13.2 Dashboard operativo

- **JSON:** [`inventory-api.json`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/observability/grafana/provisioning/dashboards/json/inventory-api.json)
- **Demo:** http://localhost:3030 → login `admin/admin` → dashboard **Inventory API** (requests/s, latencia p95).

**Generar tráfico antes:** refresca el dashboard en Cub o llama el API unas veces.

**Smoke rápido:**

```powershell
.\tests\observability\smoke.ps1
```

---

## 14. Playwright

**Qué decir:** *"Playwright automatiza el navegador real: login OIDC contra Keycloak y CRUD de producto como usuario warehouse."*

### 14.1 Login automatizado

- [`tests/e2e/helpers/keycloak-login.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/e2e/helpers/keycloak-login.ts) — `loginViaKeycloak()`, `resetBrowserSession()`.
- [`tests/e2e/specs/login-dashboard.spec.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/e2e/specs/login-dashboard.spec.ts).

### 14.2 CRUD Producto automatizado

- [`tests/e2e/specs/product-crud.spec.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/e2e/specs/product-crud.spec.ts) — crear → editar → inactivar (serial).

**Ejecutar en vivo (opcional):**

```powershell
cd C:\Users\Josvier\Desktop\quality_assurance\tests\e2e
$env:E2E_BASE_URL = "http://localhost:3000"
npm test
```

Esperado: **9 passed**.

**Reporte HTML:** `docs/qa-evidence/playwright-report` (se genera al correr tests).

---

## Cierre de la presentación (30 segundos)

> *"Cub cumple los avances incrementales: seguridad con Keycloak y JWT, base versionada con Flyway, CRUD de productos con validaciones, auditoría Envers, pruebas en todos los niveles, CI en GitHub Actions, pipeline Jenkins, observabilidad en Grafana y E2E con Playwright. Todo está en el repositorio público, dockerizado y documentado."*

---

## Checklist rápido — ¿cumplo cada requisito?

| Requisito | ¿Cumple? | Evidencia en 1 línea |
|-----------|----------|----------------------|
| Keycloak | ✅ | localhost:8081 + realm export |
| OAuth2/JWT | ✅ | Login Cub + Resource Server |
| ≥2 usuarios | ✅ | viewer, warehouse, admin, clerk |
| ≥2 permisos | ✅ | 6 client roles |
| Endpoint con permiso | ✅ | POST producto → 403 viewer |
| Flyway | ✅ | V1–V7 |
| ≥4 tablas | ✅ | categories, products, stock_movements, … |
| BD Docker | ✅ | postgres en compose |
| CRUD producto | ✅ | UI + API |
| Validaciones | ✅ | 400, 409 en API |
| ≥15 unit tests | ✅ | 35+ en backend |
| Cobertura 60% | ✅ | JaCoCo en pom.xml |
| Evidencia tests | ✅ | run-all-tests.ps1 |
| Repo público | ✅ | GitHub |
| README | ✅ | README.md |
| ≥15 commits | ✅ | 90+ |
| ≥2 PRs | ✅ | GitHub PRs |
| Envers | ✅ | products_aud |
| Swagger | ✅ | :8080/swagger-ui.html |
| Testcontainers | ✅ | ProductApiIntegrationTest |
| ≥5 integration | ✅ | 5 clases |
| ≥10 API scenarios | ✅ | 14 Newman |
| Docker app/db/kc | ✅ | compose |
| GHA build/tests | ✅ | ci.yml |
| Jenkins | ✅ | Jenkinsfile |
| Grafana | ✅ | :3030 |
| Playwright login+CRUD | ✅ | 9 tests E2E |

---

## Si algo falla en vivo

| Problema | Solución rápida |
|----------|-----------------|
| Puerto ocupado | `docker compose ... down` y volver a `up -d` |
| Keycloak lento | Esperar 1–2 min; revisar `docker compose ps` |
| 401 en API | Token expirado → logout y login de nuevo |
| Testcontainers skipped | `$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE="//./pipe/docker_engine"` |
| Grafana vacío | Generar tráfico en la app primero |
| Tempo smoke FAIL | Normal al arrancar; Prometheus y Grafana bastan para demo |

---

## Documentos relacionados

- [Preguntas defensa completa (58+)](preguntas-defensa-completa.md) — respuestas técnicas profundas
- [README del proyecto](../../README.md) — arranque rápido

*Preparado para defensa oral — rama `presentacion`.*
