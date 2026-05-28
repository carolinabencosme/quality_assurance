import { expect, test } from '@playwright/test';

test.describe('Inventory QAS — flujo principal', () => {
  test('login viewer y dashboard carga KPIs', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Usuario').fill('viewer');
    await page.getByLabel('Contraseña').fill('viewer123');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Productos activos')).toBeVisible();
  });

  test('navegación a productos', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Usuario').fill('viewer');
    await page.getByLabel('Contraseña').fill('viewer123');
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.getByRole('link', { name: 'Productos' }).click();
    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();
  });
});
