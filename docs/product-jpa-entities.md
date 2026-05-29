# Producto y categoría — dominio JPA (QA-20)

Complementa [`data-model.md`](data-model.md) con el mapeo objeto-relacional.

## Diagrama

```
Category (1) ──< (N) Product
     │                    │
  categories           products
  (sin Envers)      (@Audited → products_aud)
```

## Reglas de negocio

| Regla | Capa |
|-------|------|
| SKU único | DB `uq_products_sku` + `ProductRepository.existsBySkuIgnoreCase` |
| Inactivar producto | `Product.deactivate()` → `status = INACTIVE` (no DELETE) |
| Categoría obligatoria | `@ManyToOne(optional = false)` |
| Auditoría RF-AUD | Hibernate Envers en `Product` |

## Código

| Artefacto | Ruta |
|-----------|------|
| Entidades | `backend/.../product/entity/` |
| Repositorios | `backend/.../product/repository/` |
| README módulo | `backend/.../product/README.md` |

## Trazabilidad

| Requisito | Implementación |
|-----------|----------------|
| RF-01 | `Product`, `ProductRepository` |
| RF-02 | `ProductSpecifications` |
| RF-03 | `Product.deactivate()` / `ProductService.delete` |
| RF-10 | `@Audited` en `Product` |
