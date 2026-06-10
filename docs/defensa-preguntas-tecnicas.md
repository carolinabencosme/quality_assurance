# Preguntas técnicas — respuestas con referencias al código

Este documento resume cómo responde el proyecto **Inventory QAS** (monorepo: Spring Boot + React + Keycloak) a preguntas típicas de defensa o entrevista técnica. Las rutas son relativas a la raíz del repositorio.

---

## Guía rápida: qué abrir si el profesor pide “mostrar el código”

| Tema | Archivo principal | Qué señalar en pantalla |
|------|-------------------|---------------------------|
| Errores HTTP unificados | `backend/src/main/java/com/company/inventory/common/exception/GlobalExceptionHandler.java` | `@RestControllerAdvice`, mapeo de `ApiException`, validación → 400, genérico → 500 |
| Formato JSON de error | `backend/src/main/java/com/company/inventory/common/exception/ApiErrorResponse.java` | Campos `timestamp`, `status`, `error`, `message`, `path`, `correlationId`, `code` |
| Excepciones de dominio | `backend/src/main/java/com/company/inventory/common/exception/ApiException.java` | `notFound`, `conflict`, `badRequest` y `HttpStatus` asociado |
| 404 en servicios | `backend/src/main/java/com/company/inventory/product/service/ProductService.java` | Método `getProductOrThrow`: `findById(...).orElseThrow(() -> ApiException.notFound(...))` |
| Códigos en controlador REST | `backend/src/main/java/com/company/inventory/product/controller/ProductController.java` | `ResponseEntity.status(CREATED)`, `noContent()` en DELETE |
| Seguridad JWT + CORS | `backend/src/main/java/com/company/inventory/security/SecurityConfig.java` | `oauth2ResourceServer`, `STATELESS`, `authenticated()` para `/api/v1/**`, `HttpStatusEntryPoint(UNAUTHORIZED)` |
| Permisos en endpoints | Mismo `ProductController.java` + `backend/src/main/java/com/company/inventory/security/Permission.java` | `@PreAuthorize("hasAuthority('product:view')")` y constantes de permiso |
| Roles desde JWT Keycloak | `backend/src/main/java/com/company/inventory/security/KeycloakJwtAuthoritiesConverter.java` | Claims `realm_access` y `resource_access.inventory-backend.roles` |
| Configuración issuer JWT | `backend/src/main/resources/application.yml` (y `application-dev.yml`) | `spring.security.oauth2.resourceserver.jwt.issuer-uri` |
| Pruebas de API + HTTP | `backend/src/test/java/com/company/inventory/product/api/ProductApiIntegrationTest.java` | `mockMvc` + `status().isCreated()`, `isOk()`, etc. |
| Pruebas de API (Newman, stack real) | `tests/api/inventory-qas.postman_collection.json`, `tests/api/README.md` | ≥14 requests con aserciones; tokens Keycloak password grant |
| Pruebas del manejador de errores | `backend/src/test/java/com/company/inventory/common/exception/GlobalExceptionHandlerTest.java` | 404/400/500 y cuerpo JSON esperado |
| E2E Playwright | `tests/e2e/playwright.config.ts`, `tests/e2e/specs/login-dashboard.spec.ts`, `tests/e2e/specs/product-crud.spec.ts` | Login, dashboard, CRUD producto (`warehouse`) |
| CI (qué corre automático) | `.github/workflows/ci.yml`, `.github/workflows/api-postman.yml` | `ci.yml`: `mvn verify` + build frontend; `api-postman.yml`: Newman contra stack Docker |

---

## 1. Validaciones en el backend Java

### ¿Cómo manejan valores opcionales o nulos?

- En **entrada HTTP**, los DTOs usan **records** y anotaciones **Jakarta Bean Validation** (`@Valid`, `@NotBlank`, etc.) en los controladores (por ejemplo `ProductController` con `@Valid @RequestBody`).
- En **persistencia**, se usa el patrón típico de Spring Data: `Optional` devuelto por `findById`; el servicio no devuelve `Optional` al controlador, sino que **lanza** `ApiException.notFound(...)` si no hay entidad (ver `ProductService.getProductOrThrow`).

**Archivos:** `ProductController.java`, `ProductService.java`, DTOs en `backend/src/main/java/com/company/inventory/product/dto/`.

### ¿`Optional`, validaciones previas o excepciones cuando puede ser `null`?

- **Optional** en repositorio (`findById`); en servicio **`orElseThrow`** → `ApiException` (no se propaga `null` silencioso al API).
- **Validación previa** con métodos privados (`validateSkuUnique`, `validateNonNegative` en `ProductService`).
- **Excepciones controladas** vía `ApiException` con `HttpStatus` explícito.

### ¿Si un recurso no existe, 404 Not Found?

Sí, cuando el servicio usa `ApiException.notFound(...)`, el `GlobalExceptionHandler` responde con el **status** que lleva la excepción (404).

**Mostrar:** `ProductService.java` líneas de `getProductOrThrow` / `getCategoryOrThrow` y `GlobalExceptionHandler.handleApiException`.

