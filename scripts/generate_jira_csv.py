# -*- coding: utf-8 -*-
"""Genera docs/jira-backlog-inventory-qas.csv para importación Jira."""
import csv
import re
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "jira-backlog-inventory-qas.csv"

# Ventana del proyecto (ajusta inicio si tu plan arranca en otra fecha).
PROJECT_START = date(2026, 5, 1)
PROJECT_END = date(2026, 6, 10)

# Clave de proyecto Jira (columna Project key del CSV, como en jira_koul_atlas_tasks.csv).
PROJECT_KEY = "QA"
# Prefijo en Summary: QA-1 — Título (misma idea que KOUL-001 — en la referencia).
ISSUE_REF_PREFIX = "QA"

rows = []


def add(issue_type, summary, desc, labels, points, _priority):
    rows.append(
        {
            "Project key": PROJECT_KEY,
            "Issue type": issue_type,
            "Summary": summary,
            "Description": desc,
            "Status": "To Do",
            "Assignee": "",
            "Reporter": "CAROLINA BENCOSME",
            "Labels": labels,
            "Due date": "",
            "Start date": "",
            "Sprint": "",
            "Story point estimate": str(points) if points else "",
            "Parent": "",
            "Team": "",
        }
    )


def _phase_from_labels(labels: str) -> int:
    """0-7 según etiqueta fase-N; tareas sin fase van a la fase final."""
    m = re.search(r"fase-(\d+)", labels)
    if m:
        return max(0, min(7, int(m.group(1))))
    return 7


def assign_project_dates(rows_list: list[dict], start: date, end: date) -> None:
    """Reparte Start date y Due date por fase hasta PROJECT_END (sin solapar fuera del rango)."""
    n_days = (end - start).days + 1
    if n_days < 1:
        return
    days_per_phase = n_days / 8.0

    for phase in range(8):
        ph_start = start + timedelta(days=int(round(phase * days_per_phase)))
        ph_end = start + timedelta(days=int(round((phase + 1) * days_per_phase))) - timedelta(days=1)
        if ph_end > end:
            ph_end = end
        if ph_start > ph_end:
            ph_start = ph_end

        indices = [i for i, r in enumerate(rows_list) if _phase_from_labels(r["Labels"]) == phase]
        if not indices:
            continue

        span_days = (ph_end - ph_start).days + 1
        n_tasks = len(indices)
        for j, idx in enumerate(indices):
            if n_tasks == 1:
                s_off, e_off = 0, span_days - 1
            else:
                s_off = min(span_days - 1, int(j * span_days / n_tasks))
                e_off = min(span_days - 1, int((j + 1) * span_days / n_tasks) - 1)
                if e_off < s_off:
                    e_off = s_off
            rs = ph_start + timedelta(days=s_off)
            rd = ph_start + timedelta(days=e_off)
            rows_list[idx]["Start date"] = rs.isoformat()
            rows_list[idx]["Due date"] = rd.isoformat()


# Epics por fase (sin parent)
add(
    "Epic",
    "Fase 0: Setup repositorio y entorno local",
    "Preparar monorepo; Docker Compose dev; README; .env.example; ramas y convenciones según Plan v3.0 y GUIA_IMPLEMENTACION.",
    "inventory-qas fase-0 setup",
    5,
    "Highest",
)
add(
    "Epic",
    "Fase 1: Core funcional productos y stock",
    "Dominio product y stock; Flyway; API REST /api/v1; Swagger; reglas de negocio MVP.",
    "inventory-qas fase-1 core-backend",
    8,
    "Highest",
)
add(
    "Epic",
    "Fase 2: Seguridad Keycloak y permisos granulares",
    "Resource Server; realm export; JWT; @PreAuthorize; pruebas 401/403; CORS.",
    "inventory-qas fase-2 security",
    8,
    "High",
)
add(
    "Epic",
    "Fase 3: Dashboard, reportes y auditoría Envers",
    "Módulos report y audit; UI dashboard y /audit; KPIs y productos críticos.",
    "inventory-qas fase-3 reports",
    5,
    "High",
)
add(
    "Epic",
    "Fase 4: Testing full stack y evidencias",
    "Unit, integration, API, E2E, security, performance; JaCoCo; reportes en docs/qa-evidence.",
    "inventory-qas fase-4 testing",
    13,
    "High",
)
add(
    "Epic",
    "Fase 5: Observabilidad OpenTelemetry y Grafana stack",
    "OTLP, Alloy, Prometheus, Loki, Tempo, Grafana, Alertmanager; dashboards y alertas.",
    "inventory-qas fase-5 observability",
    8,
    "Medium",
)
add(
    "Epic",
    "Fase 6: CI/CD GitHub Actions, Jenkins y SonarQube",
    "Workflows PR; Jenkinsfile; quality gate; deploy staging; post-deploy smoke.",
    "inventory-qas fase-6 cicd",
    8,
    "High",
)
add(
    "Epic",
    "Fase 7: Documentación final y defensa",
    "Actualizar docs; capturas checklist; ensayo presentación; qa-evidence completo.",
    "inventory-qas fase-7 docs",
    5,
    "Medium",
)

