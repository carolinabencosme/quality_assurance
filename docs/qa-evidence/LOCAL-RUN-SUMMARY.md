# Local Run Summary - 2026-07-07 (final verde)

## Passed

| Command | Result |
|---|---|
| `cmd /c mvnw.cmd verify` in `backend` | Passed: 77 tests, 0 failures, 38 Testcontainers skips (Windows), JaCoCo gate met |
| `npm test` in `tests/api` | Passed: 24 requests, 0 failed assertions |
| `npm test` in `tests/e2e` | Passed: 16/16 Playwright tests |
| `tests/security/auth-smoke.ps1` | Passed: 401/403/200 including permissions-matrix admin |
| `tests/observability/smoke.ps1` | Passed: Prometheus, Grafana, Loki, Tempo, Alloy, Alertmanager, actuator |
| `npx tsc --noEmit` in `frontend` | Passed |
| `npm run build` in `frontend` | Passed |
| `docker compose -f docker-compose.prod.yml config` | Passed |
| `.\scripts\run-all-tests.ps1` | **TODOS LOS TESTS OK** |

## Optional / CI

| Command | Result |
|---|---|
| `RUN_K6_SMOKE=true .\scripts\run-k6.ps1` | Optional; skipped by default in run-all-tests |
| `run-zap-baseline.ps1` | Run manually or via GitHub Actions `security-zap.yml` |
| `run-schemathesis.ps1` | Run manually or via GitHub Actions `api-schemathesis.yml` |
| Dependency Check Maven | Run via GitHub Actions `security-deps.yml` (heavy, 10+ min) |

## Environment notes

- If backend exits with Flyway checksum mismatch after changing SQL migrations, run:
  `.\scripts\repair-flyway-checksums.ps1`
  then `docker compose ... up -d backend frontend`.
- DEF-007 (500 on permissions-matrix) resolved after rebuild + flyway repair on clean runtime.

## Evidence paths

- JaCoCo: `backend/target/site/jacoco/index.html`
- Playwright HTML: `docs/qa-evidence/playwright-report/index.html`
- Screenshots: `docs/qa-evidence/screenshots/`
- Checklist: `docs/qa-evidence/FINAL-CHECKLIST.md`
