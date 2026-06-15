import { expect, test } from '@playwright/test';
import * as path from 'path';

const evidenceDir =
  process.env.EVIDENCE_DIR ?? path.join(__dirname, '../../../docs/qa-evidence/screenshots');

test.describe('Capturas evidencia Avance V3', () => {
  test('01 login viewer', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Usuario').fill('viewer');
    await page.getByLabel('Contraseña').fill('viewer123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({ path: path.join(evidenceDir, '01-login-viewer.png'), fullPage: true });
  });

  test('02 admin productos', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contraseña').fill('admin123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.getByRole('link', { name: 'Productos' }).click();
    await expect(page).toHaveURL(/\/products/);
    await page.screenshot({ path: path.join(evidenceDir, '02-admin-products.png'), fullPage: true });
  });

  test('04 dashboard criticos', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Usuario').fill('viewer');
    await page.getByLabel('Contraseña').fill('viewer123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByText('Productos activos')).toBeVisible();
    await page.screenshot({ path: path.join(evidenceDir, '04-critical-stock.png'), fullPage: true });
  });

  test('05 auditoria admin', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contraseña').fill('admin123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.getByRole('link', { name: 'Auditoría' }).click();
    await expect(page).toHaveURL(/\/audit/);
    await page.screenshot({ path: path.join(evidenceDir, '05-audit-envers.png'), fullPage: true });
  });
});
