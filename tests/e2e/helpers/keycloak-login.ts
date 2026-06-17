import { expect, type Page } from '@playwright/test';

async function submitKeycloakCredentials(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  const userField = page.locator('#username, input[name="username"]').first();
  const passField = page.locator('#password, input[name="password"]').first();

  await userField.fill(username);
  await passField.fill(password);

  await page
    .getByRole('button', { name: /sign in|iniciar sesi[oó]n|entrar/i })
    .click();

  await page.waitForURL(/\/(auth\/callback|dashboard)/, { timeout: 25_000 });

  if (page.url().includes('/auth/callback')) {
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  }

  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Login vía Authorization Code + PKCE: Cub redirige a Keycloak, el usuario
 * autentica en la pantalla del IdP y vuelve a /auth/callback.
 */
export async function loginViaKeycloak(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto('/');

  await page.getByRole('button', { name: /iniciar sesi[oó]n con keycloak/i }).click();

  await page.waitForURL(/realms\/inventory-realm|\/protocol\/openid-connect\/auth/, {
    timeout: 20_000,
  });

  await submitKeycloakCredentials(page, username, password);
}

/** Completa el formulario cuando ya estás en la pantalla de Keycloak. */
export async function completeKeycloakLogin(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await submitKeycloakCredentials(page, username, password);
}
