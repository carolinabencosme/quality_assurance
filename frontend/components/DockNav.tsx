'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon, { type IconName } from '@/components/icons/AppIcons';
import { APP_NAV, isNavActive } from '@/lib/navigation';
import { hasPermission } from '@/lib/permissions';

const NAV_ICONS: Record<string, IconName> = {
  Dashboard: 'dashboard',
  Productos: 'package',
  Stock: 'stock',
  Reportes: 'reports',
  Auditoria: 'audit',
  Usuarios: 'key',
  Permisos: 'shield',
};

export default function DockNav() {
  const pathname = usePathname();
  const [items, setItems] = useState(() => APP_NAV.filter((item) => !item.requiredPermission));

  useEffect(() => {
    setItems(APP_NAV.filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission)));
  }, []);

  return (
    <nav className="dock-nav" aria-label="Navegacion principal">
      <div className="dock-nav-inner" style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'dock-link active' : 'dock-link'}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="dock-active-glow" aria-hidden />
              <span className="dock-icon" aria-hidden>
                <Icon name={NAV_ICONS[item.label] ?? 'dashboard'} size={18} />
              </span>
              <span className="dock-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
