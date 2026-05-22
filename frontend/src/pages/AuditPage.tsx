import { useEffect, useState } from 'react';
import { apiGet } from '../api';
import AppLayout from '../components/AppLayout';

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

  useEffect(() => {
    apiGet<AuditPageData>('/audit?size=20')
      .then((page) => {
        setEvents(page.content);
        setTotal(page.totalElements);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AppLayout title="Auditoría (Envers)">
      {error && <p className="error">{error}</p>}
      <section className="card">
        <h2>Eventos ({total})</h2>
        <table className="audit-table">
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
                <td>{e.revisionId}</td>
                <td>
                  {e.entityName} #{e.entityId}
                </td>
                <td>{e.action}</td>
                <td>{e.modifiedBy}</td>
                <td>{new Date(e.modifiedAt).toLocaleString()}</td>
                <td>{e.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && !error && <p>Sin revisiones registradas aún.</p>}
      </section>
    </AppLayout>
  );
}
