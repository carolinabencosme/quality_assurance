# Inventory QAS — Sistema de Gestión de Inventarios

## Descripción del proyecto

Monorepo del curso **Aseguramiento de Calidad de Software** (PUCMM) para un **sistema empresarial de gestión de inventarios**: catálogo de productos, movimientos de stock, reportes y auditoría, con calidad demostrable en producción académica.

El proyecto va más allá de un CRUD: incluye **seguridad granular** (Keycloak), **testing por capas**, **observabilidad**, **CI/CD** y **calidad de código** medible, según el Plan de Implementación Técnica v3.0. Guía operativa del equipo: [docs/GUIA_IMPLEMENTACION.md](docs/GUIA_IMPLEMENTACION.md).

| Documento | Versión |
|-----------|---------|
| Plan de implementación | 3.0 — Mayo 2026 |
| Proyecto final | V3 |

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Spring Boot 3 + Java 21 |
| Frontend | Next.js 15 + React + TypeScript |
| Base de datos | PostgreSQL 16 |
| Identidad / seguridad | Keycloak + OAuth2 + JWT |
| API | REST `/api/v1`, OpenAPI, Swagger UI |
| Persistencia | Flyway V1–V7, Hibernate Envers |
| Contenedores | Docker + Docker Compose |

## Estructura del repositorio (QA-10)

Monorepo según **Plan técnico v3.0**. Árbol completo y verificación: [`docs/monorepo-structure.md`](docs/monorepo-structure.md).

```powershell
.\scripts\verify-monorepo-structure.ps1
```

