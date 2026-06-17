import { Suspense } from 'react';
import AuthCallbackClient from '@/components/AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-callback-page" role="status">
          <p>Completando autenticación…</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
