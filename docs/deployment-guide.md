# Guía de despliegue

## Desarrollo (`docker-compose.dev.yml`)

Servicios: `postgres`, `keycloak`, `backend`, `frontend`.

1. Copiar `.env.example` → `.env` (el archivo `.env` es solo local; Git lo ignora vía `.gitignore`. No hacer `git add .env` si aparece en `git status`).
2. `docker compose -f docker-compose.dev.yml up -d --build`
3. Validar:
   - http://localhost:8080/actuator/health
   - http://localhost:8080/api/v1/setup/info
   - http://localhost:3000
   - http://localhost:8081 (Keycloak)

## Staging

El archivo `docker-compose.staging.yml` se completará en Fases 5–6 con observabilidad, SonarQube y Jenkins.

## Variables críticas

Listado completo en [`.env.example`](../.env.example) (Anexo A del Plan v3.0).

| Variable / grupo | Uso |
|------------------|-----|
| `SPRING_PROFILES_ACTIVE` | Perfil Spring (`dev`, `test`, `staging`) |
| `POSTGRES_*`, `DATABASE_*` | Contenedor PostgreSQL y JDBC del backend |
| `KEYCLOAK_*` | IdP OAuth2/OIDC y validación JWT en la API |
| `OTEL_*` | Exportación OTLP hacia Alloy (Fase 5+) |
| `VITE_*` | URL de API y cliente Keycloak en el frontend |
| `GRAFANA_*`, `PROMETHEUS_RETENTION` | Credenciales y retención en staging (observabilidad) |
| `SONAR_*` | Análisis de calidad local o en Jenkins (Fase 6+) |
| `JENKINS_*` | Admin del pipeline visual en staging (Fase 6+) |

Ejemplos usados en desarrollo con Docker:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | JDBC hacia PostgreSQL (`postgres:5432` en red Compose) |
| `KEYCLOAK_ISSUER_URI` | Issuer del realm (red Docker: `keycloak:8080`) |
| `VITE_API_URL` | Base URL API para el frontend en el host |

## Troubleshooting

- **Backend no arranca:** revisar logs `docker compose -f docker-compose.dev.yml logs backend`
- **Keycloak lento en primer arranque:** esperar ~60s; healthcheck con `start_period`
- **Frontend no ve API:** confirmar `VITE_API_URL` y CORS; en Docker usar URLs publicadas en host
