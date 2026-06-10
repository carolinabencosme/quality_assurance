# Sistema de Gestión de Inventarios Empresarial (QAS)

Proyecto académico de **Aseguramiento de Calidad de Software**: sistema empresarial de inventario con arquitectura monolito modular, seguridad OAuth2/JWT, testing full stack, observabilidad y CI/CD.

> **No es un CRUD aislado.** Es un sistema con seguridad granular, pruebas automatizadas, telemetría, pipelines y calidad de código medible (SonarQube).

---

## Stack

| Capa | Tecnologías |
|------|-------------|
| Backend | Spring Boot 3, Java 21, JPA, Flyway, Envers |
| Frontend | React, Vite, TypeScript, TailwindCSS, shadcn/ui |
| Datos | PostgreSQL |
| Auth | Keycloak (OAuth2 / OIDC / JWT) |
| Observabilidad | OpenTelemetry, Prometheus, Loki, Tempo, Grafana |
| CI/CD | GitHub Actions, Jenkins |
| Calidad | SonarQube, JaCoCo |

---

## Documentación

Toda la documentación técnica está en **[`docs/`](./docs/README.md)** (índice central con mapa completo):

| Documento | Contenido |
|-----------|-----------|
| [requirements.md](./docs/requirements.md) | Requisitos RF/RNF con trazabilidad |
| [architecture.md](./docs/architecture.md) | Monolito modular, capas, ADRs |
| [data-model.md](./docs/data-model.md) | PostgreSQL, Flyway, Envers |
| [api-contract.md](./docs/api-contract.md) | REST, OpenAPI, errores |
| [security-model.md](./docs/security-model.md) | Keycloak, JWT, matriz de permisos |
| [development-guide.md](./docs/development-guide.md) | Estándares de ingeniería y calidad de código |
| [deployment-guide.md](./docs/deployment-guide.md) | Docker Compose, ambientes |
| [testing-guide.md](./docs/testing-guide.md) | Pirámide de pruebas full stack |
| [observability-guide.md](./docs/observability-guide.md) | Métricas, logs, trazas, Grafana |
| [cicd-and-quality.md](./docs/cicd-and-quality.md) | GitHub Actions, Jenkins, SonarQube |
| [qa-evidence.md](./docs/qa-evidence.md) | Plantilla de evidencias para entrega |
| [GUIA_IMPLEMENTACION_PASO_A_PASO.md](./docs/GUIA_IMPLEMENTACION_PASO_A_PASO.md) | Plan por fases 0–7 con checklists |

---

## Prerrequisitos

- Java 21, Node.js 18+, Docker Desktop, Git
- 8 GB RAM mínimo recomendado (Docker + Keycloak + stack observabilidad en staging)

---

## Inicio rápido

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
```

| Servicio | URL (desarrollo) |
|----------|------------------|
| Frontend | http://localhost:3000 |
| API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Keycloak | http://localhost:8081 |
| Health | http://localhost:8080/actuator/health |

Usuarios de prueba y permisos: ver [docs/security-model.md](./docs/security-model.md).

---

## Estructura del repositorio (objetivo)

```
quality_assurance/
├── backend/                 API Spring Boot (monolito modular)
├── frontend/                SPA React
├── docker/                  Config Nginx, init scripts
├── observability/           Prometheus, Grafana, Loki, Tempo, Alloy
├── keycloak/                realm-export.json
├── tests/                   e2e, performance, security
├── docs/                    Documentación técnica
├── .github/workflows/       CI en Pull Request
├── docker-compose.dev.yml
├── docker-compose.staging.yml
└── Jenkinsfile
```

---

## Licencia y materia

Proyecto académico — Materia: Aseguramiento de Calidad de Software.
