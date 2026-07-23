import { expect, test } from '@playwright/test';
import { dockLink, loginViaKeycloak } from '../helpers/keycloak-login';

test.describe('Stock movement', () => {
  test('warehouse registers IN movement and sees it in history', async ({ page }) => {
    await loginViaKeycloak(page, 'warehouse', 'warehouse123');
    await dockLink(page, 'Stock').click();

    await expect(page).toHaveURL(/\/stock\/movements$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Movimientos de stock' })).toBeVisible();
    await page.locator('#movement-product').selectOption({ index: 1 });
    await page.locator('#movement-qty').fill('1');
    const note = `playwright-stock-${Date.now()}`;
    await page.locator('#movement-obs').fill(note);
    await page.getByRole('button', { name: /registrar movimiento/i }).click();

    await expect(page.getByText(note)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Entrada').first()).toBeVisible();
  });
});
