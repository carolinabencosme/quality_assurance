# Installation

## Prerequisites

- Java 21
- Node.js 22
- Docker Desktop or Docker Engine with Compose
- PowerShell 7 or Windows PowerShell for `.ps1` scripts
- Optional: k6, JMeter, Snyk CLI

On Windows with Testcontainers:

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
```

## Development Stack

```powershell
copy .env.example .env
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

URLs:

- Frontend: http://localhost:3000
- Backend Swagger: http://localhost:8080/swagger-ui.html
- Keycloak: http://localhost:8081
- Grafana: http://localhost:3030
- Prometheus: http://localhost:9090

Demo users:

- `admin/admin123`
- `warehouse/warehouse123`
- `clerk/clerk123`
- `viewer/viewer123`

## Full Test Battery

```powershell
.\scripts\run-all-tests.ps1
```

## Local Production Stack

```powershell
copy .env.prod.example .env.prod
# Edit .env.prod and replace every SET_IN_ENV_* value.
.\scripts\up-prod.ps1
.\scripts\post-deploy-smoke.ps1
```

Linux/macOS:

```bash
cp .env.prod.example .env.prod
# Edit .env.prod and replace every SET_IN_ENV_* value.
./scripts/up-prod.sh
./scripts/post-deploy-smoke.sh
```

Production compose is local and integrated for defense/demo use. It combines:

```powershell
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml --env-file .env.prod up -d --build
```

## Keycloak Admin Client

Real user management uses the confidential client `inventory-admin-api`.

Required backend variables:

- `KEYCLOAK_ADMIN_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_ADMIN_CLIENT_ID`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`

The secret in `.env.prod` must match the imported Keycloak client secret or the `/api/v1/users` endpoints return 503.

The realm JSON intentionally contains only the dev/test secret `inventory-admin-secret-change-me`, because Keycloak realm import does not expand `${ENV}` placeholders. For production, set `KEYCLOAK_ADMIN_CLIENT_SECRET` outside Git and rotate the imported client immediately:

```powershell
$env:KEYCLOAK_ADMIN_CLIENT_SECRET = '<real-secret-not-committed>'
.\scripts\set-keycloak-admin-secret.ps1
```

The rotation script fails when the required environment value is missing and never writes the value to an evidence file.

## Local SonarQube

The staging compose pins the official Community image and exposes a configurable host port:

```powershell
$env:SONAR_PORT = '9001' # omit to use 9000
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml up -d sonarqube
$env:SONAR_TOKEN = '<temporary-local-analysis-token>'
.\scripts\run-sonar-local.ps1 -SonarHostUrl 'http://localhost:9001'
```

The generated summary never contains the token.
