# Jenkins — evidencia pipeline funcional (Avance V3)

El PDF del avance exige un **pipeline Jenkins funcional**. En este monorepo está implementado en `Jenkinsfile` y se despliega con Docker Compose staging.

## Opción A — Jenkins en Docker (recomendada)

```powershell
# Levantar Jenkins (puerto 8082)
docker compose -f docker-compose.dev.yml -f docker-compose.staging.yml up -d jenkins

# Obtener contraseña inicial (primer arranque)
docker exec inventory-jenkins-staging cat /var/jenkins_home/secrets/initialAdminPassword
```

1. Abrir http://localhost:8082
2. Instalar plugins sugeridos (o mínimo: Pipeline, Git, Docker)
3. Crear job **Pipeline** → **Pipeline script from SCM** → repo Git → rama `fix/100%` o `develop` → Script Path: `Jenkinsfile`
4. Ejecutar build → capturar pantalla para evidencia `docs/qa-evidence/screenshots/11-jenkins-build.png`

## Stages del Jenkinsfile

| Stage | Qué hace | Equivalente local |
|-------|----------|-------------------|
| Checkout | Clona el repo | `git clone` |
| Backend — build y tests | `mvn -B verify` | `cd backend && .\mvnw.cmd verify` |
| Frontend — build | `npm ci && npm run build` | `cd frontend && npm run build` |
| Quality Gate SonarQube | `sonar:sonar` (si `SONAR_TOKEN`) | opcional |
| Deploy staging | Compose full stack | `.\scripts\deploy-staging.ps1` |
| Post-deploy smoke | Health checks | `.\scripts\post-deploy-smoke.ps1` |

## Opción B — Simular pipeline sin servidor Jenkins

Para demostrar que el pipeline **funciona** sin instalar Jenkins:

```powershell
.\scripts\verify-avance-v3.ps1
```

Esto ejecuta los mismos pasos críticos (backend verify + frontend build) que el stage principal del `Jenkinsfile`.

## Evidencia para el profesor

- Archivo: `Jenkinsfile` en la raíz
- Captura: build exitoso en UI Jenkins o salida de `verify-avance-v3.ps1`
- Documentación: este archivo + [`docs/ci-cd-guide.md`](ci-cd-guide.md)
