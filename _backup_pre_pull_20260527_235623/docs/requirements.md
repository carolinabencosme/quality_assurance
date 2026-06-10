# Requisitos del sistema — Inventario Empresarial QAS

Documento de requisitos funcionales (RF) y no funcionales (RNF) con identificadores únicos para trazabilidad con pruebas, issues y entregables.

---

## 1. Contexto y objetivos

### 1.1 Propósito del sistema

Gestionar el inventario empresarial de productos: catálogo, existencias, movimientos de stock, reportes operativos y auditoría de cambios, con acceso controlado por identidad centralizada (Keycloak) y calidad demostrable (testing, observabilidad, CI/CD).

### 1.2 Objetivos de calidad del proyecto (académicos)

| Objetivo | Descripción |
|----------|-------------|
| OQ-01 | Demostrar arquitectura profesional (monolito modular) |
| OQ-02 | Demostrar seguridad real (permisos granulares, no solo roles) |
| OQ-03 | Demostrar testing en múltiples capas con reportes |
| OQ-04 | Demostrar observabilidad (métricas, logs, trazas, alertas) |
| OQ-05 | Demostrar CI/CD automatizado y Quality Gate |
| OQ-06 | Entregar documentación y evidencias defendibles |

### 1.3 Alcance

**En alcance (MVP obligatorio):**

- CRUD de productos con validaciones y paginación
- Movimientos de stock (entrada, salida, ajuste)
- Dashboard con KPIs y productos críticos
- API REST versionada y documentada (OpenAPI)
- Autenticación/autorización con Keycloak
- PostgreSQL con migraciones Flyway
- Auditoría con Hibernate Envers
- Docker Compose (dev y staging)
- Pruebas: unit, integration, API, E2E, security, performance
- Stack Grafana (Prometheus, Loki, Tempo)
- GitHub Actions + Jenkins + SonarQube

**Fuera de alcance (extras opcionales):**

- Microservicios
- Supabase Auth como IdP principal
- Gestión avanzada de usuarios desde UI (más allá de consulta)
- Report snapshots históricos persistentes
- Multi-tenant

---

## 2. Actores y roles

| Actor | Descripción | Rol Keycloak típico |
|-------|-------------|---------------------|
| Administrador | Control total | Admin |
| Jefe de almacén | Gestión operativa inventario | Warehouse Manager |
| Auxiliar de inventario | Registra entradas/salidas | Inventory Clerk |
| Auditor / visor | Solo consulta y auditoría | Viewer / Auditor |
| Empleado básico | Lectura limitada | Employee Basic |

---

## 3. Requisitos funcionales

### 3.1 Módulo Productos

| ID | Requisito | Prioridad | Criterio de aceptación |
|----|-----------|-----------|------------------------|
| RF-PROD-01 | Listar productos con paginación | Alta | `GET /api/v1/products?page&size&sort` devuelve página JSON |
| RF-PROD-02 | Buscar y filtrar productos | Alta | Filtros por nombre, SKU, categoría, status |
| RF-PROD-03 | Ver detalle de producto | Alta | `GET /api/v1/products/{id}` con permiso `product:view` |
| RF-PROD-04 | Crear producto | Alta | POST valida SKU único, precio ≥ 0, stock inicial ≥ 0 |
| RF-PROD-05 | Editar producto | Alta | PUT actualiza campos permitidos |
| RF-PROD-06 | Inactivar producto (soft delete) | Alta | Productos con historial no se borran físicamente |
| RF-PROD-07 | Rechazar SKU duplicado | Alta | HTTP 409 con mensaje claro |
| RF-PROD-08 | Organizar por categorías | Media | Relación producto ↔ categoría |

### 3.2 Módulo Stock

| ID | Requisito | Prioridad | Criterio de aceptación |
|----|-----------|-----------|------------------------|
| RF-STK-01 | Consultar existencias actuales | Alta | `GET /api/v1/stock` |
| RF-STK-02 | Ver historial de movimientos | Alta | `GET /api/v1/stock/movements` paginado |
| RF-STK-03 | Registrar entrada (IN) | Alta | Incrementa `quantity` y crea movimiento |
| RF-STK-04 | Registrar salida (OUT) | Alta | Decrementa sin dejar stock negativo |
| RF-STK-05 | Registrar ajuste (ADJUST) | Alta | Establece cantidad con registro de delta |
| RF-STK-06 | Alerta stock mínimo | Alta | Producto crítico si `quantity <= min_stock` |
| RF-STK-07 | Trazabilidad de movimiento | Alta | Movimiento incluye usuario, fecha, `correlation_id` |

