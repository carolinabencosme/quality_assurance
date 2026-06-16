'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/icons/AppIcons';
import { APP_NAV, isNavActive } from '@/lib/navigation';

const NAV_ICONS: Record<string, IconName> = {
  Dashboard: 'dashboard',
  Productos: 'package',
  Stock: 'stock',
  Reportes: 'reports',
  Auditoria: 'audit',
};

export default function DockNav() {
  const pathname = usePathname();

  return (
    <nav className="dock-nav" aria-label="Navegacion principal">
      <div className="dock-nav-inner">
        {APP_NAV.map((item) => {
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
