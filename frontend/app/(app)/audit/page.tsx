'use client';

import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/DataTable';
import Icon from '@/components/icons/AppIcons';
import { apiGet } from '@/lib/api';

type AuditEvent = {
  revisionId: number;
  entityName: string;
  entityId: number;
  action: string;
  modifiedBy: string;
  modifiedAt: string;
  summary: string;
};

type AuditPageData = {
  content: AuditEvent[];
  totalElements: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function actionClass(action: string) {
  const normalized = action.toUpperCase();
  if (normalized.includes('DEL')) return 'badge badge-out';
  if (normalized.includes('ADD') || normalized.includes('CREATE')) return 'badge badge-ok';
  return 'badge badge-adj';
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<AuditPageData>('/audit?size=20')
      .then((page) => {
        setEvents(page.content);
        setTotal(page.totalElements);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo(
    () => [
      { key: 'revisionId', header: 'Rev', render: (e: AuditEvent) => `#${e.revisionId}` },
      {
        key: 'entity',
        header: 'Entidad',
        render: (e: AuditEvent) => (
          <>
            <strong>{e.entityName}</strong>
            <div className="row-meta">#{e.entityId}</div>
          </>
        ),
      },
      {
        key: 'action',
        header: 'Accion',
        render: (e: AuditEvent) => <span className={actionClass(e.action)}>{e.action}</span>,
      },
      { key: 'modifiedBy', header: 'Usuario', render: (e: AuditEvent) => e.modifiedBy || '-' },
      {
        key: 'modifiedAt',
        header: 'Fecha',
        render: (e: AuditEvent) => formatDate(e.modifiedAt),
      },
      { key: 'summary', header: 'Resumen', render: (e: AuditEvent) => e.summary },
    ],
    [],
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditoria</h1>
          <p className="page-sub">
            Envers - {total.toLocaleString('es-DO')} eventos con trazabilidad de cambios.
          </p>
        </div>
        <span className="page-pill">
          <Icon name="shield" size={15} /> audit:view
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Revisiones</h2>
            <p>Lectura de cumplimiento para cambios de catalogo e inventario.</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={events}
          rowKey={(e) => `${e.revisionId}-${e.entityId}`}
          loading={loading}
          skeletonRows={8}
          emptyTitle="Sin eventos"
          emptyMessage="No hay eventos de auditoria registrados."
        />
      </section>
    </>
  );
}
