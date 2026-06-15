'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Dashboard = {
  kpis: {
    totalActiveProducts: number;
    criticalProductsCount: number;
    totalStockUnits: number;
    inventoryValue: number;
    movementsLast7Days: number;
    categoriesCount: number;
  };
  criticalProducts: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    minStock: number;
  }>;
  recentMovements: Array<{
    movementId: number;
    productSku: string;
    productName: string;
    type: string;
    delta: number;
    newQty: number;
  }>;
};

const numberFormat = new Intl.NumberFormat('es-DO');
const currencyFormat = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Dashboard>('/reports/dashboard')
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Resumen operativo del inventario</p>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && (
        <div className="loading">
          <span className="spinner" /> Cargando m&eacute;tricas...
        </div>
      )}

      {data && (
        <>
          <section className="kpi-grid" aria-label="Indicadores principales">
            <article className="kpi">
              <span className="kpi-label">Productos activos</span>
              <strong className="kpi-value">{numberFormat.format(data.kpis.totalActiveProducts)}</strong>
            </article>
            <article className="kpi kpi--warn">
              <span className="kpi-label">Stock cr&iacute;tico</span>
              <strong className="kpi-value">{numberFormat.format(data.kpis.criticalProductsCount)}</strong>
            </article>
            <article className="kpi">
              <span className="kpi-label">Unidades</span>
              <strong className="kpi-value">{numberFormat.format(data.kpis.totalStockUnits)}</strong>
            </article>
            <article className="kpi">
              <span className="kpi-label">Valor inventario</span>
              <strong className="kpi-value">{currencyFormat.format(data.kpis.inventoryValue)}</strong>
            </article>
            <article className="kpi">
              <span className="kpi-label">Mov. 7 d&iacute;as</span>
              <strong className="kpi-value">{numberFormat.format(data.kpis.movementsLast7Days)}</strong>
            </article>
            <article className="kpi">
              <span className="kpi-label">Categor&iacute;as</span>
              <strong className="kpi-value">{numberFormat.format(data.kpis.categoriesCount)}</strong>
            </article>
          </section>

          <div className="grid-2">
            <section className="panel">
              <div className="panel-head">
                <h2>Productos cr&iacute;ticos</h2>
                <span>{data.criticalProducts.length}</span>
              </div>
              {data.criticalProducts.length === 0 ? (
                <p className="empty-copy">Sin alertas.</p>
              ) : (
                data.criticalProducts.map((p) => (
                  <div key={p.id} className="list-row list-row--critical">
                    <div>
                      <strong>{p.name}</strong> <span className="badge">Cr&iacute;tico</span>
                      <div className="row-meta">{p.sku}</div>
                    </div>
                    <strong className="list-row-value">
                      {p.quantity} / {p.minStock}
                    </strong>
                  </div>
                ))
              )}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Movimientos recientes</h2>
              </div>
              {data.recentMovements.length === 0 ? (
                <p className="empty-copy">Sin movimientos.</p>
              ) : (
                data.recentMovements.map((m) => (
                  <div key={m.movementId} className="list-row">
                    <div>
                      <strong>{m.productName}</strong>
                      <div className="row-meta">
                        {m.type} - {m.productSku}
                      </div>
                    </div>
                    <span className={m.delta >= 0 ? 'delta-pos' : 'delta-neg'}>
                      {m.delta > 0 ? '+' : ''}
                      {m.delta} -&gt; {m.newQty}
                    </span>
                  </div>
                ))
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
