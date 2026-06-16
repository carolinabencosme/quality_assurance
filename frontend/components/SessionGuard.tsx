'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandMark from '@/components/BrandMark';
import { getValidAccessToken } from '@/lib/auth';

/** Renueva el token al montar rutas protegidas. */
export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    getValidAccessToken().then((token) => {
      if (!active) return;
      if (!token) {
        router.replace('/?reason=session');
        return;
      }
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="session-loading" role="status" aria-live="polite">
        <BrandMark size="lg" showLabel />
        <span className="spinner" aria-hidden />
        <p>Preparando tu espacio operativo...</p>
      </div>
    );
  }

  return <>{children}</>;
}
