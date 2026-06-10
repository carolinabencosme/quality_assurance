# Guía de desarrollo — Estándares de ingeniería y calidad de código

Esta guía define **cómo** escribir código en el proyecto para mantener consistencia, testabilidad y los lineamientos más altos de ingeniería de software exigidos en el plan QAS.

---

## 1. Filosofía de desarrollo

1. **Calidad desde el primer commit** — tests y docs van con la feature, no después.
2. **Explicitud sobre magia** — código legible > abstracciones prematuras.
3. **Contratos claros** — API con DTOs; BD con Flyway.
4. **Seguridad por defecto** — endpoint nuevo = permiso + prueba 403.
5. **Observabilidad como requisito** — log con correlationId en operaciones críticas.

---

## 2. Estrategia de ramas y flujo Git

```
main          ← estable, protegida, solo vía PR
develop       ← integración continua del equipo
feature/*     ← nueva funcionalidad (feat/RF-PROD-04-crud-productos)
fix/*         ← corrección de bugs
test/*        ← experimentos de prueba
docs/*        ← solo documentación
```

### Flujo de trabajo por feature

1. Crear issue referenciando RF/RNF (ej. `RF-PROD-04`).
2. Branch desde `develop`: `feature/RF-PROD-04-create-product`.
3. Commits atómicos con [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(product): add create product endpoint`
   - `test(product): add SKU duplicate unit test`
   - `docs(api): document POST /products`
4. Pull Request hacia `develop` con:
   - Descripción y enlace al issue
   - Checklist de PR (abajo)
   - Screenshots si hay UI
   - Evidencia de tests locales
5. Merge tras review + CI verde.
6. Release periódico `develop` → `main` tras validación Jenkins completa.

### Checklist de Pull Request

- [ ] Build local pasa (`mvnw test`, `npm run build`)
- [ ] Tests nuevos o actualizados
- [ ] Sin secretos ni `.env` en el diff
- [ ] Migración Flyway si hay cambio de esquema
- [ ] OpenAPI actualizado si cambia contrato
- [ ] `@PreAuthorize` en endpoints nuevos
- [ ] Documentación actualizada si aplica
- [ ] SonarQube sin issues críticos nuevos

---

## 3. Estándares backend (Java / Spring Boot)

### 3.1 Estructura por módulo

```
product/
├── domain/           # Entidades JPA (opcional capa)
├── repository/
├── service/
├── controller/
├── dto/
│   ├── request/
│   └── response/
└── mapper/
```

### 3.2 Convenciones de nombres

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Clase entidad | Singular PascalCase | `Product` |
| Repository | `{Entity}Repository` | `ProductRepository` |
| Service | `{Domain}Service` | `ProductService` |
| Controller | `{Domain}Controller` | `ProductController` |
| DTO request | `{Action}{Entity}Request` | `CreateProductRequest` |
| DTO response | `{Entity}Response` | `ProductResponse` |
| Excepción dominio | `{Reason}Exception` | `DuplicateSkuException` |

### 3.3 Reglas de capas

```java
// ✅ CORRECTO — Controller delgado
@PostMapping
@PreAuthorize("hasAuthority('product:manage')")
public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(productService.create(request));
}

