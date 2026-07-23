# Final Closeout Checklist

## How to read this checklist

The sections below inventory implemented capabilities. A capability is **live sealed** only when it also appears in this dated evidence table; source code or a workflow alone is not treated as execution proof.

## Live seal - 2026-07-22

| Acceptance criterion | Live result | Evidence |
|---|---|---|
| Real Keycloak integration | 7 tests, 0 skips/failures/errors | `keycloak-it-summary.md` |
| Complete backend verify | 108 tests, 0 skips/failures/errors | `test-execution-summary.md` |
| Full local battery | `TODOS LOS TESTS OK` | `LOCAL-RUN-SUMMARY.md` |
| Scopes and authorization | admin business scopes; viewer users/audit 403; admin users 200 | auth smoke + Keycloak IT |
| Newman new coverage | 29 requests, 61 assertions, 0 failures | local summary / staging artifact |
| Visual regression | four deterministic baselines captured with a 1280x720 viewport | `tests/e2e/specs/*-snapshots/` |
| Accessibility | 0 critical/serious axe violations | Playwright suite |
| Complete browser suite | 21 tests passed, including visual comparison | `playwright-report/index.html` |
| Contract fuzzing | 19 operations, 1,264 cases, 0 failures | `schemathesis-report.txt` |
| Performance | k6 load/stress gates and JMeter 301/301 samples | k6/JMeter summaries |
| ZAP baseline | 0 FAIL findings | `zap-report.html`, `zap-summary.txt` |
| Sonar | Gate OK; 79.8% coverage; 0 bugs/vulnerabilities | `sonar-summary.md` |
| Correlated observability | Loki fields linked to Tempo HTTP/JDBC trace | `observability-live-summary.md` |
| Staging post-deploy | workflow orders smoke, snapshots, Newman, E2E/axe, auth and contract tests after deploy | `deploy-staging.yml`; remote run required after push |
| Branch protection | desired settings documented | `docs/branch-protection.md`; remote settings screenshot required |

Remote-only facts are deliberately not marked as live evidence until GitHub Actions and repository settings are inspected after push.

## Functionality

- [x] CRUD products works.
- [x] Soft delete documented.
- [x] Stock IN/OUT/ADJUSTMENT works.
- [x] Movement history works.
- [x] Envers audit works.
- [x] Dashboard shows KPIs.
- [x] Dashboard shows critical products.
- [x] Dashboard shows top sold products.
- [x] Dashboard shows recent history.
- [x] Swagger/OpenAPI works.
- [x] `/admin/permissions` exists.
- [x] `/admin/users` manages Keycloak users.
- [x] `user:manage` protects permissions matrix.
- [x] `user:manage` protects user management.
- [x] Navigation hides links without permissions.
- [x] Dashboard shows live system metrics.

## Testing

- [x] Unit tests exist and are covered by Maven.
- [x] Integration tests exist; Windows/Testcontainers caveat documented.
- [x] KeycloakContainerIntegrationTest uses real Keycloak tokens.
- [x] Negative database constraint tests exist.
- [x] JaCoCo 60 percent gate remains active.
- [x] Newman has 20+ scenarios.
- [x] Playwright has 13+ tests.
- [x] Responsive E2E exists.
- [x] Roles/permissions E2E exists.
- [x] Stock E2E exists.
- [x] ZAP baseline exists.
- [x] Dependency Check exists.
- [x] Schemathesis exists.
- [x] k6 load exists.
- [x] k6 stress exists.
- [x] JMeter load plan exists.
- [x] Snyk workflow exists.
- [x] Playwright visual snapshot spec exists.
- [x] Visual baselines are committed and compared in CI.
- [x] Visual API data is fixed so database mutations cannot change baselines.
- [x] Playwright axe smoke rejects critical/serious violations.
- [x] CORS test exists.
- [x] JWT/security smoke exists.
- [x] Exploratory testing documented.
- [x] Defects log documented.

## Security

- [x] Keycloak remains configured.
- [x] OAuth2 business scopes exist in realm export.
- [x] Authorization Services policies exist in realm export.
- [x] Backend validates scope and role authorities.
- [x] JWT validation remains active.
- [x] Refresh token documented in frontend auth.
- [x] Permissions are by authority.
- [x] No new production secrets added.
- [x] `.env.example` updated.
- [x] CORS validated.
- [x] Frontend npm audit reports 0 vulnerabilities.
- [x] `user:manage` implemented.
- [x] `audit:view` protected.

## Observability

- [x] Prometheus configured.
- [x] Loki configured.
- [x] Tempo configured.
- [x] Alloy configured.
- [x] Grafana configured.
- [x] Alertmanager configured.
- [x] App dashboard exists.
- [x] Infra dashboard exists.
- [x] Business dashboard exists.
- [x] Security dashboard exists.
- [x] Expanded alerts exist.
- [x] High CPU alert exists.
- [x] Logs include user and endpoint MDC fields.
- [x] Alloy labels Docker streams by service/container/project.
- [x] Tempo trace includes JDBC spans correlated from Loki.
- [x] Business metrics exist.
- [x] Observability guide exists.
- [x] Observability smoke exists.

## CI/CD

- [x] CI backend/frontend exists.
- [x] Newman workflow exists.
- [x] E2E workflow exists.
- [x] Deploy staging includes observability.
- [x] Deploy staging tests the already deployed stack with Newman, Playwright/a11y, auth smoke and Schemathesis.
- [x] Security ZAP workflow exists.
- [x] Dependency Check workflow exists.
- [x] Schemathesis workflow exists.
- [x] k6 workflow exists.
- [x] Snyk workflow exists.
- [x] JMeter workflow exists.
- [x] Deploy production workflow exists.
- [x] Full QA pipeline exists.
- [x] Jenkinsfile has visual pipeline.
- [x] Jenkinsfile has production deploy parameter.
- [x] Docker build is demonstrated.
- [x] `docker-compose.prod.yml` exists.

## Documentation

- [x] README updated.
- [x] `docs/requirements.md` exists.
- [x] `docs/installation.md` exists.
- [x] `docs/maintenance.md` exists.
- [x] `docs/architecture.md` exists.
- [x] `docs/observability-guide.md` exists.
- [x] `docs/qa-evidence.md` exists.
- [x] `docs/qa-evidence/EXPLORATORY-TESTING.md` exists.
- [x] `docs/qa-evidence/DEFECTS.md` exists.
- [x] `docs/qa-evidence/CHECKLIST-CAPTURAS.md` exists.
- [x] `docs/testing-guide.md` updated.
- [x] `CONTRIBUTING.md` and branch-protection checklist exist.
- [x] Five-demo sealed defense script exists.
- [x] Issue templates exist.
- [x] Evidence paths are linked.

## Delivery

- [x] PowerShell scripts added with ASCII console output.
- [x] No new hardcoded production secrets.
- [x] `.env.prod.example` exists without real secrets.
- [x] `scripts/up-prod.ps1` exists.
- [x] Coverage threshold not lowered.
- [x] Existing tests not removed.
- [x] Conventional commit recommendations documented.
- [x] Changes are ready for PR review.
- [x] Final summary required from Codex.
