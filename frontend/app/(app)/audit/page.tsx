'use client';

import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/DataTable';
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
        render: (e: AuditEvent) => `${e.entityName} #${e.entityId}`,
      },
      {
        key: 'action',
        header: 'Accion',
        render: (e: AuditEvent) => <span className="badge badge-adj">{e.action}</span>,
      },
      { key: 'modifiedBy', header: 'Usuario', render: (e: AuditEvent) => e.modifiedBy || '-' },
      {
        key: 'modifiedAt',
        header: 'Fecha',
        render: (e: AuditEvent) => new Date(e.modifiedAt).toLocaleString('es-DO'),
      },
      { key: 'summary', header: 'Resumen', render: (e: AuditEvent) => e.summary },
    ],
    [],
  );

  return (
    <>
      <h1 className="page-title">Auditor&iacute;a</h1>
      <p className="page-sub">
        Envers - {total.toLocaleString('es-DO')} eventos (permiso audit:view)
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <div className="panel-head">
          <h2>Revisiones</h2>
        </div>
        <DataTable
          columns={columns}
          rows={events}
          rowKey={(e) => `${e.revisionId}-${e.entityId}`}
          loading={loading}
          skeletonRows={8}
          emptyMessage="No hay eventos de auditoria registrados."
        />
      </section>
    </>
  );
}
