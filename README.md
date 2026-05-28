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
| Backend | **Spring Boot 3** + Java 21 |
| Frontend | **React** + Vite + TypeScript |
| Base de datos | **PostgreSQL** 16 |
| Identidad / seguridad | **Keycloak** + OAuth2 + JWT |
| API | REST `/api/v1`, OpenAPI, Swagger UI (Fase 1+) |
| Persistencia | Flyway, Hibernate Envers (fases posteriores) |
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
| Setup info (Fase 0) | http://localhost:8080/api/v1/setup/info |
| Keycloak Admin | http://localhost:8081 (admin / admin) |
| PostgreSQL | localhost:5432 |

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

**Backend**

```powershell
cd backend
mvn spring-boot:run
```

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
| `feature/*` | Nuevas funcionalidades (ej. `feature/qa-11-readme-inicial`) |
| `fix/*` | Correcciones de bugs |
| `test/*` | Pruebas y evidencias |
| `docs/*` | Documentación |

**Conventional Commits:** `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`, `ci:`

Cada PR debe incluir descripción, checklist (build, tests, sin secretos, docs) y evidencia cuando aplique. No hay merge directo a `main`.

## Fases de trabajo

| Fase | Objetivo | Estado |
|------|----------|--------|
| 0 | Setup repo, Docker dev, README, `.env.example` | En curso (`QA-2`, `QA-10`, `QA-11`) |
| 1 | Core: productos, stock, Flyway, Swagger | Pendiente |
| 2 | Keycloak y permisos granulares | Pendiente |
| 3 | Dashboard y auditoría (Envers) | Pendiente |
| 4 | Testing full stack | Pendiente |
| 5 | Observabilidad (Grafana stack) | Pendiente |
| 6 | CI/CD (GitHub Actions, Jenkins, SonarQube) | Pendiente |
| 7 | Documentación y defensa | Pendiente |

## Issues y Jira

- **QA-2** — Fase 0: Setup repositorio y entorno local
- **QA-11** — README inicial: stack y arranque en dev
- Etiqueta sugerida: `inventory-qas_fase-0_setup`

## Documentación

Índice en la carpeta [`docs/`](docs/):

| Documento | Contenido |
|-----------|-----------|
| [requirements.md](docs/requirements.md) | Requisitos funcionales y no funcionales (RF/RNF) |
| [architecture.md](docs/architecture.md) | Arquitectura lógica, módulos y decisiones |
| [deployment-guide.md](docs/deployment-guide.md) | Docker Compose, ambientes y troubleshooting |
| [security-model.md](docs/security-model.md) | Keycloak, JWT, permisos y matriz de acceso |
| [testing-guide.md](docs/testing-guide.md) | Pirámide de pruebas y ejecución |
| [observability-guide.md](docs/observability-guide.md) | Métricas, logs, trazas y alertas |
| [qa-evidence.md](docs/qa-evidence.md) | Plantilla de evidencias para la entrega |
| [GUIA_IMPLEMENTACION.md](docs/GUIA_IMPLEMENTACION.md) | Flujo del equipo, comandos y definición de hecho |

## Licencia y equipo

Proyecto académico — Aseguramiento de Calidad de Software, PUCMM.
