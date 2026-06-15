# Preguntas técnicas — Avance Proyecto V3

Guía de estudio y defensa alineada con el PDF **Avance Proyecto V3** (Sistema de Gestión de Inventarios — Full Stack Testing, Observabilidad y DevSecOps).

Para cada bloque del avance: **qué es**, **para qué sirve**, **cómo lo manejamos en el proyecto** y **dónde está en el código**.

Documento complementario: [`preguntas-tecnicas.md`](../defensa-preguntas-tecnicas.md) (errores HTTP, validaciones, Playwright detallado).

---

## 1. Seguridad

### ¿Qué pide el avance?

Keycloak, login OAuth2/JWT, ≥2 usuarios, ≥2 permisos, endpoint protegido validando permisos.

### ¿Para qué sirve en un sistema empresarial?

Separar **autenticación** (quién eres) de **autorización** (qué puedes hacer). Keycloak centraliza identidades; el backend no guarda contraseñas y valida cada petición con JWT firmado.

### ¿Cómo lo manejamos?

| Componente | Rol | Archivo / URL |
|------------|-----|---------------|
| **Keycloak** | Servidor de identidad (IdP), emite JWT | `keycloak/realm-export.json`, http://localhost:8081 |
| **Realm** | `inventory-realm` — usuarios, roles, clientes OAuth2 | realm export versionado |
| **Clientes** | `inventory-frontend` (login UI), `inventory-api` (audience API) | realm export |
| **Backend** | OAuth2 Resource Server — valida JWT en cada `/api/v1/**` | `SecurityConfig.java` |
| **Permisos** | Constantes `product:view`, `stock:manage`, `audit:view`… | `Permission.java` |
| **Autorización** | `@PreAuthorize("hasAuthority('...')")` por endpoint | controladores `*Controller.java` |
| **Claims JWT** | Roles desde `realm_access` y `resource_access` | `KeycloakJwtAuthoritiesConverter.java` |
| **Frontend** | Login password grant / sesión, token en requests Axios | `LoginForm.tsx`, `lib/axiosClient.ts` |

### Usuarios de prueba

| Usuario | Contraseña | Uso |
|---------|------------|-----|
| admin | admin123 | Gestión completa + auditoría |
| viewer | viewer123 | Solo lectura |
| warehouse | warehouse123 | Stock y productos |
| clerk | clerk123 | Operaciones básicas |

### Preguntas frecuentes del profesor

**¿Dónde se valida el token?**  
En el backend, filtro Spring Security OAuth2 Resource Server (`SecurityConfig`). El frontend solo lo envía; no confía en validación local.

**¿Qué pasa sin JWT?**  
401 Unauthorized (`HttpStatusEntryPoint`).

**¿Qué pasa con JWT pero sin permiso?**  
403 Forbidden (`AccessDeniedHandler` + `@PreAuthorize`).

**¿Es stateless?**  
Sí: `SessionCreationPolicy.STATELESS`. No hay sesión servidor ni Redis.

**¿Cómo demostrarlo?**  
Postman escenario 04 (401 sin JWT), 13 (403 viewer crea producto); tests `ResourceServerSecurityIntegrationTest`, `ApiSecurityMvcTest`.

---

## 2. Base de datos

### ¿Qué pide el avance?

Migraciones Flyway, ≥4 tablas relacionadas, BD en Docker.

### ¿Para qué sirve?

Versionar el esquema como código (reproducible en dev, test y CI). Flyway aplica SQL en orden y registra checksums en `flyway_schema_history`.

### ¿Cómo lo manejamos?

| Elemento | Detalle |
|----------|---------|
| **Motor** | PostgreSQL 16 en Docker (`postgres` service) |
| **Migraciones** | `V1` categories → `V7` índices y constraints |
| **Tablas core** | `categories`, `products`, `stock_movements`, `users_profile` |
| **Auditoría** | `revinfo`, `products_aud` (Envers) |
| **JPA** | `ddl-auto: validate` — Hibernate no altera esquema |
| **Conexión** | `DATABASE_URL` en `.env` / compose |

### Preguntas frecuentes

**¿Flyway o Liquibase?**  
Flyway (`flyway-core` en `pom.xml`).

**¿Cómo resetear en dev?**  
`docker compose down -v` (borra volumen) o `flyway repair` si cambió checksum.

**Script de validación:** `scripts/validate-flyway-migrations.ps1`

---

## 3. Funcionalidad — CRUD Producto

### ¿Qué pide el avance?

CRUD completo + validaciones de negocio.

### ¿Cómo lo manejamos?

| Operación | Endpoint | Reglas |
|-----------|----------|--------|
| Listar | `GET /api/v1/products` | Filtros, paginación |
| Detalle | `GET /api/v1/products/{id}` | 404 si no existe |
| Crear | `POST /api/v1/products` | SKU único (409), precio ≥0 |
| Actualizar | `PUT /api/v1/products/{id}` | No cambia cantidad directa |
| Inactivar | `DELETE /api/v1/products/{id}` | Soft delete (status INACTIVE) |

