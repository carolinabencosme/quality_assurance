# Links de demo para el profesor — Cub Inventory QAS

> Abre este archivo en pantalla durante la revision.  
> Stack local Docker Compose (dev + observabilidad + Sonar).  
> Credenciales academicas de demo (cambiar en cualquier uso real).

Rama recomendada: `herramientas-externas-pro` o `defensa` / `main` con estos cambios mergeados.

---

## 1. Aplicacion (funcionalidad)

| Que probar | Link | Como |
|------------|------|------|
| App Cub (UI) | http://localhost:3000 | Login `admin` / `admin123` |
| Viewer (permisos limitados) | http://localhost:3000 | Login `viewer` / `viewer123` |
| Dashboard + metricas sistema | http://localhost:3000/dashboard | Tras login admin |
| Productos | http://localhost:3000/products | CRUD + soft delete |
| Stock / movimientos | http://localhost:3000/stock/movements | IN / OUT |
| Auditoria Envers | http://localhost:3000/audit | Requiere `audit:view` |
| Matriz permisos | http://localhost:3000/admin/permissions | `user:manage` |
| Gestion usuarios Keycloak | http://localhost:3000/admin/users | `user:manage` |

Otros usuarios: `warehouse/warehouse123`, `clerk/clerk123`.

---

## 2. API empresarial

| Que probar | Link | Como |
|------------|------|------|
| Swagger / OpenAPI | http://localhost:8080/swagger-ui.html | Authorize con Bearer JWT |
| OpenAPI JSON | http://localhost:8080/v3/api-docs | Contrato |
| Health | http://localhost:8080/actuator/health | Debe ser UP |
| Prometheus metrics | http://localhost:8080/actuator/prometheus | Scrape Micrometer |
| System metrics API | http://localhost:8080/api/v1/observability/system-metrics | Con JWT `report:view` |

Obtener token rapido (PowerShell):

```powershell
$body = 'grant_type=password&client_id=inventory-frontend&username=admin&password=admin123'
(Invoke-RestMethod -Method Post -Uri 'http://localhost:8081/realms/inventory-realm/protocol/openid-connect/token' -ContentType 'application/x-www-form-urlencoded' -Body $body).access_token
```

---

## 3. Identidad (Keycloak)

| Que probar | Link | Como |
|------------|------|------|
| Consola admin Keycloak | http://localhost:8081 | admin / admin (admin de Keycloak, no Cub) |
| Realm OIDC discovery | http://localhost:8081/realms/inventory-realm/.well-known/openid-configuration | Issuer publico |
| Login tema Cub | http://localhost:3000 → Login | Pantalla branded |

En Admin Console: realm `inventory-realm` → Clients → `inventory-api` → Authorization (resources/policies) → Client scopes de negocio.

---

## 4. Observabilidad (Grafana stack)

| Herramienta | Link | Usuario | Que mostrar |
|-------------|------|---------|-------------|
| **Grafana Home** | http://localhost:3030/d/cub-home | admin / admin | Salud del stack + intro |
| API Overview | http://localhost:3030/d/inventory-api-overview | admin / admin | Throughput, p95, errores, logs |
| Infra | http://localhost:3030/d/inventory-infra | admin / admin | CPU, JVM, Hikari |
| Business | http://localhost:3030/d/inventory-business | admin / admin | Gauges de inventario |
| Security | http://localhost:3030/d/inventory-security | admin / admin | 401/403, user/endpoint, LOGIN |
| Explore (Loki/Tempo) | http://localhost:3030/explore | admin / admin | Logs → TraceID |
| Prometheus | http://localhost:9090 | — | Targets / Graph |
| Prometheus targets | http://localhost:9090/targets | — | Todos UP |
| Alertmanager | http://localhost:9093 | — | Alertas / silences |
| Loki ready | http://localhost:3100/ready | — | ready |
| Tempo | http://localhost:3200/status | — | status |
| Alloy UI | http://localhost:12345 | — | Collector |

**Script de humo:** `.\tests\observability\smoke.ps1`  
**Verificador correlacion:** `.\scripts\verify-observability-evidence.ps1`

---

## 5. Calidad de codigo (SonarQube)

| Que probar | Link | Notas |
|------------|------|-------|
| SonarQube UI | http://localhost:9001 | Primer arranque: admin / admin (pide cambiar password). Puerto 9001 por defecto (9000 suele estar ocupado). |
| Project `inventory-qas` | http://localhost:9001/dashboard?id=inventory-qas | Coverage, bugs, vulns, smells |
| Evidence archivada | `docs/qa-evidence/sonar-summary.md` | Ultimo gate OK documentado |

Analisis local (requiere token):

```powershell
$env:SONAR_TOKEN = '<token-de-sonar>'
.\scripts\run-sonar-local.ps1
```

---

## 6. CI / Jenkins (opcional en staging)

| Que probar | Link |
|------------|------|
| Jenkins | http://localhost:8082 |
| GitHub Actions (remoto) | https://github.com/carolinabencosme/quality_assurance/actions |

Pipeline local: `Jenkinsfile` en la raiz del repo.

---

## 7. Orden sugerido de demostracion (15–20 min)

1. Cub UI admin → dashboard → productos → stock.  
2. Viewer → 403 en users (Network o UI).  
3. Swagger + health.  
4. Keycloak realm / Authorization.  
5. Grafana Home → Business → Security → Infra → API.  
6. Prometheus targets UP + Alertmanager.  
7. Sonar dashboard + `sonar-summary.md`.  
8. (Opcional) Actions verdes en GitHub.

---

## 8. Comandos para dejar el stack listo

```powershell
cd C:\Users\Josvier\Desktop\quality_assurance
git checkout herramientas-externas-pro
git pull

docker compose `
  -f docker-compose.dev.yml `
  -f docker-compose.observability.yml `
  -f docker-compose.staging.yml `
  up -d --build

# Calentar metricas / logs para grafos con datos
.\scripts\warmup-demo-traffic.ps1

.\tests\observability\smoke.ps1
```

Si Grafana no muestra dashboards nuevos: `docker compose ... restart grafana`.

---

## 9. Evidencias ya archivadas (sin levantar nada)

Carpeta: `docs/qa-evidence/`

- `FINAL-CHECKLIST.md`
- `sonar-summary.md`
- `zap-report.html` / `zap-summary.txt`
- `k6-*-summary.txt`
- `playwright-report/`
- `observability-live-summary.md`
- Screenshots en `screenshots/`
