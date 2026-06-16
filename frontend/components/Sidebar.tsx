'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandMark from '@/components/BrandMark';
import { APP_NAV, isNavActive } from '@/lib/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandMark size="md" showLabel />
        <span>Panel operativo</span>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        {APP_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isNavActive(pathname, item) ? 'active' : undefined}
            aria-current={isNavActive(pathname, item) ? 'page' : undefined}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