// ❌ INCORRECTO — lógica de negocio en controller
@PostMapping
public Product create(@RequestBody Product p) {
    if (repo.existsBySku(p.getSku())) throw ...;
    return repo.save(p);
}
```

### 3.4 Inyección y SOLID

- Preferir **constructor injection** (`@RequiredArgsConstructor` Lombok).
- Una razón para cambiar por clase (SRP): `ProductService` no genera reportes PDF.
- Depender de interfaces solo cuando haya múltiples implementaciones reales.

### 3.5 Validación

```java
public record ProductRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 50) String sku,
    @NotNull @PositiveOrZero BigDecimal price,
    @PositiveOrZero Integer quantity
) {}
```

Validaciones de negocio (SKU único) en **service**, no solo en BD.

### 3.6 Mapeo entidad ↔ DTO

- Usar **MapStruct** o mappers explícitos en paquete `mapper/`.
- Nunca serializar entidad JPA directamente (riesgo lazy, acoplamiento).

### 3.7 Logging

```java
log.info("Product created sku={} correlationId={}", sku, MDC.get("correlationId"));
```

- Nivel INFO para eventos de negocio; DEBUG para diagnóstico.
- No loguear tokens, contraseñas ni PII sensible.

### 3.8 Configuración

- Perfiles: `dev`, `staging`, `test`
- Secrets vía variables de entorno: `${DATABASE_PASSWORD}`

---

## 4. Estándares frontend (React / TypeScript)

### 4.1 Estructura

- `pages/` — vistas enlazadas a rutas
- `components/` — UI reutilizable
- `hooks/` — lógica con estado
- `lib/` — API client, utilidades
- `types/` — interfaces TypeScript compartidas

### 4.2 TypeScript estricto

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

### 4.3 Componentes

- Funciones con hooks; evitar class components.
- Props tipadas con `interface`.
- Extraer `DataTable`, `ProductForm`, `PermissionGate` como reusables.

### 4.4 Llamadas API

```typescript
// lib/api.ts — un solo cliente configurado
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) keycloak.login();
    if (error.response?.status === 403) toast.error('Sin permisos');
    return Promise.reject(error);
  }
);
```

### 4.5 Estilo y UI

- Tailwind para layout; shadcn/ui para componentes accesibles.
- Diseño responsive mobile-first.
- Estados: skeleton loading, empty state ilustrado, error con retry.

---

## 5. Definición de hecho (DoD) por funcionalidad

| Dimensión | Criterio |
|-----------|----------|
| Código | Compila, revisado, sin secretos, convenciones cumplidas |
| Pruebas | Unit o integration según capa; casos feliz + error |
| Seguridad | Permiso correcto; 401/403 cubiertos |
| Observabilidad | correlationId en logs del flujo |
| API | OpenAPI actualizado |
| Docs | README o doc en `/docs` si cambia comportamiento |
| Evidencia | Captura en qa-evidence si es demostrable en defensa |

---

## 6. Manejo de deuda técnica

Si se introduce deuda temporal:

1. Crear issue `tech-debt/` describiendo riesgo.
2. Comentario `// TODO(#123):` en código con referencia.
3. Documentar en PR por qué se acepta.
4. No acumular deuda en seguridad o migraciones.

---

## 7. Herramientas de calidad local

### Backend

```bash
cd backend
./mvnw test                    # unit tests
./mvnw verify -P integration-tests
./mvnw spotless:apply          # si se configura formateo
```

### Frontend

```bash
cd frontend
npm run lint
npm run typecheck
npm run test                   # Vitest si está configurado
```

### Pre-commit recomendado (opcional)

- Formateo Java (Google Java Format / Spotless)
- ESLint + Prettier en frontend
- No commit si `mvnw -q test` falla en archivos tocados

---

## 8. Code review — guía para revisores

| Pregunta | Acción si falla |
|----------|-----------------|
| ¿El endpoint tiene el permiso mínimo? | Solicitar `@PreAuthorize` |
| ¿Hay N+1 queries? | Sugerir `@EntityGraph` o fetch join |
| ¿Transacción en el lugar correcto? | Mover `@Transactional` al service |
| ¿Test cubre regla de negocio nueva? | Solicitar test antes de merge |
| ¿Migración reversible o documentada? | Pedir estrategia rollback |
| ¿UI accesible (labels, roles)? | Mejorar a11y |

---

## 9. Anti-patrones prohibidos

| Anti-patrón | Por qué |
|-------------|---------|
| God class `InventoryService` con todo | Rompe modularidad |
| Entidades JPA en responses JSON | Acoplamiento y fugas lazy |
| `System.out.println` | Usar SLF4J estructurado |
| Credenciales en `application.yml` commiteado | Usar env vars |
| Skip tests en CI (`-DskipTests`) en main | Solo en build intermedio Jenkins |
| Merge directo a main | Rompe trazabilidad |

---

## 10. Referencias

- [architecture.md](./architecture.md)
- [testing-guide.md](./testing-guide.md)
- [cicd-and-quality.md](./cicd-and-quality.md)
- [GUIA_IMPLEMENTACION_PASO_A_PASO.md](./GUIA_IMPLEMENTACION_PASO_A_PASO.md)
