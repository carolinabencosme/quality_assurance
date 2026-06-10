# Guía de observabilidad — Métricas, logs, trazas y alertas

Instrumentación end-to-end del sistema con OpenTelemetry y el stack Grafana (Prometheus, Loki, Tempo, Alertmanager).

---

## 1. Objetivos de observabilidad

| Pregunta | Fuente |
|----------|--------|
| ¿El sistema está vivo? | `/actuator/health`, uptime metrics |
| ¿Qué tan rápido responde? | Histogramas HTTP latency (p50, p95) |
| ¿Cuántos errores hay? | Error rate 4xx/5xx |
| ¿Qué pasó en una request concreta? | Trazas en Tempo + logs en Loki |
| ¿Hay productos críticos de negocio? | Dashboard negocio (custom metrics) |
| ¿Hay ataques o mala config auth? | Dashboard seguridad (401/403) |

---

## 2. Arquitectura de telemetría

```
┌─────────────────────────────────────┐
│     Spring Boot API               │
│  - Micrometer metrics               │
│  - OTel Java agent / SDK            │
│  - Logs JSON (Logback)              │
└──────────────┬──────────────────────┘
               │ OTLP (gRPC/HTTP)
               ▼
┌─────────────────────────────────────┐
│     Grafana Alloy (collector)       │
└───┬─────────────┬─────────────┬─────┘
    ▼             ▼             ▼
 Prometheus      Loki         Tempo
    │             │             │
    └─────────────┴──────┬──────┘
                         ▼
                    Grafana
                         │
                         ▼
                  Alertmanager
```

---

## 3. Configuración del backend

### 3.1 Dependencias

- `spring-boot-starter-actuator`
- `micrometer-registry-prometheus`
- OpenTelemetry Spring Boot starter o Java agent

### 3.2 Variables de entorno

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4317
OTEL_SERVICE_NAME=inventory-api
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=staging
```

### 3.3 Correlation ID

Filtro `CorrelationIdFilter` (módulo `observability`):

1. Leer header `X-Correlation-Id` o generar UUID
2. Colocar en MDC: `correlationId`
3. Devolver en response header y en body de error

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {
    static final String HEADER = "X-Correlation-Id";
    // ...
}
```

### 3.4 Logs estructurados (JSON)

`logback-spring.xml` con appender JSON:

```json
{
  "timestamp": "2026-05-18T20:10:31Z",
  "level": "INFO",
  "traceId": "abc123def456",
  "spanId": "def456ghi789",
  "correlationId": "req-789xyz",
  "user": "warehouse.manager@test.com",
  "endpoint": "POST /api/v1/stock/movements",
  "message": "Stock movement registered",
  "productSku": "SKU-001",
  "movementType": "OUT"
}
```

Campos mínimos obligatorios: `timestamp`, `level`, `traceId`, `correlationId`, `endpoint`, `message`.

---

## 4. Métricas clave

### 4.1 Infraestructura / JVM

| Métrica | Descripción |
|---------|-------------|
| `jvm_memory_used_bytes` | Memoria heap |
| `process_cpu_usage` | CPU proceso |
| `jvm_threads_live` | Hilos |
| `process_uptime_seconds` | Uptime |

### 4.2 Aplicación HTTP

| Métrica | Descripción |
|---------|-------------|
| `http_server_requests_seconds` | Latencia por URI y status |
| `http_server_requests_seconds_count` | Throughput |
| Ratio 5xx / total | Error rate |

### 4.3 Base de datos

| Métrica | Descripción |
|---------|-------------|
| `hikaricp_connections_active` | Conexiones activas |
| `hikaricp_connections_pending` | Esperando conexión |
| `jdbc_connections_creation_seconds` | Tiempo crear conexión |

### 4.4 Negocio (custom — opcional)

```java
meterRegistry.counter("inventory.products.critical").increment();
meterRegistry.gauge("inventory.stock.movements.today", movementsToday);
```

---

## 5. Configuración de componentes

### 5.1 Prometheus (`observability/prometheus/prometheus.yml`)

```yaml
scrape_configs:
  - job_name: 'inventory-api'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['backend:8080']
```

### 5.2 Loki

- Recibir logs vía Alloy desde Docker driver o archivo
- Labels: `service_name`, `environment`, `level`

