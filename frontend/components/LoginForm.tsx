'use client';

import { useState } from 'react';
import { AuthError, login } from '@/lib/auth';

type Props = {
  sessionExpired?: boolean;
};

export default function LoginForm({ sessionExpired }: Props) {
  const [username, setUsername] = useState('viewer');
  const [password, setPassword] = useState('viewer123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      // Recarga completa para que middleware y cookie queden sincronizados.
      window.location.href = '/dashboard';
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : 'No se pudo autenticar. Revisa usuario y contrase\u00f1a.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <div className="brand-mark">IQ</div>
      <h2>Acceso al sistema</h2>
      <p className="sub">Realm inventory-realm - Keycloak</p>

      {sessionExpired && (
        <div className="alert alert-info" role="alert">
          Tu sesi&oacute;n expir&oacute;. Vuelve a iniciar sesi&oacute;n para continuar.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Contrase&ntilde;a</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Autenticando...' : 'Entrar'}
        </button>
      </form>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <p className="hint">
        <strong>Cuentas de prueba</strong>
        <br />
        Dashboard: <code>viewer / viewer123</code>
        <br />
        Auditor&iacute;a: <code>admin / admin123</code>
      </p>
    </div>
  );
}