### 3.3 Módulo Reportes

| ID | Requisito | Prioridad | Criterio de aceptación |
|----|-----------|-----------|------------------------|
| RF-RPT-01 | Dashboard con KPIs | Alta | Total productos, críticos, movimientos del día |
| RF-RPT-02 | Listado productos críticos | Alta | `GET /api/v1/reports/critical-products` |
| RF-RPT-03 | Visualización en frontend | Alta | Pantalla `/dashboard` con tarjetas y tablas |

### 3.4 Módulo Auditoría

| ID | Requisito | Prioridad | Criterio de aceptación |
|----|-----------|-----------|------------------------|
| RF-AUD-01 | Historial de cambios en entidades | Alta | Envers en entidades críticas (Product) |
| RF-AUD-02 | Consulta de auditoría vía API | Alta | `GET /api/v1/audit` con `audit:view` |
| RF-AUD-03 | UI de auditoría | Media | Pantalla `/audit` paginada |

### 3.5 Módulo Seguridad e identidad

| ID | Requisito | Prioridad | Criterio de aceptación |
|----|-----------|-----------|------------------------|
| RF-SEC-01 | Login vía Keycloak (OAuth2 + PKCE) | Alta | Frontend redirige a IdP y obtiene tokens |
| RF-SEC-02 | API valida JWT en cada request | Alta | Resource Server Spring Security |
| RF-SEC-03 | Permisos granulares por endpoint | Alta | `@PreAuthorize` con authorities específicas |
| RF-SEC-04 | UI oculta acciones sin permiso | Alta | `PermissionGate` en botones CRUD |
| RF-SEC-05 | Respuesta 401 sin token / token inválido | Alta | Probado en API y E2E |
| RF-SEC-06 | Respuesta 403 sin permiso | Alta | Probado por rol |
| RF-SEC-07 | Realm export reproducible | Alta | `keycloak/realm-export.json` en repo |
| RF-SEC-08 | CORS restringido | Media | Solo orígenes configurados |

### 3.6 Módulo Frontend

| ID | Requisito | Prioridad | Criterio de aceptación |
|----|-----------|-----------|------------------------|
| RF-UI-01 | Layout AppShell (sidebar, topbar) | Alta | Navegación consistente |
| RF-UI-02 | Rutas protegidas por autenticación | Alta | `ProtectedRoute` |
| RF-UI-03 | Estados loading / empty / error | Alta | Sin pantallas rotas ante fallos API |
| RF-UI-04 | Diseño responsive | Media | Playwright en viewport mobile |
| RF-UI-05 | Pantalla permisos (admin) | Baja | `/users-permissions` con `user:manage` |

---

## 4. Requisitos no funcionales

### 4.1 Arquitectura y mantenibilidad

| ID | Requisito | Métrica / criterio |
|----|-----------|-------------------|
| RNF-ARCH-01 | Monolito modular por dominio | Paquetes: product, stock, report, audit, security, observability, common |
| RNF-ARCH-02 | Separación capas | Controller → Service → Repository; sin lógica de negocio en controllers |
| RNF-ARCH-03 | DTOs en API | Nunca exponer entidades JPA directamente |
| RNF-ARCH-04 | API versionada | Prefijo `/api/v1/` |
| RNF-ARCH-05 | Migraciones versionadas | Flyway; sin DDL manual en producción |

### 4.2 Seguridad

| ID | Requisito | Métrica / criterio |
|----|-----------|-------------------|
| RNF-SEC-01 | OAuth2 Resource Server | Sin gestión de contraseñas en backend |
| RNF-SEC-02 | Sin secretos en repositorio | `.env` en `.gitignore`; secrets en CI |
| RNF-SEC-03 | Escaneo dependencias | OWASP Dependency Check o Snyk en pipeline |
| RNF-SEC-04 | Escaneo dinámico | OWASP ZAP baseline documentado |
| RNF-SEC-05 | Sesiones y refresh tokens | Configurados en Keycloak según política |

