# Cub — Gestión de inventarios

Sistema empresarial de inventario (PUCMM · Aseguramiento de Calidad de Software).  
Backend Spring Boot, frontend Next.js, Keycloak, PostgreSQL, Docker.

## Arranque rápido

```powershell
copy .env.example .env
docker compose -f docker-compose.dev.yml up -d --build
```

| Servicio | URL |
|----------|-----|
| **App Cub** | http://localhost:3000 |
| **API / Swagger** | http://localhost:8080/swagger-ui.html |
| **Keycloak Admin** | http://localhost:8081 (`admin` / `admin`) |

**Usuarios de prueba (app):** `viewer` / `viewer123` · `admin` / `admin123` · `warehouse` / `warehouse123`

## Stack

Spring Boot 3 · Java 21 · Next.js 15 · PostgreSQL 16 · Keycloak · Flyway · Envers · Docker Compose

## Documentación de defensa

- [Preguntas técnicas — resumen](docs/defensa-preguntas-tecnicas.md)
- [Preguntas técnicas — Avance V3 (completo)](docs/defensa/preguntas-tecnicas-avance-v3.md)

## Estructura

```
backend/    API REST + seguridad JWT
frontend/   Cub (Next.js)
keycloak/   Realm export
tests/      Newman, E2E, k6
docker/     Init scripts
```

Proyecto académico — PUCMM.
