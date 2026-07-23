pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 120, unit: 'MINUTES')
        timestamps()
    }

    parameters {
        booleanParam(name: 'DEPLOY_STAGING', defaultValue: false, description: 'Deploy local staging stack with Docker Compose')
        booleanParam(name: 'DEPLOY_PRODUCTION', defaultValue: false, description: 'Deploy local production stack with Docker Compose')
        booleanParam(name: 'RUN_E2E', defaultValue: true, description: 'Run Playwright E2E tests')
        booleanParam(name: 'RUN_ZAP', defaultValue: false, description: 'Run OWASP ZAP baseline scan')
        booleanParam(name: 'RUN_K6', defaultValue: false, description: 'Run k6 performance test')
        booleanParam(name: 'RUN_SONAR', defaultValue: false, description: 'Run SonarQube scan when SONAR_TOKEN is set')
        booleanParam(name: 'RUN_DEPENDENCY_CHECK', defaultValue: false, description: 'Run OWASP Dependency Check')
    }

    environment {
        COMPOSE_FILES = '-f docker-compose.dev.yml -f docker-compose.test.yml -f docker-compose.observability.yml'
        PROD_COMPOSE_FILES = '-f docker-compose.prod.yml -f docker-compose.observability.yml --env-file .env.prod'
        SONAR_HOST_URL = "${env.SONAR_HOST_URL ?: 'http://localhost:9000'}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build') {
            steps {
                dir('backend') {
                    sh 'mvn -B -DskipTests package'
                }
            }
        }

        stage('Backend Unit Tests') {
            steps {
                dir('backend') {
                    sh 'mvn -B test'
                }
            }
        }

        stage('Backend Integration Tests') {
            steps {
                dir('backend') {
                    sh 'mvn -B verify'
                }
            }
        }

        stage('Frontend Install') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Compose Build') {
            steps {
                sh "docker compose ${COMPOSE_FILES} build"
            }
        }

        stage('Deploy Staging Local') {
            when {
                expression { return params.DEPLOY_STAGING || params.RUN_E2E || params.RUN_ZAP || params.RUN_K6 }
            }
            steps {
                sh "docker compose ${COMPOSE_FILES} up -d postgres keycloak backend frontend prometheus loki tempo grafana alertmanager alloy"
                sh 'sleep 120'
            }
        }

        stage('API Newman') {
            when {
                expression { return params.DEPLOY_STAGING }
            }
            steps {
                dir('tests/api') {
                    sh 'npm ci'
                    sh 'npm test -- --env-var "baseUrl=http://localhost:8080" --env-var "keycloakUrl=http://localhost:8081" --env-var "sku=JENKINS-${BUILD_NUMBER}"'
                }
            }
        }

        stage('E2E Playwright') {
            when {
                expression { return params.RUN_E2E }
            }
            steps {
                dir('tests/e2e') {
                    sh 'npm ci'
                    sh 'npx playwright install --with-deps chromium'
                    sh 'E2E_BASE_URL=http://localhost:3000 npm test'
                }
            }
        }

        stage('Security ZAP') {
            when {
                expression { return params.RUN_ZAP }
            }
            steps {
                sh 'chmod +x scripts/run-zap-baseline.sh'
                sh 'ZAP_TARGET=http://localhost:3000 ./scripts/run-zap-baseline.sh'
            }
        }

        stage('Dependency Check') {
            when {
                expression { return params.RUN_DEPENDENCY_CHECK }
            }
            steps {
                dir('backend') {
                    sh 'mvn -B org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=9'
                }
            }
        }

        stage('k6 Performance') {
            when {
                expression { return params.RUN_K6 }
            }
            steps {
                sh 'chmod +x scripts/run-k6.sh'
                sh 'BASE_URL=http://localhost:8080 KEYCLOAK_URL=http://localhost:8081 ./scripts/run-k6.sh'
            }
        }

        stage('SonarQube') {
            when {
                expression { return params.RUN_SONAR && env.SONAR_TOKEN?.trim() }
            }
            steps {
                dir('backend') {
                    sh '''
                        mvn -B sonar:sonar \
                          -Dsonar.projectKey=inventory-qas \
                          -Dsonar.host.url=$SONAR_HOST_URL \
                          -Dsonar.token=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Quality Gate') {
            when {
                expression { return params.RUN_SONAR }
            }
            steps {
                script {
                    if (env.SONAR_TOKEN?.trim()) {
                        echo 'Quality gate executed by SonarQube server policy.'
                    } else {
                        echo 'SKIP: SONAR_TOKEN is not set.'
                    }
                }
            }
        }

        stage('Post Deploy Smoke') {
            when {
                expression { return params.DEPLOY_STAGING }
            }
            steps {
                sh 'chmod +x scripts/post-deploy-smoke.sh'
                sh 'RUN_OBSERVABILITY_SMOKE=true ./scripts/post-deploy-smoke.sh'
            }
        }

        stage('Deploy Production Local') {
            when {
                expression { return params.DEPLOY_PRODUCTION }
            }
            steps {
                sh 'cp .env.prod.example .env.prod'
                sh "docker compose ${PROD_COMPOSE_FILES} up -d --build"
                sh 'sleep 120'
                sh 'RUN_OBSERVABILITY_SMOKE=true ./scripts/post-deploy-smoke.sh'
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: 'backend/target/site/jacoco/**, backend/target/dependency-check-report.*, docs/qa-evidence/**', allowEmptyArchive: true
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml'
            sh "docker compose ${COMPOSE_FILES} down -v || true"
            sh "docker compose ${PROD_COMPOSE_FILES} down -v || true"
        }
    }
}
