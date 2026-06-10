# QA Evidence — Registro de evidencias de prueba y calidad

> **Instrucción:** actualizar este documento **cada vez** que una herramienta o suite de pruebas funcione correctamente. No dejar la evidencia para el final del proyecto.

**Proyecto:** Sistema de Gestión de Inventarios Empresarial (QAS)  
**Equipo:** _[completar nombres]_  
**Última actualización:** _[YYYY-MM-DD]_

---

## 1. Automated tests

### 1.1 Unit tests (JUnit + Mockito)

| Campo | Valor |
|-------|-------|
| Fecha ejecución | |
| Comando | `cd backend && ./mvnw test` |
| Resultado | PASS / FAIL |
| Tests ejecutados | |
| Failures | 0 |
| JaCoCo coverage (services) | ___% |
| Enlace reporte | `backend/target/site/jacoco/index.html` |
| Captura | ![](./evidence/unit-tests.png) |

**Notas:**

---

### 1.2 Integration tests (Testcontainers)

| Campo | Valor |
|-------|-------|
| Fecha | |
| Comando | `./mvnw verify -P integration-tests` |
| PostgreSQL container | ✓ / ✗ |
| Keycloak container | ✓ / ✗ |
| Resultado | |
| Captura | ![](./evidence/integration-tests.png) |

---

### 1.3 API / Contract tests

| Campo | Valor |
|-------|-------|
| Fecha | |
| Herramienta | RestAssured / Schemathesis |
| Comando | `./mvnw test -P api-tests` |
| Endpoints cubiertos | /products, /stock, /reports, /audit |
| Casos 401/403 | ✓ / ✗ |
| Reporte | |
| Captura | ![](./evidence/api-tests.png) |

---

### 1.4 E2E tests (Playwright)

| Campo | Valor |
|-------|-------|
| Fecha | |
| Comando | `npx playwright test` |
| Specs | login, products, stock, permissions |
| Passed / Failed | |
| Responsive test | ✓ / ✗ |
| HTML report | `frontend/playwright-report/index.html` |
| Captura | ![](./evidence/playwright-report.png) |

**Flujos verificados:**

- [ ] Login Keycloak
- [ ] Crear producto
- [ ] Entrada stock
- [ ] Salida stock
- [ ] Dashboard visible
- [ ] Rol limitado sin botón crear

---

### 1.5 Security tests

#### Dependency Check / Snyk

| Campo | Valor |
|-------|-------|
| Fecha | |
| Críticas | 0 |
| Altas | |
| Reporte | |
| Captura | ![](./evidence/dependency-check.png) |

#### OWASP ZAP Baseline

| Campo | Valor |
|-------|-------|
| Fecha | |
| Target URL | http://localhost:3000 |
| Alertas High | |
| Alertas Medium | |
| Reporte | `tests/security/zap-report.html` |
| Captura | ![](./evidence/zap-report.png) |

---

### 1.6 Performance tests (k6)

| Campo | Valor |
|-------|-------|
| Fecha | |
| Script | products-load-test.js |
| VUs | 100 |
| Duración | |
| p95 latency | ms |
| Throughput | req/s |
| Error rate | % |
| Captura | ![](./evidence/k6-summary.png) |

| Script stock-stress | Valor |
|---------------------|-------|
| VUs | 50 |
| p95 latency | |
| Errores | |

---

### 1.7 Data / Flyway tests

| Campo | Valor |
|-------|-------|
| Migración desde BD vacía | ✓ / ✗ |
| Seed V6 productos | count: |
| Constraint SKU | ✓ / ✗ |

---

## 2. Exploratory testing charters

### Charter 01 — Productos

| Campo | Valor |
|-------|-------|
| Tester | |
| Fecha | |
| Duración | 45 min |
| Áreas exploradas | CRUD, validaciones, paginación, filtros |
| Hallazgos | |
| Bugs creados | #issue |

**Notas sesión:**

---

### Charter 02 — Stock

