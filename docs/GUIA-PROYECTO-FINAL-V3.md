# Guia de estudio — Proyecto Final V3 (Cub Inventory QAS)

> Documento unico para **leer, estudiar y explicar** en la defensa.  
> Diagramas C4: [`architecture.md`](./architecture.md).  
> Evidencias QA: [`qa-evidence/`](./qa-evidence/).  
> Guion hablado: [`GUION-PRESENTACION.md`](./GUION-PRESENTACION.md).  
> Cloud operativo: [`CLOUD-STAGING-PROD.md`](./CLOUD-STAGING-PROD.md).

**Como usar esta guia:** cada bloque del PDF tiene rutas de codigo + demo.  
Las columnas **Como / Por que / Para que** son frases listas para la oral (un poco mas largas que un titulo, sin ser un guion completo).

| Columna | Significa en la defensa |
|---------|-------------------------|
| **Como** | Que hicimos / como funciona en el sistema |
| **Por que** | Motivo tecnico o de rubrica (por que esa decision) |
| **Para que** | Que demuestras al evaluador / valor del requisito |

---

## 1. Que es Cub (elevator pitch)

Cub es un monorepo de inventario empresarial de punta a punta:

1. **Funcionalidad** — productos, stock, dashboard, soft delete, auditoria Envers, Swagger.  
2. **Seguridad** — Keycloak (roles + permisos + scopes + policies), JWT, PKCE, 401/403, users.  
3. **Full Stack Testing** — piramide + evidencias versionadas.  
4. **Observabilidad** — Prometheus, Loki, Tempo, Alloy, Grafana (≥4 dashboards), Alertmanager.  
5. **CI/CD DevSecOps** — GitHub Actions + Jenkins + SonarQube (JaCoCo ≥60%).

**Stack:** Spring Boot 3.4 / Java 21 · Next.js · PostgreSQL · Flyway · Envers · Keycloak 26 · Docker Compose · Vercel · Render.

| Como | Por que | Para que |
|------|---------|----------|
| Un solo monorepo con app, tests, observability, pipelines y docs | El PDF evalúa el sistema completo, no pantallas sueltas | En la oral apuntas a codigo + evidencia sin cambiar de repo |
| Capas claras: UI → Keycloak → API → Postgres → telemetria | Arquitectura tipo empresa, explicable con C4 | Defender que no es “solo un CRUD academico” |

---

## 2. Links de demo (nube primero; local opcional)

### 2.1 Publico en la nube (sin Docker en la PC)

Detalle: [`CLOUD-STAGING-PROD.md`](./CLOUD-STAGING-PROD.md).

| Que | URL | Credenciales | Como | Por que | Para que |
|-----|-----|--------------|------|---------|----------|
| **Staging (Vercel)** | https://cub-inventory-qas.vercel.app | `admin` / `admin123` | Abres la UI en HTTPS y login OIDC contra Keycloak cloud | Es el ambiente pre-prod publico | Demo funcional sin encender Docker en la laptop |
| **Production (Vercel)** | https://cub-inventory-qas-prod.vercel.app | igual | Mismo frontend, proyecto Vercel separado | Separar staging vs prod academica | Mostrar dos entornos desplegados y nombrados |
| API cloud | https://cub-api.onrender.com/actuator/health | — | GET health; debe decir UP (cold start ~1 min en free) | Backend Spring en Render | Probar que la API publica responde |
| Swagger cloud | https://cub-api.onrender.com/swagger-ui.html | Bearer JWT | Authorize con token y llamar un endpoint | Contrato OpenAPI en la nube | Explicar la API sin Postman local |
| Keycloak cloud | https://cub-keycloak.onrender.com | `admin` / `admin` | Admin Console + realm `inventory-realm` | IdP real fuera de tu PC | Mostrar users/roles/clients OIDC |

**Si login da Not Found:** el Blueprint no esta Live o falta el realm → Apply `render.yaml` (rama `presentacion`) y `.\scripts\import-keycloak-realm-cloud.ps1`.