### 4.3 Rendimiento

| ID | Requisito | Métrica / criterio |
|----|-----------|-------------------|
| RNF-PERF-01 | Prueba de carga productos | k6: 100 VUs consultando listado |
| RNF-PERF-02 | Prueba de carga stock | k6: 50 VUs registrando movimientos |
| RNF-PERF-03 | Latencia bajo carga | Documentar p95 y error rate en qa-evidence |

### 4.4 Observabilidad

| ID | Requisito | Métrica / criterio |
|----|-----------|-------------------|
| RNF-OBS-01 | Métricas JVM y HTTP | Prometheus scrape del backend |
| RNF-OBS-02 | Logs estructurados JSON | traceId, spanId, correlationId, user, endpoint |
| RNF-OBS-03 | Trazas distribuidas | Request visible en Tempo vía Grafana |
| RNF-OBS-04 | Dashboards Grafana | Mínimo infra + aplicación |
| RNF-OBS-05 | Alertas | Alertmanager con reglas CPU, error rate, health |

### 4.5 Testing y calidad de código

| ID | Requisito | Métrica / criterio |
|----|-----------|-------------------|
| RNF-TEST-01 | Cobertura backend servicios | ≥ 70% (JaCoCo) |
| RNF-TEST-02 | Integration tests | Testcontainers PostgreSQL + Keycloak |
| RNF-TEST-03 | API / contract tests | RestAssured + Schemathesis vs OpenAPI |
| RNF-TEST-04 | E2E | Playwright flujos principales |
| RNF-TEST-05 | SonarQube Quality Gate | 0 bugs/vulnerabilidades críticas; duplicación ≤ 5% |

### 4.6 CI/CD y despliegue

| ID | Requisito | Métrica / criterio |
|----|-----------|-------------------|
| RNF-CICD-01 | Validación en PR | GitHub Actions: build + unit tests |
| RNF-CICD-02 | Pipeline entrega completa | Jenkins hasta staging |
| RNF-CICD-03 | Smoke post-deploy | Tests contra sistema ya levantado |
| RNF-CICD-04 | Contenedores reproducibles | Docker Compose dev y staging |

### 4.7 Documentación

| ID | Requisito | Métrica / criterio |
|----|-----------|-------------------|
| RNF-DOC-01 | README operativo | Cómo levantar dev/staging |
| RNF-DOC-02 | Docs técnicas en `/docs` | architecture, security, testing, deployment, observability |
| RNF-DOC-03 | Evidencias QA | qa-evidence.md con capturas y reportes |

---

## 5. Matriz de trazabilidad (resumen)

| Requisito | Prueba asociada | Documento |
|-----------|-----------------|-----------|
| RF-PROD-07 | ProductServiceTest, ProductApiTest | testing-guide |
| RF-STK-04 | StockServiceTest, StockApiTest | testing-guide |
| RF-SEC-05/06 | PermissionApiTest, KeycloakSecurityIT | security-model |
| RF-RPT-01 | ReportServiceTest, E2E dashboard | testing-guide |
| RNF-OBS-02 | Log inspection en Loki | observability-guide |
| RNF-CICD-01 | GitHub Actions workflow | cicd-and-quality |

---

## 6. Reglas de negocio globales

1. SKU único en todo el catálogo.
2. Precio y cantidades no negativas en creación.
3. Salida de stock no puede dejar cantidad &lt; 0.
4. Toda modificación de stock genera fila en `stock_movements`.
5. Producto crítico cuando `quantity <= min_stock`.
6. Inactivación preferida sobre borrado físico si hay historial.
7. Operaciones críticas registran usuario, timestamp y `correlationId`.

---

## 7. Supuestos y restricciones

**Supuestos:**

- Un solo realm Keycloak para todos los ambientes de demo.
- Volumen de datos académico (miles, no millones de registros).
- Un equipo con acceso a Docker en estaciones de desarrollo.

**Restricciones:**

- No microservicios en MVP.
- PostgreSQL en Docker (no Supabase Auth como IdP).
- Entrega con evidencias visuales para defensa oral.

---

*Referencias: [architecture.md](./architecture.md), [data-model.md](./data-model.md), [GUIA_IMPLEMENTACION_PASO_A_PASO.md](./GUIA_IMPLEMENTACION_PASO_A_PASO.md)*
