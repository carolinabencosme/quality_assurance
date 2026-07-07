# Final Closeout Checklist

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
- [x] `user:manage` protects permissions matrix.
- [x] Navigation hides links without permissions.

## Testing

- [x] Unit tests exist and are covered by Maven.
- [x] Integration tests exist; Windows/Testcontainers caveat documented.
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
- [x] CORS test exists.
- [x] JWT/security smoke exists.
- [x] Exploratory testing documented.
- [x] Defects log documented.

## Security

- [x] Keycloak remains configured.
- [x] JWT validation remains active.
- [x] Refresh token documented in frontend auth.
- [x] Permissions are by authority.
- [x] No new production secrets added.
- [x] `.env.example` updated.
- [x] CORS validated.
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
- [x] Observability guide exists.
- [x] Observability smoke exists.

## CI/CD

- [x] CI backend/frontend exists.
- [x] Newman workflow exists.
- [x] E2E workflow exists.
- [x] Deploy staging includes observability.
- [x] Security ZAP workflow exists.
- [x] Dependency Check workflow exists.
- [x] Schemathesis workflow exists.
- [x] k6 workflow exists.
- [x] Full QA pipeline exists.
- [x] Jenkinsfile has visual pipeline.
- [x] Docker build is demonstrated.
- [x] `docker-compose.prod.yml` exists.

## Documentation

- [x] README updated.
- [x] `docs/requirements.md` exists.
- [x] `docs/architecture.md` exists.
- [x] `docs/observability-guide.md` exists.
- [x] `docs/qa-evidence.md` exists.
- [x] `docs/qa-evidence/EXPLORATORY-TESTING.md` exists.
- [x] `docs/qa-evidence/DEFECTS.md` exists.
- [x] `docs/qa-evidence/CHECKLIST-CAPTURAS.md` exists.
- [x] `docs/testing-guide.md` updated.
- [x] Issue templates exist.
- [x] Evidence paths are linked.

## Delivery

- [x] PowerShell scripts added with ASCII console output.
- [x] No new hardcoded production secrets.
- [x] Coverage threshold not lowered.
- [x] Existing tests not removed.
- [x] Conventional commit recommendations documented.
- [x] Changes are ready for PR review.
- [x] Final summary required from Codex.