### ¿400, 401, 403, 404, 500?

| Código | Origen en el proyecto |
|--------|------------------------|
| **400** | `MethodArgumentNotValidException` → `handleValidation` en `GlobalExceptionHandler`; también `ApiException.badRequest` → negocio |
| **401** | Sin JWT en rutas protegidas: `HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)` en `SecurityConfig` |
| **403** | Sin permiso (`@PreAuthorize`): `AccessDeniedHandler` en `SecurityConfig` **y** handler en `GlobalExceptionHandler` para excepciones de acceso |
| **404** | `ApiException.notFound` |
| **409** | `ApiException.conflict` (p. ej. SKU duplicado) |
| **500** | Cualquier excepción no manejada → `handleGeneric` (mensaje genérico al cliente) |

### ¿Estructura estándar de error del API?

Sí: record **`ApiErrorResponse`** (comentario QA-18 en código).

**Archivo:** `backend/src/main/java/com/company/inventory/common/exception/ApiErrorResponse.java`.

**Demostración en dev:** `ErrorProbeController` bajo `/api/v1/demo/errors/*` (perfil `dev`).

**Archivo:** `backend/src/main/java/com/company/inventory/common/response/ErrorProbeController.java`.

---

## 2. Códigos de estado HTTP

### ¿Cada endpoint devuelve el código correcto?

En los controladores REST revisados (p. ej. productos) se usa **`ResponseEntity`** o tipo de retorno que Spring mapea a 200. Las pruebas de integración verifican los status.

**Ejemplo:** `ProductApiIntegrationTest.java` (`isCreated()`, `isOk()`, etc.).

### Creación exitosa → 201 Created

**Archivo:** `ProductController.java` — método `create`: `ResponseEntity.status(HttpStatus.CREATED).body(created)`.

### Consulta exitosa → 200 OK

Listados y GET por id devuelven cuerpo JSON; Spring responde **200** por defecto (`findAll`, `findById` en `ProductController`).

### Eliminación → 204 No Content

**Archivo:** `ProductController.java` — `delete`: `ResponseEntity.noContent().build()` (inactivación / soft delete según documentación del endpoint).

### Errores de validación en peticiones

- **Bean Validation** (`@Valid`) → `MethodArgumentNotValidException` → **400** con mensaje compuesto de campos en `GlobalExceptionHandler.handleValidation`.

---

## 3. Pruebas del backend

### ¿Pruebas unitarias de servicios?

Sí. Ejemplos: `ProductServiceTest.java`, `StockServiceTest.java`, `ReportServiceTest.java`, mappers, etc. bajo `backend/src/test/java/...`.

### ¿Pruebas de integración de endpoints?

Sí, con **Spring Boot Test** + **MockMvc** y a menudo **Testcontainers** (PostgreSQL), por ejemplo:

- `ProductApiIntegrationTest.java`
- `StockApiIntegrationTest.java`, `StockGetApiIntegrationTest.java`
- `ReportApiIntegrationTest.java`
- Pruebas de seguridad: `ApiSecurityMvcTest.java`, `ResourceServerSecurityIntegrationTest.java`

**Propiedad típica en tests:** `inventory.security.enabled=false` → `SecurityDisabledConfig` (todo permitido para aislar capa web/API).

**Archivo:** `backend/src/main/java/com/company/inventory/security/SecurityDisabledConfig.java`.

### ¿Éxito y error?

Sí: por ejemplo `ProductApiIntegrationTest` incluye casos como creación **201** y SKU duplicado **409**; `GlobalExceptionHandlerTest` cubre 404/400/500.

### ¿Nulos o vacíos?

Se cubre indirectamente vía validación (400) y vía “no encontrado” (404) en servicios; revisar aserciones concretas en cada `*Test.java`.

### ¿Cómo validan códigos HTTP?

Con **MockMvc**: `mockMvc.perform(...).andExpect(status().isXxx())`.

---

## 4. Pruebas del frontend con Playwright

### ¿Qué flujos se prueban?

En **`tests/e2e/specs/login-dashboard.spec.ts`**:

1. Login con usuario `viewer` y comprobación de URL `/dashboard` y textos KPI (“Productos activos”).
2. Navegación a **Productos** (`/products`) y visibilidad del heading.

### ¿En vivo contra la app real?

El **`baseURL`** por defecto es `http://localhost:3000` (configurable con `E2E_BASE_URL`).

**Archivo:** `tests/e2e/playwright.config.ts`.

### ¿Flujo completo login, CRUD, etc.?

- **`tests/e2e/specs/login-dashboard.spec.ts`:** login `viewer`, dashboard y navegación al listado de productos.
- **`tests/e2e/specs/product-crud.spec.ts`:** login **`warehouse`** (`product:manage`), **crear** producto (`/products/new`), **editar** nombre, **inactivar** (DELETE vía UI con diálogo de confirmación).

### ¿Errores del backend en E2E?

No hay un spec dedicado solo a errores HTTP en UI; el flujo CRUD comprueba éxito de formularios contra el API real con sesión autenticada.

### ¿Manual vs CI/CD?

