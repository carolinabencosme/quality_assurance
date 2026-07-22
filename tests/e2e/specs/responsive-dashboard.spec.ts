import { expect, test } from '@playwright/test';
import { loginViaKeycloak } from '../helpers/keycloak-login';

test.describe('Responsive dashboard', () => {
  test('mobile dashboard renders KPIs and top sold section without critical overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginViaKeycloak(page, 'viewer', 'viewer123');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Productos activos')).toBeVisible();
    await expect(page.getByText('Productos mas vendidos')).toBeVisible();
    await expect(page.getByText('CPU', { exact: true })).toBeVisible();
    await expect(page.getByText('Heap JVM')).toBeVisible();

    const hasCriticalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 4,
    );
    expect(hasCriticalOverflow).toBe(false);
  });
});
