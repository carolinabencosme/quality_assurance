# Evidencias de calidad (entregables académicos)

Aquí puedes **colocar capturas y reportes** generados localmente o descargados desde CI (no es obligatorio versionar binarios grandes).

## Cobertura JaCoCo (backend)

Tras `mvn verify` en `backend/`:

- Reporte HTML: `backend/target/site/jacoco/index.html`
- En GitHub Actions: artefacto **jacoco-report** del workflow CI (`.github/workflows/ci.yml`)

**Umbral:** el `pom.xml` del backend incluye `jacoco:check` con **mínimo 60 %** de líneas cubiertas (`jacoco.line.minimum.covered.ratio`). Si el build falla, revisa el informe y añade pruebas o ajusta exclusiones justificadas.

## Pruebas unitarias / integración

- Salida de `mvn verify` (Surefire + integración con Testcontainers).
- En CI: pestaña **Actions** del repositorio → job **backend**.

## API (Newman)

En `tests/api/`:

```bash
npm install
npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=NM-$(date +%s)"
```

Informe HTML opcional: ver `tests/api/README.md` (reporter `htmlextra`).

## E2E (Playwright)

En `tests/e2e/` (con frontend + backend + Keycloak en marcha, `E2E_BASE_URL` si aplica):

```bash
npm install
npx playwright install chromium
npm test
```

Reporte HTML configurado en `playwright.config.ts` bajo `docs/qa-evidence/playwright-report/` (crear la carpeta si no existe).

## Grafana

Con el stack de observabilidad (`docker-compose.observability.yml`), capturas del **dashboard** en Grafana (puerto por defecto del compose, p. ej. 3001 según tu `docker-compose.observability.yml`).

## Auditoría Envers

Consultas de ejemplo sobre `revinfo` y `products_aud` tras modificar un producto; exportar resultado o captura desde tu cliente SQL.
