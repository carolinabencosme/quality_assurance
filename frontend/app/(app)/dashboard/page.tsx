'use client';

import { useEffect, useState } from 'react';
import AnimatedNumber from '@/components/AnimatedNumber';
import Icon from '@/components/icons/AppIcons';
import Reveal from '@/components/Reveal';
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
  topSoldProducts: Array<{
    productId: number;
    sku: string;
    name: string;
    totalOutQty: number;
    movementCount: number;
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

type SystemMetrics = {
  jvm: {
    heapUsedMb: number;
    heapMaxMb: number;
    threads: number;
  };
  process: {
    cpuUsage: number;
    uptimeSeconds: number;
  };
  http: {
    requestsLast5m: number;
    errorRate5m: number;
    p95Ms: number;
  };
  datasource: {
    active: number;
    idle: number;
    max: number;
    pending: number;
  };
};

const numberFormat = new Intl.NumberFormat('es-DO');
const currencyFormat = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

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

function formatInventoryValue(value: number) {
  if (Math.abs(value) >= 1000) {
    return `US$${numberFormat.format(Math.round(value / 1000))}K`;
  }
  return currencyFormat.format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatMs(value: number) {
  return `${Math.round(value)} ms`;
}

function DashboardSkeleton() {
  return (
    <>
      <section className="kpi-grid" aria-label="Cargando indicadores">
        {Array.from({ length: 6 }).map((_, index) => (
          <article key={index} className="kpi kpi--skeleton">
            <span className="skeleton-bar" />
            <span className="skeleton-bar skeleton-bar--wide" />
          </article>
        ))}
      </section>
      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <span className="skeleton-bar skeleton-bar--title" />
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="list-row">
              <span className="skeleton-bar skeleton-bar--wide" />
              <span className="skeleton-bar" />
            </div>
          ))}
        </section>
        <section className="panel">
          <div className="panel-head">
            <span className="skeleton-bar skeleton-bar--title" />
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="timeline-item timeline-item--skeleton">
              <span className="skeleton-bar skeleton-bar--wide" />
            </div>
          ))}
        </section>
      </div>
    </>
  );
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

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<Dashboard>('/reports/dashboard'),
      apiGet<SystemMetrics>('/observability/system-metrics'),
    ])
      .then(([dashboard, metrics]) => {
        setData(dashboard);
        setSystemMetrics(metrics);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Reveal>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-sub">Resumen operativo del inventario en tiempo real.</p>
          </div>
          <span className="page-pill">
            <Icon name="activity" size={15} /> En vivo
          </span>
        </div>
      </Reveal>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading && <DashboardSkeleton />}

      {data && (
        <>
          <section className="kpi-grid" aria-label="Indicadores principales">
            <Reveal delay={0}>
              <article className="kpi kpi--animate">
                <span className="kpi-label">Productos activos</span>
                <strong className="kpi-value">
                  <AnimatedNumber value={data.kpis.totalActiveProducts} format={(n) => numberFormat.format(n)} />
                </strong>
              </article>
            </Reveal>
            <Reveal delay={60}>
              <article className="kpi kpi--warn kpi--animate">
                <span className="kpi-label">Stock critico</span>
                <strong className="kpi-value">
                  <AnimatedNumber value={data.kpis.criticalProductsCount} format={(n) => numberFormat.format(n)} />
                </strong>
              </article>
            </Reveal>
            <Reveal delay={120}>
              <article className="kpi kpi--animate">
                <span className="kpi-label">Unidades</span>
                <strong className="kpi-value">
                  <AnimatedNumber value={data.kpis.totalStockUnits} format={(n) => numberFormat.format(n)} />
                </strong>
              </article>
            </Reveal>
            <Reveal delay={180}>
              <article className="kpi kpi--animate">
                <span className="kpi-label">Valor inventario</span>
                <strong className="kpi-value">
                  <AnimatedNumber
                    value={Math.round(data.kpis.inventoryValue)}
                    format={(n) => formatInventoryValue(n)}
                  />
                </strong>
              </article>
            </Reveal>
            <Reveal delay={240}>
              <article className="kpi kpi--animate">
                <span className="kpi-label">Mov. 7 dias</span>
                <strong className="kpi-value">
                  <AnimatedNumber value={data.kpis.movementsLast7Days} format={(n) => numberFormat.format(n)} />
                </strong>
              </article>
            </Reveal>
            <Reveal delay={300}>
              <article className="kpi kpi--animate">
                <span className="kpi-label">Categorias</span>
                <strong className="kpi-value">
                  <AnimatedNumber value={data.kpis.categoriesCount} format={(n) => numberFormat.format(n)} />
                </strong>
              </article>
            </Reveal>
          </section>

          <div className="grid-2">
            <Reveal delay={100}>
              <section className="panel panel--hover">
                <div className="panel-head">
                  <div>
                    <h2>Productos criticos</h2>
                    <p>Items que necesitan reposicion o ajuste.</p>
                  </div>
                  <span>{data.criticalProducts.length}</span>
                </div>
                {data.criticalProducts.length === 0 ? (
                  <EmptyPanel title="Sin alertas" copy="Todos los productos estan por encima del minimo." />
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

            <Reveal delay={180}>
              <section className="panel panel--hover">
                <div className="panel-head">
                  <div>
                    <h2>Productos mas vendidos</h2>
                    <p>Proxy por salidas OUT acumuladas en los ultimos 30 dias.</p>
                  </div>
                  <span>{data.topSoldProducts.length}</span>
                </div>
                {data.topSoldProducts.length === 0 ? (
                  <EmptyPanel
                    title="Sin salidas recientes"
                    copy="No hay salidas registradas en los ultimos 30 dias."
                  />
                ) : (
                  <div
                    className="data-table-wrap"
                    role="region"
                    aria-label="Productos mas vendidos"
                    tabIndex={0}
                  >
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Producto</th>
                          <th>Unidades</th>
                          <th>Movimientos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topSoldProducts.map((product) => (
                          <tr key={product.productId}>
                            <td>{product.sku}</td>
                            <td><strong>{product.name}</strong></td>
                            <td>{numberFormat.format(product.totalOutQty)}</td>
                            <td>{numberFormat.format(product.movementCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </Reveal>
          </div>

          <Reveal delay={260}>
            <section className="panel panel--hover">
              <div className="panel-head">
                <div>
                  <h2>Movimientos recientes</h2>
                  <p>Ultimas entradas, salidas y ajustes.</p>
                </div>
              </div>
              {data.recentMovements.length === 0 ? (
                <EmptyPanel title="Sin movimientos" copy="Cuando se registre stock, aparecera aqui." />
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

          {systemMetrics && (
            <Reveal delay={320}>
              <section className="panel panel--hover">
                <div className="panel-head">
                  <div>
                    <h2>Metricas del sistema</h2>
                    <p>CPU, JVM, HTTP y pool de base de datos desde Micrometer.</p>
                  </div>
                  <a className="link-action" href="http://localhost:3030" target="_blank" rel="noreferrer">
                    Ver Grafana
                  </a>
                </div>
                <div className="kpi-grid" aria-label="Metricas tecnicas">
                  <article className="kpi">
                    <span className="kpi-label">CPU</span>
                    <strong className="kpi-value">
                      <AnimatedNumber value={systemMetrics.process.cpuUsage} format={formatPercent} />
                    </strong>
                  </article>
                  <article className="kpi">
                    <span className="kpi-label">Heap JVM</span>
                    <strong className="kpi-value">
                      <AnimatedNumber
                        value={systemMetrics.jvm.heapUsedMb}
                        format={(n) => `${Math.round(n)} / ${Math.round(systemMetrics.jvm.heapMaxMb)} MB`}
                      />
                    </strong>
                  </article>
                  <article className="kpi">
                    <span className="kpi-label">Threads</span>
                    <strong className="kpi-value">
                      <AnimatedNumber value={systemMetrics.jvm.threads} format={(n) => numberFormat.format(n)} />
                    </strong>
                  </article>
                  <article className="kpi">
                    <span className="kpi-label">Pool DB</span>
                    <strong className="kpi-value">
                      {systemMetrics.datasource.active}/{systemMetrics.datasource.max}
                    </strong>
                    <div className="row-meta">
                      Idle {systemMetrics.datasource.idle} / Pending {systemMetrics.datasource.pending}
                    </div>
                  </article>
                  <article className="kpi">
                    <span className="kpi-label">Requests</span>
                    <strong className="kpi-value">
                      <AnimatedNumber
                        value={systemMetrics.http.requestsLast5m}
                        format={(n) => numberFormat.format(n)}
                      />
                    </strong>
                  </article>
                  <article className="kpi">
                    <span className="kpi-label">p95 / errores</span>
                    <strong className="kpi-value">{formatMs(systemMetrics.http.p95Ms)}</strong>
                    <div className="row-meta">Error rate {formatPercent(systemMetrics.http.errorRate5m)}</div>
                  </article>
                </div>
              </section>
            </Reveal>
          )}
        </>
      )}
    </>
  );
}
