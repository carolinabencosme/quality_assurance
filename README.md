# Cub - Enterprise Inventory QAS

Cub is a full stack inventory system built for final defense: product CRUD, stock movements, Envers audit, Keycloak security, observability and DevSecOps evidence.

## Stack

Spring Boot 3.4, Java 21, PostgreSQL, Flyway, Hibernate Envers, Next.js 15, React 19, Keycloak 26, Docker Compose, Prometheus, Loki, Tempo, Alloy, Grafana, Alertmanager, GitHub Actions and Jenkins.

## Quick Start

```powershell
copy .env.example .env
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

| Service | URL |
|---|---|
| App Cub | http://localhost:3000 |
| API / Swagger | http://localhost:8080/swagger-ui.html |
| Keycloak | http://localhost:8081 |
| Grafana | http://localhost:3030 |
| Prometheus | http://localhost:9090 |
| Loki | http://localhost:3100 |
| Tempo | http://localhost:3200 |
| Alertmanager | http://localhost:9093 |

Demo users: `viewer/viewer123`, `warehouse/warehouse123`, `admin/admin123`.

## Core Features

- Product CRUD with pagination, search, filters and soft delete.
- Stock IN, OUT and ADJUSTMENT with movement history.
- Dashboard with KPIs, critical products, top sold products by OUT movements and recent movements.
- Dashboard system metrics from `/api/v1/observability/system-metrics`.
- Envers audit protected by `audit:view`.
- Keycloak user management protected by `user:manage`.
- Read-only permissions matrix protected by `user:manage`.
- Swagger/OpenAPI at `/swagger-ui.html`.

## Security

Keycloak is the identity provider. The frontend uses Authorization Code + PKCE and refresh tokens. The backend validates JWTs and protects endpoints with authorities such as `product:view`, `stock:manage`, `report:view`, `audit:view` and `user:manage`.

The realm exports business OAuth2 scopes and Authorization Services policies for Products, Stock, Reports, Users and Audit. Spring enforces the effective JWT authorities from role claims and scope claims.

## Testing

```powershell
.\scripts\run-all-tests.ps1
```

Focused commands:

```powershell
cd backend
.\mvnw.cmd verify
mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=9

cd ..\tests\api
npm install
npm test

cd ..\e2e
npm install
npm test

cd ..\..
.\scripts\run-zap-baseline.ps1
.\scripts\run-schemathesis.ps1
.\scripts\run-k6.ps1
.\scripts\run-k6-stress.ps1
.\scripts\run-jmeter.ps1
```

Evidence index: `docs/qa-evidence.md`.

## Observability

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
.\tests\observability\smoke.ps1
```

Grafana dashboards: Inventory API Overview, Inventory Infra, Inventory Business and Inventory Security.

Guide: `docs/observability-guide.md`.

## CI/CD

GitHub Actions: CI, Newman, Playwright, deploy staging, deploy production, ZAP, Dependency Check, Snyk, Schemathesis, k6, JMeter and Full QA Pipeline.

Jenkins: `Jenkinsfile` includes build, tests, Docker build, staging, Newman, Playwright, ZAP, Dependency Check, k6, Sonar and artifact stages.

## Local Production Demo

```powershell
copy .env.prod.example .env.prod
.\scripts\up-prod.ps1
.\scripts\post-deploy-smoke.ps1
```

This is local production for academic demonstration, not a hardened cloud deployment. Change placeholder passwords before any real use.

## Documentation

- `docs/requirements.md`
- `docs/installation.md`
- `docs/maintenance.md`
- `docs/architecture.md`
- `docs/testing-guide.md`
- `docs/observability-guide.md`
- `docs/qa-evidence.md`
- `docs/qa-evidence/FINAL-CHECKLIST.md`

## Troubleshooting

- Windows Testcontainers: set `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=//./pipe/docker_engine`.
- Keycloak browser URL must remain `http://localhost:8081`.
- Backend JWKS inside Docker must remain `http://keycloak:8080/...`.
- Loki/Tempo can need extra time on first cold start; rerun smoke after healthchecks settle.
