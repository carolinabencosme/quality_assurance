# Maintenance

## Backups

Back up PostgreSQL before deployments and before Flyway repairs:

```bash
docker compose exec postgres pg_dump -U inventory_user inventory > backup.sql
```

Restore only into an empty or disposable environment unless a migration plan exists.

## Secret Rotation

Rotate these values together:

- `POSTGRES_PASSWORD` and `DATABASE_PASSWORD`
- `KEYCLOAK_ADMIN_PASSWORD`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`
- `GRAFANA_ADMIN_PASSWORD`

After rotating `KEYCLOAK_ADMIN_CLIENT_SECRET`, update the Keycloak `inventory-admin-api` client and the backend environment value.

## Keycloak Upgrades

1. Export the current realm.
2. Test import with the target Keycloak image.
3. Run `scripts/verify-keycloak-realm.ps1`.
4. Run `KeycloakContainerIntegrationTest` through `mvn verify`.
5. Re-run auth smoke and Playwright login tests.

## Flyway

Validate migrations:

```powershell
.\scripts\validate-flyway-migrations.ps1
```

Repair checksums only after confirming the database state and keeping a backup:

```powershell
.\scripts\repair-flyway-checksums.ps1
```

## Observability

Review:

- Prometheus targets
- Alertmanager active alerts
- Grafana Inventory API, Infra, Business and Security dashboards
- Loki logs filtered by `user=` and `endpoint=`
- Tempo traces by trace id

## Evidence Refresh

Use `docs/qa-evidence/FINAL-CHECKLIST.md` as the release gate. Refresh generated evidence after meaningful changes:

```powershell
.\scripts\generate-qa-evidence.ps1
.\scripts\run-k6.ps1
.\scripts\run-jmeter.ps1
```
