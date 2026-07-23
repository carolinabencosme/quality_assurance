import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { dockLink, loginViaKeycloak } from '../helpers/keycloak-login';

type AxeResult = Awaited<ReturnType<AxeBuilder['analyze']>>;

async function expectNoSeriousViolations(page: Page, testInfo: TestInfo): Promise<void> {
  const results: AxeResult = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );

  await testInfo.attach('axe-results.json', {
    body: Buffer.from(JSON.stringify(results, null, 2)),
    contentType: 'application/json',
  });

  expect(
    blocking,
    blocking
      .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
      .join('\n'),
  ).toEqual([]);
}

test.describe('Accessibility smoke', () => {
  test('dashboard has no critical or serious violations', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loginViaKeycloak(page, 'viewer', 'viewer123');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expectNoSeriousViolations(page, testInfo);
  });

  test('products list has no critical or serious violations', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loginViaKeycloak(page, 'viewer', 'viewer123');
    await dockLink(page, 'Productos').click();
    await expect(page).toHaveURL(/\/products$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Productos', exact: true })).toBeVisible();
    await expectNoSeriousViolations(page, testInfo);
  });
});
