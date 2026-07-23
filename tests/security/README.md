# Security Tests

## Auth Smoke

```powershell
.\tests\security\auth-smoke.ps1
```

Validates:

- Protected endpoint without JWT returns 401.
- Invalid token returns 401.
- Viewer token can access dashboard with `report:view`.
- Viewer cannot access audit with missing `audit:view`.
- Viewer cannot access permissions matrix with missing `user:manage`.
- Admin can access permissions matrix.

## ZAP Baseline

```powershell
.\scripts\run-zap-baseline.ps1
```

Default target: `http://host.docker.internal:3000`. Override with `ZAP_TARGET`.

Report: `docs/qa-evidence/zap-report.html`.

## Dependency Check

```powershell
cd backend
mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=9
```

Reports:

- `backend/target/dependency-check-report.html`
- `backend/target/dependency-check-report.json`

ZAP and Dependency Check are separated from normal `mvn verify` because they download images/databases and can be slow. CI uploads reports as artifacts.
