import { expect, test } from '@playwright/test';
import { loginViaKeycloak } from '../helpers/keycloak-login';

/**
 * CRUD producto vía UI (requiere usuario con product:manage — realm warehouse-manager).
 */
test.describe('Productos - CRUD (warehouse)', () => {
  test.describe.configure({ mode: 'serial' });

  const sku = `PW-E2E-${Date.now()}`;
  const productName = `Playwright E2E ${Date.now()}`;
  const editedName = `${productName} (editado)`;
  let productId = '';

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

    const idMatch = page.url().match(/\/products\/(\d+)\/edit/);
    expect(idMatch).not.toBeNull();
    productId = idMatch![1];
  });

  test('editar nombre y guardar', async ({ page }) => {
    expect(productId, 'El test anterior debe haber creado un producto').not.toBe('');

    await loginViaKeycloak(page, 'warehouse', 'warehouse123');
    await page.goto(`/products/${productId}/edit`);
    await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible();

    await page.locator('#name').fill(editedName);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/\/products$/, { timeout: 15_000 });

    // Verificar persistencia en la ficha (evita race del listado paginado/filtrado).
    await page.goto(`/products/${productId}/edit`);
    await expect(page.locator('#name')).toHaveValue(editedName);
  });

  test('inactivar producto (soft delete)', async ({ page }) => {
    expect(productId, 'El test anterior debe haber creado un producto').not.toBe('');

    await loginViaKeycloak(page, 'warehouse', 'warehouse123');
    await page.goto(`/products/${productId}/edit`);
    await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible();

    await page.locator('.page-header').getByRole('button', { name: 'Inactivar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Inactivar' }).click();
    await expect(page).toHaveURL(/\/products$/, { timeout: 15_000 });

    await page.goto(`/products/${productId}/edit`);
    await expect(page.getByRole('button', { name: 'Inactivar' })).toBeHidden();
  });
});