**Capas:** `ProductController` → `ProductService` → `ProductRepository` → entidad `Product`.

**UI:** `/products`, `/products/new`, `/products/[id]/edit` (Next.js).

**Tests:** `ProductServiceTest`, `ProductApiIntegrationTest`, `product-crud.spec.ts` (Playwright).

---

## 4. Testing

### ¿Qué pide el avance?

≥15 pruebas unitarias, cobertura ≥60%, evidencia de ejecución exitosa.

### ¿Para qué sirve cada capa?

| Capa | Herramienta | Qué valida |
|------|-------------|------------|
| **Unitarias** | JUnit 5 + Mockito | Lógica de servicios y mappers sin BD |
| **Integración API** | MockMvc + Testcontainers | HTTP + persistencia real |
| **Seguridad** | `@SpringBootTest` + JWT mock | 401/403 y rutas públicas |
| **Cobertura** | JaCoCo | % líneas cubiertas |
| **E2E** | Playwright | Flujo usuario en navegador |
| **API externa** | Newman/Postman | Contrato contra stack real |

### ¿Cómo lo manejamos?

```powershell
cd backend
.\mvnw.cmd verify    # tests + jacoco-check (mínimo 60%)
```

- Umbral: `jacoco.line.minimum.covered.ratio=0.60` en `pom.xml`
- Evidencia: `backend/target/site/jacoco/index.html`, `docs/qa-evidence/test-execution-summary.md`
- Script: `.\scripts\generate-qa-evidence.ps1`

**¿Por qué Testcontainers?**  
PostgreSQL real en contenedor efímero — mismas constraints y SQL que producción, sin mocks de BD.

---

## 5. GitHub

### ¿Qué pide el avance?

Repo público, README, ≥15 commits, ≥2 PRs.

### ¿Cómo lo manejamos?

- **Repo:** https://github.com/carolinabencosme/quality_assurance (público)
- **Ramas:** `main` (estable), `develop` (integración), `feature/*`, `fix/*`
- **PRs:** flujo obligatorio a `develop`; ejemplos #11–#18
- **Commits:** Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`)
- **README:** stack, Docker, API, fases, usuarios de prueba

---

## 6. Auditoría (Hibernate Envers)

### ¿Qué pide el avance?

Envers funcionando + evidencia en base de datos.

### ¿Para qué sirve?

Trazabilidad regulatoria: quién cambió qué y cuándo, sin lógica manual de historial.

### ¿Cómo lo manejamos?

1. `@Audited` en entidad `Product`
2. Flyway `V5` crea tablas `*_aud` y `revinfo`
3. API `GET /api/v1/audit` (permiso `audit:view`)
4. UI `/audit`

**Evidencia BD:** ejecutar `docs/qa-evidence/envers-queries.sql` en PostgreSQL.

**Pregunta típica:** ¿Dónde se guarda?  
Tablas `products_aud` + metadatos en `revinfo` (revision id + timestamp).

---

## 7. API REST y Swagger

### ¿Qué pide el avance?

Swagger funcional + todos los endpoints documentados.

### ¿Cómo lo manejamos?

| Recurso | URL |
|---------|-----|
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

- Config global: `OpenApiConfig.java` (título, JWT bearer, lista de endpoints)
- Por endpoint: `@Tag`, `@Operation`, `@ApiResponses` en cada controlador
- Público sin JWT: rutas en `PublicApiPaths.java` (health, swagger)

**Controladores documentados:** Products, Categories, Stock, Reports, Audit (+ Demo errors en perfil `dev`).

---

## 8. Integration testing (Testcontainers)

### ¿Qué pide el avance?

Testcontainers configurado, Postgres desde TC, ≥5 pruebas integración.

### Clases principales

| Clase | Alcance |
|-------|---------|
| `InventoryApplicationTests` | Contexto + BD |
| `ProductApiIntegrationTest` | CRUD HTTP productos |
| `StockApiIntegrationTest` | Movimientos stock |
| `StockGetApiIntegrationTest` | GET stock |
| `ReportApiIntegrationTest` | Dashboard |
| `ResourceServerSecurityIntegrationTest` | JWT + seguridad |
| `ProductRepositoryTest`, `CategoryRepositoryTest` | Repos JPA |

`@Testcontainers(disabledWithoutDocker = true)` — en CI (GitHub Actions) Docker está disponible; localmente sin Docker se omiten.

---

## 9. API testing (Postman / Newman)

### ¿Qué pide el avance?

≥10 escenarios, validación errores y permisos.

### Colección: `tests/api/inventory-qas.postman_collection.json`

14 escenarios: tokens, health público, 401, 200 con JWT, 400 validación, 409 conflicto, 403 permisos, 404 demo.

```powershell
cd tests/api
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081"
```

Workflow CI: `.github/workflows/api-postman.yml`

---

## 10. Docker

### ¿Qué pide el avance?

Aplicación, BD y Keycloak dockerizados.

### Stack dev (`docker-compose.dev.yml`)

| Servicio | Puerto | Imagen / build |
|----------|--------|----------------|
| postgres | 5432 | postgres:16-alpine |
| keycloak | 8081 | keycloak:26 + realm import |
| backend | 8080 | `backend/Dockerfile` |
| frontend | 3000 | `frontend/Dockerfile` |

```powershell
copy .env.example .env
docker compose -f docker-compose.dev.yml up -d --build
```

**¿Por qué `host.docker.internal`?**  
El JWT tiene `iss` con `localhost:8081`; el backend en contenedor resuelve JWKS vía host.

---

## 11. GitHub Actions

### ¿Qué pide el avance?

Build automático, unit tests, integration tests automáticos.

### Workflow `ci.yml`

| Job | Comando |
|-----|---------|
| backend | `mvn -B verify` (unit + integration + JaCoCo 60%) |
| frontend | `npm ci && npm run build` |
| sonar | opcional si `SONAR_TOKEN` |

**Fix CI (rama fix/100%):** `TestJwtDecoderAutoConfiguration` — JwtDecoder en memoria en perfil `test` para no llamar Keycloak en el runner.

---

## 12. Jenkins

### ¿Qué pide el avance?

Pipeline funcional.

### ¿Cómo lo manejamos?

- `Jenkinsfile` — stages: checkout, backend verify, frontend build, Sonar opcional, deploy staging
- Jenkins en Docker: puerto **8082** (`docker-compose.staging.yml`)
- Guía: `docs/jenkins-evidence.md`
- Equivalente local: `.\scripts\verify-avance-v3.ps1`

---

## 13. Observabilidad

### ¿Qué pide el avance?

Grafana configurado + dashboard operativo.

### Stack (`docker-compose.observability.yml`)

OpenTelemetry (backend) → **Grafana Alloy** → Prometheus / Loki / Tempo → **Grafana** (puerto 3001).

Dashboard: `observability/grafana/provisioning/dashboards/json/inventory-api.json`

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d
```

