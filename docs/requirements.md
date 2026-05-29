# Requisitos — Inventory QAS

Documento de requisitos funcionales (RF) y no funcionales (RNF) con IDs trazables.  
Referencia: Plan v3.0 / Proyecto Final V3 — consolidado en **Fase 7 (QA-9)**.

---

## Requisitos funcionales

| ID | Descripción | Prioridad | Fase | Estado |
|----|-------------|-----------|------|--------|
| RF-01 | Registrar y consultar productos con SKU único | Alta | 1 | Implementado |
| RF-02 | Filtrar productos por categoría, estado, texto y stock crítico | Media | 1 | Implementado |
| RF-03 | Inactivar producto (soft delete) sin borrar historial | Media | 1 | Implementado |
| RF-04 | Registrar movimientos de stock (entrada, salida, ajuste) | Alta | 1 | Implementado |
| RF-05 | Impedir salida de stock mayor al disponible | Alta | 1 | Implementado |
| RF-06 | Autenticación de usuarios vía Keycloak (OIDC) | Alta | 2 | Implementado |
| RF-07 | Autorización por permisos granulares en API | Alta | 2 | Implementado |
| RF-08 | Dashboard con KPIs de inventario | Alta | 3 | Implementado |
| RF-09 | Listado de productos con stock bajo mínimo | Alta | 3 | Implementado |
| RF-10 | Consulta de auditoría de cambios (Envers) solo roles autorizados | Alta | 3 | Implementado |
| RF-11 | Documentación OpenAPI (Swagger UI) de la API | Media | 1 | Implementado |
| RF-12 | Interfaz web responsive (login, dashboard, productos, auditoría) | Alta | 3 | Implementado |

---

## Requisitos no funcionales

| ID | Descripción | Criterio de aceptación | Fase | Estado |
|----|-------------|------------------------|------|--------|
| RNF-01 | Contenedorización | `docker compose up` levanta stack completo | 0 | Cumplido |
| RNF-02 | Migraciones de BD versionadas | Flyway sin drift manual | 1 | Cumplido |
| RNF-03 | API REST JSON con códigos HTTP estándar | 400/401/403/404/409 documentados | 1–2 | Cumplido |
| RNF-04 | Seguridad transporte y secretos | Sin credenciales en repo; `.env.example` | 0–2 | Cumplido |
| RNF-05 | Pruebas automatizadas backend | `mvn verify` + JaCoCo | 4 | Cumplido |
| RNF-06 | Pruebas E2E UI | Playwright contra entorno Docker | 4 | Cumplido |
| RNF-07 | Pruebas de carga smoke | k6 sobre health/API | 4 | Cumplido |
| RNF-08 | Observabilidad | Métricas, logs y traces en Grafana | 5 | Cumplido |
| RNF-09 | Pipeline CI | GitHub Actions en push/PR | 6 | Cumplido |
| RNF-10 | Análisis estático | SonarQube configurado | 6 | Cumplido |
| RNF-11 | Documentación técnica | README + `docs/*` actualizados | 7 | Cumplido |
| RNF-12 | Evidencias QA | `docs/qa-evidence.md` + capturas | 7 | En curso (capturas) |

---

## Matriz rol → permiso (resumen)

| Permiso | viewer | warehouse | admin |
|---------|--------|-----------|-------|
| product:view | ✓ | ✓ | ✓ |
| product:manage | | ✓ | ✓ |
| stock:view | ✓ | ✓ | ✓ |
| stock:manage | | ✓ | ✓ |
| report:view | ✓ | ✓ | ✓ |
| audit:view | | | ✓ |

Detalle en [security-model.md](security-model.md).

---

## Trazabilidad pruebas → requisitos

| Requisito | Prueba / evidencia |
|-----------|-------------------|
| RF-01, RF-03 | `ProductServiceTest`, `ProductApiIntegrationTest` |
| RF-04, RF-05 | `StockServiceTest` |
| RF-07 | `ApiSecurityMvcTest`, `auth-smoke.ps1` |
| RF-08, RF-09 | `ReportServiceTest`, `ReportApiIntegrationTest` |
| RF-12 | `tests/e2e/specs/login-dashboard.spec.ts` |
| RNF-05 | JaCoCo report |
| RNF-08 | `tests/observability/smoke.ps1` |
| RNF-09 | `.github/workflows/ci.yml` |

---

## Fuera de alcance (MVP)

- Facturación, compras a proveedores, multi-almacén.
- App móvil nativa.
- Alta disponibilidad multi-región.
