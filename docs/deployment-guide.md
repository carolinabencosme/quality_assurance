# Guía de despliegue

## Desarrollo (`docker-compose.dev.yml`)

Servicios en la red interna **`inventory-net`** (bridge):

| Servicio | Puerto en el host |
|----------|-------------------|
| `postgres` | 5432 |
| `keycloak` | 8081 |
| `backend` | 8080 |
| `frontend` | 3000 |

El backend arranca cuando **postgres** y **keycloak** reportan *healthy* (healthchecks en Compose). El frontend espera al backend *healthy*.

1. Copiar `.env.example` → `.env` (el archivo `.env` es solo local; Git lo ignora vía `.gitignore`. No hacer `git add .env` si aparece en `git status`).
2. `docker compose -f docker-compose.dev.yml up -d --build` (Keycloak puede tardar hasta ~2–3 min en el primer arranque por import del realm; healthcheck TCP en puerto 8080).
3. `docker compose -f docker-compose.dev.yml ps` — comprobar estado *healthy* en postgres, keycloak y backend.
4. Validar:
   - http://localhost:8080/actuator/health
   - http://localhost:8080/swagger-ui.html
   - http://localhost:8080/api/v1/products
   - http://localhost:3000
   - http://localhost:8081 (Keycloak)

## Staging (Fase 6)

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
# o
.\scripts\deploy-staging.ps1
```

SonarQube `:9000`, Jenkins `:8082`. Ver [`ci-cd-guide.md`](ci-cd-guide.md).

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
| `KEYCLOAK_ISSUER_URI` | Issuer del realm; en navegador usar `http://localhost:8081/realms/...` |
| `NEXT_PUBLIC_API_URL` | Base API (`/api/v1` con rewrites Next.js) |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Base Keycloak (`/keycloak`) |
| `API_PROXY_TARGET` / `KEYCLOAK_PROXY_TARGET` | Destinos rewrite en Docker (`backend:8080`, Keycloak vía host) |

## Troubleshooting

- **Backend no arranca:** revisar logs `docker compose -f docker-compose.dev.yml logs backend`
- **Keycloak lento en primer arranque:** esperar ~60s; healthcheck con `start_period`
- **Sesión expirada / 401 en dashboard:** alinear `KEYCLOAK_ISSUER_URI` con el issuer del token (`localhost:8081`); reiniciar Keycloak y backend tras cambiar `.env`
- **Login falla:** usar `NEXT_PUBLIC_KEYCLOAK_URL=/keycloak` y rewrites Next.js
- **Frontend no ve API:** `NEXT_PUBLIC_API_URL=/api/v1` y `API_PROXY_TARGET` en Docker
