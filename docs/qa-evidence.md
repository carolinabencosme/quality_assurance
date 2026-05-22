# QA Evidence — Plan v3.0 §17

Ticket: **QA-6** — Fase 4: Testing full stack y evidencias.

## 1. Automated tests

| Suite | Comando | Resultado | Fecha |
|-------|---------|-----------|-------|
| Backend unit + integration | `cd backend && mvnw.cmd verify` | _Pendiente ejecutar_ | |
| JaCoCo HTML | `backend/target/site/jacoco/index.html` | _Adjuntar % cobertura_ | |
| Frontend build | `cd frontend && npm run build` | | |
| Playwright E2E | `cd tests/e2e && npm test` | | |
| k6 smoke | `k6 run tests/performance/k6/smoke.js` | | |
| Security smoke | `.\tests\security\auth-smoke.ps1` | | |

### Resumen de pruebas backend (existentes)

- `ProductServiceTest`, `StockServiceTest`, `ReportServiceTest` — unit
- `ApiSecurityMvcTest` — 401/403 JWT
- `KeycloakJwtAuthoritiesConverterTest` — roles Keycloak
- `InventoryApplicationTests` — contexto + Flyway (Testcontainers)
- `ProductApiIntegrationTest`, `ReportApiIntegrationTest` — API Fase 1/3

## 2. Exploratory testing charters

| Charter | Alcance | Notas |
|---------|---------|-------|
| CT-01 Login y roles | viewer / admin / warehouse | |
| CT-02 Stock crítico | Alertas dashboard y movimientos | |
| CT-03 Auditoría Envers | Solo admin, historial producto | |

## 3. Bugs found and fixed

| ID | Descripción | Fix |
|----|-------------|-----|
| BUG-01 | Sesión expirada / 401 tras login | Issuer JWT `localhost:8081` alineado backend + proxy Next.js |
| BUG-02 | HTTP 500 login en Docker | `KEYCLOAK_PROXY_TARGET` red interna vs localhost |

## 4. Final acceptance evidence

- [ ] Demo Docker: login → dashboard → productos → auditoría (admin)
- [ ] Capturas en carpeta `docs/qa-evidence/screenshots/` (opcional)
- [ ] PR `feature/qa-6-fase-4-testing` con checklist de `docs/testing-guide.md`
