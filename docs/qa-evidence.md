# QA Evidence Index

| Category | Tool | Command | Expected result | Evidence | Status |
|---|---|---|---|---|---|
| Unit tests | JUnit/Mockito | `cd backend && mvn test` | Green tests | `backend/target/surefire-reports/` | Automated |
| Integration tests | Spring + Testcontainers | `cd backend && mvn verify` | 0 failures and 0 skips | `test-execution-summary.md`, `keycloak-it-summary.md` | Live sealed |
| Coverage | JaCoCo | `cd backend && mvn verify` | 60 percent line gate active | `backend/target/site/jacoco/` | Automated |
| API scenarios | Newman | `cd tests/api && npm test` | 29 requests / 61 assertions | local summary + CI artifact | Live sealed |
| E2E | Playwright | `cd tests/e2e && npm test` | functional, responsive, a11y and evidence specs | `docs/qa-evidence/playwright-report/` | Live sealed |
| Visual regression | Playwright | `RUN_VISUAL_SNAPSHOTS=true npm test -- visual-snapshots.spec.ts` | deterministic API fixtures and committed baselines compare | `tests/e2e/specs/visual-snapshots.spec.ts-snapshots/` | Live sealed |
| Accessibility | axe | `npx playwright test specs/a11y-smoke.spec.ts` | 0 critical/serious violations | Playwright report | Live sealed |
| Screenshots | Playwright | `capture-evidence.spec.ts` | Screenshots saved | `docs/qa-evidence/screenshots/` | Expanded |
| Security smoke | PowerShell | `.\tests\security\auth-smoke.ps1` | 401/403/200 checks | console | Automated |
| ZAP | OWASP ZAP | `.\scripts\run-zap-baseline.ps1` | 0 baseline failures | `docs/qa-evidence/zap-report.html`, `zap-summary.txt` | Live sealed |
| Dependency Check | OWASP DC | `cd backend && mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=9` | Critical CVSS fails | `backend/target/dependency-check-report.html` | Added |
| Schemathesis | Schemathesis | `.\scripts\run-schemathesis.ps1` | No unexpected 500/schema errors | `docs/qa-evidence/schemathesis-report.txt` | Added |
| k6 | k6 | `.\scripts\run-k6.ps1` | thresholds pass | `docs/qa-evidence/k6-load-summary.txt` | Added |
| k6 stress | k6 | `.\scripts\run-k6-stress.ps1` | thresholds pass through 200 VUs | `docs/qa-evidence/k6-stress-summary.txt` | Live sealed |
| JMeter | JMeter 5.6.3 | `.\scripts\run-jmeter.ps1` | every JTL sample passes | `docs/qa-evidence/jmeter-summary.txt` | Live sealed |
| Sonar | SonarQube Community | `.\scripts\run-sonar-local.ps1` | Quality Gate OK | `docs/qa-evidence/sonar-summary.md` | Live sealed |
| Logs and DB traces | Loki + Tempo | `.\scripts\verify-observability-evidence.ps1` | correlated fields plus JDBC spans | `docs/qa-evidence/observability-live-summary.md` | Live sealed |
| Observability smoke | PowerShell | `.\tests\observability\smoke.ps1` | services healthy | console | Automated |
| Exploratory | Manual charters | see doc | charters completed | `docs/qa-evidence/EXPLORATORY-TESTING.md` | Documented |
| Defects | Defect log | see doc | risks tracked | `docs/qa-evidence/DEFECTS.md` | Documented |
| Flyway | Flyway validate | `.\scripts\validate-flyway-migrations.ps1` | migrations valid | console | Automated |
| CI/CD | GitHub Actions | workflows | green checks/artifacts | `.github/workflows/` | Expanded |
| Jenkins | Jenkinsfile | Jenkins build | visible stages | `Jenkinsfile` | Expanded |
| Grafana | Dashboards | compose observability | dashboards load | `observability/grafana/...` | Expanded |
| Swagger | OpenAPI | `/swagger-ui.html` | API docs visible | browser screenshot | Automated by app |

## Final Checklist

The detailed closeout checklist is tracked in `docs/qa-evidence/FINAL-CHECKLIST.md`.

## Local Execution Summary

Latest local command results are tracked in `docs/qa-evidence/LOCAL-RUN-SUMMARY.md`.
