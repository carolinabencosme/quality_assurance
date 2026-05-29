# Entidades JPA — Product y Category (QA-20)

Ticket: **QA-20** — SKU único, relación categoría, status/inactivación, Envers (RF-AUD).

## Entidades

| Entidad | Tabla | Envers | Notas |
|---------|-------|--------|-------|
| `Product` | `products` | **Sí** (`@Audited`) | SKU único, soft delete vía `INACTIVE` |
| `Category` | `categories` | No | Catálogo de referencia; nombre único |

### Product — campos clave

- `sku` — `@Column(unique = true)`, validación case-insensitive en repositorio
- `category` — `@ManyToOne` LAZY, `category_id` NOT NULL
- `status` — `ACTIVE` \| `INACTIVE`; `deactivate()` para inactivación lógica
- `quantity`, `minStock`, `isCritical()` — alertas de stock

### Category

- `name` — único (JPA + Flyway `uq_categories_name`)
- `status` — `ACTIVE` \| `INACTIVE`

## Repositorios

| Repositorio | Métodos destacados |
|-------------|-------------------|
| `ProductRepository` | `findBySkuIgnoreCase`, `existsBySkuIgnoreCase`, `JpaSpecificationExecutor`, `@EntityGraph(category)` en `findById` |
| `CategoryRepository` | `findByNameIgnoreCase`, `findAllByStatusOrderByNameAsc` |

## RF-AUD (Envers)

- `Product` auditado → tabla `products_aud` (Flyway V5)
- Cambios consultables vía módulo `audit` (`/api/v1/audit`)
- Categoría **no** auditada (`NOT_AUDITED` en relación)

## Pruebas

```powershell
cd backend
.\mvnw.cmd test "-Dtest=ProductEntityTest,ProductRepositoryTest,CategoryRepositoryTest"
```

Ver [`docs/data-model.md`](../../docs/data-model.md) para DDL Flyway V1–V2.
