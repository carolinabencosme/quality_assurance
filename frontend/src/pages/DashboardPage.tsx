import { useEffect, useState } from 'react';
import { apiGet } from '../api';
import AppLayout from '../components/AppLayout';

type Dashboard = {
  kpis: {
    totalActiveProducts: number;
    totalInactiveProducts: number;
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
    critical: boolean;
  }>;
  recentMovements: Array<{
    movementId: number;
    productSku: string;
    productName: string;
    type: string;
    delta: number;
    newQty: number;
    createdAt: string;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Dashboard>('/reports/dashboard')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AppLayout title="Dashboard">
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <section className="kpi-grid">
            <div className="kpi-card">
              <span>Productos activos</span>
              <strong>{data.kpis.totalActiveProducts}</strong>
            </div>
            <div className="kpi-card critical">
              <span>Stock crítico</span>
              <strong>{data.kpis.criticalProductsCount}</strong>
            </div>
            <div className="kpi-card">
              <span>Unidades en stock</span>
              <strong>{data.kpis.totalStockUnits}</strong>
            </div>
            <div className="kpi-card">
              <span>Valor inventario</span>
              <strong>${data.kpis.inventoryValue.toFixed(2)}</strong>
            </div>
            <div className="kpi-card">
              <span>Movimientos (7 días)</span>
              <strong>{data.kpis.movementsLast7Days}</strong>
            </div>
            <div className="kpi-card">
              <span>Categorías</span>
              <strong>{data.kpis.categoriesCount}</strong>
            </div>
          </section>

          <section className="card">
            <h2>Productos críticos</h2>
            <ul className="product-list">
              {data.criticalProducts.map((p) => (
                <li key={p.id} className="critical">
                  <strong>{p.name}</strong> ({p.sku}) — {p.quantity} / min {p.minStock}
                </li>
              ))}
            </ul>
            {data.criticalProducts.length === 0 && <p>Sin productos críticos.</p>}
          </section>

          <section className="card">
            <h2>Movimientos recientes</h2>
            <ul className="product-list">
              {data.recentMovements.map((m) => (
                <li key={m.movementId}>
                  {m.type} — {m.productName} ({m.productSku}): {m.delta > 0 ? '+' : ''}
                  {m.delta} → {m.newQty}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </AppLayout>
  );
}