# Fase 0
add(
    "Story",
    "Estructura monorepo según plan técnico",
    "Crear árbol: backend, frontend, docker, observability, keycloak, tests, docs, .github/workflows, Jenkinsfile, docker-compose dev/staging/test, .env.example, README. Criterio: clone y estructura visible.",
    "inventory-qas fase-0 setup",
    3,
    "Highest",
)
add(
    "Task",
    "Configurar .gitignore y política de secretos",
    "Ignorar node_modules, target, .env, dist, reportes, .idea. Documentar que .env no se versiona.",
    "inventory-qas fase-0 setup",
    1,
    "High",
)
add(
    "Task",
    "README inicial: stack y arranque en dev",
    "Descripción, stack (Spring Boot 3, React, PostgreSQL, Keycloak), prerequisitos, comando docker compose dev, enlaces a /docs.",
    "inventory-qas fase-0 docs",
    2,
    "High",
)
add(
    "Task",
    "Plantilla .env.example con variables mínimas",
    "Según Anexo A del plan: perfiles Spring, DATABASE_*, KEYCLOAK_*, OTEL_*, VITE_*, Grafana, Sonar, Jenkins (placeholders).",
    "inventory-qas fase-0 setup",
    1,
    "High",
)
add(
    "Task",
    "docker-compose.dev.yml (postgres, keycloak, backend, frontend)",
    "Puertos 5432, 8081, 8080, 3000; red interna; healthchecks básicos donde aplique.",
    "inventory-qas fase-0 infra",
    3,
    "Highest",
)
add(
    "Task",
    "Inicializar Spring Boot 3 + Java 21 en backend",
    "InventoryApplication en com.company.inventory; perfiles dev/test; Actuator /actuator/health público.",
    "inventory-qas fase-0 backend",
    2,
    "High",
)
add(
    "Task",
    "Inicializar frontend Vite + React + TypeScript",
    "strict TS; carpetas pages, components, hooks, lib, types; Tailwind + shadcn base.",
    "inventory-qas fase-0 frontend",
    2,
    "High",
)

# Fase 1 backend
add(
    "Story",
    "Migraciones Flyway V1–V7 del dominio inventario",
    "V1 categories; V2 products; V3 stock_movements; V4 users_profile; V5 auditoría Envers; V6 seed; V7 índices y constraints. Alinear con data-model.md y plan.",
    "inventory-qas fase-1 database",
    5,
    "Highest",
)
add(
    "Task",
    "Módulo common: excepciones y respuesta error estándar",
    "JSON con timestamp, status, error, message, path, correlationId; @ControllerAdvice.",
    "inventory-qas fase-1 backend",
    2,
    "High",
)
add(
    "Task",
    "CorrelationIdFilter, MDC y logging estructurado",
    "Propagar correlationId en operaciones críticas; preparar integración con trazas OTEL.",
    "inventory-qas fase-1 backend observability",
    2,
    "Medium",
)
add(
    "Task",
    "Entidades JPA Product, Category y repositorios",
    "SKU único; relación categoría; status e inactivación; Envers en entidades críticas (RF-AUD).",
    "inventory-qas fase-1 backend",
    3,
    "High",
)
add(
    "Task",
    "CRUD API productos: DTOs, mapper, validaciones",
    "GET/POST/PUT/DELETE /api/v1/products; paginación búsqueda filtros orden; 409 SKU duplicado; precio y stock inicial no negativos (RF-PROD).",
    "inventory-qas fase-1 backend rf-prod",
    5,
    "Highest",
)
add(
    "Task",
    "OpenAPI 3 + Swagger UI en dev/staging",
    "Esquema security Bearer JWT; descripciones, ejemplos, códigos 200/201/400/401/403/404/409/500.",
    "inventory-qas fase-1 backend",
    2,
    "High",
)
add(
    "Task",
    "Módulo stock: movimientos y reglas de negocio",
    "IN, OUT, ADJUST; prohibir stock negativo en salida; siempre crear stock_movement; marcar crítico si quantity <= min_stock (RF-STK).",
    "inventory-qas fase-1 backend rf-stk",
    5,
    "Highest",
)
add(
    "Task",
    "Endpoints GET /api/v1/stock y /api/v1/stock/movements",
    "Paginación; DTOs; sin serializar entidades JPA al cliente.",
    "inventory-qas fase-1 backend",
    2,
    "High",
)