- **CI GitHub Actions** (`.github/workflows/ci.yml`): **backend** `mvn verify` (incluye integración con Testcontainers cuando Docker está disponible) y **frontend** `npm ci` + `npm run build`. **No** ejecuta Playwright en ese workflow.
- **Pruebas de API (Newman):** colección `tests/api/inventory-qas.postman_collection.json` (≥10 escenarios: 401, 400, 403, 404, 409, CRUD). Workflow **API — Newman** (`.github/workflows/api-postman.yml`) levanta stack y ejecuta la colección.
- **E2E local:** `docker-compose.test.yml` + `cd tests/e2e && npm test`.

**Conclusión para el profesor:** Playwright y Newman están **en el repo**; el job principal de CI no corre E2E por tiempo; Newman tiene workflow dedicado (push en rutas `tests/api/**` o ejecución manual).

---

## 5. Autenticación y seguridad

### ¿Qué mecanismo usa el proyecto?

**OAuth 2.0 Resource Server** con **JWT** (tokens emitidos por **Keycloak**).

### ¿Keycloak?

Sí: el backend valida JWT contra el **issuer** configurado (Keycloak realm).

**Archivos:** `application.yml`, `application-dev.yml` (`spring.security.oauth2.resourceserver.jwt.issuer-uri`).

### ¿Integración backend / frontend?

- **Backend:** valida JWT en cada petición a `/api/v1/**` (salvo rutas públicas).
- **Frontend:** en ramas con login completo, el flujo E2E asume formulario de login contra la app en `:3000` (Keycloak suele estar detrás del flujo OIDC del front; detalle depende de la rama y archivos `frontend/`).

### ¿JWT para autenticar solicitudes?

Sí: cabecera **Authorization: Bearer &lt;token&gt;** hacia el API (estándar Spring Resource Server).

### ¿Dónde se valida el token?

En el **backend** (filtro OAuth2 Resource Server de Spring Security). No hay gateway en el monorepo revisado.

### ¿Qué contiene el JWT y datos sensibles?

El backend **no documenta el payload completo** en un solo archivo; los **roles/permisos** usados para autorización se extraen en `KeycloakJwtAuthoritiesConverter` desde claims **`realm_access.roles`** y **`resource_access["inventory-backend"].roles`**. Los secretos no van en el JWT; el cliente debe tratar el token como credencial.

**Archivo:** `KeycloakJwtAuthoritiesConverter.java`.

### ¿Endpoints privados?

- Regla general: **`/api/v1/**` → `authenticated()`** en `SecurityConfig`.
- Públicos: health/actuator indicados, OpenAPI/Swagger, ver arrays en `PublicApiPaths.java`.

**Archivos:** `SecurityConfig.java`, `PublicApiPaths.java`.

### Autorización por recurso

**`@PreAuthorize("hasAuthority('...')")`** en controladores + `@EnableMethodSecurity` en `MethodSecurityConfig.java`.

---

## 6. Manejo de sesiones, tokens y Redis

### ¿Redis para sesiones o tokens?

**No.** No hay dependencias ni configuración de Redis en el backend ni en los compose revisados para este fin.

### ¿JWT stateless o sesión en Redis?

**Stateless** del lado del servidor: `SessionCreationPolicy.STATELESS` en `SecurityConfig.java`.

### ¿Invalidación / refresh / logout?

No está implementado un **revocation store** (Redis) en este código: la invalidación típica sería por **expiración** del token y políticas en **Keycloak** (logout en el IdP). Detallar según lo que tengan configurado en Keycloak (realm/clients).

---

## 7. Preguntas generales de aritectura

### ¿Separación frontend / backend?

Monorepo con carpetas **`frontend/`** (React + Vite) y **`backend/`** (Spring Boot). Se comunican por **HTTP/JSON** al API REST.

### ¿API REST?

Sí, prefijo común **`/api/v1/...`** (productos, stock, reportes, auditoría, etc.).

### ¿Comunicación entre servicios?

El backend habla con **PostgreSQL** (JPA) y valida JWT contra **Keycloak** (descubrimiento JWKS vía issuer). No hay microservicios adicionales obligatorios en el núcleo revisado.

### ¿Protección de endpoints privados?

Spring Security + JWT + `@PreAuthorize` (ver sección 5).

### ¿Estrategia de manejo de errores?

1. Excepciones de negocio/API → **`ApiException`** + **`GlobalExceptionHandler`**.  
2. Errores de validación → **400** con detalle de campos.  
3. Errores no controlados → **500** con mensaje genérico (sin filtrar stack al cliente).  
4. **Correlation ID** en respuestas y trazas: ver `CorrelationIdFilter` (importado en tests del `GlobalExceptionHandler`).

---

## Nota sobre ramas

El contenido exacto (por ejemplo endpoint de “setup” Fase 0 o pantallas concretas del frontend) puede variar entre **`main`**, **`develop`** y **features**. Si algo no aparece en tu árbol local, ejecuta en la raíz del repo:

```bash
git grep -n "setup" -- "*.java" "*.tsx"
```

y alinea tu respuesta con la rama que uses en la defensa.