### 5.3 Tempo

- Recibir spans OTLP desde Alloy
- Retention según disco disponible (demo: 24–48h)

### 5.4 Alloy

Pipeline: OTLP in → batch → export a Prometheus (métricas), Loki (logs), Tempo (traces).

### 5.5 Grafana

- Datasources provisionados: Prometheus, Loki, Tempo
- Dashboards en `observability/grafana/dashboards/`

---

## 6. Dashboards mínimos

### Dashboard 1 — Infraestructura

| Panel | Query (ejemplo) |
|-------|-----------------|
| CPU | `process_cpu_usage` |
| Memoria JVM | `jvm_memory_used_bytes{area="heap"}` |
| Uptime | `process_uptime_seconds` |
| Contenedores | cAdvisor si está habilitado |

### Dashboard 2 — Aplicación

| Panel | Query |
|-------|-------|
| Throughput | `rate(http_server_requests_seconds_count[5m])` |
| Latencia p95 | `histogram_quantile(0.95, ...)` |
| Error rate | sum 5xx / sum total |
| Top endpoints | by uri |

### Dashboard 3 — Negocio (recomendado)

- Total productos activos
- Productos críticos
- Movimientos últimas 24h

### Dashboard 4 — Seguridad

- Contador `http_server_requests_seconds_count{status="401"}`
- Contador `status="403"`
- Logins fallidos (si se instrumenta en Keycloak o app)

---

## 7. Alertmanager

### Reglas ejemplo (`prometheus/alerts.yml`)

```yaml
groups:
  - name: inventory-api
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
          / sum(rate(http_server_requests_seconds_count[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: Error rate above 5%

      - alert: HighLatencyP95
        expr: histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le)) > 2
        for: 10m
        labels:
          severity: warning

      - alert: ServiceDown
        expr: up{job="inventory-api"} == 0
        for: 1m
        labels:
          severity: critical
```

### Rutas Alertmanager

- `critical` → webhook / email de prueba del equipo
- Documentar alerta de prueba en qa-evidence (captura firing/resolved)

---

## 8. Procedimiento de validación (paso a paso)

### Paso 1 — Levantar staging

```bash
docker compose -f docker-compose.staging.yml up -d
```

### Paso 2 — Generar tráfico

```bash
# Health
curl http://localhost:8080/actuator/health

# Con token
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Correlation-Id: demo-trace-001" \
     http://localhost:8080/api/v1/products
```

### Paso 3 — Verificar Prometheus

- Abrir http://localhost:9090 → query `http_server_requests_seconds_count`

### Paso 4 — Verificar Loki

- Grafana → Explore → Loki → `{service_name="inventory-api"}` | json | correlationId="demo-trace-001"

### Paso 5 — Verificar Tempo

- Grafana → Explore → Tempo → Search por traceId del log
- Ver span HTTP + span JDBC

### Paso 6 — Disparar alerta de prueba

- Detener backend 2 minutos → `ServiceDown` firing
- Restaurar → resolved

---

## 9. Integración con pruebas

| Prueba | Validación observabilidad |
|--------|---------------------------|
| Integration | MDC correlationId presente en logs de test |
| E2E | Playwright request genera traza visible |
| Manual | Charter observabilidad en qa-evidence |

---

## 10. Troubleshooting

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| Sin métricas en Prometheus | Target down, path incorrecto | Verificar `/actuator/prometheus` expuesto |
| Logs planos no JSON | Logback mal configurado | Perfil staging con appender JSON |
| Trazas vacías | OTEL endpoint incorrecto | Revisar Alloy logs |
| traceId no en logs | MDC no propagado | Integrar OTel con logging pattern |

---

## 11. Checklist observabilidad

- [ ] OpenTelemetry exportando a Alloy
- [ ] Prometheus scrape activo
- [ ] Logs JSON con traceId y correlationId
- [ ] Trazas visibles en Tempo
- [ ] ≥ 2 dashboards Grafana
- [ ] Alertmanager con ≥ 3 reglas
- [ ] Evidencia capturada en qa-evidence

---

## 12. Referencias

- [deployment-guide.md](./deployment-guide.md)
- [architecture.md](./architecture.md)
- [testing-guide.md](./testing-guide.md)
