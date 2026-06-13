'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/DataTable';
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
  const canManage = canManageStock();

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
          <span className={m.delta >= 0 ? 'delta-pos' : 'delta-neg'}>
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
      <h1 className="page-title">Movimientos de stock</h1>
      <p className="page-sub">Historial y registro - RF-STK (IN / OUT / ADJUSTMENT)</p>

      {canManage && (
        <section className="panel">
          <div className="panel-head">
            <h2>Registrar movimiento</h2>
            <span>Permiso stock:manage</span>
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
          <h2>Historial</h2>
          {!listLoading && (
            <span>
              {totalElements.toLocaleString('es-DO')} movimientos - p&aacute;g. {filters.page + 1}/
              {Math.max(totalPages, 1)}
            </span>
          )}
        </div>

        <div className="filter-bar">
          <div className="form-field filter-field">
            <label htmlFor="filter-product">Producto</label>
            <select
              id="filter-product"
              value={filters.productId}
              onChange={(e) => setFilters((f) => ({ ...f, productId: e.target.value, page: 0 }))}
            >
              <option value="">Todos</option>
              {products.map((p) => (
                <option key={p.productId} value={String(p.productId)}>
                  {p.sku}
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
            Limpiar
          </button>
        </div>

        {listError && <div className="alert alert-error">{listError}</div>}

        <DataTable
          columns={columns}
          rows={movements}
          rowKey={(m) => m.id}
          loading={listLoading}
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
                  Anterior
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
                  Siguiente
                </button>
              </div>
            ) : undefined
          }
        />
      </section>
    </>
  );
}
