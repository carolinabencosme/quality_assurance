# Flyway — dominio inventario (QA-17)

Migraciones versionadas **V1–V7** (sin V8). Orden fijo; no renombrar versiones ya aplicadas en entornos compartidos.

| Versión | Archivo | Contenido |
|---------|---------|-----------|
| V1 | `V1__create_categories_table.sql` | Tabla `categories` |
| V2 | `V2__create_products_table.sql` | Tabla `products` + FK categoría |
| V3 | `V3__create_stock_movements_table.sql` | Tabla `stock_movements` |
| V4 | `V4__create_users_profile_table.sql` | Tabla `users_profile` |
| V5 | `V5__create_envers_audit_tables.sql` | `revinfo`, `products_aud`, secuencia Envers |
| V6 | `V6__seed_initial_catalog.sql` | Seed categorías, productos, movimientos |
| V7 | `V7__add_indexes_and_constraints.sql` | Índices y búsqueda stock crítico |

Modelo lógico: [`docs/data-model.md`](../../../../../docs/data-model.md) (desde la raíz del repo).

Validación local:

```powershell
.\scripts\validate-flyway-migrations.ps1
```
