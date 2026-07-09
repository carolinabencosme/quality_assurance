import { expect, test } from '@playwright/test';
import { dockLink, loginViaKeycloak } from '../helpers/keycloak-login';

test.describe('Admin users', () => {
  test('admin can open users administration', async ({ page }) => {
    await loginViaKeycloak(page, 'admin', 'admin123');

    await expect(dockLink(page, 'Usuarios')).toBeVisible({ timeout: 15_000 });
    await dockLink(page, 'Usuarios').click();

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByRole('heading', { name: 'Usuarios' })).toBeVisible();
    await expect(page.getByText('Usuarios Keycloak')).toBeVisible();
  });

  test('viewer does not see users administration', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await expect(dockLink(page, 'Usuarios')).toHaveCount(0);
  });
});
