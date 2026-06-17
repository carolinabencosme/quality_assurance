import { expect, test } from '@playwright/test';
import { loginViaKeycloak } from '../helpers/keycloak-login';

test.describe('Inventory QAS — flujo principal', () => {
  test('login viewer y dashboard carga KPIs', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Productos activos')).toBeVisible();
  });

  test('navegación a productos', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await page.getByRole('link', { name: 'Productos' }).click();
    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();
  });
});
