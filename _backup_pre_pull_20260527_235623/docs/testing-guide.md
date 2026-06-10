# Guía de testing — Pirámide full stack y ejecución

El testing es el **área de mayor peso técnico** del proyecto. Esta guía define tipos de prueba, herramientas, estructura, casos mínimos y cómo generar evidencias.

---

## 1. Pirámide de pruebas

```
                    ┌─────────────┐
                    │  Manual /   │
                    │ Exploratory │
                    └──────┬──────┘
               ┌───────────┴───────────┐
               │  E2E (Playwright)     │
               │  Security (ZAP)       │
               │  Performance (k6)   │
               └───────────┬───────────┘
          ┌────────────────┴────────────────┐
          │  API / Contract (RestAssured)   │
          │  Schemathesis                   │
          └────────────────┬────────────────┘
     ┌─────────────────────┴─────────────────────┐
     │  Integration (Testcontainers)             │
     └─────────────────────┬─────────────────────┘
┌──────────────────────────┴──────────────────────────┐
│  Unit (JUnit + Mockito)                             │
└─────────────────────────────────────────────────────┘
```

**Principio:** muchas pruebas rápidas abajo; pocas pruebas lentas arriba.

---

## 2. Estructura de carpetas

```
backend/src/test/java/
├── unit/
│   ├── ProductServiceTest.java
│   ├── StockServiceTest.java
│   └── ReportServiceTest.java
├── integration/
│   ├── ProductRepositoryIT.java
│   ├── StockMovementIT.java
│   └── KeycloakSecurityIT.java
└── api/
    ├── ProductApiTest.java
    ├── StockApiTest.java
    └── PermissionApiTest.java

tests/
├── e2e/playwright/
│   ├── login.spec.ts
│   ├── products.spec.ts
│   ├── stock.spec.ts
│   └── permissions.spec.ts
├── performance/k6/
│   ├── products-load-test.js
│   └── stock-stress-test.js
├── security/zap/
│   └── zap-baseline.conf
└── postman/                    # opcional
```

---

## 3. Unit tests (JUnit 5 + Mockito)

### Alcance

- Services: reglas de negocio
- Mappers y validadores
- Utilidades de dominio

### Meta de cobertura

**≥ 70%** en paquetes `*.service.*` (JaCoCo).

### Ejemplo — SKU duplicado

```java
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository repository;
    @InjectMocks ProductService service;

    @Test
    void create_duplicateSku_throwsConflict() {
        when(repository.existsBySku("SKU-001")).thenReturn(true);
        assertThatThrownBy(() -> service.create(validRequest("SKU-001")))
            .isInstanceOf(DuplicateSkuException.class);
    }
}
```

### Ejecución

```bash
cd backend
./mvnw test
# Reporte JaCoCo
./mvnw verify
open target/site/jacoco/index.html
```

---

## 4. Integration tests (Testcontainers)

### Alcance

- Repositories con PostgreSQL real
- Transacciones producto + movimiento
- Seguridad con contenedor Keycloak (o mock mínimo según tiempo)

### Configuración Maven

Perfil `integration-tests` con `maven-failsafe-plugin`:

```bash
./mvnw verify -P integration-tests
```

### Ejemplo — movimiento de stock

```java
@SpringBootTest
@Testcontainers
class StockMovementIT {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Test
    void registerOut_insufficientStock_fails() {
        // seed product with quantity 5
        // attempt OUT 10 → expect exception
    }
}
```

---

## 5. API tests (RestAssured + Schemathesis)

### Casos mínimos por área

| Área | Casos |
|------|-------|
| Productos | CRUD OK, 409 SKU, 400 precio negativo, paginación |
| Stock | IN suma, OUT resta, OUT exceso → error |
| Seguridad | 401 sin token, 403 rol incorrecto, 200 rol correcto |
| Contrato | Schema OpenAPI válido |

### RestAssured

```java
@Test
void listProducts_withoutToken_returns401() {
    given()
    .when().get("/api/v1/products")
    .then().statusCode(401);
}
```

### Schemathesis

```bash
schemathesis run http://localhost:8080/v3/api-docs \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --checks all
```

### Ejecución

```bash
./mvnw test -P api-tests
```

---

## 6. E2E tests (Playwright)

### Flujos obligatorios

