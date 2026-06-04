'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/DataTable';
import ProductFilters from '@/components/ProductFilters';
import { apiGet } from '@/lib/api';
import { canManageProducts } from '@/lib/permissions';
import type { Page } from '@/lib/types/api';
import type { Category, Product, ProductFilters as Filters } from '@/lib/types/product';

const defaultFilters: Filters = {
  search: '',
  categoryId: '',
  status: '',
  critical: '',
  page: 0,
  size: 10,
};

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('size', String(filters.size));
  params.set('sort', 'name,asc');
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.status) params.set('status', filters.status);
  if (filters.critical) params.set('critical', filters.critical);
  return `/products?${params.toString()}`;
}

export default function ProductsPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canManage = canManageProducts();

  const loadCategories = useCallback(async () => {
    try {
      const data = await apiGet<Category[]>('/categories');
      setCategories(data);
    } catch {
      /* filtros funcionan sin categorías */
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await apiGet<Page<Product>>(buildQuery(filters));
      setProducts(page.content);
      setTotalElements(page.totalElements);
      setTotalPages(page.totalPages);
    } catch (e) {
      setProducts([]);
      setError(e instanceof Error ? e.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Producto',
        render: (p: Product) => <strong>{p.name}</strong>,
      },
      { key: 'sku', header: 'SKU', render: (p: Product) => p.sku },
      { key: 'category', header: 'Categoría', render: (p: Product) => p.categoryName },
      { key: 'quantity', header: 'Stock', render: (p: Product) => p.quantity },
      { key: 'minStock', header: 'Mín.', render: (p: Product) => p.minStock },
      {
        key: 'stockStatus',
        header: 'Alerta',
        render: (p: Product) =>
          p.critical ? <span className="badge">Crítico</span> : <span className="badge badge-ok">OK</span>,
      },
      {
        key: 'status',
        header: 'Estado',
        render: (p: Product) => (p.status === 'ACTIVE' ? 'Activo' : 'Inactivo'),
      },
      ...(canManage
        ? [
            {
              key: 'actions',
              header: '',
              render: (p: Product) => (
                <Link href={`/products/${p.id}/edit`} className="link-action">
                  Editar
                </Link>
              ),
            },
          ]
        : []),
    ],
    [canManage],
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-sub">Catálogo — {totalElements} registros</p>
        </div>
        {canManage && (
          <Link href="/products/new" className="btn btn-primary btn-inline">
            Nuevo producto
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <div className="panel-head">
          <h2>Inventario</h2>
          {!loading && <span>Página {filters.page + 1} de {Math.max(totalPages, 1)}</span>}
        </div>

        <ProductFilters
          filters={filters}
          categories={categories}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onReset={() => setFilters(defaultFilters)}
        />

        <DataTable
          columns={columns}
          rows={products}
          rowKey={(p) => p.id}
          loading={loading}
          emptyMessage="No hay productos que coincidan con los filtros."
          footer={
            !loading && totalPages > 1 ? (
              <div className="table-pagination">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={filters.page <= 0}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
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
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
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
