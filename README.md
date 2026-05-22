# Inventory QAS — Sistema de Gestión de Inventarios

Monorepo del proyecto **Aseguramiento de Calidad de Software** (PUCMM): inventario empresarial con Full Stack Testing, observabilidad y DevSecOps.

| Documento | Versión |
|-----------|---------|
| Plan de implementación | 3.0 — Mayo 2026 |
| Proyecto final | V3 |

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Spring Boot 3 + Java 21 |
| Frontend | React + Vite + TypeScript |
| Base de datos | PostgreSQL 16 |
| Seguridad | Keycloak + OAuth2 + JWT (Fase 2) |
| Contenedores | Docker + Docker Compose |

## Estructura del repositorio

```
inventory-qas-project/
├── backend/          # API Spring Boot (monolito modular)
├── frontend/         # React + Vite
├── docker/           # Init DB, Nginx
├── keycloak/         # Realm export
├── observability/    # Prometheus, Grafana, Loki, Tempo, Alloy (Fase 5+)
├── tests/            # E2E, performance, security (Fase 4+)
├── docs/             # Documentación técnica
├── .github/workflows/
├── docker-compose.dev.yml
├── docker-compose.staging.yml
├── .env.example
└── README.md
```

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine + Compose v2)
- [Java 21](https://adoptium.net/) y Maven 3.9+ (desarrollo backend sin Docker)
- [Node.js 22 LTS](https://nodejs.org/) (desarrollo frontend sin Docker)
- Git

## Inicio rápido (Docker — recomendado)

```powershell
# 1. Clonar y entrar al repo
cd quality_assurance

# 2. Variables de entorno
copy .env.example .env

# 3. Levantar ambiente de desarrollo
docker compose -f docker-compose.dev.yml up -d --build

# 4. Verificar servicios
docker compose -f docker-compose.dev.yml ps
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

Detener:

```powershell
docker compose -f docker-compose.dev.yml down
```

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

Configurar `VITE_API_URL` en `.env` o en el entorno según `.env.example`.

## Estrategia de ramas (Plan v3.0 §15)

| Rama | Uso |
|------|-----|
| `main` | Estable y protegida; solo merge vía Pull Request |
| `develop` | Integración de features validadas |
| `feature/*` | Nuevas funcionalidades (ej. `feature/qa-2-fase-0-setup`) |
| `fix/*` | Correcciones de bugs |
| `test/*` | Pruebas y evidencias |
| `docs/*` | Documentación |

**Conventional Commits:** `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`, `ci:`

Cada PR debe incluir descripción, checklist (build, tests, sin secretos, docs) y evidencia cuando aplique. No hay merge directo a `main`.

## Fases de trabajo

| Fase | Objetivo | Estado |
|------|----------|--------|
| 0 | Setup repo, Docker dev, README, `.env.example` | Completado (`QA-2`) |
| 1 | Core: productos, stock, Flyway, Swagger | En curso (`QA-3`) |
| 2 | Keycloak y permisos granulares | Pendiente |
| 3 | Dashboard y auditoría (Envers) | Pendiente |
| 4 | Testing full stack | Pendiente |
| 5 | Observabilidad (Grafana stack) | Pendiente |
| 6 | CI/CD (GitHub Actions, Jenkins, SonarQube) | Pendiente |
| 7 | Documentación y defensa | Pendiente |

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

## Issues y Jira

- **QA-2** — Fase 0: Setup repositorio y entorno local  
- **QA-3** — Fase 1: Core funcional productos y stock  
- Etiquetas: `inventory-qas_fase-0_setup`, `inventory-qas_fase-1_core`

## Documentación

Ver carpeta [`docs/`](docs/):

- [`docs/GUIA_IMPLEMENTACION.md`](docs/GUIA_IMPLEMENTACION.md) — Guía de implementación del equipo
- [`docs/architecture.md`](docs/architecture.md) — Arquitectura (borrador)
- [`docs/deployment-guide.md`](docs/deployment-guide.md) — Despliegue y variables

## Licencia y equipo

Proyecto académico — Aseguramiento de Calidad de Software, PUCMM.
