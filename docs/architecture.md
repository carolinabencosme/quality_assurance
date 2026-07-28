# Architecture - Cub Inventory QAS

## Summary

Cub uses a Spring Boot API, Next.js frontend, PostgreSQL persistence, Keycloak identity provider and a Grafana observability stack. Local demos use Docker Compose (dev, staging, observability, prod). Public staging/production UIs are on Vercel; API + Keycloak + Postgres are defined in `render.yaml` for Render (see `docs/CLOUD-STAGING-PROD.md`).


## Stack

Backend: Spring Boot 3.4, Java 21, Maven, PostgreSQL, Flyway, Hibernate Envers, Micrometer, OpenTelemetry.

Frontend: Next.js 16, React 19, TypeScript, Axios, App Router.

Security: Keycloak 26, OAuth2 Authorization Code + PKCE, JWT resource server, authorities.

Observability: Prometheus, Loki, Tempo, Alloy, Grafana, Alertmanager.

Testing: JUnit, Mockito, Testcontainers, Newman, Playwright, ZAP, Dependency Check, Schemathesis, k6.

## C4 diagrams

Model: **Cub Inventory QAS** — enterprise inventory with Full Stack Testing, DevSecOps and observability (Proyecto Final V3).

> Nota: los diagramas usan `flowchart` estilo C4 (compatible con preview de Cursor/GitHub). La semantica es C4 L1/L2/L3.

### Level 1 — System Context

Who uses Cub and which external systems it talks to.

```mermaid
flowchart TB
  subgraph personas["Personas"]
    user["Usuario de inventario<br/>admin / warehouse / clerk / viewer"]
    qa["Equipo QA / Docente<br/>pruebas, evidencias, CI/CD"]
  end

  cub["Cub Inventory QAS<br/>CRUD, stock, dashboard, Envers,<br/>seguridad granular, telemetria"]

  subgraph externos["Sistemas externos"]
    idp["Keycloak 26<br/>OIDC / JWT / scopes / policies"]
    ci["GitHub Actions + Jenkins<br/>build, tests, scans, deploy"]
  end

  user -->|"usa via navegador"| cub
  qa -->|"valida calidad y Grafana"| cub
  qa -->|"dispara y revisa pipelines"| ci
  cub -->|"autentica y autoriza"| idp
  ci -->|"construye, prueba y despliega"| cub
```

### Level 2 — Containers

Runtime containers inside Cub (Docker Compose: app + observability).

```mermaid
flowchart TB
  user["Usuario navegador"]

  subgraph cub["Cub Inventory QAS"]
    subgraph app["Aplicacion"]
      web["Frontend Cub<br/>Next.js 16 / React 19<br/>PKCE + UI"]
      api["Backend API<br/>Spring Boot 3.4 / Java 21<br/>REST + JWT + OTEL"]
      db[("PostgreSQL 16<br/>Flyway + Envers")]
      kc["Keycloak 26<br/>realm + scopes/policies"]
    end

    subgraph obs["Observabilidad"]
      alloy["Alloy<br/>OTLP collector"]
      prom["Prometheus"]
      loki["Loki"]
      tempo["Tempo"]
      am["Alertmanager"]
      graf["Grafana<br/>App / Infra / Business / Security"]
    end
  end

  user --> web
  user --> graf
  web -->|"OIDC PKCE"| kc
  web -->|"REST Bearer JWT"| api
  api -->|"JDBC"| db
  api -->|"JWKS + Admin API"| kc
  api -->|"OTLP"| alloy
  alloy --> loki
  alloy --> tempo
  prom -->|"scrape /actuator/prometheus"| api
  prom --> am
  graf --> prom
  graf --> loki
  graf --> tempo
```

### Level 3 — Components (Backend API)

Internal structure of the Spring Boot container (modules that map to PDF capabilities).

```mermaid
flowchart TB
  subgraph api["Backend API - Spring Boot"]
    sec["Security / JWT<br/>converter + PreAuthorize"]
    prod["Products<br/>CRUD + soft delete"]
    stock["Stock<br/>IN / OUT / ADJUSTMENT"]
    report["Reports<br/>dashboard KPIs"]
    audit["Audit<br/>Envers"]
    users["Users Admin<br/>Keycloak Admin API"]
    obs["Observability<br/>MDC + metrics + JDBC traces"]
    openapi["OpenAPI<br/>Swagger"]
  end

  db[("PostgreSQL")]
  kc["Keycloak"]
  alloy["Alloy"]

  sec --> prod
  sec --> stock
  sec --> report
  sec --> audit
  sec --> users
  sec -->|"JWKS"| kc
  users -->|"Admin REST"| kc
  prod --> db
  stock --> db
  report --> db
  audit --> db
  obs -->|"OTLP"| alloy
  openapi -.-> prod
```

### Level 3 — Components (Frontend Cub)

```mermaid
flowchart TB
  subgraph web["Frontend - Next.js"]
    auth["Auth / OIDC<br/>PKCE + refresh"]
    nav["Navigation<br/>filtrada por permisos"]
    dash["Dashboard UI"]
    prodUi["Products UI"]
    stockUi["Stock UI"]
    adminUi["Admin UI<br/>permissions + users"]
    http["HTTP Client<br/>Axios Bearer"]
  end

  api["Backend API"]
  kc["Keycloak"]

  auth -->|"code + token"| kc
  auth --> http
  nav --> auth
  dash --> http
  prodUi --> http
  stockUi --> http
  adminUi --> http
  http -->|"REST JWT"| api
```

### Level 2 (CI/CD and QA) — Supporting systems

