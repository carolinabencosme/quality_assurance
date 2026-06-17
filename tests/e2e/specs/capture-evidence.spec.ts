import { expect, test } from '@playwright/test';
import * as path from 'path';
import { loginViaKeycloak, completeKeycloakLogin, resetBrowserSession, dockLink } from '../helpers/keycloak-login';

const evidenceDir =
  process.env.EVIDENCE_DIR ?? path.join(__dirname, '../../../docs/qa-evidence/screenshots');

test.describe('Capturas evidencia Avance V3', () => {
  test('01 login viewer', async ({ page }) => {
    await resetBrowserSession(page);
    await page.getByRole('button', { name: /iniciar sesi[oó]n con keycloak/i }).click();
    await page.waitForURL(/realms\/inventory-realm|\/protocol\/openid-connect\/auth/);
    await page.screenshot({ path: path.join(evidenceDir, '01-keycloak-login.png'), fullPage: true });

    await completeKeycloakLogin(page, 'viewer', 'viewer123');
    await page.screenshot({ path: path.join(evidenceDir, '01-login-viewer.png'), fullPage: true });
  });

  test('02 admin productos', async ({ page }) => {
    await loginViaKeycloak(page, 'admin', 'admin123');
    await dockLink(page, 'Productos').click();
    await expect(page).toHaveURL(/\/products/);
    await page.screenshot({ path: path.join(evidenceDir, '02-admin-products.png'), fullPage: true });
  });

  test('04 dashboard criticos', async ({ page }) => {
    await loginViaKeycloak(page, 'viewer', 'viewer123');
    await expect(page.getByText('Productos activos')).toBeVisible();
    await page.screenshot({ path: path.join(evidenceDir, '04-critical-stock.png'), fullPage: true });
  });

  test('05 auditoria admin', async ({ page }) => {
    await loginViaKeycloak(page, 'admin', 'admin123');
    await dockLink(page, 'Auditoria').click();
    await expect(page).toHaveURL(/\/audit/);
    await page.screenshot({ path: path.join(evidenceDir, '05-audit-envers.png'), fullPage: true });
  });
});