| Como (cloud) | Por que | Para que |
|--------------|---------|----------|
| Vercel hospeda Next.js; Render hospeda API + Keycloak + Postgres (`render.yaml`) | Vercel no corre Spring/Keycloak; hace falta un PaaS de contenedores | Demo publica estable, sin tuneles ni PC encendida |
| Healthcheck de Keycloak en `/`, no en el realm | Si Render exige el realm antes del import, reinicia en loop y el realm nunca carga | Evitar el “Not Found” en el login de Vercel |
| Admin con `KC_BOOTSTRAP_ADMIN_*` + script de import Admin API | Keycloak 26 ya no usa solo `KEYCLOAK_ADMIN_*`; el import puede fallar en free tier | Poder reparar el realm y dejar OIDC funcionando |

### 2.2 Local (observabilidad / Jenkins / Sonar para la oral)

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
.\scripts\warmup-demo-traffic.ps1
.\scripts\seed-demo-data.ps1
```

| Que | URL | Credenciales | Como | Por que | Para que |
|-----|-----|--------------|------|---------|----------|
| App Cub | http://localhost:3000 | `admin` / `admin123` (+ viewer/warehouse/clerk) | Login PKCE local contra Keycloak :8081 | Stack completo en Compose | Demo CRUD, stock, roles y 403 |
| Swagger | http://localhost:8080/swagger-ui.html | Bearer JWT | Authorize + probar API | Documentacion viva del backend | Mostrar endpoints protegidos |
| Keycloak Admin | http://localhost:8081 | `admin` / `admin` | Realm `inventory-realm` | Fuente de verdad de identidad | Ver roles, clients, policies |
| Grafana Home | http://localhost:3030/d/cub-home | `admin` / `admin` | Dashboards JSON provisionados | Observabilidad del PDF | ≥4 paneles + drill-down |
| Prometheus | http://localhost:9090/targets | — | Targets UP del API | Scraping de metricas | Probar que el backend exporta metrics |
| Alertmanager | http://localhost:9093 | `CubStackHeartbeat` activo | UI de alertas firing | Prom → Alertmanager cableado | Demostrar alertas no vacias |
| SonarQube | http://localhost:9001 | `admin` / `admin` | Quality Gate del proyecto | Calidad de codigo del PDF | Cobertura + smells en vivo |
| Jenkins | http://localhost:8082 | `admin` / `admin` · job `cub-inventory-qas` | Build History + stages | CI local con historial visible | Pipeline DevSecOps en la oral |

Usuarios del realm:

| Usuario | Password | Que puede hacer | Como | Por que | Para que |
|---------|----------|-----------------|------|---------|----------|
| admin | admin123 | todo (`user:manage` incluido) | Login y navegar todo | Rol con el set completo de permisos | Demo completa + gestion de users |
| warehouse | warehouse123 | productos + stock + reportes | Login y operar almacen | Rol compuesto de negocio | Mostrar permisos por rol, no un solo “admin” |
| clerk | clerk123 | stock operativo | Login y movimientos | Rol de mostrador | Limitar la UI/API a stock |
| viewer | viewer123 | solo lectura | Intentar escribir o abrir admin | Rol read-only | Forzar **403** delante del evaluador |

---

## 3. Mapa del PDF (rubrica) → repo

| Area PDF | % | Que demuestras | Donde | Como | Por que | Para que |
|----------|--:|----------------|-------|------|---------|----------|
| Funcionalidad | 15 | CRUD, stock, dashboard, soft delete, Swagger | §4 | Demo en app + Swagger | Es el dominio del inventario | Probar que el sistema “sirve” al negocio |
| Testing | 20 | Piramide + evidencias | §5 · `tests/` · `qa-evidence/` | Abrir specs y reportes | La calidad no se improvisa en la oral | Cubrir unit → E2E → perf/sec |
| Seguridad | 10 | Keycloak, scopes, policies, 401/403, users | §6 | Login por rol + smoke 401/403 | Un ERP exige autorizacion fina | No validar solo “esta logueado” |
| Observabilidad | 15 | ≥4 dashboards, logs, trazas, alertas | §7 | Grafana + AM + Loki/Tempo | Operar y diagnosticar en produccion | Ver salud tecnica, negocio y auth |
| CI/CD | 15 | Actions + Jenkins + staging | §8 | GitHub Actions + Jenkins UI | Automatizar calidad y entrega | Pipeline repetible y auditable |
| Calidad | 10 | Sonar gate + JaCoCo ≥60% | §9 | Mostrar gate y umbral en `pom.xml` | La deuda tecnica debe ser visible | Un gate que puede romper el build |
| Documentacion | 10 | Guia + C4 + evidencias | `docs/` | Citar rutas y ADRs | Defensa reproducible | Que el evaluador pueda seguir el hilo |
| Presentacion | 5 | Demo viva | §11 + guion | Seguir orden y frases | Comunicar valor, no solo pantallas | Cubrir el rubro completo en tiempo |

---

## 4. Funcionalidad (15%)

### 4.1 Productos (CRUD + soft delete)

| Pieza | Ruta | Como | Por que | Para que |
|-------|------|------|---------|----------|
| API REST | `.../product/controller/ProductController.java` | CRUD HTTP con `@PreAuthorize` por permiso | La API es la puerta del dominio producto | Crear, listar, editar e inactivar con seguridad |
| Soft delete | `.../product/entity/Product.java` → `INACTIVE` | `DELETE` no borra la fila; marca estado | Borrar fisico rompe stock e historial Envers | Conservar trazabilidad empresarial |
| Estado | `.../product/entity/ProductStatus.java` | Enum ACTIVE / INACTIVE | Ciclo de vida explicito | Filtrar catalogo operativo vs baja |
| Categorias | `.../product/controller/CategoryController.java` | CRUD/listado de categorias | El inventario se clasifica | Agrupar y filtrar productos |
| UI | `frontend/app/(app)/products/` | Pantallas Next.js | El usuario no usa Postman | Operar el catalogo en demo viva |

**Frase oral:** “El DELETE es soft delete a `INACTIVE` para no romper stock ni auditoria; cada endpoint exige `product:view` o `product:manage`, no solo estar autenticado.”

```105:106:backend/src/main/java/com/company/inventory/product/controller/ProductController.java
    @PreAuthorize("hasAuthority('" + Permission.PRODUCT_MANAGE + "') or hasAuthority('SCOPE_" + Permission.PRODUCT_MANAGE + "')")
    @Operation(summary = "Inactivar producto", description = "Soft delete: status INACTIVE")