# Fase 1 frontend
add(
    "Story",
    "UI productos: tabla, filtros y formularios crear/editar",
    "Rutas /products, /products/new, /products/:id/edit; DataTable; ProductForm; skeleton, empty y errores.",
    "inventory-qas fase-1 frontend rf-prod",
    5,
    "High",
)
add(
    "Task",
    "Cliente axios (baseURL, interceptors, errores)",
    "Preparar Bearer token; manejo 401/403 según development-guide (Keycloak en fase 2).",
    "inventory-qas fase-1 frontend",
    2,
    "High",
)
add(
    "Story",
    "UI stock: historial y registro de movimientos",
    "Ruta /stock/movements; formularios entrada/salida/ajuste; alineado RF-STK.",
    "inventory-qas fase-1 frontend rf-stk",
    3,
    "High",
)
add(
    "Task",
    "AppShell: layout con sidebar, topbar y usuario",
    "Navegación a módulos del plan (dashboard, productos, stock, reportes, auditoría).",
    "inventory-qas fase-1 frontend",
    2,
    "Medium",
)

# Fase 2
add(
    "Story",
    "Keycloak: realm inventory-realm y export versionado",
    "Clients inventory-frontend (public, PKCE) e inventory-api (resource server); roles compuestos; permisos product:view/manage, stock:view/manage, report:view, audit:view, user:manage; realm-export.json en keycloak/.",
    "inventory-qas fase-2 security rf-sec",
    8,
    "Highest",
)
add(
    "Task",
    "Spring Security OAuth2 Resource Server (JWT)",
    "issuer-uri, JWKS; rutas públicas solo las necesarias; integración con tests.",
    "inventory-qas fase-2 security",
    3,
    "Highest",
)
add(
    "Task",
    "@PreAuthorize en todos los endpoints de negocio",
    "Matriz del plan y security-model; JwtAuthoritiesConverter.",
    "inventory-qas fase-2 security rf-sec",
    3,
    "Highest",
)
add(
    "Task",
    "Frontend: login Keycloak y adjuntar JWT a la API",
    "OAuth2/OIDC PKCE; manejo refresh y logout.",
    "inventory-qas fase-2 frontend rf-sec",
    3,
    "High",
)
add(
    "Task",
    "ProtectedRoute y PermissionGate",
    "Guardas por permisos del token; ocultar acciones sin authority.",
    "inventory-qas fase-2 frontend rf-sec",
    2,
    "High",
)
add(
    "Task",
    "CORS restrictivo y tests 401/403",
    "Configuración producción/dev; pruebas API y/o integration documentadas.",
    "inventory-qas fase-2 security testing",
    2,
    "High",
)
add(
    "Task",
    "Pantalla /users-permissions (user:manage)",
    "Resumen lectura de roles/permisos para demostración académica.",
    "inventory-qas fase-2 frontend rf-sec",
    2,
    "Medium",
)

# Fase 3
add(
    "Task",
    "Módulo report: dashboard y productos críticos",
    "GET /api/v1/reports/dashboard y /api/v1/reports/critical-products; permiso report:view (RF-RPT).",
    "inventory-qas fase-3 backend rf-rpt",
    3,
    "High",
)
add(
    "Task",
    "Módulo audit: API sobre Envers / historial",
    "GET /api/v1/audit paginado; permiso audit:view (RF-AUD).",
    "inventory-qas fase-3 backend rf-aud",
    3,
    "High",
)
add(
    "Task",
    "UI /dashboard con KPIs y tablas",
    "KpiCard; métricas del plan; permiso report:view.",
    "inventory-qas fase-3 frontend rf-rpt",
    3,
    "High",
)
add(
    "Task",
    "UI /audit consulta paginada",
    "Filtros básicos; permiso audit:view.",
    "inventory-qas fase-3 frontend rf-aud",
    2,
    "Medium",
)
add(
    "Task",
    "Opcional: users_profile y nombres en historial",
    "Asociación keycloak_user_id; uso en movimientos y auditoría.",
    "inventory-qas fase-3 backend",
    2,
    "Low",
)

