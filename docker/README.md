# Docker — assets de infraestructura

| Ruta | Uso |
|------|-----|
| `init/postgres/` | Scripts SQL ejecutados al primer arranque de PostgreSQL |
| `nginx/` | Configuración reverse proxy en staging |

Montados desde `docker-compose.dev.yml` y overlays (`test`, `staging`).
