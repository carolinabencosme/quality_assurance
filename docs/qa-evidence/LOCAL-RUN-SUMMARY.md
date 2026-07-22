# Local Run Summary - 2026-07-22 (sellado V3)

## Passed

| Command | Result |
|---|---|
| `mvnw.cmd verify` in `backend` | Passed: 28 suites, 108 tests, 0 failures/errors/skips; real PostgreSQL and Keycloak containers |
| `scripts/verify-keycloak-it-report.ps1` | Passed: 7 Keycloak integration tests, 0 skips |
| `npm test` in `tests/api` | Passed: 29 requests, 61 assertions, 0 failures |
| `RUN_VISUAL_SNAPSHOTS=true npm test` in `tests/e2e` | Passed: 21 functional/responsive/evidence/axe/visual tests; 4 deterministic baselines compared |
| `tests/security/auth-smoke.ps1` | Passed: admin business scopes and `/security/me`; viewer users/audit 403; admin users 200 |
| `tests/observability/smoke.ps1` | Passed: Prometheus, Grafana, Loki, Tempo, Alloy, Alertmanager, actuator |
| `scripts/verify-observability-evidence.ps1` | Passed: Loki user/endpoint/correlation and Tempo request-to-JDBC spans |
| `npm run lint` in `frontend` | Passed: ESLint Core Web Vitals + TypeScript |
| `npm run build` in `frontend` | Passed |
| `npm audit --audit-level=moderate` in `frontend` | Passed: 0 vulnerabilities |
| `docker compose -f docker-compose.prod.yml config` | Passed |
| `.\scripts\run-all-tests.ps1` | **TODOS LOS TESTS OK** |

## Extended live evidence

| Command | Result |
|---|---|
| `scripts/run-schemathesis.ps1` | Passed: 19 operations, 1,264 generated cases, 0 failures |
| `scripts/run-k6.ps1` | Passed thresholds; summary archived |
| `scripts/run-k6-stress.ps1` | Passed through 200 VUs; 99.99% checks, p95 about 198 ms |
| `scripts/run-jmeter.ps1` | Passed: 301 samples, 0 failures, 27.24 ms average, 230 ms max |
| `scripts/run-zap-baseline.ps1` | Passed baseline gate with 0 FAIL findings; HTML and summary archived |
| `scripts/run-sonar-local.ps1` | Quality Gate OK: 79.8% coverage, 0 bugs, 0 vulnerabilities, 0.9% duplication |

## Environment notes

- Live evidence used Docker Desktop on Windows with `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=//./pipe/docker_engine`.
- The academic passwords belong only to the imported dev/test realm. No production secret is present in a report.
- Sonar used local port 9001 because an unrelated user container already owned port 9000; the compose default remains 9000 and is configurable through `SONAR_PORT`.

## Evidence paths

- JaCoCo: `backend/target/site/jacoco/index.html`
- Aggregated tests: `docs/qa-evidence/test-execution-summary.md`
- Keycloak IT: `docs/qa-evidence/keycloak-it-summary.md`
- Sonar: `docs/qa-evidence/sonar-summary.md`
- Loki/Tempo: `docs/qa-evidence/observability-live-summary.md`
- Contract/performance/security summaries: `docs/qa-evidence/*summary*` and `zap-report.html`
- Playwright HTML: `docs/qa-evidence/playwright-report/index.html`
- Screenshots: `docs/qa-evidence/screenshots/`
- Checklist: `docs/qa-evidence/FINAL-CHECKLIST.md`
