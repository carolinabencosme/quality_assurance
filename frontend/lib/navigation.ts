export type NavItem = {
  href: string;
  label: string;
  requiredPermission?: string;
  /** Prefijo de ruta para marcar activo; por defecto usa href. */
  activePrefix?: string;
};

export const APP_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', requiredPermission: 'report:view' },
  { href: '/products', label: 'Productos', requiredPermission: 'product:view' },
  { href: '/stock/movements', label: 'Stock', requiredPermission: 'stock:view', activePrefix: '/stock' },
  { href: '/reports', label: 'Reportes', requiredPermission: 'report:view' },
  { href: '/audit', label: 'Auditoria', requiredPermission: 'audit:view' },
  { href: '/admin/permissions', label: 'Permisos', requiredPermission: 'user:manage', activePrefix: '/admin' },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  const prefix = item.activePrefix ?? item.href;
  if (prefix === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
