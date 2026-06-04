'use client';

import { useEffect, useState } from 'react';
import { logout } from '@/lib/auth';
import { getSessionUser, type SessionUser } from '@/lib/sessionUser';

export default function Topbar() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  const displayName = user?.name ?? user?.username ?? 'Usuario';

  return (
    <header className="topbar">
      <div className="topbar-context">
        <span className="topbar-eyebrow">Inventory QAS</span>
        <strong className="topbar-title">Panel operativo</strong>
      </div>

      <div className="topbar-user">
        <div className="topbar-avatar" aria-hidden>
          {user?.initials ?? 'U'}
        </div>
        <div className="topbar-user-meta">
          <strong>{displayName}</strong>
          <span>{user?.email ?? user?.username ?? '—'}</span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => logout()}>
          Salir
        </button>
      </div>
    </header>
  );
}
