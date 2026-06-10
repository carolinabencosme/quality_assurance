# Guía de implementación paso a paso — Sistema de Gestión de Inventarios Empresarial (QAS)

> Basada en el **Plan de Implementación Técnica v3.0** (Full Stack Testing · Observabilidad · DevSecOps).  
> **Frase guía:** no es un CRUD aislado; es un sistema empresarial con seguridad granular, testing full stack, observabilidad, CI/CD y calidad continua.

> **Documentación complementaria:** esta guía es el plan operativo por fases. Para especificaciones técnicas detalladas, estándares de ingeniería y ejecución por área, consulta el [índice de documentación](./README.md) (`requirements`, `architecture`, `development-guide`, `deployment-guide`, `testing-guide`, etc.).

---

## Tabla de contenidos

1. [Visión general y orden de ejecución](#1-visión-general-y-orden-de-ejecución)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Fase 0 — Setup del repositorio y entorno](#fase-0--setup-del-repositorio-y-entorno)
4. [Fase 1 — Core funcional (productos y stock)](#fase-1--core-funcional-productos-y-stock)
5. [Fase 2 — Seguridad con Keycloak](#fase-2--seguridad-con-keycloak)
6. [Fase 3 — Dashboard, reportes y auditoría](#fase-3--dashboard-reportes-y-auditoría)
7. [Fase 4 — Testing full stack](#fase-4--testing-full-stack)
8. [Fase 5 — Observabilidad y telemetría](#fase-5--observabilidad-y-telemetría)
9. [Fase 6 — CI/CD, SonarQube y staging](#fase-6--cicd-sonarqube-y-staging)
10. [Fase 7 — Documentación, evidencias y defensa](#fase-7--documentación-evidencias-y-defensa)
11. [Checklist de entrega final](#checklist-de-entrega-final)
12. [Anexos operativos](#anexos-operativos)

---

## 1. Visión general y orden de ejecución

### Arquitectura elegida

| Decisión | Detalle |
|----------|---------|
| Patrón | **Monolito modular** (una API Spring Boot, módulos internos por dominio) |
| Backend | Spring Boot 3 + Java 21 |
| Frontend | React + Vite + TypeScript + Tailwind + shadcn/ui |
| Base de datos | PostgreSQL + Flyway + Hibernate Envers |
| Seguridad | Keycloak + OAuth2 + JWT (permisos granulares, no solo roles) |
| Observabilidad | OpenTelemetry → Alloy → Prometheus / Loki / Tempo → Grafana → Alertmanager |
| CI/CD | GitHub Actions (PR) + Jenkins (entrega completa) |
| Calidad | SonarQube |

### Prioridad de ejecución (resumen)

```
Fase 0 → Setup
    ↓
Fase 1 → Productos + Stock + API documentada
    ↓
Fase 2 → Keycloak + permisos en endpoints
    ↓
Fase 3 → Dashboard + Envers + auditoría en UI
    ↓
Fase 4 → Pruebas por capas (unit → integration → API → E2E → security → performance)
    ↓
Fase 5 → Observabilidad completa
    ↓
Fase 6 → Pipelines + SonarQube + deploy staging
    ↓
Fase 7 → Docs + evidencias + presentación
```

### MVP obligatorio vs extras

| MVP (obligatorio) | Extras (si da tiempo) |
|-------------------|------------------------|
| CRUD productos, movimientos de stock, dashboard | Gestión avanzada de usuarios en UI |
| Swagger, Keycloak con permisos, Flyway | Report snapshots históricos |
| Docker Compose, pruebas principales | Dashboards de negocio avanzados |
| Grafana stack, GitHub Actions, Jenkins, SonarQube | Alertas sofisticadas, más k6, exportables |

---

## 2. Prerrequisitos

### Software en la máquina de desarrollo

- [ ] **Java 21** (JDK)
- [ ] **Maven** o usar `./mvnw` incluido en el repo
- [ ] **Node.js 18+** y **npm**
- [ ] **Docker Desktop** (o Docker Engine + Compose v2)
- [ ] **Git**
- [ ] IDE: IntelliJ IDEA / VS Code con extensiones Java y ESLint
- [ ] (Opcional) **k6**, **Playwright CLI**, cuenta local en **SonarQube** y **Jenkins**

### Cuentas y herramientas del proyecto

- [ ] Repositorio Git (GitHub recomendado)
- [ ] Issues y Pull Requests habilitados
- [ ] Rama `main` protegida (sin merge directo)
- [ ] Jenkins instalado (contenedor en staging o servidor local)
- [ ] SonarQube en Docker (staging)

### Convenciones del equipo

- **Ramas:** `main` (estable), `develop` (integración), `feature/*`, `fix/*`, `test/*`, `docs/*`
- **Commits:** Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`, `refactor:`)
- **Regla:** cada funcionalidad → issue; cada PR → descripción + evidencia de pruebas
- **Secretos:** nunca en el repo; usar `.env.example` + `.env` local ignorado por Git

---

## Fase 0 — Setup del repositorio y entorno

**Objetivo:** repositorio público, estructura de carpetas, Docker Compose base, backend y frontend arrancando en local.

### Tarea 0.1 — Crear estructura del monorepo

**Qué hacer:** crear el árbol de carpetas según el plan.

```
inventory-qas-project/
├── backend/
├── frontend/
├── docker/
├── observability/
├── keycloak/
├── tests/
├── docs/
├── .github/workflows/
├── docker-compose.dev.yml
├── docker-compose.staging.yml
├── docker-compose.test.yml
├── Jenkinsfile
├── .env.example
└── README.md
```

**Pasos:**

1. Inicializar Git: `git init` y conectar remoto en GitHub.
2. Crear `.gitignore` con: `node_modules/`, `target/`, `.env`, `dist/`, reportes locales, `.idea/`.
3. Copiar plantilla de `.env.example` (ver [Anexo A](#anexo-a-variables-de-entorno)).
4. Crear `README.md` inicial con: descripción, stack, prerequisitos y comando para levantar dev.

**Criterio de hecho:** `git clone` + estructura visible; README explica cómo empezar.

---

### Tarea 0.2 — Docker Compose de desarrollo (mínimo)

**Qué hacer:** `docker-compose.dev.yml` con postgres, keycloak, backend, frontend.

| Servicio | Puerto | Función |
|----------|--------|---------|
| postgres | 5432 | BD transaccional |
| keycloak | 8081 | IdP OAuth2/OIDC |
| backend | 8080 | API Spring Boot |
| frontend | 3000 | React (Vite dev o Nginx) |

**Pasos:**

1. Crear `docker/postgres/init/` con script que cree BD `inventory` y usuario `inventory_user`.
2. Definir servicio `postgres` con volumen persistente y healthcheck.
3. Definir servicio `keycloak` (imagen oficial) con variables de admin y volumen para `realm-export.json` (se completará en Fase 2).
4. Crear `backend/Dockerfile` (multi-stage: build Maven + runtime JRE 21).
5. Crear `frontend/Dockerfile` (dev: Vite; prod: build + Nginx en `docker/nginx/`).
6. Enlazar redes Docker y nombres de host (`postgres`, `keycloak`, `backend`).

**Comando:**

```bash
docker compose -f docker-compose.dev.yml up -d
```

**Criterio de hecho:** `docker compose ps` muestra servicios healthy; postgres acepta conexiones.

---

### Tarea 0.3 — Scaffold del backend (Spring Boot)

**Qué hacer:** proyecto Maven con paquete base `com.company.inventory` y módulos vacíos.

**Pasos:**

1. Generar proyecto en [start.spring.io](https://start.spring.io):
   - Java 21, Spring Boot 3.x
   - Dependencias: Web, Data JPA, Validation, PostgreSQL, Flyway, Actuator, OAuth2 Resource Server, OpenAPI (springdoc)
2. Crear paquetes:

```
com.company.inventory
├── InventoryApplication.java
├── product/
├── stock/
├── report/
├── audit/
├── security/
├── observability/
└── common/
    ├── exception/
    ├── response/
    └── validation/
```

3. Configurar `application-dev.yml`:
   - `spring.datasource.url=jdbc:postgresql://postgres:5432/inventory`
   - Perfil activo: `SPRING_PROFILES_ACTIVE=dev`
4. Exponer `/actuator/health` (público para health checks).
5. Verificar arranque: `cd backend && ./mvnw spring-boot:run` (o vía Docker).

**Criterio de hecho:** aplicación arranca; health responde `UP`.

---

### Tarea 0.4 — Scaffold del frontend (React + Vite)

**Qué hacer:** SPA con TypeScript, Tailwind, shadcn/ui y rutas base.

**Pasos:**

1. `npm create vite@latest frontend -- --template react-ts`
2. Instalar TailwindCSS y configurar según documentación oficial.
3. Inicializar shadcn/ui (`npx shadcn@latest init`).
4. Instalar React Router y cliente HTTP (axios o fetch wrapper).
5. Crear estructura mínima:

```
frontend/src/
├── components/
│   ├── AppShell.tsx
│   ├── ProtectedRoute.tsx
│   └── PermissionGate.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── Products.tsx
├── lib/
│   └── api.ts
└── App.tsx
```

6. Variables en `.env`: `VITE_API_URL`, `VITE_KEYCLOAK_*` (ver anexo).

**Comando:**

```bash
cd frontend && npm install && npm run dev
```

**Criterio de hecho:** frontend en `http://localhost:3000` sin errores de compilación.

---

### Tarea 0.5 — Documentación inicial en `/docs`

**Qué hacer:** crear archivos vacíos o con esqueleto para ir completando en paralelo.

| Archivo | Contenido inicial |
|---------|-------------------|
| `requirements.md` | IDs de requisitos funcionales y no funcionales |
| `architecture.md` | Diagrama monolito modular (puede ser Mermaid) |
| `security-model.md` | Tabla de permisos (plantilla) |
| `testing-guide.md` | Tipos de prueba y comandos |
| `deployment-guide.md` | Comandos Docker |
| `observability-guide.md` | Puertos del stack |
| `qa-evidence.md` | Secciones vacías para capturas |

**Criterio de hecho Fase 0:** repo clonable, `docker compose -f docker-compose.dev.yml up` levanta postgres + keycloak; backend y frontend compilan.

---

## Fase 1 — Core funcional (productos y stock)

**Objetivo:** CRUD de productos, movimientos de stock, migraciones Flyway, Swagger UI activo. **Sin seguridad completa aún** (opcional: endpoints abiertos en dev y cerrar en Fase 2).

### Tarea 1.1 — Modelo de datos y migraciones Flyway

**Tablas principales:**

| Tabla | Campos clave | Notas |
|-------|--------------|-------|
| `categories` | id, name, description, status | Organización de productos |
| `products` | id, name, sku, category_id, price, quantity, min_stock, status, timestamps | SKU único; auditable con Envers |
| `stock_movements` | id, product_id, user_id, type, previous_qty, new_qty, delta, observations, correlation_id | IN / OUT / ADJUST |
| `users_profile` | id, keycloak_user_id, full_name, email, status | Opcional para historial |

**Migraciones sugeridas (orden):**

1. `V1__create_categories_table.sql`
2. `V2__create_products_table.sql`
3. `V3__create_stock_movements_table.sql`
4. `V4__create_users_profile_table.sql`
5. `V5__enable_audit_tables.sql` (preparación Envers)
6. `V6__seed_initial_catalog.sql`
7. `V7__add_indexes_and_constraints.sql`

**Pasos:**

1. Colocar scripts en `backend/src/main/resources/db/migration/`.
2. Definir constraints: `UNIQUE(sku)`, `CHECK (price >= 0)`, `CHECK (quantity >= 0)`.
3. Ejecutar: `./mvnw flyway:migrate` o arrancar la app (Flyway auto-migrate).
4. Verificar en postgres: `\dt` y datos del seed.

**Reglas de negocio a implementar en servicios (no solo en BD):**

- SKU duplicado → error 409
- Precio o stock inicial negativo → 400
- Salida que deje quantity &lt; 0 → 400/409
- Toda modificación de stock → registro en `stock_movements`
- Si `quantity <= min_stock` → producto crítico para dashboard
- Productos con historial → soft delete (`status = inactive`), no DELETE físico

**Criterio de hecho:** migraciones aplican sin error; seed visible en BD.

---

### Tarea 1.2 — Módulo `product` (backend)

**Pasos detallados:**

1. **Entidad JPA** `Product.java` con relación a `Category`, `@Audited` (Envers) si ya está habilitado.
2. **Repository** `ProductRepository` con métodos de búsqueda, filtro por categoría/status, paginación.
3. **DTOs:** `ProductRequest`, `ProductResponse`, `ProductFilter`.
4. **Mapper:** MapStruct o manual entre entidad y DTO.
5. **Service** `ProductService`:
   - `create`, `update`, `findById`, `findAll(Pageable, filters)`, `inactivate`
   - Validar SKU único, precios, estados
6. **Controller** `ProductController` bajo `/api/v1/products`:
   - `GET` lista con `page`, `size`, `sort`, búsqueda
   - `GET /{id}`
   - `POST`, `PUT /{id}`, `DELETE` o `PATCH` inactivate
7. **Manejo de errores** en `common/exception`: respuesta estándar con `correlationId`.

**Formato de error (obligatorio):**

```json
{
  "timestamp": "2026-05-18T20:10:31Z",
  "status": 409,
  "error": "Conflict",
  "message": "SKU already exists",
  "path": "/api/v1/products",
  "correlationId": "req-789xyz"
}
```

**Criterio de hecho:** CRUD productos funciona vía curl/Postman; paginación y filtros operativos.

---

### Tarea 1.3 — Módulo `stock` (backend)

**Pasos:**

1. Entidad `StockMovement` con enum `MovementType` (IN, OUT, ADJUST).
2. `StockService.registerMovement(request)`:
   - Leer producto actual
   - Calcular `new_qty` según tipo
   - Validar no negativo en salidas
   - Persistir movimiento con `previous_qty`, `delta`, `correlation_id`
   - Actualizar `product.quantity`
3. Endpoints:
   - `GET /api/v1/stock` — existencias actuales
   - `GET /api/v1/stock/movements` — historial paginado
   - `POST /api/v1/stock/movements` — registrar movimiento
4. Inyectar `correlationId` desde filtro HTTP (módulo observability, puede ser stub al inicio).

**Criterio de hecho:** entrada suma, salida resta, salida inválida rechazada, cada cambio genera fila en `stock_movements`.

---

### Tarea 1.4 — OpenAPI y Swagger UI

**Pasos:**

1. Añadir dependencia `springdoc-openapi-starter-webmvc-ui`.
2. Configurar grupo OpenAPI `/api/v1` con descripciones por tag (Products, Stock).
3. Anotar controllers con `@Operation`, `@ApiResponse`.
4. Habilitar Swagger solo en perfiles `dev` y `staging`.
5. Probar en `http://localhost:8080/swagger-ui.html`.

**Criterio de hecho:** contrato documentado; se pueden ejecutar requests desde Swagger (aún sin JWT si no está Fase 2).

---

### Tarea 1.5 — Frontend: productos y stock (sin auth o mock)

**Pantallas:**

| Ruta | Contenido | Permiso (cuando exista auth) |
|------|-----------|------------------------------|
| `/products` | Tabla con búsqueda, filtros, paginación | `product:view` |
| `/products/new` | Formulario creación | `product:manage` |
| `/products/:id/edit` | Formulario edición | `product:manage` |
| `/stock/movements` | Historial + formulario entrada/salida/ajuste | `stock:view` / `stock:manage` |

**Pasos:**

1. Implementar `DataTable` reutilizable (paginación, sort, filtros).
2. Implementar `ProductForm` con validaciones cliente (SKU, precio ≥ 0).
3. Implementar `StockMovementForm` con selector de tipo y producto.
4. Conectar `lib/api.ts` con `VITE_API_URL`.
5. Estados: loading, empty state, mensajes de error de API.

**Criterio de hecho Fase 1:** flujo completo producto + movimiento de stock desde UI; Swagger alineado con endpoints reales.

---

## Fase 2 — Seguridad con Keycloak

**Objetivo:** realm exportado, login OAuth2 + PKCE, JWT en API, `@PreAuthorize` por permiso, pruebas 401/403.

### Tarea 2.1 — Configurar Keycloak (realm `inventory-realm`)

**Pasos en consola Keycloak (`http://localhost:8081`):**

1. Crear realm **`inventory-realm`**.
2. **Client `inventory-frontend`** (public):
   - Standard flow + PKCE
   - Valid redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000`
3. **Client `inventory-api`** (bearer-only / confidential según diseño):
   - Usado como audiencia del Resource Server
4. Crear **client roles** (permisos):
   - `product:view`, `product:manage`
   - `stock:view`, `stock:manage`
   - `report:view`, `audit:view`, `user:manage`
5. Crear **roles compuestos** de negocio:

| Rol | Permisos |
|-----|----------|
| Admin | Todos |
| Warehouse Manager | product + stock + report (view/manage según tabla del plan) |
| Inventory Clerk | product:view, stock:view, stock:manage |
| Viewer / Auditor | view + audit:view + report:view |
| Employee Basic | product:view, stock:view |

6. Crear usuarios de prueba (uno por rol) con contraseñas documentadas en README.
7. **Exportar realm** → `keycloak/realm-export.json` y montarlo en Docker para reproducibilidad.

**Authorization Services (opcional pero defendible):**

- Resources: `products`, `stock`, `reports`, `audit`, `users`
- Scopes: `view`, `manage`
- Policies y Permissions vinculando recursos + scopes + roles

**Criterio de hecho:** realm JSON versionado; login manual en Keycloak funciona.

---

### Tarea 2.2 — Backend como OAuth2 Resource Server

**Pasos:**

1. Dependencia `spring-boot-starter-oauth2-resource-server`.
2. `SecurityConfig.java`:
   - Deshabilitar CSRF para API stateless
   - `authorizeHttpRequests`: `/actuator/health` público; `/api/v1/**` autenticado
   - `oauth2ResourceServer().jwt()`
3. `JwtAuthoritiesConverter`: mapear claims de Keycloak (`realm_access`, `resource_access`) a authorities `product:view`, etc.
4. Activar `@EnableMethodSecurity` y anotar controllers:

```java
@PreAuthorize("hasAuthority('product:view')")
@GetMapping("/products")
public Page<ProductResponse> findAll(...) { ... }
```

5. Configurar CORS solo para orígenes permitidos (`localhost:3000`).
6. Variables: `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_JWKS_URI`.

**Pruebas manuales:**

| Caso | Resultado esperado |
|------|-------------------|
| Sin token | 401 |
| Token válido sin permiso | 403 |
| Token con permiso correcto | 200/201 |

**Criterio de hecho:** todos los endpoints `/api/v1/*` protegidos; matriz rol→permiso verificada.

---

### Tarea 2.3 — Frontend: login y guards

**Pasos:**

1. Integrar **keycloak-js** o `@react-keycloak/web` con PKCE.
2. Página `/login` redirige a Keycloak y vuelve con tokens.
3. `ProtectedRoute`: exige autenticación.
4. `PermissionGate`: lee authorities del token y oculta botones (crear, editar, eliminar).
5. Interceptor HTTP: adjuntar `Authorization: Bearer <access_token>`.
6. Manejar 401 → redirect login; 403 → pantalla o toast “sin permiso”.
7. Ruta `/users-permissions` (solo `user:manage`): resumen de roles del realm.

**Criterio de hecho:** cada rol ve solo lo permitido; Warehouse Manager puede gestionar stock; Employee Basic solo lectura.

---

### Tarea 2.4 — Pruebas de seguridad iniciales

**Pasos:**

1. Crear `KeycloakSecurityIT.java` con Testcontainers (Keycloak + Postgres).
2. Crear `PermissionApiTest.java` con RestAssured: 401, 403, 200 por rol.
3. Documentar matriz en `docs/security-model.md`.

**Criterio de hecho Fase 2:** capturas de Keycloak + evidencia de 401/403 en reportes de prueba.

---

## Fase 3 — Dashboard, reportes y auditoría

**Objetivo:** KPIs, productos críticos, historial Envers, pantalla de auditoría.

### Tarea 3.1 — Módulo `report`

**Endpoints:**

| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/api/v1/reports/dashboard` | `report:view` |
| GET | `/api/v1/reports/critical-products` | `report:view` |

**KPIs mínimos del dashboard:**

- Total productos activos
- Productos en estado crítico (`quantity <= min_stock`)
- Movimientos del día
- (Opcional) top productos por movimientos de salida

**Pasos:**

1. `ReportService` con consultas agregadas (JPQL o native query optimizada).
2. DTOs de respuesta para dashboard.
3. `ReportController` con permisos.

---

### Tarea 3.2 — Auditoría con Hibernate Envers

**Pasos:**

1. Anotar entidades críticas (`Product`, etc.) con `@Audited`.
2. Asegurar migración `V5__enable_audit_tables.sql` crea tablas `_AUD`.
3. Módulo `audit`:
   - `AuditService` consulta revisiones (Envers API)
   - `GET /api/v1/audit` con permiso `audit:view`
4. Opcional: `users_profile` para mostrar nombre en lugar de solo `keycloak_user_id`.

---

### Tarea 3.3 — Frontend: dashboard y auditoría

**Pasos:**

1. Página `/dashboard` con `KpiCard` y tablas resumen (requiere `report:view`).
2. Gráficos simples (recharts o similar): productos críticos, movimientos recientes.
3. Página `/audit` con tabla paginada de cambios (`audit:view`).
4. Página `/reports` si se separan vistas adicionales.

**Criterio de hecho Fase 3:** dashboard muestra críticos tras movimiento que cruza `min_stock`; auditoría lista cambios de un producto editado.

---

## Fase 4 — Testing full stack

**Objetivo:** pruebas automatizadas por capas con reportes archivables en `docs/qa-evidence.md`.

### Estructura de carpetas de pruebas

```
backend/src/test/java/
├── unit/
├── integration/
└── api/

tests/
├── e2e/playwright/
├── performance/k6/
└── security/zap/
```

### Tarea 4.1 — Unit tests (JUnit + Mockito)

**Qué probar:**

- `ProductServiceTest`: SKU duplicado, precio negativo, paginación
- `StockServiceTest`: entrada, salida, salida inválida, ajuste
- `ReportServiceTest`: conteos y críticos

**Pasos:**

1. Ubicar tests en `backend/src/test/java/unit/`.
2. Mockear repositories; no levantar contexto Spring si no es necesario.
3. Configurar **JaCoCo** en `pom.xml` con umbral mínimo 70% en paquete `*.service.*`.
4. Ejecutar: `cd backend && ./mvnw test`.
5. Guardar reporte HTML en `backend/target/site/jacoco/` y referenciar en qa-evidence.

**Meta:** coverage ≥ 70% en servicios y reglas de negocio.

---

### Tarea 4.2 — Integration tests (Testcontainers)

**Qué probar:**

- `ProductRepositoryIT`: persistencia, constraints
- `StockMovementIT`: transacción producto + movimiento
- `KeycloakSecurityIT`: JWT real contra Keycloak en contenedor

**Pasos:**

1. Perfil Maven `integration-tests` con `maven-failsafe-plugin`.
2. `@Testcontainers` con PostgreSQL; imagen Keycloak para seguridad.
3. Usar `docker-compose.test.yml` si hace falta red compartida.
4. Ejecutar: `./mvnw verify -P integration-tests`.

---

### Tarea 4.3 — API / Contract tests

**Herramientas:** RestAssured + Schemathesis (validación contra OpenAPI).

**Casos mínimos:**

| Área | Casos |
|------|-------|
| Productos | CRUD válido, 409 SKU, 400 precio negativo, paginación |
| Stock | IN/OUT/ADJUST, 400 stock negativo |
| Seguridad | 401 sin token, 403 rol incorrecto |
| Contrato | Schema OpenAPI, status codes |

**Pasos:**

1. Tests en `backend/src/test/java/api/`.
2. Perfil `api-tests`: `./mvnw test -P api-tests`.
3. Exportar colección Postman en `tests/postman/` (opcional Newman en CI).

---

### Tarea 4.4 — E2E (Playwright)

**Specs mínimos:**

- `login.spec.ts` — flujo Keycloak
- `products.spec.ts` — crear y listar producto
- `stock.spec.ts` — entrada y salida
- `permissions.spec.ts` — usuario limitado no ve botón “Crear”

**Pasos:**

1. `cd frontend && npm init playwright@latest`.
2. Configurar baseURL y storage de auth (token o login programático).
3. Ejecutar contra sistema levantado: `npx playwright test`.
4. Activar trace/screenshot on failure; archivar HTML report en `tests/e2e/reports/`.
5. Incluir viewport mobile en al menos un test responsive.

---

### Tarea 4.5 — Security testing

**Pasos:**

1. **OWASP Dependency Check** o Snyk en GitHub Actions (`security.yml`).
2. **OWASP ZAP baseline** contra frontend en staging:

```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:3000 -r zap-report.html
```

3. Config en `tests/security/zap/zap-baseline.conf`.
4. Validar JWT, CORS y headers en checklist manual.
5. Guardar reportes en qa-evidence.

---

### Tarea 4.6 — Performance (k6)

**Escenarios mínimos:**

- 100 VUs consultando `GET /api/v1/products`
- 50 VUs registrando movimientos de stock

**Pasos:**

1. Scripts en `tests/performance/k6/products-load-test.js` y `stock-stress-test.js`.
2. Obtener token Keycloak en `setup()` de k6 para requests autenticados.
3. Ejecutar: `k6 run tests/performance/k6/products-load-test.js`.
4. Documentar: latencia p95, throughput, error rate.

---

### Tarea 4.7 — Data testing

**Pasos:**

1. Verificar que Flyway migra desde cero en CI (test job).
2. Test que seed inserta categorías y productos esperados.
3. Test de constraint SKU duplicado a nivel BD (opcional integration).

**Criterio de hecho Fase 4:** todos los tipos de prueba ejecutables localmente; enlaces/capturas en `qa-evidence.md`.

---

## Fase 5 — Observabilidad y telemetría

**Objetivo:** métricas, logs estructurados, trazas, dashboards Grafana, alertas Alertmanager.

### Flujo de datos

```
Spring Boot API
    → OpenTelemetry (metrics + logs + traces)
    → Alloy (collector)
    → Prometheus | Loki | Tempo
    → Grafana
    → Alertmanager
```

### Tarea 5.1 — Instrumentación en el backend

**Pasos:**

1. Añadir dependencias OpenTelemetry Java agent o Spring Boot starter OTel.
2. Variables: `OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4317`, `OTEL_SERVICE_NAME=inventory-api`.
3. Implementar `CorrelationIdFilter` en módulo `observability`:
   - Leer o generar header `X-Correlation-Id`
   - Incluir en MDC para logs
4. `LoggingConfig`: logs JSON con `traceId`, `spanId`, `correlationId`, `user`, `endpoint`.

**Ejemplo de log esperado:**

```json
{
  "timestamp": "2026-05-18T20:10:31Z",
  "level": "INFO",
  "traceId": "abc123def456",
  "correlationId": "req-789xyz",
  "user": "warehouse.manager@test.com",
  "endpoint": "POST /api/v1/stock/movements",
  "message": "Stock movement registered"
}
```

---

### Tarea 5.2 — Stack en `docker-compose.staging.yml`

| Servicio | Puerto |
|----------|--------|
| prometheus | 9090 |
| grafana | 3001 |
| loki | 3100 |
| tempo | 3200 |
| alloy | 4317 / 4318 |
| alertmanager | 9093 |

**Pasos:**

1. Crear configs en `observability/prometheus/`, `loki/`, `tempo/`, `alloy/`, `alertmanager/`.
2. Provisionar dashboards en `observability/grafana/dashboards/`.
3. Levantar: `docker compose -f docker-compose.staging.yml up -d --build`.

---

### Tarea 5.3 — Dashboards Grafana (mínimo 2)

| Dashboard | Paneles mínimos |
|-----------|-----------------|
| Infraestructura | CPU, memoria, JVM, uptime, contenedores |
| Aplicación | Latencia, throughput, error rate, status codes por endpoint |
| Negocio (recomendado) | Total productos, críticos, movimientos/día |
| Seguridad (recomendado) | Contadores 401, 403, fallos de login |

**Pasos:**

1. Importar dashboards de Spring Boot / JVM si aplica.
2. Enlazar Loki para logs y Tempo para traces (derived fields traceId).
3. Probar: hacer un request y localizar traza completa en Tempo.

---

### Tarea 5.4 — Alertmanager

**Alertas mínimas:**

- CPU alta / memoria JVM
- Error rate elevado
- Latencia p95 alta
- Servicio caído (health check)
- Pico de 401/403 (posible ataque o mala config)

**Pasos:**

1. Definir reglas en Prometheus (`observability/prometheus/alerts.yml`).
2. Configurar rutas en Alertmanager (webhook o email de prueba).
3. Simular alerta (ej. detener backend) y capturar evidencia.

**Criterio de hecho Fase 5:** un request aparece en logs (Loki), métricas (Prometheus) y traza (Tempo); al menos una alerta de prueba documentada.

---

## Fase 6 — CI/CD, SonarQube y staging

**Objetivo:** GitHub Actions en PR, Jenkins pipeline completo, Quality Gate, deploy staging con smoke tests post-deploy.

### Tarea 6.1 — GitHub Actions (`.github/workflows/ci.yml`)

**Cuándo corre:** push y pull request a cualquier rama.

**Etapas:**

1. Checkout
2. Setup Java 21 + Node
3. Lint (opcional frontend)
4. `./mvnw test` (unit)
5. `cd frontend && npm ci && npm run build`
6. JaCoCo report upload (artifact)
7. Dependency security scan
8. `docker build` (sin desplegar)

**Workflow adicional `security.yml`:** OWASP Dependency Check programado o en PR.

---

### Tarea 6.2 — Jenkins (`Jenkinsfile`)

**Etapas del pipeline completo:**

1. Checkout  
2. Build Backend (`./mvnw clean package -DskipTests`)  
3. Build Frontend (`npm ci && npm run build`)  
4. Unit Tests  
5. Integration Tests (`-P integration-tests`)  
6. API Tests (`-P api-tests`)  
7. E2E Tests (`npx playwright test`)  
8. Security Scan (`./scripts/run-zap-baseline.sh`)  
9. SonarQube Analysis  
10. **Quality Gate** (abort on fail)  
11. Docker Build  
12. Deploy Staging (`docker compose -f docker-compose.staging.yml up -d`)  
13. **Post-Deploy Smoke** (`./scripts/smoke-test.sh`) — contra sistema ya levantado  
14. Archive Artifacts (`**/reports/**`)

**Regla crítica:** las pruebas de staging/post-deploy corren **contra el sistema desplegado**, no solo durante el build de la imagen.

---

### Tarea 6.3 — SonarQube

**Métricas meta:**

| Métrica | Meta |
|---------|------|
| Coverage backend | ≥ 70% |
| Coverage frontend | ≥ 50% o E2E suficiente |
| Duplicación | ≤ 5% |
| Bugs críticos | 0 |
| Vulnerabilidades críticas | 0 |

**Pasos:**

1. Levantar SonarQube en staging (puerto 9000).
2. Crear proyecto `inventory-qas`.
3. Script `./scripts/run-sonar.sh` con token en variable de entorno.
4. Integrar `waitForQualityGate` en Jenkins.
5. Capturar dashboard para qa-evidence.

---

### Tarea 6.4 — Smoke tests post-deploy

**Script `scripts/smoke-test.sh` debe verificar:**

- `GET /actuator/health` → UP
- Login Keycloak (token obtenido)
- `GET /api/v1/products` con token → 200
- Frontend responde en puerto 3000

**Criterio de hecho Fase 6:** PR con GitHub Actions verde; Jenkins verde hasta staging; SonarQube Quality Gate passed.

---

## Fase 7 — Documentación, evidencias y defensa

**Objetivo:** paquete defendible para presentación final.

### Tarea 7.1 — Completar `/docs`

| Documento | Contenido final |
|-----------|-----------------|
| `README.md` | Cómo correr dev/staging, usuarios de prueba, URLs Swagger/Grafana/Jenkins/Sonar |
| `requirements.md` | RF/RNF con IDs trazables a tests |
| `architecture.md` | Diagramas actualizados, decisiones (monolito modular, PostgreSQL vs Supabase) |
| `security-model.md` | Matriz rol × permiso × endpoint |
| `testing-guide.md` | Comandos de cada tipo de prueba |
| `deployment-guide.md` | Troubleshooting Docker |
| `observability-guide.md` | Cómo reproducir traza y alerta |
| `qa-evidence.md` | Todas las capturas y enlaces a reportes |

### Tarea 7.2 — Evidencias visuales obligatorias

Guardar capturas o exports en `docs/evidence/` y referenciar en `qa-evidence.md`:

- [ ] Swagger con Bearer JWT
- [ ] Keycloak: realm, clients, roles, permisos
- [ ] Grafana: infra + aplicación
- [ ] Tempo: traza completa de un request
- [ ] Loki: logs con traceId y correlationId
- [ ] Alertmanager con regla disparada (o simulada)
- [ ] Jenkins pipeline verde
- [ ] GitHub Actions en PR
- [ ] SonarQube Quality Gate
- [ ] Playwright HTML report
- [ ] ZAP report
- [ ] k6 summary
- [ ] PRs e issues con Conventional Commits

### Tarea 7.3 — Preparar defensa oral

**Guion técnico (resumen):**

1. Por qué **monolito modular** (velocidad + orden + testing directo).
2. Por qué **Keycloak** con permisos `product:manage`, no solo rol `admin`.
3. Demostración en vivo: login → CRUD → movimiento stock → dashboard crítico → Grafana trace.
4. Mostrar pipeline CI/CD y SonarQube.
5. Riesgos mitigados: Keycloak con realm export; testing desde Fase 1; observabilidad por capas.

---

## Checklist de entrega final

### Funcionalidad

- [ ] Productos: CRUD, búsqueda, filtros, paginación, validaciones
- [ ] Stock: entradas, salidas, ajustes, alertas min_stock
- [ ] Dashboard: KPIs, críticos, movimientos recientes
- [ ] Reportes y auditoría consultables
- [ ] API REST + Swagger UI

### Seguridad

- [ ] Keycloak: realm, clients, roles, scopes, policies
- [ ] OAuth2 + JWT en todos los endpoints `/api/v1`
- [ ] CORS restringido
- [ ] Refresh tokens y expiración configurados
- [ ] Pruebas 401 y 403 pasando

### Testing

- [ ] Unit ≥ 70% servicios
- [ ] Integration con Testcontainers en CI
- [ ] API: RestAssured / Schemathesis
- [ ] E2E Playwright
- [ ] ZAP + dependency check
- [ ] k6 documentado

### Observabilidad

- [ ] Prometheus, Loki, Tempo operativos
- [ ] Grafana ≥ 2 dashboards
- [ ] Alertmanager con reglas

### CI/CD

- [ ] GitHub Actions en PR
- [ ] Jenkins hasta staging
- [ ] SonarQube Quality Gate
- [ ] Smoke post-deploy

### Repositorio

- [ ] README profesional
- [ ] Estrategia de ramas aplicada
- [ ] Conventional Commits
- [ ] `/docs` completo
- [ ] `qa-evidence.md` con capturas

### Definición de listo global

El proyecto está listo cuando, con un solo `docker compose -f docker-compose.staging.yml up`:

1. Se inicia sesión con Keycloak en el frontend.  
2. Se opera inventario (productos + stock).  
3. Swagger prueba la API con JWT.  
4. Grafana muestra métricas, logs y trazas.  
5. Jenkins/GitHub Actions y SonarQube muestran calidad verde.  
6. Los reportes de prueba están archivados y referenciados.

---

## Anexos operativos

### Anexo A. Variables de entorno

Copiar a `.env` (no commitear). Mantener `.env.example` en el repo.

```bash
# Backend
SPRING_PROFILES_ACTIVE=dev
DATABASE_URL=jdbc:postgresql://postgres:5432/inventory
DATABASE_USERNAME=inventory_user
DATABASE_PASSWORD=inventory_password
KEYCLOAK_ISSUER_URI=http://keycloak:8080/realms/inventory-realm
KEYCLOAK_JWKS_URI=http://keycloak:8080/realms/inventory-realm/protocol/openid-connect/certs
OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4317
OTEL_SERVICE_NAME=inventory-api

# Frontend
VITE_API_URL=http://localhost:8080/api/v1
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=inventory-realm
VITE_KEYCLOAK_CLIENT_ID=inventory-frontend

# Observabilidad
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
PROMETHEUS_RETENTION=7d

# SonarQube
SONAR_HOST_URL=http://sonarqube:9000
SONAR_TOKEN=replace_with_local_token

# Jenkins
JENKINS_ADMIN_ID=admin
JENKINS_ADMIN_PASSWORD=admin
```

### Anexo B. Comandos de referencia

```bash
# Desarrollo
docker compose -f docker-compose.dev.yml up -d

# Staging completo
docker compose -f docker-compose.staging.yml up -d --build

# Logs backend
docker compose -f docker-compose.staging.yml logs -f backend

# Tests backend
cd backend && ./mvnw test
cd backend && ./mvnw verify -P integration-tests

# Frontend dev
cd frontend && npm install && npm run dev

# E2E
cd frontend && npx playwright test

# Performance
k6 run tests/performance/k6/products-load-test.js

# SonarQube
./mvnw sonar:sonar \
  -Dsonar.projectKey=inventory-qas \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=$SONAR_TOKEN
```

### Anexo C. Definición de hecho por funcionalidad

| Dimensión | Criterio |
|-----------|----------|
| Código | Compila, modular, sin secretos |
| Pruebas | Unit o integration; pipeline verde |
| Seguridad | Permiso correcto; 401/403 cubiertos |
| Observabilidad | correlationId en logs; métrica/traza si aplica |
| Documentación | README o doc actualizado |
| Evidencia | Captura en qa-evidence si se demuestra en defensa |

### Anexo D. Orden de trabajo diario sugerido (calendario)

| Día / Sprint | Foco |
|--------------|------|
| 1-2 | Fase 0 completa |
| 3-5 | Fase 1: Flyway, product, stock, Swagger |
| 6-8 | Fase 2: Keycloak + Spring Security + login UI |
| 9-10 | Fase 3: Dashboard + Envers + audit UI |
| 11-14 | Fase 4: unit → integration → API → E2E → ZAP → k6 |
| 15-17 | Fase 5: OTel + Grafana + alertas |
| 18-20 | Fase 6: GitHub Actions + Jenkins + Sonar + staging |
| 21+ | Fase 7: docs, evidencias, ensayo de defensa |

### Anexo E. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Demasiadas herramientas | Priorizar MVP; extras al final |
| Keycloak lento de configurar | Realm export desde día 1 de Fase 2 |
| Observabilidad abrumadora | Primero logs + métricas; luego trazas |
| Testing al final | Escribir tests junto con cada servicio |
| Pipeline pesado | GitHub Actions rápido; Jenkins solo entrega completa |
| Falta de evidencias | Actualizar `qa-evidence.md` cada vez que algo pase |

---

## Referencia rápida de endpoints API

| Método | Endpoint | Permiso |
|--------|----------|---------|
| GET | `/api/v1/products` | `product:view` |
| GET | `/api/v1/products/{id}` | `product:view` |
| POST | `/api/v1/products` | `product:manage` |
| PUT | `/api/v1/products/{id}` | `product:manage` |
| DELETE | `/api/v1/products/{id}` | `product:manage` |
| GET | `/api/v1/stock` | `stock:view` |
| GET | `/api/v1/stock/movements` | `stock:view` |
| POST | `/api/v1/stock/movements` | `stock:manage` |
| GET | `/api/v1/reports/dashboard` | `report:view` |
| GET | `/api/v1/reports/critical-products` | `report:view` |
| GET | `/api/v1/audit` | `audit:view` |
| GET | `/actuator/health` | público |

---

*Documento generado para el equipo QAS — alinear ejecución con el Plan de Implementación Técnica v3.0.*
