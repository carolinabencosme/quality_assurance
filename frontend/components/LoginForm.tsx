'use client';

import { useState } from 'react';
import BrandMark from '@/components/BrandMark';
import Icon from '@/components/icons/AppIcons';
import { startLogin } from '@/lib/auth';
import { BRAND } from '@/lib/brand';
import { OIDC } from '@/lib/oidc-config';

type Props = {
  sessionExpired?: boolean;
};

export default function LoginForm({ sessionExpired }: Props) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    void startLogin('/dashboard');
  };

  return (
    <div className="login-card login-card--dark">
      <div className="login-card-glow" aria-hidden />
      <div className="login-card-header">
        <BrandMark size="lg" showLabel variant="dark" />
        <span className="login-secure-pill">
          <Icon name="lock" size={14} /> OIDC + PKCE
        </span>
      </div>
      <h2 id="login-title">Accede a {BRAND.name}</h2>
      <p className="sub">
        Autenticación delegada a Keycloak ({OIDC.realm}). Serás redirigido a la pantalla
        segura del servidor de identidad.
      </p>

      {sessionExpired && (
        <div className="alert alert-info alert--dark" role="alert">
          Tu sesión expiró. Inicia sesión de nuevo en Keycloak para continuar.
        </div>
      )}

      <div className="login-form-dark">
        <button
          type="button"
          className="btn btn-keycloak btn-block"
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? (
            <>
              <span className="spinner spinner--light" aria-hidden /> Redirigiendo…
            </>
          ) : (
            <>
              <Icon name="key" size={17} /> Iniciar sesión con Keycloak
            </>
          )}
        </button>
      </div>

      <p className="hint hint--dark">
        Usa las credenciales de tu usuario en el realm <code>{OIDC.realm}</code>. Los roles y
        permisos se obtienen del JWT emitido por Keycloak.
      </p>
    </div>
  );
}
