import { expect, test } from '@playwright/test';
import { dockLink, loginViaKeycloak } from '../helpers/keycloak-login';

test.describe('Visual snapshots', () => {
  test.skip(process.env.RUN_VISUAL_SNAPSHOTS !== 'true', 'Visual snapshots run only when explicitly enabled.');

  test('admin core screens match approved snapshots', async ({ page }) => {
    await loginViaKeycloak(page, 'admin', 'admin123');
    await expect(page).toHaveScreenshot('dashboard-admin.png', { fullPage: true });

    await dockLink(page, 'Productos').click();
    await expect(page).toHaveScreenshot('products-list-admin.png', { fullPage: true });

    await dockLink(page, 'Permisos').click();
    await expect(page).toHaveScreenshot('admin-permissions.png', { fullPage: true });

    await dockLink(page, 'Usuarios').click();
    await expect(page).toHaveScreenshot('admin-users.png', { fullPage: true });
  });
});
