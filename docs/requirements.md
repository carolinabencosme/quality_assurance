# Requirements - Cub Inventory QAS

## Introduction

Cub is an enterprise inventory system for product catalog management, stock movements, auditability, security, observability and QA evidence.

## Scope

The system covers inventory CRUD, stock IN/OUT/ADJUSTMENT, dashboard KPIs, audit events, granular permissions, OpenAPI, automated testing, DevSecOps scans and local Docker environments.

## Functional Requirements

| ID | Requirement | Status | Implementation |
|---|---|---|---|
| RF-01 | Create product | Done | `POST /api/v1/products`, UI `/products/new` |
| RF-02 | Edit product | Done | `PUT /api/v1/products/{id}`, UI edit page |
| RF-03 | Delete product | Done as soft delete | `DELETE /api/v1/products/{id}` sets `INACTIVE` |
| RF-04 | List products | Done | paginated products API and UI |
| RF-05 | Search products | Done | `search` filter |
| RF-06 | Filter products | Done | category, status, critical |
| RF-07 | Sort products | Done | Spring pageable sort |
| RF-08 | Register stock IN | Done | `POST /api/v1/stock/movements` |
| RF-09 | Register stock OUT | Done | rejects negative stock |
| RF-10 | Register stock ADJUSTMENT | Done | fixed final quantity |
| RF-11 | View stock history | Done | `/api/v1/stock/movements` and UI |
| RF-12 | Minimum stock alerts | Done | critical products report |
| RF-13 | Audit with Envers | Done | `/api/v1/audit` |
| RF-14 | Dashboard KPIs | Done | `/api/v1/reports/dashboard` |
| RF-15 | Critical products | Done | dashboard and report endpoint |
| RF-16 | Top sold products | Done | proxy: OUT movements in last 30 days |
| RF-17 | Recent movement history | Done | dashboard recent movements |
| RF-18 | OpenAPI / Swagger | Done | `/swagger-ui.html`, `/v3/api-docs` |
| RF-19 | Granular security | Done | `@PreAuthorize` by authority |
| RF-20 | `user:manage` matrix | Done | `/api/v1/security/permissions-matrix`, UI `/admin/permissions` |
| RF-21 | OAuth2 business scopes | Done | Keycloak client scopes, JWT converter, OIDC scope request |
| RF-22 | Real user management | Done | `/api/v1/users`, UI `/admin/users`, Keycloak Admin API |
| RF-23 | System metrics dashboard | Done | `/api/v1/observability/system-metrics`, dashboard UI |

## Soft Delete

The product delete requirement is implemented as logical deletion. `DELETE /api/v1/products/{id}` does not physically remove the record; it changes the status to `INACTIVE`. This protects traceability, Envers audit history and stock movement history, which is the expected behavior in an enterprise inventory system.

## Non Functional Requirements

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| RNF-01 | OAuth2/JWT/Keycloak security | Done | Keycloak realm, security tests |
| RNF-02 | Granular authorization | Done | authorities and UI navigation filtering |
| RNF-03 | Observability | Done | Prometheus, Loki, Tempo, Alloy, Grafana |
| RNF-04 | Traceability | Done | Envers, stock history, correlation id |
| RNF-05 | Performance | Implemented and live sealed | k6 load/stress and JMeter zero-failure summaries |
| RNF-06 | CI/CD | PDF-compliant staging flow | Post-deploy Newman, Playwright/a11y, auth smoke and Schemathesis |
| RNF-07 | Code quality | Live sealed | JaCoCo 60 percent gate plus real Sonar Quality Gate |
| RNF-08 | Maintainability | Done | layered backend, typed frontend |
| RNF-09 | Dockerization | Done | dev, test, observability, staging, prod compose |
| RNF-10 | Versioned migrations | Done | Flyway migrations |
| RNF-11 | Audit | Done | Hibernate Envers |
| RNF-12 | Automated testing | Live sealed | JUnit/Testcontainers, Newman, Playwright snapshots/axe, ZAP, Dependency Check, Snyk, Schemathesis, k6, JMeter |
| RNF-13 | Accessibility | Done | axe smoke rejects critical/serious violations |
| RNF-14 | Correlated observability | Live sealed | Loki user/endpoint/correlation plus Tempo HTTP and JDBC spans |

## Permissions Matrix

| Module | Permission | Description | Roles |
|---|---|---|---|
| Products | `product:view` | View products | admin, warehouse-manager, clerk, viewer |
| Products | `product:manage` | Create, update, soft delete | admin, warehouse-manager |
| Stock | `stock:view` | View stock and movements | admin, warehouse-manager, clerk, viewer |
| Stock | `stock:manage` | Register stock movements | admin, warehouse-manager, clerk |
| Reports | `report:view` | View dashboard and reports | admin, warehouse-manager, viewer |
| Audit | `audit:view` | View Envers audit events | admin |
| Users | `user:manage` | Manage Keycloak users and view permission matrix | admin |

## Main Use Cases

1. Admin reviews dashboard, audit and permission matrix.
2. Warehouse manager creates products and registers stock movements.
3. Viewer reviews products, dashboard and reports without manage permissions.
4. QA runs unit, integration, API, E2E, security and performance evidence.

## Out of Scope

Billing, real sales module, purchasing/procurement, multi-tenant support and real cloud production are out of scope. "Top sold products" is implemented as a professional inventory proxy: products with the largest OUT quantity in the last 30 days.

## PDF Traceability

| PDF requirement | State | Path / evidence | Notes |
|---|---|---|---|
| Product CRUD | Done | `backend/product`, `frontend/app/(app)/products` | Soft delete documented |
| Stock movements | Done | `backend/stock`, UI stock page | IN/OUT/ADJUSTMENT |
| Dashboard | Done | `ReportService`, dashboard UI | Includes KPIs, critical, recent, top sold |
| Security roles | Done | Keycloak realm, `Permission` | Authority based |
| User management | Done | `/api/v1/users`, `/admin/users` | Keycloak remains source of truth |
| Audit | Done | Envers migrations and `/audit` | Protected by `audit:view` |
| Testing | Expanded | `docs/qa-evidence.md` | Full stack testing |
| Observability | Expanded | `docs/observability-guide.md` | Grafana dashboards and alerts |
| OAuth scopes and policies | Done | `keycloak/realm-export.json`, converter tests | Scopes in JWT plus Keycloak Authorization Services metadata |
| DevSecOps | Expanded | `.github/workflows`, `Jenkinsfile` | ZAP, Dependency Check, Snyk, Schemathesis, k6, JMeter |
| Staging post-deploy testing | Done | `.github/workflows/deploy-staging.yml` | Tests execute after the stack is healthy |
| Accessibility | Done | `tests/e2e/specs/a11y-smoke.spec.ts` | Critical/serious gate |
| Sonar quality | Live sealed | `docs/qa-evidence/sonar-summary.md` | Gate OK with recorded metrics |
| Logs and DB traces | Live sealed | `docs/qa-evidence/observability-live-summary.md` | Loki-to-Tempo correlation with JDBC spans |
