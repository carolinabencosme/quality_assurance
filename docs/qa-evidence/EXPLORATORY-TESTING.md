# Exploratory Testing

## Charter 1 - Products

Objective: explore product lifecycle and data validation. Timebox: 45-60 min.

| Scenario | Steps | Expected | Obtained | Severity | Evidence | Status |
|---|---|---|---|---|---|---|
| Create product | Login warehouse, create valid product | Product created | To execute | Medium | Screenshot/API | Planned |
| Duplicate SKU | Create same SKU twice | 409 conflict | Covered by Newman | Medium | Newman | Automated |
| Filters | Search, category, status, critical | Correct list | To execute | Low | Screenshot | Planned |
| Pagination | Change page size/page | Stable paging | To execute | Low | Screenshot | Planned |
| Edit | Change product name/price/min stock | Persisted | Covered by Playwright | Medium | Playwright | Automated |
| Soft delete | Inactivate product | Status INACTIVE | Covered by Playwright | High | Playwright | Automated |
| Minimum stock | Product below min stock | Critical badge/report | Covered by dashboard | Medium | Screenshot | Automated/manual |

## Charter 2 - Stock

Objective: explore stock rules, history and user traceability. Timebox: 45-60 min.

| Scenario | Steps | Expected | Obtained | Severity | Evidence | Status |
|---|---|---|---|---|---|---|
| IN | Register quantity | Stock increases | Covered by Newman/E2E | High | Newman/Playwright | Automated |
| OUT | Register quantity | Stock decreases | Covered by Newman | High | Newman | Automated |
| ADJUSTMENT | Set final quantity | Stock equals target | Covered by backend tests | High | JUnit | Automated |
| Negative quantity | Send invalid quantity | 400 validation | Covered by backend rules | Medium | JUnit/API | Automated |
| OUT greater than stock | Send excessive OUT | 409 conflict | Covered by tests | High | JUnit/Newman | Automated |
| History | Open stock movements | Movement listed | Covered by E2E | Medium | Playwright | Automated |
| User recorded | Omit userId with JWT | JWT username stored | Covered by unit test | Medium | JUnit | Automated |
| Observations | Add note | Note visible in history | Covered by E2E | Low | Playwright | Automated |

## Charter 3 - Security and Roles

Objective: explore permission boundaries. Timebox: 45-60 min.

| Scenario | Steps | Expected | Obtained | Severity | Evidence | Status |
|---|---|---|---|---|---|---|
| Viewer no manage | Try create product | 403 / hidden action | Covered by Newman/UI | High | Newman/E2E | Automated |
| Warehouse stock manage | Register stock | 201 | Covered by E2E | High | Playwright | Automated |
| Admin full access | Open audit and permissions | Pages visible | Covered by E2E | High | Playwright | Automated |
| Audit restricted | Viewer opens audit | Hidden/403 | Covered by Newman/E2E | High | Newman/E2E | Automated |
| Endpoint without JWT | Call protected API | 401 | Covered by smoke/Newman | High | Smoke/Newman | Automated |
| Invalid token | Call protected API | 401 | Covered by smoke | High | Security smoke | Automated |
| Expired token | Wait or inject expired token | refresh or logout | To execute manually | Medium | Browser | Planned |
