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

## Staging (Fase 6)

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d --build
# o
.\scripts\deploy-staging.ps1
```

SonarQube `:9000`, Jenkins `:8082`. Ver [`ci-cd-guide.md`](ci-cd-guide.md).

## Variables críticas

Ver `.env.example` y Anexo A del Plan v3.0.

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | JDBC hacia PostgreSQL |
| `KEYCLOAK_ISSUER_URI` | Issuer del realm (red Docker: `keycloak:8080`) |
| `NEXT_PUBLIC_API_URL` | Base API (`/api/v1` con rewrites Next.js) |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Base Keycloak (`/keycloak`) |
| `API_PROXY_TARGET` / `KEYCLOAK_PROXY_TARGET` | Destinos rewrite (Docker: `backend:8080`, `keycloak:8080`) |
| `KEYCLOAK_ISSUER_URI` | Debe coincidir con `iss` del JWT (`http://localhost:8081/realms/...`) |

## Troubleshooting

- **Backend no arranca:** revisar logs `docker compose -f docker-compose.dev.yml logs backend`
- **Keycloak lento en primer arranque:** esperar ~60s; healthcheck con `start_period`
- **Sesión expirada / 401 en dashboard:** alinear `KEYCLOAK_ISSUER_URI` con el issuer del token (`localhost:8081`); reiniciar Keycloak y backend tras cambiar `.env`
- **Login falla:** usar `NEXT_PUBLIC_KEYCLOAK_URL=/keycloak` y rewrites Next.js
- **Frontend no ve API:** `NEXT_PUBLIC_API_URL=/api/v1` y `API_PROXY_TARGET` en Docker
