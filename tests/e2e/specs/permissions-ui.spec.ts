import { expect, test } from '@playwright/test';
import { dockLink, loginViaKeycloak } from '../helpers/keycloak-login';

test.describe('Permissions UI', () => {
  test('admin sees audit and permissions links', async ({ page }) => {
    await loginViaKeycloak(page, 'admin', 'admin123');

    await expect(dockLink(page, 'Auditoria')).toBeVisible({ timeout: 15_000 });
    await expect(dockLink(page, 'Permisos')).toBeVisible({ timeout: 15_000 });

    await dockLink(page, 'Permisos').click();
    await expect(page).toHaveURL(/\/admin\/permissions/);
    await expect(page.getByRole('heading', { name: 'Matriz de permisos' })).toBeVisible();
    await expect(page.getByText('inventory-admin')).toBeVisible();
  });

  test('viewer does not see audit or permissions links', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await expect(dockLink(page, 'Permisos')).toHaveCount(0);
    await expect(dockLink(page, 'Auditoria')).toHaveCount(0);
  });

  test('viewer direct permissions access is denied', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await page.goto('/admin/permissions');
    await expect(page.getByText(/user:manage/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/No tienes permiso user:manage/)).toBeVisible();
  });
});