```

**Demo:** admin → Productos → crear/editar/inactivar → Swagger `/api/v1/products`.

### 4.2 Stock

| Pieza | Ruta | Como | Por que | Para que |
|-------|------|------|---------|----------|
| API | `.../stock/controller/StockController.java` | GET niveles + POST movimientos | Exponer operaciones de inventario | Entradas, salidas y ajustes |
| Reglas | `.../stock/service/` | OUT rechaza stock negativo | Integridad del inventario | Evitar cantidades imposibles |
| UI | `frontend/app/(app)/stock/` | Formulario de movimiento | Es la operacion diaria del almacen | Registrar IN / OUT / ADJUSTMENT en vivo |

**Frase oral:** “`POST /api/v1/stock/movements` con IN/OUT/ADJUSTMENT; el OUT no deja negativo; queda usuario y correlationId para trazabilidad.”

### 4.3 Dashboard / reportes

| Pieza | Ruta | Como | Por que | Para que |
|-------|------|------|---------|----------|
| Reportes API | `.../report/controller/ReportController.java` | `GET /reports/dashboard` | Agregar KPIs en un solo endpoint | Vista gerencial |
| Logica KPIs | `.../report/service/ReportService.java` | Activos/inactivos, criticos, top OUT 30d | Decisiones con datos reales del stock | Dashboard creible sin modulo de ventas |
| Metricas sistema | `.../observability/ObservabilityController.java` | `GET /observability/system-metrics` | La app tambien expone salud | Puente entre producto y ops |
| UI | `frontend/app/(app)/dashboard/page.tsx` | Primera pantalla post-login | Resumen operativo inmediato | Abrir la demo con valor de negocio |

### 4.4 Auditoria Envers

| Pieza | Ruta | Como | Por que | Para que |
|-------|------|------|---------|----------|
| API | `.../audit/controller/AuditController.java` | Historial por entidad | Cumplir trazabilidad del PDF | Quien cambio que y cuando |
| Entidades | `@Audited` + tablas `*_AUD` | Hibernate Envers escribe revisiones | Soft delete no basta para compliance | Evidencia de cambios |
| UI | `frontend/app/(app)/audit/` | Lista legible de eventos | Lectura humana en defensa | Demo de auditoria |
| Permiso | `audit:view` | Solo roles autorizados | Es dato sensible | Blindar el historial |

### 4.5 Swagger / OpenAPI

| Pieza | Donde | Como | Por que | Para que |
|-------|-------|------|---------|----------|
| UI | `/swagger-ui.html` (local o cloud) | Authorize con Bearer JWT | Contrato API vivo | Probar sin cliente custom |
| Anotaciones | `@Operation` en controllers | Descripcion por endpoint | Documentar soft delete y reglas | Claridad cuando preguntan “que hace” |
| Auth | Mismo JWT que la app | Sin token = 401; con token = 200 | Endpoints protegidos de verdad | Transicion 401→200 en la oral |

---

## 5. Testing (20%)

```text
                    E2E Playwright
                 /                  \
           API (Postman/Schemathesis)   Security (auth/ZAP)
          /                                              \
   Integration (Testcontainers/Keycloak)          Performance (k6/JMeter)
                         |
                    Unit (JUnit/Mockito)
