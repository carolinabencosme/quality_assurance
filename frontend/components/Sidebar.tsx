'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BrandMark from '@/components/BrandMark';
import { APP_NAV, isNavActive } from '@/lib/navigation';
import { hasPermission } from '@/lib/permissions';

export default function Sidebar() {
  const pathname = usePathname();
  const [items, setItems] = useState(() => APP_NAV.filter((item) => !item.requiredPermission));

  useEffect(() => {
    setItems(APP_NAV.filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission)));
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandMark size="md" showLabel />
        <span>Panel operativo</span>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        {items.map((item) => (
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
