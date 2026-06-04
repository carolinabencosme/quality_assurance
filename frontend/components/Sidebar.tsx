'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/products', label: 'Productos' },
  { href: '/audit', label: 'Auditoría' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">IQ</div>
        <div>
          <strong>Inventory QAS</strong>
          <span>PUCMM · Fase 3</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={pathname === href || pathname.startsWith(`${href}/`) ? 'active' : undefined}
          >
            <span aria-hidden>●</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div style={{ padding: '0 0.5rem' }}>
        <button type="button" className="btn btn-outline" onClick={() => logout()}>
          Salir
        </button>
      </div>
    </aside>
  );
}