| Campo | Valor |
|-------|-------|
| Tester | |
| Fecha | |
| Escenarios | IN, OUT, ADJUST, stock negativo, alerta mínimo |
| Hallazgos | |

---

### Charter 03 — Seguridad

| Campo | Valor |
|-------|-------|
| Tester | |
| Fecha | |
| Roles probados | Admin, Clerk, Employee Basic |
| 401 sin token | ✓ |
| 403 sin permiso | ✓ |
| CORS | ✓ |

---

### Charter 04 — Responsive

| Campo | Valor |
|-------|-------|
| Dispositivos | Desktop 1920, Mobile 375 |
| Páginas | Dashboard, Products, Stock |
| Issues UX | |

---

## 3. Bugs found and fixed

| ID | Descripción | Severidad | Evidencia | Commit/PR | Estado |
|----|-------------|-----------|-----------|-----------|--------|
| BUG-001 | | Alta/Media/Baja | | #PR | Fixed/Open |
| BUG-002 | | | | | |

---

## 4. CI/CD and quality evidence

### 4.1 GitHub Actions

| Campo | Valor |
|-------|-------|
| PR ejemplo | #___ |
| Workflow | ci.yml |
| Resultado | ✓ |
| Captura | ![](./evidence/github-actions.png) |

### 4.2 Jenkins

| Campo | Valor |
|-------|-------|
| Build # | |
| Todas las stages | ✓ |
| Deploy staging | ✓ |
| Post-deploy smoke | ✓ |
| Captura | ![](./evidence/jenkins-pipeline.png) |

### 4.3 SonarQube

| Campo | Valor |
|-------|-------|
| Quality Gate | PASSED |
| Coverage | ___% |
| Bugs | |
| Vulnerabilities | |
| Duplicación | ___% |
| Captura | ![](./evidence/sonarqube-dashboard.png) |

---

## 5. Observability evidence

| Herramienta | Verificado | Captura |
|-------------|------------|---------|
| Prometheus targets UP | ✓ | evidence/prometheus.png |
| Grafana — Infra dashboard | ✓ | |
| Grafana — App dashboard | ✓ | |
| Loki — log con correlationId | ✓ | |
| Tempo — traza completa request | ✓ | |
| Alertmanager — regla disparada | ✓ | |

**Trace ID de ejemplo:** `________________`

**Correlation ID de ejemplo:** `demo-trace-001`

---

## 6. Security and API evidence

| Evidencia | ✓ | Archivo |
|-----------|---|---------|
| Swagger UI con Bearer JWT | | evidence/swagger-jwt.png |
| Keycloak realm + roles | | evidence/keycloak-realm.png |
| Matriz permisos probada | | security-model.md |

---

## 7. Final acceptance evidence (entrega)

Checklist de demostración para defensa oral:

- [ ] `docker compose -f docker-compose.staging.yml up` — sistema levanta
- [ ] Login con al menos 2 roles distintos
- [ ] Operación inventario completa en vivo
- [ ] Swagger con JWT
- [ ] Grafana: métrica + log + traza del mismo request
- [ ] Jenkins pipeline verde (último build)
- [ ] SonarQube Quality Gate
- [ ] Reporte Playwright y k6 archivados
- [ ] Este documento completo

**URL repositorio:**  
**URL demo staging (si aplica):**  
**Fecha defensa:**  

---

## 8. Carpeta de capturas

Crear directorio `docs/evidence/` y guardar PNG/PDF con nombres descriptivos:

```
docs/evidence/
├── unit-tests.png
├── integration-tests.png
├── playwright-report.png
├── jenkins-pipeline.png
├── sonarqube-dashboard.png
├── grafana-dashboard.png
├── tempo-trace.png
├── loki-logs.png
├── keycloak-realm.png
├── swagger-jwt.png
├── zap-report.png
└── k6-summary.png
```

---

*Plantilla alineada con Plan QAS v3.0 — Sección 17 Documentación y Evidencias.*
