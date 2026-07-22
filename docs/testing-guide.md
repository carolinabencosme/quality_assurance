# Testing Guide

## Test Layers

| Layer | Tool | Location | Current scope |
|---|---|---|---|
| Unit | JUnit 5 + Mockito | `backend/src/test/java` | services, mappers, entities, security converter |
| Integration | Spring Boot + Testcontainers | `backend/src/test/java/**/*IntegrationTest.java` | API, repositories, reports, stock, Keycloak real tokens |
| Coverage | JaCoCo | `backend/pom.xml` | 60 percent line gate |
| API | Newman/Postman | `tests/api` | 29 requests, including scopes, users and system metrics |
| E2E | Playwright | `tests/e2e/specs` | responsive, stock, permissions, user admin and visual baselines |
| Accessibility | Playwright + axe | `tests/e2e/specs/a11y-smoke.spec.ts` | zero critical/serious violations on dashboard and products |
| Security smoke | PowerShell | `tests/security/auth-smoke.ps1` | 401, 403, 200, invalid token |
| ZAP | OWASP ZAP | `scripts/run-zap-baseline.*` | baseline scan and HTML report |
| Dependency scan | OWASP Dependency Check + Snyk | `backend/pom.xml`, `.github/workflows/security-snyk.yml` | CVSS 9 gate and manual Snyk scan |
| Contract | Schemathesis | `scripts/run-schemathesis.*` | OpenAPI checks |
| Performance | k6 + JMeter | `tests/performance` | load, stress and JMeter plans |
| Observability | PowerShell smoke | `tests/observability/smoke.ps1` | Prometheus/Grafana/Loki/Tempo |

## Backend

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
cd backend
.\mvnw.cmd verify
```

Docker is required for the sealed run. `scripts/verify-keycloak-it-report.ps1` rejects missing reports, skips, failures and errors; CI therefore cannot claim a green Keycloak integration test without a real container.

`KeycloakContainerIntegrationTest` imports `keycloak/realm-export.json`, obtains real Keycloak tokens and calls protected endpoints without `SecurityMockMvcRequestPostProcessors.jwt()`.

`ProductRepositoryConstraintTest` validates negative database constraints for duplicate SKU, missing movement FK and duplicate `users_profile.keycloak_user_id`.

## API Newman

```powershell
cd tests/api
npm install
$sku = "NM-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=$sku"
```

## E2E Playwright

```powershell
cd tests/e2e
npm install
npx playwright install chromium
$env:E2E_BASE_URL = "http://localhost:3000"
npm test
```

Reports are written to `docs/qa-evidence/playwright-report/`.

Visual snapshots are intentionally opt-in:

```powershell
$env:RUN_VISUAL_SNAPSHOTS = "true"
npm test -- visual-snapshots.spec.ts
```

Compare with committed baselines by running the same command normally. Regenerate after an intentional UI change with:

```powershell
$env:RUN_VISUAL_SNAPSHOTS = "true"
npx playwright test specs/visual-snapshots.spec.ts --update-snapshots=all
```

The configuration fixes the Chromium viewport at 1280x720, disables animations and uses platform-neutral snapshot names. The visual spec intercepts its four screen APIs with fixed fixtures, so accumulated local database state cannot alter a baseline. CI always enables this suite.

Accessibility runs with the normal suite:

```powershell
npx playwright test specs/a11y-smoke.spec.ts
```

## Security

```powershell
.\tests\security\auth-smoke.ps1
.\scripts\run-zap-baseline.ps1
cd backend
mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=9
```

Snyk runs from `.github/workflows/security-snyk.yml` with `SNYK_TOKEN`.

## Contract Testing

```powershell
.\scripts\run-schemathesis.ps1
```

Default schema URL is `http://host.docker.internal:8080/v3/api-docs` for Docker-based Windows execution.

## Performance

```powershell
$env:K6_USERNAME = "viewer"
$env:K6_PASSWORD = "viewer123"
.\scripts\run-k6.ps1
.\scripts\run-k6-stress.ps1
.\scripts\run-jmeter.ps1
```

The k6 and JMeter scripts authenticate against Keycloak and should run only against disposable data. JMeter authenticates once in a setup thread group, then loads the business endpoints; both runners fail when any JTL sample fails.

## Full Local Battery

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
.\scripts\run-all-tests.ps1
```

Frontend static and dependency gates:

```powershell
cd frontend
npm run lint
npm run build
npm audit --audit-level=moderate
```

## CI

CI includes backend/frontend, Newman, Playwright, ZAP, Dependency Check, Schemathesis, k6 and a manual Full QA pipeline. `deploy-staging.yml` first starts the complete application and then, against that deployed stack, runs smoke, visual regression, Newman, Playwright/axe, authorization smoke and Schemathesis. Failure artifacts include Playwright and contract reports plus compose logs.

## Sonar Quality Gate

Start the Sonar service from the staging compose, create a local analysis token and run:

```powershell
$env:SONAR_TOKEN = '<temporary-analysis-token>'
.\scripts\run-sonar-local.ps1 -SonarHostUrl 'http://localhost:9000'
```

The scanner uses `sonar.qualitygate.wait=true`, fails on a red gate and writes only non-secret metrics to `docs/qa-evidence/sonar-summary.md`.