```

| Nivel | Donde | Como se corre | Como (oral) | Por que | Para que |
|-------|-------|---------------|-------------|---------|----------|
| Unit + Integration | `backend/src/test/java/...` | `mvn -B verify` | JUnit/Mockito + Testcontainers | Base barata y rapida | Reglas de negocio aisladas y con DB real |
| Keycloak IT | `KeycloakContainerIntegrationTest.java` | mismo verify | Keycloak en contenedor | Auth no mockeada a ciegas | JWT y roles de verdad |
| API Postman | `tests/api/...postman_collection.json` | `api-postman.yml` | Coleccion en CI | Happy-path contractual | Regresion de API |
| Schemathesis | `tests/api/schemathesis/` | `api-schemathesis.yml` | Fuzz desde OpenAPI | Encontrar huecos del contrato | Robustez de inputs |
| E2E | `tests/e2e/specs/*.spec.ts` | Playwright / CI | Flujo en browser | Simula usuario real | Login → CRUD → permisos |
| Auth smoke | `tests/security/auth-smoke.ps1` | script local | 401/403 en 30s | Matriz de seguridad visible | Evidencia viva para la oral |
| Perf | `tests/performance/k6|jmeter` | workflows CI | Carga sintetica | Capacidad bajo estres | No solo “funciona en demo” |
| Obs smoke | `tests/observability/smoke.ps1` | script local | Grafana/Prom/AM vivos | Stack no “solo instalado” | Paneles y alertas operativos |
| Bateria | `scripts/run-all-tests.ps1` | un comando | Orquesta niveles | Ensayar la defensa | Repetibilidad |
| Evidencias | `docs/qa-evidence/` | carpeta versionada | Abrir reportes/capturas | El PDF pide evidencia | Traza de que se ejecuto QA |

### Specs E2E utiles

| Spec | Demuestra | Como | Por que | Para que |
|------|-----------|------|---------|----------|
| `login-dashboard.spec.ts` | login + dashboard | Playwright abre la app | Camino feliz | Probar auth UI |
| `product-crud.spec.ts` | CRUD productos | Crear/editar/inactivar | Nucleo funcional | Regresion del catalogo |
| `stock-movement.spec.ts` | movimientos | IN/OUT en UI | Regla de inventario | Movimientos reales |
| `permissions-ui.spec.ts` | UI por rol | Viewer vs admin | Autorizacion visible | Menus/acciones segun permiso |
| `admin-users.spec.ts` | users admin | UI + Admin API | User management vivo | No es pantalla decorativa |
| `a11y-smoke.spec.ts` | a11y basica | Checks automaticos | Calidad inclusiva | Smoke de accesibilidad |
| `visual-snapshots.spec.ts` | regresion visual | Snapshots | UI no se rompe en silencio | Detectar cambios visuales |

**Frase oral:** “No solo unitarios: IT con Keycloak real, API contractual, E2E, seguridad y performance; evidencias en `docs/qa-evidence/`.”

---

## 6. Seguridad (10%)

```text
Browser (Next.js PKCE)
  → Keycloak (inventory-realm)
  → JWT (roles + resource_access + scope)
  → Spring (JwtDecoder + KeycloakJwtAuthoritiesConverter)
  → @PreAuthorize(hasAuthority('product:view') | SCOPE_...)
```

| Concepto | Ruta | Como | Por que | Para que |
|----------|------|------|---------|----------|
| Permisos | `Permission.java` | Constantes `recurso:accion` | Una sola fuente de verdad | Evitar authorities inventadas |
| JWT → authorities | `KeycloakJwtAuthoritiesConverter.java` | Lee roles de realm/client + scopes | Bridge Keycloak ↔ Spring | Que `@PreAuthorize` entienda el token |
| Roles compuestos | `RealmRolePermissions.java` | Rol de negocio → set de permisos | Roles legibles (admin/warehouse/…) | No mapear permiso a permiso en cada user |
| Filter chain | `SecurityConfig.java` | Resource server JWT + CORS patterns | Blindar la API | 401 sin token; CORS para Vercel |
| Realm | `keycloak/realm-export.json` | Import al arrancar / script cloud | Realm reproducible | Misma identidad en local, CI y nube |
| Frontend PKCE | `frontend/lib/auth.ts` | Authorization Code + PKCE | Login seguro en SPA publica | Sin client secret en el browser |
| Matriz | `SecurityController.java` | Endpoints de inspeccion | Explicar permisos en vivo | Debug/demo de authorities |
| Users | `UserController` + UI `/admin/users` | Keycloak Admin API | Gestion centralizada | Activar/roles sin consola cruda |

```10:17:backend/src/main/java/com/company/inventory/security/Permission.java
    public static final String PRODUCT_VIEW = "product:view";
    public static final String PRODUCT_MANAGE = "product:manage";
    public static final String STOCK_VIEW = "stock:view";
    public static final String STOCK_MANAGE = "stock:manage";
    public static final String REPORT_VIEW = "report:view";
    public static final String AUDIT_VIEW = "audit:view";
    public static final String USER_MANAGE = "user:manage";
```

**Demo:** `.\tests\security\auth-smoke.ps1` → sin token **401**; viewer en escritura/admin **403**.

**Frase oral:** “No validamos solo el nombre del rol: el JWT trae permisos y scopes; Spring enforcea con `hasAuthority` en cada endpoint.”

---

## 7. Observabilidad (15%)

| Componente | Donde | URL | Como | Por que | Para que |
|------------|-------|-----|------|---------|----------|
| Prometheus | `observability/prometheus/` | :9090 | Scrapea `/actuator/prometheus` | Store de series temporales | Targets UP + reglas de alerta |
| Loki | compose obs | :3100 | Logs via Alloy | Logs centralizados | Buscar por servicio/label |
| Tempo | compose obs | :3200 | Trazas OTLP | Latency end-to-end | Correlacion request → spans |
| Alloy | compose | :4317/:4318 | Agent OTLP | Unificar ingest | Empujar metrics/logs/traces |
| Grafana | `observability/grafana/provisioning/` | :3030 | Dashboards JSON | UI unica de ops | Cumplir ≥4 dashboards |
| Alertmanager | rules YAML | :9093 | Recibe firing de Prom | Gestionar alertas | Heartbeat + caidas/errores |

### Dashboards

| Dashboard | JSON | Como | Por que | Para que |
|-----------|------|------|---------|----------|
| Cub Home | `cub-home.json` | Abrir `/d/cub-home` | Puerta de entrada | Orientar al evaluador en 10s |
| API | `inventory-api.json` | Latencia, RPS, errores | Salud tecnica | Ver si el API aguanta |
| Business | `inventory-business.json` | KPIs Micrometer de inventario | Negocio en ops | Inventario visible fuera de la UI |
| Security | `inventory-security.json` | 401/403 y auth | Seguridad observable | Detectar fallos/ataques de auth |
| Infra | `inventory-infra.json` | JVM/CPU/memoria | Capacidad del proceso | Explicar recursos |

| Pieza codigo | Ruta | Como | Por que | Para que |
|--------------|------|------|---------|----------|
| Metricas negocio | `BusinessMetricsRegistrar.java` | Counters/gauges de dominio | No solo metricas JVM | Paneles Business con sentido |
| System metrics API | `ObservabilityController.java` | JSON para la UI | Salud tambien in-app | Dashboard de producto |
| MDC / filters | paquete observability | Labels user/endpoint en logs | Correlacion | Buscar un request concreto |
| Alertas | `inventory-alerts.yml` | PromQL (`CubStackHeartbeat`, down, 5xx, latency…) | Deteccion automatica | Alertmanager con contenido real |
| Datasources | provisioning Grafana | Loki↔Tempo | Enlace logs y trazas | Drill-down en un clic |

```4:12:observability/prometheus/rules/inventory-alerts.yml
      - alert: CubStackHeartbeat
        expr: up{job="inventory-api"} == 1
        for: 0m
        labels:
          severity: info
        annotations:
          summary: Cub API UP (heartbeat Alertmanager)
```

**Antes de la demo:** `.\scripts\warmup-demo-traffic.ps1` y `.\tests\observability\smoke.ps1`.

**Frase oral:** “No es solo Grafana: metricas Prometheus, logs Loki, trazas Tempo y alertas en Alertmanager con heartbeat para que la UI no salga vacia.”

---

## 8. CI/CD (15%)

### 8.1 GitHub Actions

| Workflow | Archivo | Como | Por que | Para que |
|----------|---------|------|---------|----------|
| CI | `ci.yml` | Corre en push/PR | Gate minimo | No romper la rama principal |
| Full QA | `full-qa-pipeline.yml` | Bateria larga | Cobertura QA completa | Evidencia “full stack testing” |
| E2E | `e2e-playwright.yml` | Browser en CI | Regresion UI | Flujos criticos automaticos |
| API | `api-postman.yml` / `api-schemathesis.yml` | Coleccion + fuzz | Contrato estable | API confiable |
| Perf | `performance-k6|jmeter.yml` | Carga en CI | Capacidad | No quedarse en unitarios |
| Sec | `security-zap|snyk|deps.yml` | Scans automaticos | DevSecOps | Vulnerabilidades tempranas |
| Deploy | `deploy-staging|production.yml` | Post-tests | Entregar ambiente | Staging/prod academica |

### 8.2 Jenkins local

| Pieza | Ruta | Como | Por que | Para que |
|-------|------|------|---------|----------|
| Imagen | `jenkins/Dockerfile` | Plugins + JCasC en imagen | Jenkins reproducible | Mismo Jenkins en cada demo |
| CasC | `jenkins/casc/jenkins.yaml` | Config as Code | Sin clicks manuales | Setup declarativo |
| Seed job | `init.groovy.d/01-seed-cub-job.groovy` | Crea job al boot | El job siempre existe | Defensa sin setup |
| Demo pipeline | `Jenkinsfile.demo` | Stages + smoke del stack vivo | Oral sin agent Maven pesado | Historial visual del PDF |
| Full pipeline | `Jenkinsfile` | Maven/Node/Docker real | CI “de verdad” | Documentar el pipeline completo |
| Compose | `docker-compose.staging.yml` | Jenkins :8082 | Junto a Sonar | Un stack de calidad |

**Demo:** http://localhost:8082 → `cub-inventory-qas` → Build History + stages.

### 8.3 Staging / prod academica local

| Como | Por que | Para que |
|------|---------|----------|
| `docker-compose.staging.yml` = Sonar + Jenkins; `docker-compose.prod.yml` = prod local | Separar tooling de calidad vs runtime “prod” del curso | En la oral mostrar ambos mundos |
| Parametros `DEPLOY_*` en Jenkinsfile / workflows | Deploy despues de tests | Cumplir “staging post-tests” del PDF |

### 8.4 Staging y Production publicos (Vercel + Render)

Guia operativa: [`CLOUD-STAGING-PROD.md`](./CLOUD-STAGING-PROD.md).

| Pieza | Donde | Como | Por que | Para que |
|-------|-------|------|---------|----------|
| Blueprint | `render.yaml` | New Blueprint → rama `presentacion` | Infra como codigo en Render | Crear DB + Keycloak + API con nombres fijos |
| API image | `backend/Dockerfile.cloud` + entrypoint | Convierte `postgres://`→JDBC y arma issuer | Render entrega URLs estilo PaaS | Arranque correcto en la nube |
| Keycloak image | `keycloak/Dockerfile.cloud` | `start-dev --import-realm` + `KC_BOOTSTRAP_ADMIN_*` | IdP en contenedor publico | Login OIDC desde Vercel |
| Import fallback | `scripts/import-keycloak-realm-cloud.ps1` | Admin API si falta el realm | Free tier / cold start pueden fallar el import | Reparar “Not Found” sin redeploy ciego |
| Frontends | Vercel `cub-inventory-qas` / `-prod` | `deploy-vercel-cloud.ps1` | UI separada por ambiente | Dos URLs publicas de presentacion |
| CORS / redirects | `SecurityConfig` + `realm-export.json` | `*.vercel.app` en CORS y redirect URIs | Browser cross-origin HTTPS | Que el login cloud complete el flujo |

| Como (explicacion oral ampliada) | Por que | Para que |
|----------------------------------|---------|----------|
| Vercel sirve Next.js; el browser habla con Keycloak y API en Render por HTTPS | Spring/Keycloak no caben en Vercel; el PaaS completa el stack | Demo publica sin depender de tu laptop |
| Healthcheck de Keycloak en `/` (no en `/realms/inventory-realm/...`) | Si el health exige el realm antes del import, Render reinicia en loop | Que el realm termine de importarse y el login deje de dar Not Found |
| Nombres fijos `cub-api` / `cub-keycloak` | Las URLs `*.onrender.com` salen del nombre del servicio | Staging y prod Vercel apuntan siempre a lo mismo |

**URLs:**  
https://cub-inventory-qas.vercel.app · https://cub-inventory-qas-prod.vercel.app · https://cub-api.onrender.com · https://cub-keycloak.onrender.com  

**Frase oral:** “Vercel es la UI; Render es API + Keycloak. El realm se importa al arrancar; el healthcheck no bloquea ese import. Asi staging/prod autentican de verdad sin mi PC.”

---

## 9. Calidad (10%) — Sonar + JaCoCo ≥60%

| Pieza | Donde | Como | Por que | Para que |
|-------|-------|------|---------|----------|
| Umbral JaCoCo | `pom.xml` → `0.60` | El build falla si cobertura < 60% | Gate cuantitativo del PDF | Cumplir rubrica de cobertura |
| Plugin check | `jacoco-maven-plugin` | Corre en `mvn verify` | Enforce automatico | No “prometer” cobertura |
| Scanner | `sonar-maven-plugin` | Analisis estatico | Deuda/bugs/smells visibles | Quality Gate |
| Sonar staging | `sonarqube` + `sonar-db` Postgres | UI en :9001 | Evitar H2 embebido inestable | Demo de gate estable |
| Puerto 9001 | compose staging | Default academico | Evitar choque con emuladores en 9000 | Arranque limpio en Windows |
| Evidencia | `docs/qa-evidence/sonar-summary.md` | Resumen versionado | Traza para el evaluador | No depender solo de la UI |

**Demo:** http://localhost:9001 → Quality Gate + cobertura.

---

## 10. Documentacion (10%)

| Documento | Contenido | Como | Por que | Para que |
|-----------|-----------|------|---------|----------|
| Esta guia | PDF ↔ codigo ↔ demo + Como/Por que/Para que | Lectura y estudio | Un solo mapa mental | Saber donde apuntar en la oral |
| [`GUION-PRESENTACION.md`](./GUION-PRESENTACION.md) | Texto hablado por minutos | Ensayar en voz alta | Timing de la defensa | Que decir y que abrir |
| [`architecture.md`](./architecture.md) | C4 L1/L2/L3 | Abrir Mermaid | Arquitectura clara | Explicar contexto y contenedores |
| [`CLOUD-STAGING-PROD.md`](./CLOUD-STAGING-PROD.md) | Deploy Vercel/Render | Checklist operativo | Cloud sin PC | Levantar staging/prod publicos |
| [`qa-evidence/`](./qa-evidence/) | Reportes y capturas | Abrir carpeta | Evidencia del PDF | Probar que se ejecuto QA |
| `README.md` | Arranque rapido | Compose + cloud links | Onboarding | Que otro pueda seguir |

---

## 11. Orden de presentacion (25–30 min)

1. **Apertura** — Cub + C4 L1/L2.  
2. **Funcionalidad** — productos, stock, dashboard; soft delete + Envers.  
3. **Seguridad** — viewer 403; scopes; `/admin/users`; `Permission` + converter.  
4. **Swagger** — Authorize + endpoint protegido.  
5. **Observabilidad** — Grafana Home → Business/Security/Infra; Alertmanager heartbeat.  
6. **Calidad** — Sonar + JaCoCo 60%.  
7. **CI/CD** — Actions + Jenkins historial; mencionar Vercel/Render.  
8. **Testing** — piramide + `qa-evidence/`.  
9. **Cierre** — calidad, seguridad y trazabilidad; no es solo CRUD.

Detalle hablado: [`GUION-PRESENTACION.md`](./GUION-PRESENTACION.md).

---

## 12. Comandos utiles

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1

.\scripts\warmup-demo-traffic.ps1
.\scripts\seed-demo-data.ps1

.\tests\observability\smoke.ps1
.\tests\security\auth-smoke.ps1

# Cloud Keycloak si el realm falta
.\scripts\import-keycloak-realm-cloud.ps1
```

---

## 13. Decisiones clave (ADRs)

| Decision | Como | Por que | Para que |
|----------|------|---------|----------|
| Soft delete `INACTIVE` | `markInactive` en entidad/API | No romper stock ni Envers | Auditoria e integridad |
| Authorities por permiso | `@PreAuthorize` + `Permission.*` | PDF: no validar solo nombre de rol | Matriz tipo ERP |
| Scopes JWT + policies Keycloak | Converter + realm-export | Modelo OAuth2 alineado con Spring | Roles, scopes y policies juntos |
| Top sold = OUT 30d | `ReportService` | No hay modulo de ventas | KPI util en dashboard |
| Local Compose + cloud Vercel/Render | compose + `render.yaml` + Vercel | Flexibilidad en la oral | Demo local rica + URL publica |
| Sonar + Postgres | `sonar-db` en staging | Evitar H2 embebido | Gate estable en defensa |
| `Jenkinsfile.demo` + `Jenkinsfile` | Dos pipelines | Oral visual vs CI completo | Stages sin friccion + pipeline real |
| Healthcheck Keycloak en `/` | `render.yaml` | No exigir realm antes del import | Evitar Not Found en login cloud |

---

## 14. Fuera de alcance

Billing, compras, multi-tenant, produccion cloud endurecida.  
“Prod” del curso = `docker-compose.prod.yml` local; tambien hay URLs publicas (Vercel + Render) para demo funcional.
