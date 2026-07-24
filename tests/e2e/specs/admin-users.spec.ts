import { expect, test } from '@playwright/test';
import { dockLink, loginViaKeycloak } from '../helpers/keycloak-login';

test.describe('Admin users', () => {
  test('admin can open users administration', async ({ page }) => {
    await loginViaKeycloak(page, 'admin', 'admin123');

    const usersLink = dockLink(page, 'Usuarios');
    await expect(usersLink).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL(/\/admin\/users/, { timeout: 20_000 }),
      usersLink.click(),
    ]);

    await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Usuarios Keycloak')).toBeVisible();
  });

  test('viewer does not see users administration', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await expect(dockLink(page, 'Usuarios')).toHaveCount(0);
  });
});
