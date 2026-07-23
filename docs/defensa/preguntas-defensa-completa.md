# Preguntas para la Defensa — Guía completa con rutas de código

Documento para la rama **[presentacion](https://github.com/carolinabencosme/quality_assurance/tree/presentacion)**. Cada respuesta incluye **qué decir en voz alta**, **enlace directo al código** y **cómo demostrarlo en vivo**.

> **Cómo usarlo en la defensa:** para la presentación oral en el orden del profesor, abre primero **[guion-presentacion-manana.md](guion-presentacion-manana.md)**. Para preguntas técnicas puntuales, usa la sección [12. Guion oral y novedades](#12-guion-oral-y-novedades-cub-v06) o el número de pregunta.

**Repositorio:** [github.com/carolinabencosme/quality_assurance](https://github.com/carolinabencosme/quality_assurance)

**URLs del demo (stack levantado):**


| Servicio            | URL                                                                            | Credenciales                                                   |
| ------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| App Cub             | [http://localhost:3000](http://localhost:3000)                                 | `viewer/viewer123`, `admin/admin123`, `warehouse/warehouse123` |
| Swagger             | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | JWT desde Keycloak                                             |
| Keycloak Admin      | [http://localhost:8081](http://localhost:8081)                                 | `admin/admin`                                                  |
| Grafana             | [http://localhost:3030](http://localhost:3030)                                 | `admin/admin`                                                  |
| Prometheus          | [http://localhost:9090](http://localhost:9090)                                 | —                                                              |
| Jenkins (staging)   | [http://localhost:8082](http://localhost:8082)                                 | tras `docker-compose.staging.yml`                              |
| SonarQube (staging) | [http://localhost:9000](http://localhost:9000)                                 | tras staging                                                   |


**Levantar todo:**

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

**Usuarios:** se crean al importar `keycloak/realm-export.json` (no están hardcodeados en la app). Ver sección Seguridad.

---

## 1. Arquitectura y diseño

### 1. ¿Qué modelo arquitectónico se utilizó (MVC, MVVM, Clean, etc.)?

**Respuesta:** Arquitectura **en capas** (no microservicios):

- **Backend:** Controller → Service → Repository → Entity (patrón **MVC / layered** de Spring). El controller solo recibe HTTP y delega; la lógica vive en el service; JPA accede a Postgres vía repository.
- **Frontend:** **App Router de Next.js 16** (React 19) — páginas en `app/`, componentes reutilizables en `components/`, lógica HTTP en `lib/`. No es MVVM; es **component-based + hooks** con separación presentación / cliente API.

**Qué decir:** *"Tomamos el dominio Product como ejemplo: el usuario ve la tabla en Next.js, la petición llega al ProductController, el ProductService aplica reglas y filtros, y ProductRepository persiste en PostgreSQL."*

**Rutas clave (clic → código en GitHub):**


| Capa               | Ejemplo productos                                                                                                                                                                                                                | Qué hace                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Controller         | `[ProductController.java](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/controller/ProductController.java)`                                        | REST `/api/v1/products`, `@PreAuthorize`, paginación Spring     |
| Service            | `[ProductService.java](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/service/ProductService.java)`                                                 | CRUD, validación SKU único, filtros con `ProductSpecifications` |
| Repository         | `[ProductRepository.java](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/repository/ProductRepository.java)`                                        | `JpaRepository` + `JpaSpecificationExecutor`                    |
| Entity             | `[Product.java](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/entity/Product.java)`                                                                | `@Entity`, `@Audited` (Envers), relación con `Category`         |
| DTO respuesta      | `[ProductResponse.java](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/dto/ProductResponse.java)`                                                   | JSON que ve el frontend (no expone entidad JPA)                 |
| Vista UI           | `[products/page.tsx](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/app/(app)`/products/page.tsx)                                                                                              | Tabla, filtros, paginación, link Editar                         |
| Editar / inactivar | `[products/[id]/edit/page.tsx](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/app/(app)`/products/%5Bid%5D/edit/page.tsx)                                                                      | Formulario edición + modal confirmación inactivar               |
| Cliente HTTP       | `[axiosClient.ts](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/axiosClient.ts)`, `[api.ts](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/api.ts)` | Axios + interceptores JWT                                       |


---

### 2. ¿Qué granularidad se utiliza?

**Respuesta:** **Monorepo modular** con separación por dominio (product, stock, audit, report, security). Un despliegue = un backend + un frontend + servicios de infra (Postgres, Keycloak, observabilidad). Granularidad **media**: bounded contexts en paquetes Java, no microservicios independientes.

**Ruta:** `backend/src/main/java/com/company/inventory/` (subpaquetes por dominio).

---

### 3. ¿Monolito o microservicios?

**Respuesta:** **Monolito modular** (un JAR Spring Boot). Keycloak y Postgres son procesos separados en Docker, pero la lógica de negocio vive en un solo API.

**Ruta:** `backend/pom.xml`, `docker-compose.dev.yml` (servicio `backend` único).

---

### 4. ¿Stack tecnológico?


| Capa           | Tecnología                                               | Archivo / evidencia                                   |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| API            | Java 21, Spring Boot 3.4                                 | `backend/pom.xml`                                     |
| Seguridad      | Spring Security OAuth2 Resource Server, Keycloak 26      | `SecurityConfig.java`, `keycloak/realm-export.json`   |
| Persistencia   | PostgreSQL 16, JPA/Hibernate, Flyway, Envers             | `db/migration/V*.sql`, `application.yml`              |
| Frontend       | Next.js 16, React, TypeScript, Axios                     | `frontend/package.json`                               |
| Auth UI        | OIDC Authorization Code + PKCE                           | `frontend/lib/auth.ts`, `frontend/lib/oidc-config.ts` |
| Contenedores   | Docker, Docker Compose                                   | `docker-compose.dev.yml`                              |
| Tests          | JUnit 5, Mockito, Testcontainers, Playwright, Newman, k6 | `backend/src/test/`, `tests/`                         |
| CI             | GitHub Actions, Jenkins (staging)                        | `.github/workflows/`, `Jenkinsfile`                   |
| Observabilidad | OpenTelemetry, Prometheus, Loki, Tempo, Grafana Alloy    | `docker-compose.observability.yml`, `observability/`  |


---

### 5. ¿Enfoque para presentación de datos?

**Respuesta:**

- **API:** JSON REST con DTOs (`ProductResponse`, etc.) — no expone entidades JPA directamente.
- **Frontend:** React state + componentes (`DataTable`, `ProductFilters`). Datos llegan vía Axios y se renderizan en JSX.
- **Paginación:** objeto Spring `Page<T>` serializado a JSON (`content`, `totalElements`, `totalPages`).

**Rutas:** `backend/.../dto/ProductResponse.java`, `frontend/components/DataTable.tsx`, `frontend/lib/types/api.ts` (tipo `Page`).

---

### 6. ¿Patrones / metodologías en Spring?


| Patrón               | Uso                        | Ruta                                             |
| -------------------- | -------------------------- | ------------------------------------------------ |
| Dependency Injection | `@Autowired` / constructor | Todos los `@Service`, `@RestController`          |
| Repository           | Acceso a datos             | `*Repository.java` extends `JpaRepository`       |
| DTO                  | Entrada/salida API         | `*Request.java`, `*Response.java`                |
| Bean Validation      | `@Valid` en controllers    | `ProductRequest.java`                            |
| Method Security      | `@PreAuthorize`            | `ProductController.java`, `StockController.java` |
| Resource Server JWT  | OAuth2                     | `SecurityConfig.java`                            |
| Auditoría            | Hibernate Envers           | entidades `@Audited`, tablas `*_aud`             |
| Migraciones          | Flyway                     | `backend/src/main/resources/db/migration/`       |
| Exception handling   | `@ControllerAdvice`        | `backend/.../common/exception/`                  |


---

## 2. Docker y despliegue

### 7. ¿Sobre qué corre Keycloak?

**Respuesta:** Imagen oficial **Quay.io Keycloak 26.0.7** sobre **Linux en contenedor Docker**, modo `start-dev --import-realm`, con base embebida de desarrollo (H2 en dev). Expone puerto **8081** en el host.

**Ruta:** `docker-compose.dev.yml` → servicio `keycloak`, imagen `quay.io/keycloak/keycloak:26.0.7`.

---

### 8. ¿Keycloak en Docker o standalone?

**Respuesta:** **Docker** (no instalación standalone en el host). Realm importado desde `keycloak/realm-export.json`. Tema Cub montado en `keycloak/themes/`.

**Rutas:** `docker-compose.dev.yml` (líneas `keycloak`), `keycloak/realm-export.json`, `keycloak/themes/cub/`.

---

### 9. Explicar el Dockerfile

**Backend** (`backend/Dockerfile`) — multi-stage:

1. **Stage build:** Maven 3.9 + JDK 21 → `mvn package` → JAR.
2. **Stage run:** JRE 21 Alpine, usuario no-root `inventory`, `EXPOSE 8080`, `java -jar app.jar`.

**Frontend** (`frontend/Dockerfile`): Node 22 Alpine, `npm install`, `npm run dev` (desarrollo).

**Staging frontend** (`frontend/Dockerfile.staging`): build producción Next.js standalone.

**Demo:** abrir `backend/Dockerfile` y explicar las dos etapas (imagen final más pequeña y segura).

---

### 10. Explicar Docker Compose

**Respuesta:** Orquestación por **overlays**:


| Archivo                            | Ambiente         | Servicios                                             |
| ---------------------------------- | ---------------- | ----------------------------------------------------- |
| `docker-compose.dev.yml`           | Desarrollo       | postgres, keycloak, backend, frontend                 |
| `docker-compose.observability.yml` | Overlay          | prometheus, loki, tempo, grafana, alloy, alertmanager |
| `docker-compose.test.yml`          | Tests E2E        | override nombres contenedores                         |
| `docker-compose.staging.yml`       | Staging/CI tools | sonarqube, jenkins, frontend prod                     |


**Red:** `inventory-net`. **Volúmenes:** datos Postgres, node_modules, Grafana.

**Demo:**

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml ps
```

---

### 11. Revisar YAML de configuración

**Respuesta:** Configuración por capas Spring + variables de entorno en Compose.


| Archivo                                                    | Contenido                                               |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| `backend/src/main/resources/application.yml`               | JPA, Flyway, app name                                   |
| `backend/src/main/resources/application-dev.yml`           | `issuer-uri` Keycloak                                   |
| `backend/src/main/resources/application-observability.yml` | OTel, logging JSON                                      |
| `docker-compose.dev.yml`                                   | `KEYCLOAK_ISSUER_URI`, `DATABASE_URL`, proxies frontend |
| `.env.example`                                             | Plantilla variables                                     |


---

### 12. ¿Tres ambientes (Dev, QA/Staging, Producción)?

**Respuesta:**


| Ambiente       | Cómo se modela                                                          | Estado                                 |
| -------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| **Desarrollo** | `docker-compose.dev.yml`                                                | ✅ Completo                             |
| **QA / Test**  | `docker-compose.dev.yml` + `docker-compose.test.yml`                    | ✅ E2E, Newman local                    |
| **Staging**    | + `docker-compose.staging.yml` (Jenkins, SonarQube)                     | ✅ Definido                             |
| **Producción** | Mismo patrón Compose + `Dockerfile.staging`; sin cloud provider en repo | ⚠️ Documentado, no desplegado en cloud |


**Ruta:** `docs/deployment-guide.md`, `docker-compose.staging.yml`.

---

## 3. Base de datos

### 13. ¿Cómo se renderiza la lista de productos?

**Flujo:**

1. `ProductsPage` construye query `page`, `size`, `sort`, filtros.
2. `apiGet<Page<Product>>('/products?...')` → Axios → `GET /api/v1/products`.
3. Backend devuelve `Page<ProductResponse>`.
4. `DataTable` renderiza `products` en tabla.

**Qué decir:** *"La página React construye la query con page, size, sort y filtros; Axios llama al API con el JWT; Spring devuelve un Page JSON; DataTable pinta las filas. Si hay más de 10 productos, paginamos con offset — por eso en E2E buscamos por ID o filtro SKU, no solo la primera página."*

**Rutas (enlaces directos):**

- `[products/page.tsx](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/app/(app)`/products/page.tsx) — `loadProducts()`, `buildQuery()`
- `[DataTable.tsx](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/components/DataTable.tsx)`
- `[ProductController.java](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/controller/ProductController.java)` — `findAll()`
- `[ProductService.java](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/service/ProductService.java)` — lógica y filtros
- `[ProductSpecifications.java](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/repository/ProductSpecifications.java)` — búsqueda LIKE en name/sku/description

**Demo:** login `viewer` → [http://localhost:3000/products](http://localhost:3000/products)

---

### 14–15. ¿Cómo se consume la información desde la BD?

**Flujo completo:**

```
React (page.tsx)
  → api.ts / axiosClient.ts (Bearer JWT)
  → ProductController
  → ProductService
  → ProductRepository (Spring Data JPA)
  → Hibernate SQL
  → PostgreSQL (tabla products)
```

**Rutas:** `ProductRepository.java`, `Product.java` (`@Entity`), `ProductService.java`.

---

### 16. Mostrar el cliente HTTP

**Respuesta:** **Axios** encapsulado en `axiosClient.ts`; funciones helper en `api.ts`.

- Base URL: `NEXT_PUBLIC_API_URL` → `/api/v1` (proxy Next → backend).
- Interceptor añade `Authorization: Bearer <token>`.
- Interceptor maneja 401 → redirect login.

**Rutas:**

- `frontend/lib/axiosClient.ts` — cliente e interceptores
- `frontend/lib/api.ts` — `apiGet`, `apiPost`, `apiPut`, `apiDelete`
- `frontend/next.config.ts` — rewrite `/api/`* → backend:8080

**Demo en DevTools:** Network → petición `products?page=0` → header `Authorization`.

---

### 17–18. ¿Paginación? ¿Offset, Page, Cursor?

**Respuesta:** Sí. Mecanismo **Page / Offset** de Spring Data:

- Parámetros: `page` (0-based), `size`, `sort` (ej. `name,asc`).
- Implementación: `Pageable` + `Page<T>` — internamente **LIMIT/OFFSET** en SQL.
- No usamos cursor-based pagination.

**Rutas:**

- Backend: `ProductController.findAll(..., Pageable pageable)` con `@PageableDefault(size = 20)`
- Frontend: `filters.page`, `filters.size` en `products/page.tsx`
- Test: `ProductApiIntegrationTest.listProducts_returnsSeededCatalogWithPagination()`

---

### 19. Mostrar esquema de BD

**Respuesta:** Versionado con **Flyway** (`V1`–`V7`).


| Migración | Tabla / contenido                  |
| --------- | ---------------------------------- |
| V1        | `categories`                       |
| V2        | `products`                         |
| V3        | `stock_movements`                  |
| V4        | `users_profile`                    |
| V5        | tablas Envers (`revinfo`, `*_aud`) |
| V6        | seed catálogo                      |
| V7        | índices y constraints              |


**Rutas:** `backend/src/main/resources/db/migration/V*.sql`

**Demo:** `\dt` en Postgres o mostrar `V2__create_products_table.sql` en pantalla.

---

### 20. ¿Por qué no se versiona la API?

**Respuesta:** **Sí está versionada:** prefijo `**/api/v1/`** en todos los controllers.

**Ruta:** `@RequestMapping("/api/v1/products")` en `ProductController.java`.

Si el profesor pregunta por v2: se podría duplicar controller o usar header `Accept-Version`; hoy solo existe **v1** por alcance académico.

---

## 4. Seguridad y Keycloak

### 21–22. ¿Cómo está integrado Keycloak? ¿Correctamente?

**Respuesta:** Sí.


| Componente   | Integración                                                              |
| ------------ | ------------------------------------------------------------------------ |
| **Frontend** | OIDC Authorization Code + **PKCE** (cliente público SPA)                 |
| **Keycloak** | Realm `inventory-realm`, clientes `inventory-frontend` y `inventory-api` |
| **Backend**  | OAuth2 **Resource Server** — valida JWT con JWKS de Keycloak             |


**Qué decir:** *"El frontend es un cliente público OIDC: no guarda client_secret. Usamos Authorization Code con PKCE; Keycloak muestra el login con tema Cub oscuro; el callback intercambia el code por tokens; el access token va en cookie y Axios lo envía al API, que lo valida como Resource Server."*

**Rutas (enlaces directos):**

- Realm: `[keycloak/realm-export.json](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/keycloak/realm-export.json)`
- Login UI: `[LoginForm.tsx](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/components/LoginForm.tsx)` → `[auth.ts](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/auth.ts)` → `startLogin()`
- PKCE: `[pkce.ts](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/pkce.ts)`
- Callback: `[AuthCallbackClient.tsx](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/components/AuthCallbackClient.tsx)`
- Config OIDC: `[oidc-config.ts](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/oidc-config.ts)`
- Proxy Keycloak (CSS/recursos): `[next.config.ts](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/next.config.ts)`
- Tema login Cub: `[keycloak/themes/cub/](https://github.com/carolinabencosme/quality_assurance/tree/presentacion/keycloak/themes/cub)`
- Middleware rutas protegidas: `[middleware.ts](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/middleware.ts)`

---

### 23–24. ¿Cómo se maneja la seguridad? ¿Mecanismo API?

**Respuesta:**

1. **Autenticación:** JWT Bearer emitido por Keycloak.
2. **Autorización:** permisos granulares (`product:view`, `stock:manage`, …) en `@PreAuthorize`.
3. **Sin JWT** → 401. **JWT sin permiso** → 403 JSON.

**Ruta principal:** `backend/.../security/SecurityConfig.java`

```java
.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
.oauth2ResourceServer(oauth2 -> oauth2.jwt(...))
.requestMatchers("/api/v1/**").authenticated()
```

---

### 25. ¿En qué punto se envía la seguridad al cliente?

**Respuesta:**

1. Tras login OIDC, Keycloak devuelve tokens al callback.
2. `auth.ts` guarda `access_token` en **cookie** `inventory_access` (y refresh en `localStorage`).
3. Cada petición API: interceptor Axios añade `Authorization: Bearer ...`.

**Rutas:** `frontend/lib/auth.ts` (`setCookie`, `exchangeCodeForTokens`), `frontend/lib/axiosClient.ts` (interceptor request).

---

### 26. ¿Cuándo conoce el servidor los permisos?

**Respuesta:** En **cada request**, al validar el JWT:

1. Spring decodifica JWT con claves JWKS de Keycloak.
2. `KeycloakJwtAuthoritiesConverter` extrae roles de `realm_access` y `resource_access.inventory-api.roles`.
3. `RealmRolePermissions` expande roles compuestos a permisos (`inventory-admin` → `product:manage`, …).
4. `@PreAuthorize` evalúa `hasAuthority('product:view')`.

**Rutas:**

- `KeycloakJwtAuthoritiesConverter.java`
- `RealmRolePermissions.java`
- `Permission.java`

---

### 27. ¿Sesión stateful o stateless?

**Respuesta:** **Stateless** en el backend (`SessionCreationPolicy.STATELESS`). No hay sesión HTTP en Spring ni Redis.

El frontend mantiene tokens en cookie/localStorage; Keycloak mantiene su propia sesión SSO en el navegador (cookie de Keycloak), independiente del API.

---

### 28. ¿Qué pasa si creo un nuevo rol en Keycloak?

**Respuesta:**

1. Si el rol es **realm role** nuevo sin composite → el backend **no** le asigna permisos hasta mapearlo en `RealmRolePermissions.java`.
2. Si es **client role** en `inventory-api` (ej. `product:manage`) → se lee **dinámicamente** del JWT vía `resource_access`.
3. En el **frontend**, `permissions.ts` tiene espejo de composites para ocultar botones UI.

**Para que funcione end-to-end:** asignar client roles de `inventory-api` o actualizar el mapa en `RealmRolePermissions` + `permissions.ts`.

**Rutas:** `keycloak/realm-export.json` (composites), `RealmRolePermissions.java`, `frontend/lib/permissions.ts`.

---

### 29. ¿Roles dinámicos o hardcodeados?

**Respuesta:** **Híbrido:**

- **Client roles** (`product:view`, …) → **dinámicos** desde JWT.
- **Realm roles compuestos** → mapeo **explícito** en código (espejo del realm export).

**Ruta:** `KeycloakJwtAuthoritiesConverter.java` líneas 24–37.

---

### 30. ¿Swagger en producción?

**Respuesta:** Swagger/OpenAPI está **público** (sin JWT) por configuración de desarrollo/demo:

- Rutas públicas: `PublicApiPaths.OPENAPI` → `/swagger-ui.html`, `/api-docs/`**
- En producción real se **restringiría** quitando esas rutas de `permitAll` o deshabilitando springdoc.

**Rutas:** `PublicApiPaths.java`, `SecurityConfig.java`, redirect `/` → Swagger en `RootRedirectController.java`.

**Demo:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) → Authorize con Bearer token.

---

### 31–32. Flujo de login y autenticación en código

**Flujo OIDC + PKCE:**

```
1. Usuario → LoginForm → startLogin()
2. Genera code_verifier + code_challenge (pkce.ts)
3. Redirect → Keycloak /auth?client_id=inventory-frontend&...
4. Usuario autentica en Keycloak (tema cub)
5. Redirect → /auth/callback?code=...
6. exchangeCodeForTokens() → POST /token con code + verifier
7. Cookie inventory_access + redirect /dashboard
```

**Rutas:**


| Paso             | Archivo                                               |
| ---------------- | ----------------------------------------------------- |
| Botón login      | `frontend/components/LoginForm.tsx`                   |
| PKCE             | `frontend/lib/pkce.ts`                                |
| OIDC             | `frontend/lib/auth.ts`, `frontend/lib/oidc-config.ts` |
| Callback         | `frontend/components/AuthCallbackClient.tsx`          |
| Protección rutas | `frontend/middleware.ts`                              |


---

### 33–34. Seguridad en código y contexto usuario "X"

**Backend:** Spring Security Context tiene `JwtAuthenticationToken` con authorities. No hay "usuario X" en sesión servidor; el **subject** del JWT es el username (`preferred_username`).

**Frontend:** decodifica JWT en cliente solo para **UI** (mostrar/ocultar botones); la **autorización real** es siempre en el API.

**Demo 403:** login `viewer` → intentar crear producto → API devuelve 403 o botón oculto vía `canManageProducts()`.

**Rutas:** `ApiSecurityMvcTest.java`, `ResourceServerSecurityIntegrationTest.java`, `frontend/lib/permissions.ts`.

---

## 5. Testing y calidad

### 35. Mostrar tests de integración

**Rutas principales:**


| Test                                         | Qué valida                                                   |
| -------------------------------------------- | ------------------------------------------------------------ |
| `ProductApiIntegrationTest.java`             | CRUD, paginación, filtros con Postgres real (Testcontainers) |
| `StockApiIntegrationTest.java`               | Movimientos stock, reglas RF-STK                             |
| `ResourceServerSecurityIntegrationTest.java` | 401/403 con JWT                                              |
| `ReportApiIntegrationTest.java`              | Reportes                                                     |


**Demo:**

```powershell
cd backend
.\mvnw.cmd test -Dtest=ProductApiIntegrationTest
```

---

### 36–37. Herramientas de testing (todas)


| Tipo            | Herramienta                                        | Ubicación                                                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit            | JUnit 5, Mockito, AssertJ                          | `backend/src/test/java/**/service/*Test.java`                                                                                                                                                                                                            |
| Integración API | Spring Boot Test + MockMvc + **Testcontainers**    | `backend/src/test/java/**/api/*IntegrationTest.java`                                                                                                                                                                                                     |
| Seguridad MVC   | `@WebMvcTest`                                      | `ApiSecurityMvcTest.java`                                                                                                                                                                                                                                |
| API externa     | **Newman** (Postman)                               | `tests/api/inventory-qas.postman_collection.json`                                                                                                                                                                                                        |
| E2E UI          | **Playwright** (9 escenarios, login Keycloak real) | `[tests/e2e/specs/](https://github.com/carolinabencosme/quality_assurance/tree/presentacion/tests/e2e/specs)`, helper `[keycloak-login.ts](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/e2e/helpers/keycloak-login.ts)` |
| Performance     | **k6**                                             | `tests/performance/k6/smoke.js`                                                                                                                                                                                                                          |
| Seguridad smoke | PowerShell                                         | `tests/security/auth-smoke.ps1`                                                                                                                                                                                                                          |
| Observabilidad  | PowerShell                                         | `tests/observability/smoke.ps1`                                                                                                                                                                                                                          |
| Cobertura       | **JaCoCo** (≥60% líneas)                           | `backend/pom.xml`, `target/site/jacoco/`                                                                                                                                                                                                                 |


---

### 38. ¿Qué se modifica en BD vs código en tests?


| Ámbito             | Qué pasa                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **BD integración** | Testcontainers levanta Postgres **efímero**; Flyway aplica migraciones; `@Transactional` revierte cambios por test |
| **Código**         | No se modifica producción; solo se ejecutan tests                                                                  |
| **Newman/E2E**     | Usan stack Docker dev/test; pueden crear productos de prueba (SKU único)                                           |
| **Unit tests**     | Mockito — sin BD                                                                                                   |


**Ruta Testcontainers:** `ProductApiIntegrationTest.java` — `@Container PostgreSQLContainer`, `@ServiceConnection`.

---

### 39. Para qué sirve cada tipo de test


| Tipo           | Sirve para                                            |
| -------------- | ----------------------------------------------------- |
| Unit           | Lógica de negocio aislada (reglas, validaciones)      |
| Integration    | Contrato HTTP + BD real (repositorios, SQL, Flyway)   |
| API Newman     | Escenarios REST completos con Keycloak real (CI)      |
| E2E Playwright | Flujo usuario en navegador (login → dashboard → CRUD) |
| k6             | Carga / smoke performance                             |
| auth-smoke     | Verificar 401/403 en caliente                         |
| JaCoCo         | Métricas cobertura para evidencia académica           |


---

### 40. Mostrar ejecución de tests

**Qué decir:** *"Tenemos pirámide de pruebas: unitarias con Mockito, integración con Testcontainers y Postgres real, Newman contra el stack Docker, Playwright simulando login OIDC real en Chromium, y smokes de seguridad/observabilidad. El script `run-all-tests.ps1` ejecuta los cinco bloques en orden desde la raíz del monorepo."*

**E2E estabilizados (v0.6):**

| Problema | Solución en código |
| -------- | ------------------ |
| Login Keycloak intermitente | [`resetBrowserSession()`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/e2e/helpers/keycloak-login.ts) limpia cookies/storage; `waitUntil: 'commit'` en callback |
| Producto no en página 1 del listado | CRUD E2E guarda `productId` y navega directo a `/products/{id}/edit` |
| Inactivar no redirige | Modal React (no `window.confirm`) — test confirma en [`product-crud.spec.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/e2e/specs/product-crud.spec.ts) |
| Suite completa | [`scripts/run-all-tests.ps1`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/scripts/run-all-tests.ps1) → esperado **9/9 Playwright PASS** |

```powershell
# Backend completo + cobertura
cd backend
.\mvnw.cmd verify

# API Newman
cd tests\api
npm install
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=$sku"

# E2E
cd tests\e2e
npm install
npx playwright install chromium
$env:E2E_BASE_URL = "http://localhost:3000"
npm test

# Seguridad + observabilidad
.\tests\security\auth-smoke.ps1
.\tests\observability\smoke.ps1
```

---

### 41. Provocar falla y ver reacción

**Ejemplo 1 — test unitario:**

```powershell
cd backend
.\mvnw.cmd test -Dtest=ProductServiceTest#createProduct_duplicateSkuThrows
```

Modificar temporalmente assertion → test en rojo → revertir.

**Ejemplo 2 — API sin token:**

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/api/v1/products
# Esperado: 401
```

**Ejemplo 3 — Newman escenario 04** (401 sin JWT) en colección Postman.

---

### 42. Tests en GitHub

**Rutas:**

- `.github/workflows/ci.yml` — `mvn verify`, frontend build, Sonar opcional
- `.github/workflows/api-postman.yml` — stack Docker + Newman
- `.github/workflows/deploy-staging.yml` — deploy staging

**Demo:** GitHub → Actions → workflow **CI** → job **backend** → logs `mvn verify`.

---

## 6. CI/CD y automatización

### 43–44. Workflows y explicación


| Workflow             | Trigger                                | Jobs                                                  |
| -------------------- | -------------------------------------- | ----------------------------------------------------- |
| `ci.yml`             | push/PR main, develop                  | backend test+JaCoCo, frontend build, sonar (opcional) |
| `api-postman.yml`    | push main/develop (paths api/keycloak) | Docker postgres+keycloak+backend → Newman             |
| `deploy-staging.yml` | manual / push develop                  | staging compose                                       |


---

### 45–46. GitHub Actions vs Jenkins

**Respuesta:**

- **GitHub Actions:** CI principal en cada push (tests, build, Newman).
- **Jenkins:** Pipeline complementario para **staging** local (SonarQube, deploy opcional, smoke post-deploy). Definido en `Jenkinsfile`.

No compiten: GHA valida calidad en cloud; Jenkins demuestra pipeline empresarial on-prem en staging.

**Ruta:** `Jenkinsfile`, `docs/ci-cd-guide.md`.

---

### 47. Validar Jenkins

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d jenkins
# http://localhost:8082
```

Pipeline: checkout → `mvn verify` → `npm build` → Sonar (si token) → deploy staging (parámetro).

---

## 7. Observabilidad

### 48. Validar Grafana

```powershell
.\tests\observability\smoke.ps1
# Abrir http://localhost:3030 — admin/admin
# Dashboard: observability/grafana/provisioning/dashboards/json/inventory-api.json
```

---

### 49. Métricas monitoreadas

- **JVM / Spring Boot:** Micrometer → Prometheus (`/actuator/prometheus`)
- **HTTP:** latencia, status codes
- **Logs:** JSON estructurado → Loki (vía Alloy)
- **Trazas:** OpenTelemetry → Tempo

**Rutas:** `application-observability.yml`, `observability/prometheus/prometheus.yml`, `observability/alloy/config.alloy`.

---

### 50. Visualizar logs y métricas

1. **Grafana Explore** → Prometheus: `http_server_requests_seconds_count`
2. **Loki:** `{container=~"inventory-.*"}`
3. **Tempo:** buscar trace tras llamar API con JWT

**Guía:** `docs/observability-guide.md`

---

### 51. ¿Fault tolerance / caída de servicio?

**Respuesta (alcance actual):**

- **Healthchecks** Docker en postgres, keycloak, backend, frontend (`docker-compose.dev.yml`).
- **depends_on: condition: service_healthy** — backend espera Keycloak.
- **Restart policy:** `unless-stopped`.
- **Alertmanager** configurado para alertas Prometheus (overlay observability).
- No hay circuit breaker / réplicas múltiples (monolito académico).

**Demo:** `docker stop inventory-backend-dev` → frontend muestra error de red; `docker start` → recuperación.

---

## 8. Demostraciones prácticas (guion en vivo)

### 52. Render lista en frontend

→ Sección 13. Abrir DevTools Network + tabla productos.

### 53. Flujo frontend → BD

```
Browser → axiosClient → Next proxy /api/v1 → ProductController
→ ProductService → ProductRepository → PostgreSQL
```

Mostrar en paralelo: pestaña Network + log SQL (si `show-sql` en dev) o Swagger.

### 54. Roles Keycloak → aplicación

```
Keycloak realm role (inventory-viewer)
  → composite client roles en inventory-api
  → JWT access_token (claim resource_access)
  → KeycloakJwtAuthoritiesConverter
  → @PreAuthorize en API
  → permissions.ts en UI (botones)
```

**Demo:** comparar JWT en jwt.io con `viewer` vs `admin`.

### 55. Flujo autenticación + autorización completo

Combinar secciones 31 + 26 + demo viewer (lectura) vs warehouse (crear producto).

### 56. Demo login y seguridad

1. [http://localhost:3000](http://localhost:3000) → login Keycloak tema Cub
2. `viewer` → dashboard sin botón "Nuevo producto"
3. Logout → login `warehouse` → crear producto
4. Swagger sin token → 401

### 57. Esquema BD

Mostrar migraciones `V1`–`V7` o diagrama en `docs/architecture.md`.

### 58. Cliente HTTP

Abrir `frontend/lib/axiosClient.ts` en IDE + DevTools Network.

---

## 9. Preguntas adicionales (seguridad / BD / pruebas)

### Testcontainers — ¿cómo y beneficios?

**Ruta:** `ProductApiIntegrationTest.java`

```java
@Container
@ServiceConnection
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
```

**Beneficio:** misma BD real que producción, aislada por test, sin mock de SQL.

---

### Control de versiones BD (Flyway)

**Ruta:** `backend/src/main/resources/db/migration/`, `application.yml` (`flyway.enabled: true`).

**Entorno nuevo:** al arrancar backend, Flyway crea `flyway_schema_history` y aplica `V1`…`V7` en orden.

**Demo:**

```powershell
docker compose -f docker-compose.dev.yml up -d postgres backend
docker exec inventory-postgres-dev psql -U inventory_user -d inventory -c "\dt"
```

---

### Comunicación entre componentes

```
Browser ↔ Next.js (3000) ↔ Spring API (8080) ↔ PostgreSQL (5432)
                ↕ proxy                    ↔ Keycloak (8081) valida JWT
Backend → OTLP → Alloy → Prometheus/Loki/Tempo → Grafana (3030)
```

---

### APIs de terceros

**Respuesta:** No consumimos APIs externas de negocio. "Tercero" = **Keycloak** (IdP) vía OIDC estándar.

**Rutas:** `frontend/lib/auth.ts` (token endpoint), `application-dev.yml` (issuer-uri).

---

## 10. Comandos completos para correr todo (Windows)

### A. Preparar entorno (una vez por terminal)

```powershell
cd C:\Users\Josvier\Desktop\quality_assurance
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
# Si mvn verify sigue con 38 skipped: Docker Desktop → Expose daemon tcp://localhost:2375
# $env:DOCKER_HOST = "tcp://localhost:2375"
```

### B. Levantar stack

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
# Esperar ~2 min. Verificar:
curl.exe -s -o NUL -w "fe:%{http_code} api:%{http_code} kc:%{http_code} gf:%{http_code}" `
  http://localhost:3000/ http://localhost:8080/actuator/health `
  http://localhost:8081/realms/inventory-realm http://localhost:3030/api/health
```

### C. Todos los tests (recomendado)

```powershell
.\scripts\run-all-tests.ps1
```

### D. Tests uno a uno (rutas correctas desde la raíz)

```powershell
# Backend + JaCoCo
cd backend; .\mvnw.cmd verify; cd ..

# Newman API
cd tests\api; npm install
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=$sku"
cd ..\..

# Playwright E2E
cd tests\e2e; npm install; npx playwright install chromium
$env:E2E_BASE_URL = "http://localhost:3000"; npm test
cd ..\..

# Smoke (desde raíz, NO desde backend)
.\tests\security\auth-smoke.ps1
.\tests\observability\smoke.ps1

# Capturas defensa
cd tests\e2e; npx playwright test specs/capture-evidence.spec.ts --workers=1; cd ..\..
```

### E. URLs demo


| Servicio | URL                                                                            | Login            |
| -------- | ------------------------------------------------------------------------------ | ---------------- |
| Cub      | [http://localhost:3000](http://localhost:3000)                                 | viewer/viewer123 |
| Swagger  | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | JWT              |
| Keycloak | [http://localhost:8081](http://localhost:8081)                                 | admin/admin      |
| Grafana  | [http://localhost:3030](http://localhost:3030)                                 | admin/admin      |


**Checklist capturas:** `docs/qa-evidence/CHECKLIST-CAPTURAS.md`

---

## 11. Índice de archivos más citados


| Tema | Archivo |
| ---- | ------- |
| Seguridad API | [`SecurityConfig.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/security/SecurityConfig.java) |
| Permisos JWT | [`KeycloakJwtAuthoritiesConverter.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/security/KeycloakJwtAuthoritiesConverter.java) |
| Login OIDC + PKCE | [`auth.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/auth.ts), [`pkce.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/pkce.ts) |
| Cliente HTTP | [`axiosClient.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/axiosClient.ts) |
| Lista productos UI | [`products/page.tsx`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/app/(app)/products/page.tsx) |
| API productos | [`ProductController.java`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/backend/src/main/java/com/company/inventory/product/controller/ProductController.java) |
| Realm Keycloak | [`realm-export.json`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/keycloak/realm-export.json) |
| Tema login Cub | [`keycloak/themes/cub/`](https://github.com/carolinabencosme/quality_assurance/tree/presentacion/keycloak/themes/cub) |
| Docker dev | [`docker-compose.dev.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/docker-compose.dev.yml) |
| Observabilidad | [`docker-compose.observability.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/docker-compose.observability.yml) |
| Migraciones | [`db/migration/`](https://github.com/carolinabencosme/quality_assurance/tree/presentacion/backend/src/main/resources/db/migration) |
| CI GitHub | [`ci.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/.github/workflows/ci.yml) |
| Jenkins | [`Jenkinsfile`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/Jenkinsfile) |
| Tests E2E | [`login-dashboard.spec.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/e2e/specs/login-dashboard.spec.ts), [`product-crud.spec.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/e2e/specs/product-crud.spec.ts) |
| Newman | [`inventory-qas.postman_collection.json`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/tests/api/inventory-qas.postman_collection.json) |
| Run all tests | [`run-all-tests.ps1`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/scripts/run-all-tests.ps1) |

---

## 12. Guion oral y novedades (Cub v0.6)

### Apertura (30 segundos)

> *"Cub es un monorepo de inventario: Spring Boot 3.4 + Next.js 16, autenticación OIDC con Keycloak, PostgreSQL con Flyway y Envers, observabilidad con Prometheus/Grafana/Loki/Tempo, y una pirámide de pruebas automatizadas. Lo levantamos con Docker Compose y lo demostramos en localhost:3000."*

### Novedades que suelen preguntar

| Tema | Respuesta corta | Dónde demostrar |
| ---- | --------------- | --------------- |
| **Marca Cub + UI oscura** | Landing, dashboard y login unificados; login Keycloak con tema custom | [localhost:3000](http://localhost:3000), [`themes/cub`](https://github.com/carolinabencosme/quality_assurance/tree/presentacion/keycloak/themes/cub) |
| **OIDC + PKCE (no password grant)** | Cliente público SPA; más seguro para frontend | [`auth.ts`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/lib/auth.ts), flujo sección 31 |
| **Grafana en puerto 3030** | Evita conflicto con otros frontends en 3001 | [`docker-compose.observability.yml`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/docker-compose.observability.yml) |
| **Soft delete productos** | DELETE lógico (status INACTIVE); modal de confirmación en UI | [`edit/page.tsx`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/frontend/app/(app)/products/%5Bid%5D/edit/page.tsx) |
| **Tests E2E 9/9** | Login real Keycloak + CRUD warehouse + capturas evidencia | `.\scripts\run-all-tests.ps1` |
| **Testcontainers Windows** | `.testcontainers.properties` + variable `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE`; si falla, TCP 2375 | [`run-all-tests.ps1`](https://github.com/carolinabencosme/quality_assurance/blob/presentacion/scripts/run-all-tests.ps1) sección [10.A](#a-preparar-entorno-una-vez-por-terminal) |

### Si preguntan "¿cómo probaste que funciona?"

1. **Backend:** `mvn verify` + JaCoCo ≥ 60 % (unit + integración; integración con Testcontainers si Docker OK).
2. **API:** Newman 14 requests / 29 assertions — token Keycloak, CRUD, 401/403/409.
3. **UI:** Playwright 9 tests — OIDC, dashboard, productos, CRUD, capturas.
4. **Seguridad:** `auth-smoke.ps1` — 401 sin token, 403 viewer en audit.
5. **Observabilidad:** `smoke.ps1` — Prometheus, Grafana, Loki (Tempo puede tardar al arrancar).

### Cierre defensa

> *"La seguridad no depende del frontend: el JWT se valida en cada request en Spring. Keycloak centraliza identidad; Envers audita cambios; Grafana nos da visibilidad operativa. Todo está versionado en Git, probado en CI y documentado en este repositorio."*

---

*Última sincronización: rama `presentacion` — OIDC+PKCE, tema Cub, Grafana 3030, E2E 9/9 estabilizados, enlaces GitHub en guía defensa.*
