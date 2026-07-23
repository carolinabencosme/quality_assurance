# Architecture - Cub Inventory QAS

## Summary

Cub uses a Spring Boot API, Next.js frontend, PostgreSQL persistence, Keycloak identity provider and a Grafana observability stack. The architecture is containerized with Docker Compose for dev, staging, observability and local production.

## Stack

Backend: Spring Boot 3.4, Java 21, Maven, PostgreSQL, Flyway, Hibernate Envers, Micrometer, OpenTelemetry.

Frontend: Next.js 16, React 19, TypeScript, Axios, App Router.

Security: Keycloak 26, OAuth2 Authorization Code + PKCE, JWT resource server, authorities.

Observability: Prometheus, Loki, Tempo, Alloy, Grafana, Alertmanager.

Testing: JUnit, Mockito, Testcontainers, Newman, Playwright, ZAP, Dependency Check, Schemathesis, k6.

## C4 Level 1

```mermaid
flowchart LR
  User[User] --> Frontend[Next.js Cub App]
  Frontend --> Keycloak[Keycloak]
  Frontend --> Backend[Spring Boot API]
  Backend --> Postgres[(PostgreSQL)]
  Backend --> Keycloak
  Backend --> Observability[Grafana Stack]
```

## C4 Level 2

```mermaid
flowchart TB
  Frontend --> Products[Products API]
  Frontend --> Stock[Stock API]
  Frontend --> Reports[Reports API]
  Frontend --> Audit[Audit API]
  Frontend --> Security[Security API]
  Products --> Postgres[(PostgreSQL + Flyway)]
  Stock --> Postgres
  Reports --> Postgres
  Audit --> Envers[Hibernate Envers tables]
  Security --> Realm[Keycloak realm-export]
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
