# Checklist de capturas — evidencia visual

Guardar archivos en `docs/qa-evidence/screenshots/` con los nombres indicados.  
Formato recomendado: PNG, resolución ≥ 1280×720, sin datos personales reales.

| Archivo | Contenido | Cuándo |
|---------|-----------|--------|
| `01-login-viewer.png` | Pantalla login o dashboard como viewer | Demo CT-01 |
| `02-admin-products.png` | Listado productos con acciones admin | Demo CT-01 |
| `03-stock-movement.png` | Formulario/historial movimiento stock | Demo CT-02 |
| `04-critical-stock.png` | Widget productos críticos en dashboard | Demo CT-02 |
| `05-audit-envers.png` | Pantalla `/audit` con revisiones | Demo CT-03 |
| `06-swagger.png` | Swagger UI con endpoints `/api/v1` | Demo API |
| `07-grafana-dashboard.png` | Panel Grafana inventario | Fase 5 |
| `08-github-actions.png` | Workflow CI en verde | Fase 6 |
| `09-jacoco.png` | Resumen cobertura JaCoCo | Fase 4 |
| `10-keycloak-realm.png` | Realm `inventory-realm` y clientes | Fase 2 |

## Comandos útiles antes de capturar

```powershell
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3001"
Start-Process "http://localhost:8080/swagger-ui.html"
```

## Nota para entrega académica

Generación automática de capturas parciales:

```powershell
docker compose -f docker-compose.dev.yml up -d
.\scripts\generate-qa-evidence.ps1
```

Capturas manuales: Swagger (06), Grafana (07), GitHub Actions (08), JaCoCo HTML (09), Keycloak (10), Jenkins (ver `docs/jenkins-evidence.md`).

Si el profesor pide ZIP en lugar de commit, incluir esta carpeta más `docs/qa-evidence/EVIDENCIAS-AVANCE-V3.md`.
