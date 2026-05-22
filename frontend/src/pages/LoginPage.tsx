import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('viewer');
  const [password, setPassword] = useState('viewer123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      setError(null);
      navigate('/dashboard');
    } catch {
      setError('No se pudo autenticar con Keycloak');
    }
  };

  return (
    <main className="app">
      <header>
        <h1>Inventory QAS</h1>
        <p>Fase 3 — Dashboard y auditoría (QA-5)</p>
      </header>
      <section className="card">
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Usuario
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit">Entrar</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="hint">
          Dashboard: viewer/viewer123 · Auditoría completa: admin/admin123
        </p>
      </section>
    </main>
  );
}