# Fase 4 testing
add(
    "Task",
    "Tests unitarios: ProductService, StockService, ReportService",
    "JUnit + Mockito; reglas SKU, precios, stock negativo; JaCoCo meta >=70% servicios críticos.",
    "inventory-qas fase-4 testing backend",
    5,
    "High",
)
add(
    "Task",
    "Integration tests con Testcontainers (PostgreSQL)",
    "Repositories y transacciones; perfil Maven integration-tests.",
    "inventory-qas fase-4 testing backend",
    3,
    "High",
)
add(
    "Task",
    "Integration tests de seguridad con Keycloak",
    "KeycloakSecurityIT o equivalente; token y authorities.",
    "inventory-qas fase-4 testing security",
    3,
    "High",
)
add(
    "Task",
    "API tests RestAssured (perfil api-tests)",
    "ProductApiTest, StockApiTest, PermissionApiTest (401/403).",
    "inventory-qas fase-4 testing api",
    3,
    "High",
)
add(
    "Task",
    "Contract testing con Schemathesis (u homólogo)",
    "Validación contra OpenAPI en CI si aplica.",
    "inventory-qas fase-4 testing api",
    2,
    "Medium",
)
add(
    "Task",
    "E2E Playwright: login, productos, stock, permisos, responsive",
    "Estructura tests/e2e/playwright; evidencias screenshots/traces.",
    "inventory-qas fase-4 testing e2e",
    5,
    "High",
)
add(
    "Task",
    "OWASP ZAP baseline + dependency check / Snyk",
    "Scripts y reportes HTML; integración pipeline o GA.",
    "inventory-qas fase-4 testing security",
    3,
    "High",
)
add(
    "Task",
    "Performance k6: productos y stock",
    "Escenarios carga/stress; resultados en docs o artefactos CI.",
    "inventory-qas fase-4 testing performance",
    2,
    "Medium",
)
add(
    "Task",
    "Validación de migraciones y seeds en CI",
    "Flyway up en entorno test; constraints y datos mínimos.",
    "inventory-qas fase-4 testing database",
    2,
    "Medium",
)
add(
    "Task",
    "Actualizar testing-guide.md y qa-evidence.md",
    "Enlaces o rutas a reportes; charters exploratorios; bugs encontrados.",
    "inventory-qas fase-4 docs",
    2,
    "Medium",
)

# Fase 5 observabilidad
add(
    "Task",
    "Instrumentación OpenTelemetry en backend",
    "Métricas, logs y trazas OTLP; OTEL_SERVICE_NAME=inventory-api; endpoint Alloy.",
    "inventory-qas fase-5 observability backend",
    3,
    "High",
)
add(
    "Task",
    "Configuración Alloy y Prometheus",
    "Scrape de métricas aplicación e infra según observability-guide.",
    "inventory-qas fase-5 observability infra",
    2,
    "High",
)
add(
    "Task",
    "Pipeline de logs hacia Loki (JSON estructurado)",
    "traceId, spanId, correlationId, usuario, endpoint.",
    "inventory-qas fase-5 observability",
    2,
    "High",
)
add(
    "Task",
    "Tempo + exploración de trazas en Grafana",
    "Datasource; ejemplo de request completo.",
    "inventory-qas fase-5 observability",
    2,
    "High",
)
add(
    "Task",
    "Dashboards Grafana mínimos (infra, app, DB, negocio, seguridad)",
    "Contenido según plan sección 12 y observability-guide.",
    "inventory-qas fase-5 observability",
    3,
    "High",
)
add(
    "Task",
    "Alertmanager: reglas CPU, error rate, latencia, auth",
    "Alertas de ejemplo activas; documentación paso a paso.",
    "inventory-qas fase-5 observability",
    2,
    "Medium",
)
add(
    "Task",
    "Compose staging: stack observabilidad completo",
    "prometheus, grafana, loki, tempo, alloy, alertmanager, sonarqube, jenkins según plan.",
    "inventory-qas fase-5 infra",
    2,
    "High",
)

