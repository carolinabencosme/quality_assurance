'use client';

import { useEffect, useState } from 'react';
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

  return (
    <>
      <h1 className="page-title">Auditoría</h1>
      <p className="page-sub">Envers — {total} eventos (permiso audit:view)</p>

      {error && <div className="alert alert-info">{error}</div>}
      {loading && (
        <div className="loading">
          <span className="spinner" /> Cargando historial…
        </div>
      )}

      {!loading && (
        <section className="panel">
          <div className="panel-head">
            <h2>Revisiones</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rev</th>
                  <th>Entidad</th>
                  <th>Acción</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                  <th>Resumen</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={`${e.revisionId}-${e.entityId}`}>
                    <td>#{e.revisionId}</td>
                    <td>
                      {e.entityName} #{e.entityId}
                    </td>
                    <td>{e.action}</td>
                    <td>{e.modifiedBy || '—'}</td>
                    <td>{new Date(e.modifiedAt).toLocaleString('es')}</td>
                    <td>{e.summary}</td>
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
