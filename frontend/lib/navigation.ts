export type NavItem = {
  href: string;
  label: string;
  /** Prefijo de ruta para marcar activo (por defecto usa href). */
  activePrefix?: string;
};

export const APP_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/products', label: 'Productos' },
  { href: '/stock/movements', label: 'Stock', activePrefix: '/stock' },
  { href: '/reports', label: 'Reportes' },
  { href: '/audit', label: 'Auditoría' },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  const prefix = item.activePrefix ?? item.href;
  if (prefix === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
