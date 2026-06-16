'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import BrandMark from '@/components/BrandMark';
import Icon from '@/components/icons/AppIcons';
import { logout } from '@/lib/auth';
import { APP_NAV, isNavActive } from '@/lib/navigation';
import { getSessionUser, type SessionUser } from '@/lib/sessionUser';

export default function Topbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  const displayName = user?.name ?? user?.username ?? 'Usuario';
  const activeLabel = useMemo(
    () => APP_NAV.find((item) => isNavActive(pathname, item))?.label ?? 'Cub',
    [pathname],
  );

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <BrandMark size="sm" showLabel />
        <span className="topbar-breadcrumb">{activeLabel}</span>
      </div>

      <div className="topbar-user">
        <div className="topbar-avatar" aria-hidden>
          {user?.initials ?? 'CU'}
        </div>
        <div className="topbar-user-meta">
          <strong>{displayName}</strong>
          <span>{user?.email ?? user?.username ?? 'Sesion activa'}</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => logout()}>
          <Icon name="logout" size={16} /> <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