```
quality_assurance/
├── backend/                        # Spring Boot API
├── frontend/                       # Next.js App Router
├── docker/                         # Init PostgreSQL, Nginx
├── keycloak/                       # realm-export.json
├── observability/                  # Prometheus, Grafana, Loki, Tempo, Alloy
├── tests/                          # E2E, k6, security, observability smoke
├── docs/                           # Documentación
├── scripts/                        # Deploy, smoke, verify estructura
├── .github/workflows/              # CI + deploy staging
├── Jenkinsfile
├── docker-compose.dev.yml
├── docker-compose.test.yml           # Overlay E2E / integración
├── docker-compose.staging.yml
├── docker-compose.observability.yml
├── .env.example
└── README.md
```

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine + **Compose v2**) — **obligatorio** para el flujo recomendado de desarrollo.
- [Java 21](https://adoptium.net/) y Maven 3.9+ — **opcional** (solo si desarrollas el backend sin Docker).
- [Node.js 22 LTS](https://nodejs.org/) — **opcional** (solo si desarrollas el frontend sin Docker).
- Git

## Arranque en desarrollo (Docker)

```powershell
# Clonar y entrar al repo (si aplica)
cd quality_assurance

copy .env.example .env
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml ps
```

Verificación rápida del backend:

```powershell
Invoke-RestMethod http://localhost:8080/actuator/health
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Health | http://localhost:8080/actuator/health |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| API productos | http://localhost:8080/api/v1/products |
| API stock | http://localhost:8080/api/v1/stock |
| Keycloak Admin | http://localhost:8081 (admin / admin) |
| PostgreSQL | localhost:5432 |

**Fase 5 — observabilidad** (`-f docker-compose.observability.yml`):

| Servicio | URL |
|----------|-----|
| Grafana | http://localhost:3001 (admin / admin) |
| Prometheus | http://localhost:9090 |
| Alertmanager | http://localhost:9093 |

Ver [`docs/observability-guide.md`](docs/observability-guide.md).

**Ambiente de pruebas (E2E)** — overlay `docker-compose.test.yml`:

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.test.yml up -d --build
cd tests/e2e; npm install; npm test
```

Detener:

```powershell
docker compose -f docker-compose.dev.yml down
```

## Variables de entorno y secretos

- **`.env.example`** sí se versiona: plantilla con nombres de variables y valores de ejemplo (sin secretos reales de producción).
- **`.env`** no se versiona: está en [`.gitignore`](.gitignore). Cada desarrollador lo crea en local con `copy .env.example .env` y ajusta contraseñas o tokens propios.
- No subir al repositorio contraseñas, tokens de SonarQube/Jenkins ni claves privadas; en CI usar secretos del proveedor (GitHub Actions, Jenkins credentials).
- Si `git status` muestra `.env`, no ejecutar `git add .env`.

## Desarrollo local (sin Docker)

**Backend** (no requiere Maven instalado; usa el wrapper incluido)

```powershell
cd backend
.\mvnw.cmd test          # pruebas (Docker Desktop encendido para Testcontainers)
.\mvnw.cmd spring-boot:run
```

Requisitos: **Java 21+** (recomendado 21 LTS) y **Docker Desktop** en ejecución para el test de contexto con PostgreSQL.

**Frontend**

```powershell
cd frontend
npm install
npm run dev
```

En desarrollo, Next.js reescribe `/api` y `/keycloak` al backend y Keycloak (sin CORS). Ver `NEXT_PUBLIC_*` en `.env.example`.

## Estrategia de ramas (Plan v3.0 §15)

| Rama | Uso |
|------|-----|
| `main` | Estable y protegida; solo merge vía Pull Request |
| `develop` | Integración de features validadas |
| `feature/*` | Nuevas funcionalidades (ej. `feature/qa-11-readme-inicial`) |
| `fix/*` | Correcciones de bugs |
| `test/*` | Pruebas y evidencias |
| `docs/*` | Documentación |

**Conventional Commits:** `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`, `ci:`

Cada PR debe incluir descripción, checklist (build, tests, sin secretos, docs) y evidencia cuando aplique. No hay merge directo a `main`.

## Fases de trabajo

| Fase | Objetivo | Estado |
|------|----------|--------|
| 0 | Setup repo, Docker dev, README, `.env.example` | Completado (`QA-2`, `QA-10`–`QA-13`) |
| 1 | Core: productos, stock, Flyway, Swagger | Completado (`QA-3`, `QA-17`) |
| 2 | Keycloak y permisos granulares | Completado (`QA-4`) |
| 3 | Dashboard y auditoría (Envers) | Completado (`QA-5`) |
| 4 | Testing full stack (JaCoCo, E2E, k6, evidencias) | Completado (`QA-6`, `QA-14`) |
| 5 | Observabilidad (Grafana stack) | Completado (`QA-7`) |
| 6 | CI/CD (GitHub Actions, Jenkins, SonarQube) | Completado (`QA-8`) |
| 7 | Documentación y defensa | Completado (`QA-9`, `QA-11`) |
| — | Common: excepciones y error estándar | Completado (`QA-18`) |
| — | CorrelationId, MDC y logging estructurado | En curso (`QA-19`) |
| 1b | Entidades JPA Product, Category y repos | Completado (`QA-20`) |
| 1c | CRUD API productos DTOs mapper validaciones | En curso (`QA-21`) |
| 1d | Stock: movimientos y reglas RF-STK | En curso (`QA-23`) |
| 1e | GET stock y movimientos con paginación y DTOs | En curso (`QA-24`) |
| 2b | UI productos: tabla, filtros y formularios | En curso (`QA-25`) |

## API Fase 1 (QA-3)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/products` | Lista con `search`, `categoryId`, `status`, `critical`, paginación |
| GET | `/api/v1/products/{id}` | Detalle |
| POST | `/api/v1/products` | Crear (SKU único, stock inicial opcional) |
| PUT | `/api/v1/products/{id}` | Actualizar (sin cambiar cantidad directa) |
| DELETE | `/api/v1/products/{id}` | Inactivar (soft delete) |
| GET | `/api/v1/categories` | Categorías para filtros |
| GET | `/api/v1/stock` | Existencias actuales |
| GET | `/api/v1/stock/movements` | Historial (`productId`, `type`) |
| POST | `/api/v1/stock/movements` | IN / OUT / ADJUSTMENT |

Reglas MVP: SKU duplicado → 409; precio/stock negativo → 400; salida sin stock → 409; cada cambio de cantidad genera movimiento.

## Dashboard y auditoría Fase 3 (QA-5)

| Método | Endpoint | Permiso |
|--------|----------|---------|
| GET | `/api/v1/reports/dashboard` | `report:view` |
| GET | `/api/v1/reports/critical-products` | `report:view` |
| GET | `/api/v1/audit` | `audit:view` |

Frontend (Next.js): `/dashboard`, `/products`, `/audit`. Productos auditados con **Hibernate Envers**. Sesión con JWT + refresh token en cookie.

## Seguridad Fase 2 (QA-4)

Todos los endpoints `/api/v1/*` exigen JWT Bearer. Permisos granulares vía `@PreAuthorize` (ej. `product:view`).

Usuarios de prueba (Keycloak): `admin`/`admin123`, `viewer`/`viewer123` — ver [docs/security-model.md](docs/security-model.md).

```powershell
# Token de ejemplo (viewer)
curl -s -X POST "http://localhost:8081/realms/inventory-realm/protocol/openid-connect/token" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "grant_type=password&client_id=inventory-frontend&username=viewer&password=viewer123"
```

Frontend: login en http://localhost:3000 con las mismas credenciales.

## Issues y Jira

- **QA-2** — Fase 0: Setup repositorio y entorno local
- **QA-3** — Fase 1: Core funcional productos y stock
- **QA-4** — Fase 2: Seguridad Keycloak y permisos granulares
- **QA-5** — Fase 3: Dashboard, reportes y auditoría Envers
- **QA-6** — Fase 4: Testing full stack y evidencias
- **QA-7** — Fase 5: Observabilidad OpenTelemetry y Grafana stack
- **QA-8** — Fase 6: CI/CD GitHub Actions, Jenkins y SonarQube
- **QA-9** — Fase 7: Documentación final y defensa
- **QA-10** — Estructura monorepo según plan técnico
- **QA-11** — README inicial: stack y arranque en dev
- **QA-12** — `.env.example` alineado al plan
- **QA-13** — Healthchecks en Docker Compose
- **QA-14** — Perfil `test` y smoke health
- **QA-17** — Migraciones Flyway V1–V7 del dominio inventario
- **QA-18** — Módulo common: excepciones y respuesta error estándar
- **QA-19** — CorrelationIdFilter, MDC y logging estructurado
- **QA-20** — Entidades JPA Product, Category y repositorios
- **QA-24** — GET /api/v1/stock y /movements con paginación y DTOs
- **QA-21** — CRUD API productos: DTOs, mapper y validaciones (RF-PROD)
- **QA-23** — Módulo stock: movimientos IN/OUT/ADJUSTMENT y reglas RF-STK
- **QA-25** — UI productos: tabla, filtros, crear/editar (Next.js)
- Etiquetas: `inventory-qas_fase-0_setup` … `inventory-qas_fase-7_docs`

## Documentación

Índice en la carpeta [`docs/`](docs/):

- [`docs/monorepo-structure.md`](docs/monorepo-structure.md) — Árbol y convenciones (QA-10)
- [`docs/GUIA_IMPLEMENTACION.md`](docs/GUIA_IMPLEMENTACION.md) — Guía de implementación del equipo
- [`docs/data-model.md`](docs/data-model.md) — Modelo de datos y Flyway V1–V7 (QA-17)
- [`docs/product-jpa-entities.md`](docs/product-jpa-entities.md) — Entidades JPA Product/Category (QA-20)
- [`docs/stock-get-api.md`](docs/stock-get-api.md) — GET stock/movimientos, paginación y DTOs (QA-24)
- [`docs/stock-api-crud.md`](docs/stock-api-crud.md) — API stock, movimientos y reglas RF-STK (QA-23)
- [`docs/product-api-crud.md`](docs/product-api-crud.md) — CRUD `/api/v1/products` (QA-21)
- [`docs/architecture.md`](docs/architecture.md) — Arquitectura del sistema
- [`docs/requirements.md`](docs/requirements.md) — Requisitos RF/RNF
- [`docs/deployment-guide.md`](docs/deployment-guide.md) — Despliegue, healthchecks y variables
- [`docs/security-model.md`](docs/security-model.md) — Keycloak, JWT y permisos
- [`docs/observability-guide.md`](docs/observability-guide.md) — Observabilidad Fase 5 (QA-7)
- [`docs/common-error-response.md`](docs/common-error-response.md) — Formato JSON de errores (QA-18)
- [`docs/observability-correlation-logging.md`](docs/observability-correlation-logging.md) — MDC, correlationId y OTEL (QA-19)
- [`docs/testing-guide.md`](docs/testing-guide.md) — Pruebas Fase 4 (QA-6)
- [`docs/qa-evidence.md`](docs/qa-evidence.md) — Evidencias QA (todas las fases)
- [`docs/ci-cd-guide.md`](docs/ci-cd-guide.md) — CI/CD Fase 6 (QA-8)
- [`docs/defensa/guion-presentacion.md`](docs/defensa/guion-presentacion.md) — Guión defensa (~15 min)
- [`docs/defensa/checklist-defensa.md`](docs/defensa/checklist-defensa.md) — Checklist demo

## Licencia y equipo

Proyecto académico — Aseguramiento de Calidad de Software, PUCMM.
