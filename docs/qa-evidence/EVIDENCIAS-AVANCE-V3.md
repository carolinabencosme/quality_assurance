# Evidencias — Avance Proyecto V3 (100%)

Documento de cierre del checklist académico **Avance Proyecto V3** (PUCMM — Aseguramiento de Calidad de Software).

**Rama:** `fix/100%`  
**Última verificación:** ejecutar `.\scripts\verify-avance-v3.ps1`

---

## Matriz de cumplimiento

| Bloque PDF | Criterio | Estado | Evidencia en repo |
|------------|----------|--------|-------------------|
| **Seguridad** | Keycloak funcionando | ✅ | `keycloak/realm-export.json`, `docker-compose.dev.yml` |
| | OAuth2/JWT login | ✅ | `docs/security-model.md`, `SecurityConfig.java` |
| | ≥2 usuarios | ✅ | `admin`, `viewer`, `warehouse`, `clerk` en realm |
| | ≥2 permisos | ✅ | `Permission.java` — product:view, stock:manage, audit:view, etc. |
| | Endpoint con permisos | ✅ | `@PreAuthorize` en controladores + tests 401/403 |
| **Base de datos** | Flyway | ✅ | `backend/src/main/resources/db/migration/V1–V7` |
| | ≥4 tablas relacionadas | ✅ | categories, products, stock_movements, users_profile + audit |
| | Docker PostgreSQL | ✅ | servicio `postgres` en compose |
| **Funcionalidad** | CRUD producto | ✅ | API + UI `/products` |
| | Validaciones negocio | ✅ | SKU único 409, stock negativo 400, RF-STK |
| **Testing** | ≥15 unitarias | ✅ | ~72 tests backend |
| | Cobertura ≥60% | ✅ | `jacoco-check` en `pom.xml` |
| | Evidencia ejecución | ✅ | `docs/qa-evidence/test-execution-summary.md`, JaCoCo HTML |
| **GitHub** | Repo público | ✅ | github.com/carolinabencosme/quality_assurance |
| | README | ✅ | `README.md` |
| | ≥15 commits | ✅ | historial `develop` |
| | ≥2 PRs | ✅ | PRs #1–#18 mergeados/abiertos |
| **Auditoría** | Envers | ✅ | `@Audited` en `Product.java`, `/api/v1/audit` |
| | Evidencia en BD | ✅ | `docs/qa-evidence/envers-queries.sql` + captura `05-audit-envers.png` |
| **API REST** | Swagger funcional | ✅ | http://localhost:8080/swagger-ui.html |
| | Endpoints documentados | ✅ | `@Operation` + `@ApiResponses` en todos los controladores |
| **Integration testing** | Testcontainers | ✅ | `*IntegrationTest.java` |
| | PostgreSQL en TC | ✅ | `PostgreSQLContainer` en tests |
| | ≥5 integración | ✅ | 8+ clases de integración |
| **API testing** | ≥10 escenarios | ✅ | 14 en Postman |
| | Errores + permisos | ✅ | escenarios 04, 08, 13, 14 |
| **Docker** | App + BD + Keycloak | ✅ | `docker compose -f docker-compose.dev.yml up` |
| **GitHub Actions** | Build + tests | ✅ | `.github/workflows/ci.yml` |
| | Integration tests CI | ✅ | `mvn verify` con Docker en runner |
| **Jenkins** | Pipeline funcional | ✅ | `Jenkinsfile` + `docs/jenkins-evidence.md` |
| **Observabilidad** | Grafana | ✅ | `docker-compose.observability.yml` |
| | Dashboard operativo | ✅ | `observability/grafana/.../inventory-api.json` |
| **Playwright** | Login + CRUD | ✅ | `login-dashboard.spec.ts`, `product-crud.spec.ts` |

---

## Comandos para regenerar evidencias

```powershell
# Verificación completa del checklist
.\scripts\verify-avance-v3.ps1

# Stack dev + observabilidad
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build

# Evidencias (JaCoCo, capturas E2E)
.\scripts\generate-qa-evidence.ps1

# Postman (14 escenarios)
cd tests/api
npm install
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081"

# Envers en BD
docker exec -it inventory-postgres-dev psql -U inventory_user -d inventory -f /tmp/envers.sql
# (copiar docs/qa-evidence/envers-queries.sql al contenedor o pegar queries)
```

---

## Capturas requeridas

Ver [`CHECKLIST-CAPTURAS.md`](CHECKLIST-CAPTURAS.md). Generación automática parcial:

```powershell
docker compose -f docker-compose.dev.yml up -d
.\scripts\generate-qa-evidence.ps1
```

Capturas manuales recomendadas: Swagger (`06`), Grafana (`07`), GitHub Actions verde (`08`), Keycloak realm (`10`).

---

## Referencias

- Preguntas técnicas defensa: [`docs/defensa/preguntas-tecnicas-avance-v3.md`](../defensa/preguntas-tecnicas-avance-v3.md)
- Modelo de seguridad: [`docs/security-model.md`](../security-model.md)
- CI/CD: [`docs/ci-cd-guide.md`](../ci-cd-guide.md)
