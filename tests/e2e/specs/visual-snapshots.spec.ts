import { expect, test } from '@playwright/test';
import { dockLink, loginViaKeycloak } from '../helpers/keycloak-login';

const fixedApiResponses: Record<string, unknown> = {
  '/api/v1/reports/dashboard': {
    kpis: {
      totalActiveProducts: 4,
      criticalProductsCount: 2,
      totalStockUnits: 183,
      inventoryValue: 2480,
      movementsLast7Days: 4,
      categoriesCount: 3,
    },
    criticalProducts: [
      { id: 2, name: 'USB-C Hub', sku: 'SKU-HUB-002', quantity: 8, minStock: 10 },
      { id: 4, name: 'Desk Lamp', sku: 'SKU-LAMP-004', quantity: 5, minStock: 5 },
    ],
    topSoldProducts: [
      { productId: 1, sku: 'SKU-MOUSE-001', name: 'Wireless Mouse', totalOutQty: 4, movementCount: 1 },
    ],
    recentMovements: [
      { movementId: 3, productSku: 'SKU-LAMP-004', productName: 'Desk Lamp', type: 'IN', delta: 1, newQty: 5 },
      { movementId: 2, productSku: 'SKU-MOUSE-001', productName: 'Wireless Mouse', type: 'OUT', delta: -4, newQty: 50 },
      { movementId: 1, productSku: 'SKU-HUB-002', productName: 'USB-C Hub', type: 'ADJUSTMENT', delta: 2, newQty: 8 },
    ],
  },
  '/api/v1/observability/system-metrics': {
    jvm: { heapUsedMb: 256, heapMaxMb: 1024, threads: 32 },
    process: { cpuUsage: 0.12, uptimeSeconds: 3600 },
    http: { requestsLast5m: 128, errorRate5m: 0.01, p95Ms: 42 },
    datasource: { active: 2, idle: 8, max: 10, pending: 0 },
  },
  '/api/v1/categories': [
    { id: 1, name: 'Accesorios', description: null, status: 'ACTIVE' },
    { id: 2, name: 'Iluminacion', description: null, status: 'ACTIVE' },
    { id: 3, name: 'Oficina', description: null, status: 'ACTIVE' },
  ],
  '/api/v1/products': {
    content: [
      { id: 4, name: 'Desk Lamp', sku: 'SKU-LAMP-004', description: null, categoryId: 2, categoryName: 'Iluminacion', price: 35, quantity: 5, minStock: 5, critical: true, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 3, name: 'Mechanical Keyboard', sku: 'SKU-KEY-003', description: null, categoryId: 1, categoryName: 'Accesorios', price: 95, quantity: 40, minStock: 10, critical: false, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 2, name: 'USB-C Hub', sku: 'SKU-HUB-002', description: null, categoryId: 1, categoryName: 'Accesorios', price: 60, quantity: 8, minStock: 10, critical: true, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 1, name: 'Wireless Mouse', sku: 'SKU-MOUSE-001', description: null, categoryId: 1, categoryName: 'Accesorios', price: 45, quantity: 50, minStock: 10, critical: false, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    totalElements: 4,
    totalPages: 1,
    number: 0,
    size: 10,
    first: true,
    last: true,
    empty: false,
  },
  '/api/v1/security/permissions-matrix': {
    source: 'Keycloak + Spring Security',
    permissionDescriptions: [
      { permission: 'product:view', description: 'Consultar el catalogo.' },
      { permission: 'product:manage', description: 'Crear, editar e inactivar productos.' },
      { permission: 'stock:manage', description: 'Registrar movimientos de inventario.' },
      { permission: 'report:view', description: 'Consultar reportes y dashboard.' },
      { permission: 'audit:view', description: 'Consultar la trazabilidad de cambios.' },
      { permission: 'user:manage', description: 'Administrar usuarios y roles.' },
    ],
    roles: [
      { role: 'inventory-admin', permissions: ['product:view', 'product:manage', 'stock:manage', 'report:view', 'audit:view', 'user:manage'] },
      { role: 'warehouse-manager', permissions: ['product:view', 'product:manage', 'stock:manage', 'report:view'] },
      { role: 'inventory-clerk', permissions: ['product:view', 'stock:manage'] },
      { role: 'inventory-viewer', permissions: ['product:view', 'report:view'] },
    ],
  },
  '/api/v1/users': [
    { id: 'admin-fixed', username: 'admin', email: 'admin@inventory.local', firstName: 'Admin', lastName: 'Inventory', enabled: true, roles: ['inventory-admin'] },
    { id: 'warehouse-fixed', username: 'warehouse', email: 'warehouse@inventory.local', firstName: 'Warehouse', lastName: 'Manager', enabled: true, roles: ['warehouse-manager'] },
    { id: 'clerk-fixed', username: 'clerk', email: 'clerk@inventory.local', firstName: 'Inventory', lastName: 'Clerk', enabled: true, roles: ['inventory-clerk'] },
    { id: 'viewer-fixed', username: 'viewer', email: 'viewer@inventory.local', firstName: 'Inventory', lastName: 'Viewer', enabled: true, roles: ['inventory-viewer'] },
  ],
};

async function installDeterministicApi(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const normalizedPath = url.pathname.replace(/\/$/, '');
    const response = fixedApiResponses[normalizedPath];
    if (response === undefined) {
      await route.continue();
      return;
    }
    await route.fulfill({ json: response });
  });
}

test.describe('Visual snapshots', () => {
  test.skip(process.env.RUN_VISUAL_SNAPSHOTS !== 'true', 'Visual snapshots run only when explicitly enabled.');

  test('admin core screens match approved snapshots', async ({ page }) => {
    await installDeterministicApi(page);
    await loginViaKeycloak(page, 'admin', 'admin123');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-admin.png', { fullPage: true });

    await dockLink(page, 'Productos').click();
    await expect(page).toHaveURL(/\/products$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Productos', exact: true })).toBeVisible();
    await expect(page.getByText('Mechanical Keyboard', { exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('products-list-admin.png', { fullPage: true });

    await dockLink(page, 'Permisos').click();
    await expect(page).toHaveURL(/\/admin\/permissions$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Matriz de permisos' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('admin-permissions.png', { fullPage: true });

    await dockLink(page, 'Usuarios').click();
    await expect(page).toHaveURL(/\/admin\/users$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('admin-users.png', { fullPage: true });
  });
});
