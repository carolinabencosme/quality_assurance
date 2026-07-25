import { expect, test } from '@playwright/test';
import { loginViaKeycloak } from '../helpers/keycloak-login';

test.describe('Stock movement', () => {
  test('warehouse registers IN movement and sees it in history', async ({ page }) => {
    await loginViaKeycloak(page, 'warehouse', 'warehouse123');

    // Asegura un producto activo: Newman/Schemathesis pueden soft-deletear el seed.
    const sku = `PW-STOCK-${Date.now()}`;
    const productName = `Stock E2E ${Date.now()}`;
    await page.goto('/products/new');
    await expect(page.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible();
    await page.locator('#name').fill(productName);
    await page.locator('#sku').fill(sku);
    await page.locator('#categoryId').selectOption({ index: 1 });
    await page.locator('#price').fill('5.00');
    await page.locator('#quantity').fill('10');
    await page.locator('#minStock').fill('1');
    await page.getByRole('button', { name: 'Crear producto' }).click();
    await expect(page).toHaveURL(new RegExp(`/products/\\d+/edit`), { timeout: 15_000 });

    await page.goto('/stock/movements');
    await expect(page).toHaveURL(/\/stock\/movements$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Movimientos de stock' })).toBeVisible();

    const productSelect = page.locator('#movement-product');
    await expect(productSelect.locator('option')).not.toHaveCount(1, { timeout: 15_000 });
    await productSelect.selectOption({ label: productName });
    await page.locator('#movement-qty').fill('1');
    const note = `playwright-stock-${Date.now()}`;
    await page.locator('#movement-obs').fill(note);
    await page.getByRole('button', { name: /registrar movimiento/i }).click();

    await expect(page.getByText(note)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Entrada').first()).toBeVisible();
  });
});