# Fase 6 CI/CD
add(
    "Task",
    "GitHub Actions: validación en PR (ci.yml)",
    "Checkout, Java/Node, lint, mvn test, npm build, coverage, Docker build opcional.",
    "inventory-qas fase-6 cicd github-actions",
    3,
    "High",
)
add(
    "Task",
    "GitHub Actions: workflow de seguridad (security.yml)",
    "Escaneo de dependencias según estrategia del repo.",
    "inventory-qas fase-6 cicd",
    1,
    "Medium",
)
add(
    "Task",
    "Jenkinsfile: pipeline de entrega completa",
    "Etapas del plan: build, unit, integration, API, E2E, ZAP, Sonar, quality gate, docker, deploy staging, post-deploy smoke, archive artifacts.",
    "inventory-qas fase-6 cicd jenkins",
    5,
    "Highest",
)
add(
    "Task",
    "Scripts: run-sonar, run-zap-baseline, smoke-test",
    "Reproducibles en Linux/CI; documentados en README o docs.",
    "inventory-qas fase-6 cicd",
    2,
    "High",
)
add(
    "Task",
    "SonarQube: análisis + Quality Gate en Jenkins",
    "Subida JaCoCo; fallo pipeline si gate no pasa; captura evidencia.",
    "inventory-qas fase-6 quality",
    2,
    "High",
)
add(
    "Task",
    "Dockerfiles backend y frontend (+ nginx si producción)",
    "Imágenes usadas por docker compose staging.",
    "inventory-qas fase-6 infra",
    2,
    "High",
)
add(
    "Task",
    "docker-compose.test.yml para pruebas en CI",
    "Servicios mínimos para integration/API según testing-guide.",
    "inventory-qas fase-6 infra",
    2,
    "Medium",
)

# Fase 7
add(
    "Task",
    "Sincronizar docs: requirements, architecture, security-model",
    "Trazabilidad RF/RNF; diagramas coherentes con implementación.",
    "inventory-qas fase-7 docs",
    2,
    "Medium",
)
add(
    "Task",
    "Completar deployment-guide.md",
    "Ambientes dev/staging/prod, variables, troubleshooting, comandos Anexo B.",
    "inventory-qas fase-7 docs",
    2,
    "Medium",
)
add(
    "Task",
    "qa-evidence.md: checklist de capturas finales",
    "Swagger, Keycloak, Grafana, Tempo, Loki, Alertmanager, Jenkins, GA, Sonar, Playwright, ZAP, k6, PRs.",
    "inventory-qas fase-7 docs qa-evidence",
    3,
    "High",
)
add(
    "Task",
    "Verificar checklist entrega final (plan §18)",
    "Funcionalidad, seguridad, testing, observabilidad, CI/CD, repo y docs.",
    "inventory-qas fase-7 docs",
    2,
    "High",
)
add(
    "Task",
    "Ramas main/develop y protección de main en GitHub",
    "Sin merge directo a main; Conventional Commits en equipo.",
    "inventory-qas fase-7 process",
    1,
    "Medium",
)
add(
    "Task",
    "Ensayo de defensa técnica (guion Anexo C)",
    "Mensajes clave: monolito modular, permisos granulares, pruebas por capas, observabilidad, CI/CD.",
    "inventory-qas fase-7 docs",
    1,
    "Medium",
)

# Transversal / calidad
add(
    "Task",
    "Aplicar estándares development-guide en backend",
    "Capas, MapStruct/mappers, constructor injection, sin entidades en responses.",
    "inventory-qas quality backend",
    2,
    "Medium",
)
add(
    "Task",
    "Aplicar estándares development-guide en frontend",
    "TS strict, a11y, estados de UI, convenciones carpetas.",
    "inventory-qas quality frontend",
    2,
    "Medium",
)
add(
    "Task",
    "Seeds Flyway: categorías, productos y movimientos demo",
    "Datos alineados con usuarios/roles de prueba en Keycloak.",
    "inventory-qas fase-1 database",
    2,
    "Medium",
)
add(
    "Task",
    "[Extra] Report snapshots históricos",
    "Opcional si hay tiempo: tabla report_snapshots y jobs de agregación.",
    "inventory-qas extra",
    2,
    "Low",
)

assign_project_dates(rows, PROJECT_START, PROJECT_END)

for i, row in enumerate(rows, start=1):
    row["Summary"] = f"{ISSUE_REF_PREFIX}-{i} — {row['Summary']}"

fieldnames = [
    "Project key",
    "Issue type",
    "Summary",
    "Description",
    "Status",
    "Assignee",
    "Reporter",
    "Labels",
    "Due date",
    "Start date",
    "Sprint",
    "Story point estimate",
    "Parent",
    "Team",
]

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
    w.writeheader()
    w.writerows(rows)

print(f"Wrote {len(rows)} rows to {OUT}")
