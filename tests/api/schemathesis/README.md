# Schemathesis Contract Tests

Run against a live backend OpenAPI document:

```powershell
.\scripts\run-schemathesis.ps1
```

The script uses Docker image `schemathesis/schemathesis:stable` and writes `docs/qa-evidence/schemathesis-report.txt`.

If a real defect is found, document it in `docs/qa-evidence/DEFECTS.md` instead of hiding it.