1. Login vía Keycloak
2. Crear producto (usuario con `product:manage`)
3. Registrar entrada de stock
4. Registrar salida
5. Ver dashboard con KPIs
6. Usuario limitado no ve botón "Crear producto"
7. (Opcional) viewport mobile

### Configuración

```typescript
// playwright.config.ts
export default defineConfig({
  baseURL: 'http://localhost:3000',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

### Ejecución

```bash
# Requisito: stack dev o staging levantado
cd frontend
npx playwright install
npx playwright test
npx playwright show-report
```

### Auth en tests

- Opción A: login UI real (más lento, más realista)
- Opción B: obtener token vía Keycloak password grant solo en test env

---

## 7. Security testing

### 7.1 OWASP Dependency Check

En CI (GitHub Actions):

```yaml
- name: Dependency Check
  run: ./mvnw org.owasp:dependency-check-maven:check
```

### 7.2 OWASP ZAP Baseline

```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r tests/security/zap-report.html \
  -c tests/security/zap/zap-baseline.conf
```

**Requisito:** incluir en qa-evidence; 0 alertas críticas sin justificación.

### 7.3 Pruebas manuales de seguridad

- [ ] JWT expirado rechazado
- [ ] CORS desde origen no permitido bloqueado
- [ ] Headers sensibles no expuestos

---

## 8. Performance testing (k6)

### Escenarios

| Script | VUs | Duración | Objetivo |
|--------|-----|----------|----------|
| products-load-test.js | 100 | 5 min | GET /products estable |
| stock-stress-test.js | 50 | 3 min | POST movimientos |

### Ejemplo k6 con token

```javascript
import http from 'k6/http';

export function setup() {
  const token = obtainKeycloakToken();
  return { token };
}

export default function (data) {
  http.get(`${__ENV.API_URL}/products`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
}
```

### Ejecución

```bash
k6 run -e API_URL=http://localhost:8080/api/v1 tests/performance/k6/products-load-test.js
```

Documentar en qa-evidence: **p95 latency**, **throughput**, **error rate**.

---

## 9. Data testing

| Prueba | Comando / método |
|--------|------------------|
| Migraciones desde cero | CI job Flyway en BD vacía |
| Seeds | Assert count categories/products post V6 |
| Constraints | Integration test SKU duplicate |

---

## 10. Testing manual exploratorio

Usar **charters** documentados en [qa-evidence.md](./qa-evidence.md):

| Charter | Foco | Tiempo |
|---------|------|--------|
| CH-01 Productos | CRUD, validaciones, UX errores | 45 min |
| CH-02 Stock | Movimientos, concurrencia ligera | 45 min |
| CH-03 Seguridad | Roles, logout, token refresh | 30 min |
| CH-04 Responsive | Mobile + tablet layouts | 30 min |

---

## 11. Integración con CI/CD

| Etapa | Pipeline | Pruebas |
|-------|----------|---------|
| PR | GitHub Actions | unit, build, dependency scan |
| Entrega | Jenkins | unit → integration → API → E2E → ZAP → Sonar |
| Nightly | cron | ZAP, k6 smoke |

Ver [cicd-and-quality.md](./cicd-and-quality.md).

---

## 12. Criterios de aceptación globales

| Tipo | Criterio |
|------|----------|
| Unit | ≥ 70% coverage servicios; 0 fallos |
| Integration | Todos pasan en CI con Testcontainers |
| API | Contrato OpenAPI validado |
| E2E | Flujos principales verdes; reporte archivado |
| Security | ZAP + dependency check documentados |
| Performance | k6 ejecutado; métricas en qa-evidence |
| Observabilidad | Request de prueba visible en Grafana/Tempo |

---

## 13. Trazabilidad requisitos → tests

| Requisito | Test |
|-----------|------|
| RF-PROD-07 | ProductServiceTest, ProductApiTest |
| RF-STK-04 | StockServiceTest, StockMovementIT |
| RF-SEC-06 | PermissionApiTest |
| RF-RPT-01 | ReportServiceTest, E2E dashboard |
| RNF-TEST-01 | JaCoCo report |

---

## 14. Referencias

- [qa-evidence.md](./qa-evidence.md)
- [security-model.md](./security-model.md)
- [deployment-guide.md](./deployment-guide.md)
- [GUIA_IMPLEMENTACION_PASO_A_PASO.md](./GUIA_IMPLEMENTACION_PASO_A_PASO.md) — Fase 4
