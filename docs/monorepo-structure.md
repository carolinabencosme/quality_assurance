# Estructura del monorepo — Plan técnico v3.0

Ticket: **QA-10** — Estructura monorepo según plan técnico.  
Criterio de aceptación: **clonar el repo y ver la estructura completa y documentada**.

## Árbol canónico (raíz)

```
quality_assurance/                    # Raíz del monorepo
├── backend/                          # API Spring Boot (monolito modular)
├── frontend/                         # Next.js 15 App Router
├── docker/                           # Scripts init DB, Nginx staging
├── keycloak/                         # Realm export (import automático)
├── observability/                    # Alloy, Prometheus, Loki, Tempo, Grafana
├── tests/                            # E2E, performance, security, observability smoke
├── docs/                             # Documentación técnica y evidencias QA
├── scripts/                          # Deploy staging, smoke post-deploy
├── .github/
│   ├── workflows/                    # CI y deploy staging (GitHub Actions)
│   └── PULL_REQUEST_TEMPLATE.md
├── Jenkinsfile                       # Pipeline Jenkins (Fase 6)
├── docker-compose.dev.yml            # Desarrollo local
├── docker-compose.staging.yml        # SonarQube, Jenkins (overlay)
├── docker-compose.observability.yml  # Stack Grafana (overlay)
├── docker-compose.test.yml           # E2E / pruebas (overlay)
├── sonar-project.properties
├── .env.example
├── .gitignore
└── README.md
```

## Responsabilidad por carpeta

| Carpeta | Contenido | Fase típica |
|---------|-----------|-------------|
| `backend/` | `src/main`, `src/test`, `pom.xml`, `Dockerfile`, `mvnw` | 1–4 |
| `frontend/` | `app/`, `components/`, `lib/`, `Dockerfile` | 1, 3 |
| `docker/` | `init/postgres/`, `nginx/` | 0, 6 |
| `keycloak/` | `realm-export.json`, `realm-export.version` | 2 |
| `observability/` | Config Alloy, Prometheus, Loki, Tempo, Grafana | 5 |
| `tests/e2e/` | Playwright | 4 |
| `tests/performance/k6/` | Smoke carga | 4 |
| `tests/security/` | Scripts auth | 4 |
| `tests/observability/` | Smoke métricas | 5 |
| `docs/` | Arquitectura, requisitos, guías, `qa-evidence/` | 0–7 |

## Compose — tres perfiles base + overlays

| Archivo | Propósito |
|---------|-----------|
| `docker-compose.dev.yml` | Postgres, Keycloak, backend, frontend |
| `docker-compose.test.yml` | Mismo stack, volumen DB de test, sin OTLP |
| `docker-compose.staging.yml` | SonarQube + Jenkins |
| `docker-compose.observability.yml` | Prometheus, Loki, Tempo, Grafana, Alloy |

```powershell
# Desarrollo
docker compose -f docker-compose.dev.yml up -d --build

# Pruebas E2E
docker compose -f docker-compose.dev.yml -f docker-compose.test.yml up -d --build

# Staging + observabilidad
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
```

## Verificación automática

Tras clonar:

```powershell
git clone https://github.com/carolinabencosme/quality_assurance.git
cd quality_assurance
.\scripts\verify-monorepo-structure.ps1
```

Debe imprimir `OK: estructura monorepo conforme al plan técnico (QA-10)`.

## Ramas y convención

- Integración: `develop`
- Features: `feature/qa-<n>-<descripcion-corta>`
- Este ticket: `feature/qa-10-estructura-monorepo`

Ver también [`GUIA_IMPLEMENTACION.md`](GUIA_IMPLEMENTACION.md) y [`architecture.md`](architecture.md).
