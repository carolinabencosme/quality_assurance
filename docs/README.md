# Documentación técnica — Sistema de Gestión de Inventarios Empresarial (QAS)

Bienvenido al centro de documentación del proyecto. Este repositorio implementa un **sistema empresarial de inventario** con seguridad granular, testing full stack, observabilidad, CI/CD y calidad de código medible — no un CRUD aislado.

**Plan de referencia:** Plan de Implementación Técnica v3.0 (Aseguramiento de Calidad de Software).

---

## Cómo usar esta documentación

| Si quieres… | Lee primero |
|-------------|-------------|
| Entender **qué** se debe construir y **por qué** | [requirements.md](./requirements.md) |
| Ver **arquitectura**, módulos y decisiones técnicas | [architecture.md](./architecture.md) |
| **Ejecutar** el proyecto en local o staging | [deployment-guide.md](./deployment-guide.md) |
| Desarrollar con **estándares de ingeniería** | [development-guide.md](./development-guide.md) |
| Configurar **Keycloak y permisos** | [security-model.md](./security-model.md) |
| Conocer el **modelo de datos** y reglas de negocio | [data-model.md](./data-model.md) |
| Consultar la **API REST** y OpenAPI | [api-contract.md](./api-contract.md) |
| Ejecutar **todas las pruebas** | [testing-guide.md](./testing-guide.md) |
| Instrumentar **métricas, logs y trazas** | [observability-guide.md](./observability-guide.md) |
| Configurar **pipelines y SonarQube** | [cicd-and-quality.md](./cicd-and-quality.md) |
| Seguir el plan **fase por fase** (checklists) | [GUIA_IMPLEMENTACION_PASO_A_PASO.md](./GUIA_IMPLEMENTACION_PASO_A_PASO.md) |
| Registrar **evidencias** para la entrega | [qa-evidence.md](./qa-evidence.md) |

---

## Mapa de documentos

```
docs/
├── README.md                          ← Estás aquí (índice)
├── requirements.md                    Requisitos funcionales y no funcionales
├── architecture.md                    Arquitectura lógica, física y módulos
├── data-model.md                      Tablas, migraciones Flyway, reglas de negocio
├── api-contract.md                      Endpoints REST, errores, OpenAPI
├── security-model.md                  Keycloak, JWT, matriz de permisos
├── development-guide.md               Estándares de código y flujo de desarrollo
├── deployment-guide.md                Docker Compose, ambientes, troubleshooting
├── testing-guide.md                   Pirámide de pruebas y ejecución
├── observability-guide.md             OpenTelemetry, Grafana, alertas
├── cicd-and-quality.md                GitHub Actions, Jenkins, SonarQube
├── qa-evidence.md                     Plantilla de evidencias de QA
└── GUIA_IMPLEMENTACION_PASO_A_PASO.md Plan operativo por fases (0–7)
```

---

## Stack tecnológico (resumen)

| Capa | Tecnología |
|------|------------|
| Backend | Spring Boot 3, Java 21 |
| Frontend | React, Vite, TypeScript, TailwindCSS, shadcn/ui |
| Base de datos | PostgreSQL, Flyway, Hibernate Envers |
| Seguridad | Keycloak, OAuth2, JWT |
| API | REST `/api/v1`, OpenAPI, Swagger UI |
| Testing | JUnit, Mockito, Testcontainers, RestAssured, Playwright, k6, OWASP ZAP |
| Observabilidad | OpenTelemetry, Alloy, Prometheus, Loki, Tempo, Grafana, Alertmanager |
| CI/CD | GitHub Actions, Jenkins |
| Calidad | SonarQube, JaCoCo |

---

## Inicio rápido (cuando el código esté scaffolded)

```bash
# 1. Clonar y configurar entorno
git clone <url-del-repo>
cd quality_assurance
cp .env.example .env

# 2. Levantar desarrollo
docker compose -f docker-compose.dev.yml up -d

# 3. Verificar servicios
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8080
# Swagger:   http://localhost:8080/swagger-ui.html
# Keycloak:  http://localhost:8081
```

Detalle completo en [deployment-guide.md](./deployment-guide.md).

---

## Fases del proyecto (visión ejecutiva)

| Fase | Objetivo |
|------|----------|
| 0 | Setup: repo, Docker, backend y frontend base |
| 1 | Core: productos, stock, Flyway, Swagger |
| 2 | Seguridad: Keycloak, JWT, permisos granulares |
| 3 | Dashboard, reportes, auditoría Envers |
| 4 | Testing full stack automatizado |
| 5 | Observabilidad completa |
| 6 | CI/CD, SonarQube, deploy staging |
| 7 | Documentación, evidencias y defensa |

Checklists detallados en [GUIA_IMPLEMENTACION_PASO_A_PASO.md](./GUIA_IMPLEMENTACION_PASO_A_PASO.md).

---

## Principios de ingeniería del proyecto

1. **Monolito modular** — una API desplegable, dominios separados por paquetes.
2. **Seguridad por permiso** — `product:manage`, no solo rol `admin`.
3. **Contratos explícitos** — DTOs en API; entidades JPA no salen al cliente.
4. **Base de datos versionada** — todo cambio estructural vía Flyway.
5. **Trazabilidad** — `correlationId` y `traceId` en logs y trazas.
6. **Pruebas por capas** — pirámide de testing desde el día uno.
7. **Sin secretos en Git** — `.env.example` + variables de CI.
8. **Definición de hecho** — código + pruebas + seguridad + docs + evidencia.

---

## Definición de listo (proyecto completo)

El proyecto se considera terminado cuando:

- Se levanta con `docker compose -f docker-compose.staging.yml up`.
- Login con Keycloak funciona en el frontend.
- Inventario operable (productos + movimientos de stock).
- API probada con Swagger y JWT.
- Grafana muestra métricas, logs y trazas.
- Pipelines (GitHub Actions + Jenkins) y SonarQube en verde.
- Reportes de prueba archivados en [qa-evidence.md](./qa-evidence.md).

---

## Contacto y convenciones del equipo

- **Ramas:** `main` (protegida), `develop`, `feature/*`, `fix/*`, `test/*`, `docs/*`
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `ci:`)
- **Pull Requests:** issue asociado, checklist, evidencia de pruebas, sin merge directo a `main`

---

*Última actualización alineada con Plan de Implementación QAS v3.0 — Mayo 2026.*
