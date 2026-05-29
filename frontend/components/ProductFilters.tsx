'use client';

import type { Category, ProductFilters } from '@/lib/types/product';

type Props = {
  filters: ProductFilters;
  categories: Category[];
  onChange: (patch: Partial<ProductFilters>) => void;
  onReset: () => void;
};

export default function ProductFilters({ filters, categories, onChange, onReset }: Props) {
  return (
    <div className="filter-bar">
      <div className="form-field filter-field">
        <label htmlFor="filter-search">Buscar</label>
        <input
          id="filter-search"
          type="search"
          placeholder="Nombre o SKU…"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value, page: 0 })}
        />
      </div>

      <div className="form-field filter-field">
        <label htmlFor="filter-category">Categoría</label>
        <select
          id="filter-category"
          value={filters.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value, page: 0 })}
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field filter-field">
        <label htmlFor="filter-status">Estado</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value, page: 0 })}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      <div className="form-field filter-field">
        <label htmlFor="filter-critical">Stock crítico</label>
        <select
          id="filter-critical"
          value={filters.critical}
          onChange={(e) => onChange({ critical: e.target.value, page: 0 })}
        >
          <option value="">Todos</option>
          <option value="true">Solo críticos</option>
          <option value="false">Solo OK</option>
        </select>
      </div>

      <button type="button" className="btn btn-secondary btn-sm" onClick={onReset}>
        Limpiar
      </button>
    </div>
  );
}
