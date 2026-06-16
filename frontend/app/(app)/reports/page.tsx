'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/icons/AppIcons';
import Reveal from '@/components/Reveal';
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

function movementClass(type: string) {
  if (type === 'IN') return 'badge badge-ok';
  if (type === 'OUT') return 'badge badge-out';
  return 'badge badge-adj';
}

function movementLabel(type: string) {
  if (type === 'IN') return 'Entrada';
  if (type === 'OUT') return 'Salida';
  return 'Ajuste';
}

function EmptyPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="empty-state empty-state--compact" role="status">
      <span className="empty-state-icon" aria-hidden>
        <Icon name="empty" size={24} />
      </span>
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-sub">Alertas de stock y actividad reciente del inventario.</p>
        </div>
        <span className="page-pill">
          <Icon name="reports" size={15} /> Analisis operativo
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && (
        <div className="loading loading-card">
          <span className="spinner" aria-hidden /> Cargando reportes...
        </div>
      )}

      {data && (
        <div className="grid-2">
          <Reveal>
            <section className="panel panel--hover">
              <div className="panel-head">
                <div>
                  <h2>Productos criticos</h2>
                  <p>Riesgo de quiebre por debajo del stock minimo.</p>
                </div>
                <span>{data.criticalProducts.length}</span>
              </div>
              {data.criticalProducts.length === 0 ? (
                <EmptyPanel title="Sin alertas" copy="El inventario se mantiene dentro del rango definido." />
              ) : (
                data.criticalProducts.map((product) => (
                  <div key={product.id} className="list-row list-row--critical">
                    <div>
                      <strong>{product.name}</strong> <span className="badge">Critico</span>
                      <div className="row-meta">{product.sku}</div>
                    </div>
                    <strong className="list-row-value">
                      {product.quantity} / {product.minStock}
                    </strong>
                  </div>
                ))
              )}
            </section>
          </Reveal>

          <Reveal delay={100}>
            <section className="panel panel--hover">
              <div className="panel-head">
                <div>
                  <h2>Movimientos recientes</h2>
                  <p>Lectura rapida de la actividad del almacen.</p>
                </div>
              </div>
              {data.recentMovements.length === 0 ? (
                <EmptyPanel title="Sin movimientos" copy="Los registros apareceran cuando se actualice stock." />
              ) : (
                <div className="timeline-list">
                  {data.recentMovements.map((movement) => (
                    <div key={movement.movementId} className="timeline-item">
                      <span className="timeline-dot" aria-hidden />
                      <div>
                        <strong>{movement.productName}</strong>
                        <div className="row-meta">
                          <span className={movementClass(movement.type)}>{movementLabel(movement.type)}</span>{' '}
                          {movement.productSku}
                        </div>
                      </div>
                      <span className={movement.delta >= 0 ? 'delta-pos delta-with-icon' : 'delta-neg delta-with-icon'}>
                        <Icon name={movement.delta >= 0 ? 'arrowUp' : 'arrowDown'} size={14} />
                        {movement.delta > 0 ? '+' : ''}
                        {movement.delta} a {movement.newQty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </Reveal>
        </div>
      )}
    </>
  );
}
