'use client';

import { useState } from 'react';
import BrandMark from '@/components/BrandMark';
import Icon from '@/components/icons/AppIcons';
import { AuthError, login } from '@/lib/auth';
import { BRAND } from '@/lib/brand';

type Props = {
  sessionExpired?: boolean;
};

export default function LoginForm({ sessionExpired }: Props) {
  const [username, setUsername] = useState('viewer');
  const [password, setPassword] = useState('viewer123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : 'No se pudo autenticar. Revisa usuario y contrasena.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card login-card--dark">
      <div className="login-card-glow" aria-hidden />
      <div className="login-card-header">
        <BrandMark size="lg" showLabel variant="dark" />
        <span className="login-secure-pill">
          <Icon name="lock" size={14} /> Keycloak
        </span>
      </div>
      <h2 id="login-title">Inicia sesion en {BRAND.name}</h2>
      <p className="sub">Realm inventory-realm con roles y permisos JWT.</p>

      {sessionExpired && (
        <div className="alert alert-info alert--dark" role="alert">
          Tu sesion expiro. Vuelve a iniciar sesion para continuar.
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form-dark">
        <div className="form-field form-field--dark">
          <label htmlFor="username">Usuario o correo</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="viewer"
            required
          />
        </div>
        <div className="form-field form-field--dark">
          <label htmlFor="password">Contrasena</label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="********"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              aria-pressed={showPassword}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-keycloak btn-block" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner spinner--light" aria-hidden /> Autenticando...
            </>
          ) : (
            <>
              <Icon name="key" size={17} /> Entrar
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="alert alert-error alert--dark" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <p className="hint hint--dark">
        <strong>Cuentas de prueba</strong>
        <br />
        Operador: <code>viewer / viewer123</code>
        <br />
        Admin: <code>admin / admin123</code>
        <br />
        Almacen: <code>warehouse / warehouse123</code>
      </p>
    </div>
  );
}
