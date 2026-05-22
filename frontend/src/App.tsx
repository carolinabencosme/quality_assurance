import { useEffect, useState } from 'react';

type SetupInfo = {
  application: string;
  phase: string;
  status: string;
  message: string;
  timestamp: string;
};

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

export default function App() {
  const [info, setInfo] = useState<SetupInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/setup/info`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SetupInfo>;
      })
      .then(setInfo)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="app">
      <header>
        <h1>Inventory QAS</h1>
        <p>Sistema de Gestion de Inventarios — Fase 0 (Setup)</p>
      </header>
      <section className="card">
        <h2>Estado del entorno</h2>
        {info && (
          <ul>
            <li>
              <strong>API:</strong> {info.application} — {info.status}
            </li>
            <li>
              <strong>Fase:</strong> {info.phase}
            </li>
            <li>{info.message}</li>
            <li>
              <small>{info.timestamp}</small>
            </li>
          </ul>
        )}
        {error && <p className="error">No se pudo contactar el backend: {error}</p>}
        {!info && !error && <p>Conectando con el backend…</p>}
      </section>
      <footer>
        <p>
          Keycloak: {import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8081'} — Realm:{' '}
          {import.meta.env.VITE_KEYCLOAK_REALM ?? 'inventory-realm'}
        </p>
      </footer>
    </main>
  );
}
