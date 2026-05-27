// Pipeline Jenkins — Fase 6 (QA-8)
// Requiere: Docker, Maven 21, Node 22 en el agente (o agente Docker)

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 90, unit: 'MINUTES')
        timestamps()
    }

    parameters {
        booleanParam(name: 'DEPLOY_STAGING', defaultValue: false, description: 'Levantar stack staging con Compose')
        booleanParam(name: 'RUN_SONAR', defaultValue: true, description: 'Ejecutar analisis SonarQube (requiere SONAR_TOKEN)')
    }

    environment {
        COMPOSE_FILES = '-f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.staging.yml'
        SONAR_HOST_URL = "${env.SONAR_HOST_URL ?: 'http://localhost:9000'}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend — build y tests') {
            steps {
                dir('backend') {
                    sh 'mvn -B verify'
                }
            }
        }

        stage('Frontend — build') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Quality Gate — SonarQube') {
            when {
                expression { return params.RUN_SONAR && env.SONAR_TOKEN?.trim() }
            }
            steps {
                dir('backend') {
                    sh '''
                        mvn -B verify sonar:sonar \
                          -Dsonar.projectKey=inventory-qas \
                          -Dsonar.host.url=$SONAR_HOST_URL \
                          -Dsonar.token=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Deploy staging') {
            when {
                expression { return params.DEPLOY_STAGING }
            }
            steps {
                sh "docker compose ${COMPOSE_FILES} up -d --build"
                sh 'sleep 120'
            }
        }

        stage('Post-deploy smoke') {
            when {
                expression { return params.DEPLOY_STAGING }
            }
            steps {
                sh 'chmod +x scripts/post-deploy-smoke.sh'
                sh './scripts/post-deploy-smoke.sh'
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml'
            archiveArtifacts artifacts: 'backend/target/site/jacoco/**', allowEmptyArchive: true
        }
    }
}
