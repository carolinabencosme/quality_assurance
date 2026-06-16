'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/DataTable';
import Icon from '@/components/icons/AppIcons';
import StockMovementForm, {
  formValuesToPayload,
  type StockMovementFormValues,
} from '@/components/StockMovementForm';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import { canManageStock } from '@/lib/permissions';
import type { Page } from '@/lib/types/api';
import type { MovementFilters, StockLevel, StockMovement, StockMovementType } from '@/lib/types/stock';

const defaultFilters: MovementFilters = {
  productId: '',
  type: '',
  page: 0,
  size: 10,
};

function buildMovementsQuery(filters: MovementFilters): string {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('size', String(filters.size));
  params.set('sort', 'createdAt,desc');
  if (filters.productId) params.set('productId', filters.productId);
  if (filters.type) params.set('type', filters.type);
  return `/stock/movements?${params.toString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-DO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const typeBadgeClass: Record<StockMovementType, string> = {
  IN: 'badge badge-ok',
  OUT: 'badge badge-out',
  ADJUSTMENT: 'badge badge-adj',
};

const typeLabels: Record<StockMovementType, string> = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUSTMENT: 'Ajuste',
};

export default function StockMovementsPage() {
  const [filters, setFilters] = useState<MovementFilters>(defaultFilters);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<StockLevel[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    setCanManage(canManageStock());
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const page = await apiGet<Page<StockLevel>>('/stock?size=100&sort=name,asc');
      setProducts(page.content);
    } catch {
      /* Filtros y formulario siguen disponibles si falla la lista auxiliar. */
    }
  }, []);

  const loadMovements = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const page = await apiGet<Page<StockMovement>>(buildMovementsQuery(filters));
      setMovements(page.content);
      setTotalElements(page.totalElements);
      setTotalPages(page.totalPages);
    } catch (e) {
      setMovements([]);
      setListError(e instanceof Error ? e.message : 'Error al cargar movimientos');
    } finally {
      setListLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const handleRegister = async (values: StockMovementFormValues) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      await apiPost<StockMovement>('/stock/movements', formValuesToPayload(values));
      await Promise.all([loadMovements(), loadProducts()]);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'No se pudo registrar el movimiento');
      throw e;
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Fecha',
        render: (m: StockMovement) => formatDate(m.createdAt),
      },
      {
        key: 'product',
        header: 'Producto',
        render: (m: StockMovement) => (
          <>
            <strong>{m.productName}</strong>
            <div className="row-meta">{m.productSku}</div>
          </>
        ),
      },
      {
        key: 'type',
        header: 'Tipo',
        render: (m: StockMovement) => (
          <span className={typeBadgeClass[m.type]}>{typeLabels[m.type]}</span>
        ),
      },
      {
        key: 'delta',
        header: 'Cambio',
        render: (m: StockMovement) => (
          <span className={m.delta >= 0 ? 'delta-pos delta-with-icon' : 'delta-neg delta-with-icon'}>
            <Icon name={m.delta >= 0 ? 'arrowUp' : 'arrowDown'} size={14} />
            {m.delta >= 0 ? '+' : ''}
            {m.delta}
          </span>
        ),
      },
      {
        key: 'qty',
        header: 'Ant. -> Nuevo',
        render: (m: StockMovement) => `${m.previousQty} -> ${m.newQty}`,
      },
      {
        key: 'obs',
        header: 'Observaciones',
        render: (m: StockMovement) => m.observations ?? '-',
      },
    ],
    [],
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Movimientos de stock</h1>
          <p className="page-sub">Historial y registro RF-STK para entradas, salidas y ajustes.</p>
        </div>
        <span className="page-pill">
          <Icon name="stock" size={15} /> {totalElements.toLocaleString('es-DO')} mov.
        </span>
      </div>

      <div className={canManage ? 'stock-layout' : 'stock-layout stock-layout--single'}>
        {canManage && (
          <section className="panel panel--sticky">
            <div className="panel-head">
              <div>
                <h2>Registrar movimiento</h2>
                <p>Actualiza el nivel de inventario con trazabilidad.</p>
              </div>
              <span>stock:manage</span>
            </div>
            <StockMovementForm
              products={products}
              onSubmit={handleRegister}
              error={formError}
              submitting={formSubmitting}
            />
          </section>
        )}

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Historial</h2>
              <p>Ordenado por movimientos mas recientes.</p>
            </div>
            {!listLoading && (
              <span>
                Pag. {filters.page + 1}/{Math.max(totalPages, 1)}
              </span>
            )}
          </div>

          <div className="filter-card">
            <div className="filter-bar">
              <div className="form-field filter-field">
                <label htmlFor="filter-product">Producto</label>
                <select
                  id="filter-product"
                  value={filters.productId}
                  onChange={(e) => setFilters((f) => ({ ...f, productId: e.target.value, page: 0 }))}
                >
                  <option value="">Todos</option>
                  {products.map((product) => (
                    <option key={product.productId} value={String(product.productId)}>
                      {product.sku}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field filter-field">
                <label htmlFor="filter-type">Tipo</label>
                <select
                  id="filter-type"
                  value={filters.type}
                  onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 0 }))}
                >
                  <option value="">Todos</option>
                  <option value="IN">Entrada</option>
                  <option value="OUT">Salida</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                </select>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setFilters(defaultFilters)}
              >
                <Icon name="filter" size={15} /> Limpiar
              </button>
            </div>
          </div>

          {listError && <div className="alert alert-error">{listError}</div>}

          <DataTable
            columns={columns}
            rows={movements}
            rowKey={(m) => m.id}
            loading={listLoading}
            emptyTitle="Sin movimientos"
            emptyMessage="No hay movimientos registrados."
            footer={
              !listLoading && totalPages > 1 ? (
                <div className="table-pagination">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={filters.page <= 0}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  >
                    <Icon name="chevronLeft" size={16} /> Anterior
                  </button>
                  <span>
                    {filters.page + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={filters.page >= totalPages - 1}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  >
                    Siguiente <Icon name="chevronRight" size={16} />
                  </button>
                </div>
              ) : undefined
            }
          />
        </section>
      </div>
    </>
  );
}
