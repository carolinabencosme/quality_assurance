'use client';

import Icon from '@/components/icons/AppIcons';
import type { Category, ProductFilters } from '@/lib/types/product';

type Props = {
  filters: ProductFilters;
  categories: Category[];
  onChange: (patch: Partial<ProductFilters>) => void;
  onReset: () => void;
};

export default function ProductFilters({ filters, categories, onChange, onReset }: Props) {
  const categoryName = categories.find((category) => String(category.id) === filters.categoryId)?.name;
  const hasFilters = Boolean(filters.search || filters.categoryId || filters.status || filters.critical);

  return (
    <div className="filter-card">
      <div className="filter-bar">
        <div className="form-field filter-field filter-field--search">
          <label htmlFor="filter-search">Buscar</label>
          <div className="input-with-icon">
            <Icon name="search" size={16} />
            <input
              id="filter-search"
              type="search"
              placeholder="Nombre o SKU..."
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value, page: 0 })}
            />
          </div>
        </div>

        <div className="form-field filter-field">
          <label htmlFor="filter-category">Categoria</label>
          <select
            id="filter-category"
            value={filters.categoryId}
            onChange={(e) => onChange({ categoryId: e.target.value, page: 0 })}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
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
          <label htmlFor="filter-critical">Stock critico</label>
          <select
            id="filter-critical"
            value={filters.critical}
            onChange={(e) => onChange({ critical: e.target.value, page: 0 })}
          >
            <option value="">Todos</option>
            <option value="true">Solo criticos</option>
            <option value="false">Solo OK</option>
          </select>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={onReset}>
          <Icon name="filter" size={15} /> Limpiar
        </button>
      </div>

      {hasFilters && (
        <div className="filter-chips" aria-label="Filtros activos">
          {filters.search && (
            <button type="button" className="filter-chip" onClick={() => onChange({ search: '', page: 0 })}>
              Busqueda: {filters.search}
            </button>
          )}
          {filters.categoryId && (
            <button type="button" className="filter-chip" onClick={() => onChange({ categoryId: '', page: 0 })}>
              Categoria: {categoryName ?? filters.categoryId}
            </button>
          )}
          {filters.status && (
            <button type="button" className="filter-chip" onClick={() => onChange({ status: '', page: 0 })}>
              Estado: {filters.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
            </button>
          )}
          {filters.critical && (
            <button type="button" className="filter-chip" onClick={() => onChange({ critical: '', page: 0 })}>
              Stock: {filters.critical === 'true' ? 'Critico' : 'OK'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
