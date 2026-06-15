'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Dashboard = {
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

export default function ReportsPage() {
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
      <h1 className="page-title">Reportes</h1>
      <p className="page-sub">Alertas de stock y actividad reciente del inventario</p>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && (
        <div className="loading">
          <span className="spinner" /> Cargando reportes...
        </div>
      )}

      {data && (
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
      )}
    </>
  );
}
