import { expect, test } from '@playwright/test';
import { loginViaKeycloak } from '../helpers/keycloak-login';

/**
 * CRUD producto vía UI (requiere usuario con product:manage — realm warehouse-manager).
 */
test.describe('Productos — CRUD (warehouse)', () => {
  test.describe.configure({ mode: 'serial' });

  const sku = `PW-E2E-${Date.now()}`;
  const productName = `Playwright E2E ${Date.now()}`;

  test('login warehouse y crear producto', async ({ page }) => {
    await loginViaKeycloak(page, 'warehouse', 'warehouse123');

    await page.goto('/products/new');
    await expect(page.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible();

    await page.locator('#name').fill(productName);
    await page.locator('#sku').fill(sku);
    await page.locator('#description').fill('Creado por Playwright');
    await page.locator('#categoryId').selectOption({ index: 1 });
    await page.locator('#price').fill('9.99');
    await page.locator('#quantity').fill('2');
    await page.locator('#minStock').fill('1');

    await page.getByRole('button', { name: 'Crear producto' }).click();
    await expect(page).toHaveURL(new RegExp(`/products/\\d+/edit`), { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible();
    await expect(page.getByText(sku)).toBeVisible();
  });

  test('editar nombre y guardar', async ({ page }) => {
    await loginViaKeycloak(page, 'warehouse', 'warehouse123');

    await page.goto('/products');
    const row = page.locator('tr', { hasText: sku });
    await row.getByRole('link', { name: 'Editar' }).click();
    await expect(page).toHaveURL(/\/products\/\d+\/edit/);

    await page.locator('#name').fill(`${productName} (editado)`);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByText(`${productName} (editado)`).first()).toBeVisible();
  });

  test('inactivar producto (soft delete)', async ({ page }) => {
    await loginViaKeycloak(page, 'warehouse', 'warehouse123');

    await page.goto('/products');
    const row = page.locator('tr', { hasText: sku });
    await row.getByRole('link', { name: 'Editar' }).click();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Inactivar' }).click();
    await expect(page).toHaveURL(/\/products$/);

    await page.goto('/products');
    const rowAfter = page.locator('tr', { hasText: sku });
    await expect(rowAfter.getByText('Inactivo')).toBeVisible();
  });
});
