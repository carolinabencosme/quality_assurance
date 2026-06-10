# Guía de despliegue — Docker Compose y ambientes

Instrucciones para levantar, operar y diagnosticar el sistema en **desarrollo**, **staging** y ejecución de **tests** contra infraestructura real.

---

## 1. Prerrequisitos del host

| Requisito | Versión mínima | Verificación |
|-----------|----------------|--------------|
| Docker Engine | 24+ | `docker --version` |
| Docker Compose | v2 | `docker compose version` |
| RAM libre | 8 GB (16 GB para staging completo) | — |
| Puertos libres | 3000, 3001, 5432, 8080, 8081, 8082, 9000, 9090, 9093, 3100, 3200, 4317 | `netstat` / `ss` |

Para desarrollo sin Docker (solo JVM/Node): Java 21, Maven, Node 18+.

---

## 2. Configuración inicial

### 2.1 Clonar repositorio

```bash
git clone https://github.com/<org>/quality_assurance.git
cd quality_assurance
```

### 2.2 Variables de entorno

```bash
cp .env.example .env
# Editar .env con valores locales (nunca commitear .env)
```

Ver sección [Variables de entorno](#6-variables-de-entorno) y archivo `.env.example` en la raíz.

### 2.3 Estructura de archivos Compose

| Archivo | Uso |
|---------|-----|
| `docker-compose.dev.yml` | Desarrollo diario |
| `docker-compose.staging.yml` | Demo completa + observabilidad + Jenkins + Sonar |
| `docker-compose.test.yml` | Dependencias para tests locales opcionales |

---

## 3. Ambiente de desarrollo

### 3.1 Servicios incluidos

| Servicio | Puerto host | Descripción |
|----------|-------------|-------------|
| frontend | 3000 | React (Vite dev o Nginx) |
| backend | 8080 | Spring Boot API |
| postgres | 5432 | PostgreSQL 16 |
| keycloak | 8081 | IdP (mapeo desde 8080 interno) |

### 3.2 Levantar stack

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

### 3.3 Verificar salud

```bash
# Estado contenedores
docker compose -f docker-compose.dev.yml ps

# Health API
curl http://localhost:8080/actuator/health

# Logs backend
docker compose -f docker-compose.dev.yml logs -f backend
```

### 3.4 URLs de desarrollo

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API base | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |
| Keycloak Admin | http://localhost:8081 (admin / ver .env) |
| PostgreSQL | `localhost:5432` — DB `inventory` |

### 3.5 Desarrollo híbrido (recomendado para velocidad)

Solo infra en Docker; apps en host:

```bash
docker compose -f docker-compose.dev.yml up -d postgres keycloak

# Terminal 1 — backend
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Ajustar en `.env` del host:

```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/inventory
VITE_API_URL=http://localhost:8080/api/v1
VITE_KEYCLOAK_URL=http://localhost:8081
```

---

## 4. Ambiente de staging (completo)

### 4.1 Servicios adicionales

| Servicio | Puerto | Función |
|----------|--------|---------|
| prometheus | 9090 | Métricas |
| grafana | 3001 | Dashboards |
| loki | 3100 | Logs |
| tempo | 3200 | Trazas |
| alloy | 4317, 4318 | OTel collector |
| alertmanager | 9093 | Alertas |
| sonarqube | 9000 | Calidad de código |
| jenkins | 8082 | Pipeline visual |

### 4.2 Levantar staging

```bash
docker compose -f docker-compose.staging.yml up -d --build
```

**Nota:** primera ejecución puede tardar varios minutos (descarga imágenes, SonarQube, Jenkins).

### 4.3 Regla crítica — pruebas post-deploy

Las pruebas de integración/E2E/smoke en Jenkins deben ejecutarse **contra el sistema ya desplegado**, no solo durante el build de imagen.

```bash
# Ejemplo smoke manual post-deploy
./scripts/smoke-test.sh
```

### 4.4 URLs staging

| Recurso | URL |
|---------|-----|
| Grafana | http://localhost:3001 (admin/admin — cambiar en prod) |
| Prometheus | http://localhost:9090 |
| SonarQube | http://localhost:9000 |
| Jenkins | http://localhost:8082 |

---

## 5. Operaciones comunes

### 5.1 Detener servicios

```bash
docker compose -f docker-compose.dev.yml down
# Con volúmenes (reset BD):
docker compose -f docker-compose.dev.yml down -v
```

### 5.2 Reconstruir un servicio

```bash
docker compose -f docker-compose.dev.yml up -d --build backend
```

### 5.3 Ejecutar migraciones Flyway manualmente

```bash
cd backend
./mvnw flyway:migrate \
  -Dflyway.url=jdbc:postgresql://localhost:5432/inventory \
  -Dflyway.user=inventory_user \
  -Dflyway.password=inventory_password
```

### 5.4 Importar realm Keycloak

Si no se importa automáticamente:

1. Admin Console → Create realm → Import `keycloak/realm-export.json`
2. Verificar clients y usuarios de prueba

### 5.5 Backup de base de datos (demo)

```bash
docker exec -t <postgres_container> pg_dump -U inventory_user inventory > backup.sql
```

---

## 6. Variables de entorno

### Backend

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | `dev` | Perfil Spring |
| `DATABASE_URL` | `jdbc:postgresql://postgres:5432/inventory` | JDBC URL |
| `DATABASE_USERNAME` | `inventory_user` | Usuario BD |
| `DATABASE_PASSWORD` | `***` | Password BD |
| `KEYCLOAK_ISSUER_URI` | `http://keycloak:8080/realms/inventory-realm` | Issuer JWT |
| `KEYCLOAK_JWKS_URI` | `.../protocol/openid-connect/certs` | Claves públicas |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://alloy:4317` | Collector OTel |
| `OTEL_SERVICE_NAME` | `inventory-api` | Nombre servicio en trazas |

### Frontend

| Variable | Ejemplo |
|----------|---------|
| `VITE_API_URL` | `http://localhost:8080/api/v1` |
| `VITE_KEYCLOAK_URL` | `http://localhost:8081` |
| `VITE_KEYCLOAK_REALM` | `inventory-realm` |
| `VITE_KEYCLOAK_CLIENT_ID` | `inventory-frontend` |

### Observabilidad / herramientas

| Variable | Uso |
|----------|-----|
| `GRAFANA_ADMIN_USER` / `PASSWORD` | Login Grafana |
| `SONAR_HOST_URL` / `SONAR_TOKEN` | Análisis Sonar |
| `JENKINS_ADMIN_ID` / `PASSWORD` | Jenkins local |

---

## 7. Troubleshooting

### Backend no arranca — conexión BD

**Síntoma:** `Connection refused` a postgres

**Solución:**

1. Verificar postgres healthy: `docker compose ps`
2. Usar hostname `postgres` dentro de Docker, `localhost` fuera
3. Esperar healthcheck antes de arrancar backend (`depends_on: condition: service_healthy`)

### 401 en todos los endpoints

**Causas:**

- Issuer URI incorrecto (host `keycloak` vs `localhost`)
- Reloj desincronizado
- Token de otro realm

**Solución:** alinear `KEYCLOAK_ISSUER_URI` con el issuer del JWT (decodificar en jwt.io).

### 403 con token válido

**Causa:** roles no mapeados a authorities

**Solución:** revisar `JwtAuthenticationConverter` y client roles en Keycloak.

### Keycloak redirect loop

**Causa:** redirect URI no registrada

**Solución:** añadir `http://localhost:3000/*` en client frontend.

### Flyway migration failed

**Causa:** migración editada después de aplicada

**Solución:** en dev `flyway clean` + migrate (solo dev) o nueva migración V8.

### Grafana sin datos

**Causa:** Prometheus no scrapea backend; Alloy no recibe OTLP

**Solución:** verificar targets en `prometheus.yml` y variables OTEL del backend.

### Puertos en uso

```bash
# Windows PowerShell
netstat -ano | findstr :8080
```

Cambiar mapeo en compose o detener proceso conflictivo.

---

## 8. Producción (demostración académica)

Para defensa, **staging suele ser suficiente**. Si se despliega en VM/cloud:

1. Usar HTTPS (reverse proxy Nginx / Traefik)
2. Secretos en vault o variables del CI, no en imagen
3. Keycloak con contraseñas fuertes
4. Deshabilitar Swagger en perfil `prod`
5. Retención de logs y backups documentados

---

## 9. Checklist de despliegue

- [ ] `.env` configurado (no en Git)
- [ ] `docker compose up` sin errores
- [ ] `/actuator/health` → UP
- [ ] Flyway migraciones aplicadas
- [ ] Keycloak realm importado
- [ ] Login frontend OK
- [ ] Swagger con JWT funcional
- [ ] (Staging) Grafana accesible
- [ ] Smoke test post-deploy pasa

---

## 10. Referencias

- [observability-guide.md](./observability-guide.md)
- [security-model.md](./security-model.md)
- [cicd-and-quality.md](./cicd-and-quality.md)
- [testing-guide.md](./testing-guide.md) — Testcontainers
