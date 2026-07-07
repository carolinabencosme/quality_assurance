# Testing Guide

## Test Layers

| Layer | Tool | Location | Current scope |
|---|---|---|---|
| Unit | JUnit 5 + Mockito | `backend/src/test/java` | services, mappers, entities, security converter |
| Integration | Spring Boot + Testcontainers | `backend/src/test/java/**/*IntegrationTest.java` | API, repositories, reports, stock |
| Coverage | JaCoCo | `backend/pom.xml` | 60 percent line gate |
| API | Newman/Postman | `tests/api` | 24 scenarios |
| E2E | Playwright | `tests/e2e/specs` | 13+ tests, responsive, stock, permissions |
| Security smoke | PowerShell | `tests/security/auth-smoke.ps1` | 401, 403, 200, invalid token |
| ZAP | OWASP ZAP | `scripts/run-zap-baseline.*` | baseline scan and HTML report |
| Dependency scan | OWASP Dependency Check | `backend/pom.xml` | CVSS 9 fail threshold |
| Contract | Schemathesis | `scripts/run-schemathesis.*` | OpenAPI checks |
| Performance | k6 | `tests/performance/k6` | load test thresholds |
| Observability | PowerShell smoke | `tests/observability/smoke.ps1` | Prometheus/Grafana/Loki/Tempo |

## Backend

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
cd backend
.\mvnw.cmd verify
```

If Docker is unavailable, Testcontainers tests can be skipped by JUnit. This is documented as a Windows/local risk, not a CI target.

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

## Security

```powershell
.\tests\security\auth-smoke.ps1
.\scripts\run-zap-baseline.ps1
cd backend
mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=9
```

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
```

The k6 script runs without authenticated endpoints when credentials are not set. Local `run-all-tests.ps1` only runs k6 when `RUN_K6_SMOKE=true`.

## Full Local Battery

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
.\scripts\run-all-tests.ps1
```

## CI

CI now includes backend/frontend, Newman, Playwright, staging smoke, ZAP, Dependency Check, Schemathesis, k6 and a manual Full QA pipeline. Heavy scans can be run manually when runtime is a concern.
