'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getValidAccessToken } from '@/lib/auth';

/** Renueva el token al montar rutas protegidas. */
export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    getValidAccessToken().then((token) => {
      if (!token) {
        router.replace('/?reason=session');
      }
    });
  }, [router]);

  return <>{children}</>;
}
