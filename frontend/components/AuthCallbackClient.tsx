'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandMark from '@/components/BrandMark';
import { AuthError, completeLoginFromCallback } from '@/lib/auth';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const description = searchParams.get('error_description') ?? oauthError;
      setError(description);
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setError('Respuesta de Keycloak incompleta. Vuelve a iniciar sesión.');
      return;
    }

    let active = true;

    completeLoginFromCallback(code, state)
      .then((returnTo) => {
        if (!active) return;
        router.replace(returnTo);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof AuthError
            ? err.message
            : 'No se pudo completar el inicio de sesión.',
        );
      });

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="auth-callback-page">
        <div className="auth-callback-card">
          <BrandMark size="md" showLabel />
          <h1>No se pudo iniciar sesión</h1>
          <p className="auth-callback-error">{error}</p>
          <Link href="/" className="btn btn-gradient">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback-page" role="status" aria-live="polite">
      <BrandMark size="lg" showLabel />
      <span className="spinner" aria-hidden />
      <p>Completando autenticación con Keycloak…</p>
    </div>
  );
}