Not runtime of the business app, but required by the PDF DevSecOps model.

```mermaid
flowchart LR
  subgraph devops["DevSecOps / Full Stack Testing"]
    gha["GitHub Actions"]
    jenkins["Jenkins"]
    tests["Test suites<br/>JUnit Newman Playwright k6"]
    evidence["QA Evidence<br/>docs/qa-evidence"]
  end

  runtime["Cub runtime<br/>Docker Compose"]

  gha --> runtime
  jenkins --> runtime
  gha --> tests
  jenkins --> tests
  tests --> runtime
  tests --> evidence
```

## Authentication Flow

```mermaid
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant K as Keycloak
  participant B as Backend
  participant DB as PostgreSQL
  U->>F: Open protected app
  F->>K: Authorization Code + PKCE
  K-->>F: code
  F->>K: token request
  K-->>F: access + refresh token
  F->>B: API request with JWT
  B->>K: JWKS validation
  B->>DB: business data
  B-->>F: response
```

## Authorization: Scopes + Policies

Keycloak exports seven business scopes:

`product:view`, `product:manage`, `stock:view`, `stock:manage`, `report:view`, `user:manage`, `audit:view`.

`inventory-api` has Authorization Services enabled with resources for Products, Stock, Reports, Users and Audit. Role policies map `inventory-admin`, `warehouse-manager`, `inventory-clerk` and `inventory-viewer` to allowed scopes.

Spring Resource Server remains the enforcement point for API requests. `KeycloakJwtAuthoritiesConverter` reads:

- realm roles, expanded through local role-to-permission mapping
- `resource_access.inventory-api.roles`
- `scope` claim as string or array

When role claims are present, scope aliases are added only for permissions already backed by roles. This prevents optional requested scopes from over-granting lower-privilege users while still exposing `SCOPE_product:view` style evidence.

```mermaid
flowchart LR
  Token[Keycloak JWT] --> Converter[JWT authorities converter]
  Converter --> Roles[realm/resource roles]
  Converter --> Scopes[scope claim]
  Roles --> Authorities[product:view and SCOPE_product:view]
  Scopes --> Authorities
  Authorities --> PreAuth[@PreAuthorize]
```

## User Management Flow

```mermaid
sequenceDiagram
  participant A as Admin UI
  participant B as Backend /api/v1/users
  participant K as Keycloak Admin API
  A->>B: user:manage JWT
  B->>K: client_credentials inventory-admin-api
  K-->>B: users and role mappings
  B-->>A: users, enabled state, managed roles
```

## Stock Movement Flow

```mermaid
flowchart LR
  UI[Stock UI] --> API[POST /api/v1/stock/movements]
  API --> Rules[Validate type and quantity]
  Rules --> Product[Update product quantity]
  Product --> Movement[Persist movement with userId and correlationId]
  Movement --> History[History and dashboard]
```

## Envers Audit Flow

```mermaid
flowchart LR
  ProductChange[Product create/update/soft delete] --> Envers[Envers listener]
  Envers --> REVINFO[Inventory revision]
  Envers --> ProductAUD[product_AUD tables]
  AuditAPI[/api/v1/audit/] --> ProductAUD
```

## Observability Flow

```mermaid
flowchart LR
  Backend -->|metrics| Prometheus
  Backend -->|logs/traces| Alloy
  Alloy --> Loki
  Alloy --> Tempo
  Prometheus --> Grafana
  Loki --> Grafana
  Tempo --> Grafana
  Prometheus --> Alertmanager
```

## CI/CD Flow

```mermaid
flowchart LR
  Push[Push / PR] --> GHA[GitHub Actions]
  GHA --> Build[Backend + Frontend build]
  GHA --> Tests[JUnit + Newman + Playwright]
  GHA --> Security[ZAP + Dependency Check + Schemathesis]
  GHA --> Perf[k6]
  Jenkins[Jenkinsfile] --> Staging[Local staging compose]
  Staging --> Smoke[Post deploy smoke]
```

## Services and Ports

| Service | Port | Notes |
|---|---:|---|
| Frontend | 3000 | Next.js app |
| Backend | 8080 | API, Swagger, Actuator |
| Keycloak | 8081 | Public IdP URL |
| PostgreSQL | 5432 | Dev only exposed |
| Grafana | 3030 | Dashboards |
| Prometheus | 9090 | Metrics |
| Loki | 3100 | Logs |
| Tempo | 3200 | Traces |
| Alertmanager | 9093 | Alerts |

## Main Environment Variables

`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_JWKS_URI`, `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_APP_URL`, `INVENTORY_CORS_ORIGINS`, `OTEL_EXPORTER_OTLP_*`.

## Decisions

| ADR | Decision |
|---|---|
| ADR-01 | Spring Boot + PostgreSQL for transactional inventory |
| ADR-02 | Keycloak + PKCE for enterprise auth |
| ADR-03 | Authorization by effective authority from roles and scopes |
| ADR-04 | Soft delete + Envers for traceability |
| ADR-05 | Testcontainers for integration database tests |
| ADR-06 | OpenTelemetry stack for metrics, logs and traces |
| ADR-07 | Docker Compose for dev, staging and local production |

## Known Limitations

Local production is demonstrable, not cloud-hardened. PostgreSQL exporter is not included, so database infrastructure alerts are documented as a limitation. k6, JMeter, Snyk and security scans can be heavy and may run manually in CI.

## Basic Maintenance

Run Flyway validation after migrations, keep Keycloak realm export versioned, update `.env.example` for new variables, and archive QA evidence under `docs/qa-evidence/`.
