import { expect, test } from '@playwright/test';
import { loginViaKeycloak, dockLink } from '../helpers/keycloak-login';

test.describe('Inventory QAS - flujo principal', () => {
  test('login viewer y dashboard carga KPIs', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Productos activos')).toBeVisible();
  });

  test('navegacion a productos', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await dockLink(page, 'Productos').click();
    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByRole('heading', { name: 'Productos', exact: true })).toBeVisible();
  });
});
