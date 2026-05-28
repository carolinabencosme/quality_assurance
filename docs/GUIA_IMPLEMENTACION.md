# Guía de implementación del equipo

Documento operativo alineado con **Plan de Implementación v3.0** y **Proyecto Final V3**.

## Principios

1. Monolito modular: un backend, un frontend, módulos por dominio (`product`, `stock`, `report`, `audit`, `security`, `observability`, `common`).
2. Sin secretos en Git: usar `.env.example` y `.env` local.
3. Conventional Commits y PRs con checklist.
4. Documentación viva en `docs/` y evidencias en `docs/qa-evidence.md` (Fase 7).

## Flujo por issue / Jira

1. Crear rama desde `develop` (o `main` si aún no existe `develop`):
   - `feature/<jira-id>-<descripcion-corta>`
   - Ejemplo: `feature/qa-2-fase-0-setup`, `feature/qa-3-fase-1-core-productos-stock`
2. Implementar con commits atómicos (`feat:`, `chore:`, etc.).
3. Abrir PR hacia `develop` con descripción, pruebas y capturas.
4. Tras revisión, merge a `develop`; release periódico a `main`.

## Comandos de referencia (Anexo B del plan)

```powershell
# Desarrollo
docker compose -f docker-compose.dev.yml up -d --build

# Backend — tests
cd backend; mvn test

# Frontend (Next.js) — dev
cd frontend; npm install; npm run dev
```

## Definición de hecho (por funcionalidad)

| Dimensión | Criterio |
|-----------|----------|
| Código | Compila, sin secretos, convenciones del módulo |
| Pruebas | Unit/integration según fase; no romper CI |
| Seguridad | Permiso correcto en endpoints (desde Fase 2) |
| Docs | README o `docs/` actualizados |

## Enlaces internos

- [Arquitectura](architecture.md)
- [Despliegue](deployment-guide.md)
- [Modelo de seguridad](security-model.md) — Fase 2
- [Guía de pruebas](testing-guide.md) — Fase 4 (QA-6)
- [Evidencias QA](qa-evidence.md) — Plantilla §17
