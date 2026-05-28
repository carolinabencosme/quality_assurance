'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  critical: boolean;
  categoryName: string;
};

type PageResponse = {
  content: Product[];
  totalElements: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<PageResponse>('/products?size=20&sort=name,asc')
      .then((page) => {
        setProducts(page.content);
        setTotal(page.totalElements);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Productos</h1>
      <p className="page-sub">Catálogo — {total} registros</p>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && (
        <div className="loading">
          <span className="spinner" /> Cargando…
        </div>
      )}

      {!loading && (
        <section className="panel">
          <div className="panel-head">
            <h2>Inventario</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Mín.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>{p.sku}</td>
                    <td>{p.categoryName}</td>
                    <td>{p.quantity}</td>
                    <td>{p.minStock}</td>
                    <td>
                      {p.critical ? (
                        <span className="badge">Crítico</span>
                      ) : (
                        <span className="badge badge-ok">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
