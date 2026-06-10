# CI/CD y calidad de código — GitHub Actions, Jenkins y SonarQube

Automatización del ciclo de entrega con validación continua, Quality Gate y despliegue a staging.

---

## 1. Estrategia de pipelines

| Pipeline | Trigger | Propósito | Duración objetivo |
|----------|---------|-----------|-------------------|
| **GitHub Actions — CI** | PR, push a cualquier rama | Feedback rápido al desarrollador | &lt; 10 min |
| **Jenkins — Full delivery** | Merge a main, manual | Entrega completa + staging | 20–40 min |
| **Nightly security** | Cron 02:00 | ZAP, k6 smoke, dependency check | Variable |

**Principio:** GitHub Actions para **no bloquear** el flujo diario; Jenkins para **demostración integral** en defensa.

---

## 2. GitHub Actions

### 2.1 Workflow CI (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven
      - name: Unit tests
        run: cd backend && ./mvnw test
      - name: Build package
        run: cd backend && ./mvnw package -DskipTests
      - name: Upload JaCoCo
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-report
          path: backend/target/site/jacoco/

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci && npm run lint && npm run build

  docker:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      - name: Build images
        run: docker compose -f docker-compose.dev.yml build
```

### 2.2 Workflow Security (`.github/workflows/security.yml`)

```yaml
name: Security

on:
  schedule:
    - cron: '0 2 * * *'
  pull_request:
    paths:
      - 'backend/pom.xml'

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: OWASP Dependency Check
        run: cd backend && ./mvnw org.owasp:dependency-check-maven:check
```

### 2.3 Protección de rama `main`

En GitHub → Settings → Branches:

- Require PR before merge
- Require status checks: `backend`, `frontend`
- No bypass para administradores (recomendado en proyecto académico)

---

## 3. Jenkins — Pipeline completo

### 3.1 Jenkinsfile (referencia)

```groovy
pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonar-token')
        COMPOSE_FILE = 'docker-compose.staging.yml'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Build Backend') {
            steps { sh './mvnw -f backend/pom.xml clean package -DskipTests' }
        }
        stage('Build Frontend') {
            steps { sh 'cd frontend && npm ci && npm run build' }
        }
        stage('Unit Tests') {
            steps { sh './mvnw -f backend/pom.xml test' }
        }
        stage('Integration Tests') {
            steps { sh './mvnw -f backend/pom.xml verify -P integration-tests' }
        }
        stage('API Tests') {
            steps { sh './mvnw -f backend/pom.xml test -P api-tests' }
        }
        stage('SonarQube Analysis') {
            steps { sh './scripts/run-sonar.sh' }
        }
        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Docker Build') {
            steps { sh "docker compose -f ${COMPOSE_FILE} build" }
        }
        stage('Deploy Staging') {
            steps { sh "docker compose -f ${COMPOSE_FILE} up -d" }
        }
        stage('Post-Deploy Smoke') {
            steps { sh './scripts/smoke-test.sh' }
        }
        stage('E2E Tests') {
            steps { sh 'cd frontend && npx playwright test' }
        }
        stage('Security Scan') {
            steps { sh './scripts/run-zap-baseline.sh' }
        }
        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/reports/**, **/*.xml, **/playwright-report/**',
                    allowEmptyArchive: true
            }
        }
    }

    post {
        always {
            junit '**/target/surefire-reports/*.xml'
        }
        failure {
            echo 'Pipeline failed — revisar logs y qa-evidence'
        }
    }
}
```

### 3.2 Orden crítico de etapas

1. Build y unit tests **antes** de Sonar (para coverage).
2. Quality Gate **antes** de deploy si se quiere bloquear mal código.
3. Deploy staging **antes** de E2E y smoke.
4. ZAP contra URL pública del frontend en staging.

---

## 4. SonarQube

### 4.1 Métricas y Quality Gate

| Métrica | Umbral recomendado | Bloqueante |
|---------|-------------------|------------|
| Coverage (backend) | ≥ 70% en new code o overall | Sí |
| Duplicación | ≤ 5% | Advertencia |
| Bugs críticos | 0 | Sí |
| Vulnerabilidades críticas | 0 | Sí |
| Code smells | Tendencia estable | No (inicial) |

### 4.2 Configuración `sonar-project.properties`

```properties
sonar.projectKey=inventory-qas
sonar.projectName=Inventory QAS
sonar.sources=backend/src/main,frontend/src
sonar.tests=backend/src/test,frontend/src
sonar.java.binaries=backend/target/classes
sonar.coverage.jacoco.xmlReportPaths=backend/target/site/jacoco/jacoco.xml
sonar.exclusions=**/dto/**,**/config/**
```

### 4.3 Script `scripts/run-sonar.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
./mvnw -f backend/pom.xml verify -P integration-tests
./mvnw -f backend/pom.xml sonar:sonar \
  -Dsonar.projectKey=inventory-qas \
  -Dsonar.host.url="${SONAR_HOST_URL:-http://localhost:9000}" \
  -Dsonar.token="${SONAR_TOKEN}"
```

### 4.4 Primera configuración SonarQube

1. `docker compose -f docker-compose.staging.yml up -d sonarqube`
2. Esperar inicialización (~2 min)
3. Login admin/admin → cambiar password
4. Crear proyecto → generar token
5. Guardar token en Jenkins credentials y `.env` local

---

## 5. Scripts auxiliares

### 5.1 `scripts/smoke-test.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
API_URL="${API_URL:-http://localhost:8080}"

curl -sf "${API_URL}/actuator/health" | grep -q '"status":"UP"'
echo "Health OK"

# Opcional: obtener token y probar /api/v1/products
# source scripts/get-test-token.sh
# curl -sf -H "Authorization: Bearer $TOKEN" "${API_URL}/api/v1/products"
```

### 5.2 `scripts/run-zap-baseline.sh`

Ejecutar ZAP contra `STAGING_URL` documentada en `.env`.

---

## 6. Artefactos y evidencias

| Artefacto | Ubicación | Uso |
|-----------|-----------|-----|
| JaCoCo HTML | `backend/target/site/jacoco/` | Coverage |
| Surefire XML | `target/surefire-reports/` | Jenkins junit |
| Playwright report | `frontend/playwright-report/` | E2E |
| ZAP report | `tests/security/zap-report.html` | Seguridad |
| Sonar dashboard | URL SonarQube | Calidad |

Archivar en Jenkins y referenciar en [qa-evidence.md](./qa-evidence.md).

---

## 7. Conventional Commits y trazabilidad

```
feat(product): add paginated product list endpoint
fix(stock): prevent negative quantity on OUT movement
test(api): add permission 403 tests for clerk role
ci(jenkins): add post-deploy smoke stage
docs(deployment): update staging ports table
```

Vincular commits a issues: `Closes #42` en PR description.

---

## 8. Checklist CI/CD para entrega

- [ ] GitHub Actions verde en PR de ejemplo (captura)
- [ ] Jenkins pipeline completo verde (captura)
- [ ] SonarQube Quality Gate passed (captura)
- [ ] Artefactos archivados en Jenkins
- [ ] Staging accesible post-pipeline
- [ ] Smoke test automatizado pasa
- [ ] No secretos en logs de pipeline

---

## 9. Referencias

- [testing-guide.md](./testing-guide.md)
- [deployment-guide.md](./deployment-guide.md)
- [development-guide.md](./development-guide.md)
- [qa-evidence.md](./qa-evidence.md)