Grafana: http://localhost:3001 (admin/admin)

**¿Para qué Prometheus?**  
Métricas HTTP, JVM, latencia — alertas y KPIs operativos.

**¿Para qué Tempo/Loki?**  
Trazas distribuidas y logs correlacionados (`CorrelationIdFilter`).

---

## 14. Playwright

### ¿Qué pide el avance?

Login automatizado + CRUD producto automatizado.

| Spec | Flujo |
|------|-------|
| `login-dashboard.spec.ts` | Login viewer → dashboard → productos |
| `product-crud.spec.ts` | Login warehouse → crear/editar/inactivar producto |
| `capture-evidence.spec.ts` | Capturas PNG para evidencia académica |

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.test.yml up -d
cd tests/e2e
npm install
npm test
```

---

## 15. Arquitectura general (preguntas transversales)

### ¿Monolito o microservicios?

**Monolito modular** en un repo: backend Spring Boot + frontend Next.js. Comunicación HTTP/JSON. Keycloak y Postgres como servicios separados en Docker.

### ¿Por qué Spring Boot 3 + Java 21?

LTS, soporte nativo virtual threads, ecosistema maduro para JPA, Security, OpenAPI.

### ¿Por qué Next.js?

SSR/App Router, proxy API/Keycloak sin CORS, despliegue Docker unificado.

### ¿Dónde está el modelo de errores?

`ApiException` + `GlobalExceptionHandler` + `ApiErrorResponse` — JSON uniforme con `correlationId`.

### ¿Cómo correlacionamos logs?

`CorrelationIdFilter` — header `X-Correlation-Id` en request/response y MDC.

---

## 16. Checklist rápido antes de la evaluación

```powershell
.\scripts\verify-avance-v3.ps1
docker compose -f docker-compose.dev.yml up -d
.\scripts\generate-qa-evidence.ps1
```

1. Login admin en http://localhost:3000  
2. Swagger http://localhost:8080/swagger-ui.html  
3. Keycloak http://localhost:8081  
4. Grafana http://localhost:3001 (con overlay observability)  
5. GitHub Actions en verde en la rama mergeada  

---

## Referencias cruzadas

| Tema | Documento |
|------|-----------|
| Evidencias PDF | `docs/qa-evidence/EVIDENCIAS-AVANCE-V3.md` |
| Seguridad detallada | `docs/security-model.md` |
| OAuth2 Resource Server | `docs/oauth2-resource-server.md` |
| Testing | `docs/testing-guide.md` |
| CI/CD | `docs/ci-cd-guide.md` |
| Arquitectura | `docs/architecture.md` |
| Capturas | `docs/qa-evidence/CHECKLIST-CAPTURAS.md` |
