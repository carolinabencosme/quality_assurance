# Guía de despliegue

## Desarrollo (`docker-compose.dev.yml`)

Servicios: `postgres`, `keycloak`, `backend`, `frontend`.

1. Copiar `.env.example` → `.env`
2. `docker compose -f docker-compose.dev.yml up -d --build`
3. Validar:
   - http://localhost:8080/actuator/health
   - http://localhost:8080/swagger-ui.html
   - http://localhost:8080/api/v1/products
   - http://localhost:3000
   - http://localhost:8081 (Keycloak)

## Staging

El archivo `docker-compose.staging.yml` se completará en Fases 5–6 con observabilidad, SonarQube y Jenkins.

## Variables críticas

Ver `.env.example` y Anexo A del Plan v3.0.

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | JDBC hacia PostgreSQL |
| `KEYCLOAK_ISSUER_URI` | Issuer del realm (red Docker: `keycloak:8080`) |
| `VITE_API_URL` | Base URL API para el frontend |

## Troubleshooting

- **Backend no arranca:** revisar logs `docker compose -f docker-compose.dev.yml logs backend`
- **Keycloak lento en primer arranque:** esperar ~60s; healthcheck con `start_period`
- **Frontend no ve API:** confirmar `VITE_API_URL` y CORS; en Docker usar URLs publicadas en host
