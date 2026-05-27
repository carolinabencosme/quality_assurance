# Checklist de defensa — Inventory QAS

Usar este listado el día de la demo y la presentación. Marcar cada ítem y adjuntar capturas según [`../qa-evidence/CHECKLIST-CAPTURAS.md`](../qa-evidence/CHECKLIST-CAPTURAS.md).

## Antes de la demo (30 min)

- [ ] `docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build`
- [ ] `docker compose ... ps` — todos healthy
- [ ] http://localhost:3000 — login `admin` / `admin123`
- [ ] http://localhost:8080/actuator/health — `{"status":"UP"}`
- [ ] http://localhost:3001 — Grafana (admin/admin)
- [ ] `cd backend && .\mvnw.cmd verify` — BUILD SUCCESS

## Demo funcional (10–12 min)

| # | Acción | Esperado | Captura |
|---|--------|----------|---------|
| 1 | Login viewer | Dashboard sin botones de edición | `01-login-viewer.png` |
| 2 | Login admin | CRUD productos visible | `02-admin-products.png` |
| 3 | Crear movimiento stock | Cantidad y movimiento en historial | `03-stock-movement.png` |
| 4 | Producto bajo mínimo | Aparece en dashboard crítico | `04-critical-stock.png` |
| 5 | Auditoría (admin) | Lista revisiones Envers | `05-audit-envers.png` |
| 6 | Swagger | Endpoints documentados | `06-swagger.png` |

## Observabilidad (3 min)

- [ ] Grafana → dashboard inventario (métricas JVM / HTTP)
- [ ] Trace de una petición API en Tempo (opcional)
- [ ] `.\tests\observability\smoke.ps1` — OK

## Calidad y CI (3 min)

- [ ] Mostrar `docs/qa-evidence.md` consolidado
- [ ] Mostrar PR / GitHub Actions verde (o Jenkins build)
- [ ] JaCoCo: abrir `backend/target/site/jacoco/index.html`

## Preguntas frecuentes (preparar respuesta)

- ¿Por qué monolito modular y no microservicios?
- ¿Cómo se valida JWT y permisos granulares?
- ¿Qué pruebas corren en CI vs local?
- ¿Cómo se correlacionan logs y traces (correlationId)?

## Después de la demo

- [ ] `docker compose ... down` (opcional)
- [ ] Subir capturas al repo o entrega indicada por el profesor
- [ ] Completar comentario en Jira **QA-9**
