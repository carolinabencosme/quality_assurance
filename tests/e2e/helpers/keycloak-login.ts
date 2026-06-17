import { expect, type Page } from '@playwright/test';

function isAppUrl(url: URL): boolean {
  return url.hostname === 'localhost' && url.port === '3000';
}

function isPostLoginUrl(url: URL): boolean {
  if (!isAppUrl(url)) return false;
  return url.pathname.startsWith('/auth/callback') || url.pathname.startsWith('/dashboard');
}

async function submitKeycloakCredentials(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  const userField = page.locator('#username, input[name="username"]').first();
  const passField = page.locator('#password, input[name="password"]').first();

  await userField.waitFor({ state: 'visible', timeout: 15_000 });
  await userField.fill(username);
  await passField.fill(password);

  const signIn = page.getByRole('button', {
    name: /sign in|iniciar sesi[oó]n|entrar/i,
  });

  await Promise.all([
    page.waitForURL((url) => isPostLoginUrl(url), { timeout: 45_000 }),
    signIn.click(),
  ]);

  if (page.url().includes('/auth/callback')) {
    await page.waitForURL((url) => isAppUrl(url) && url.pathname.startsWith('/dashboard'), {
      timeout: 30_000,
    });
  }

  await expect(page).toHaveURL(/localhost:3000\/dashboard/);
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
    timeout: 25_000,
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

/** Navegación del dock inferior (evita ambigüedad con otros links). */
export function dockLink(page: Page, label: string) {
  return page
    .getByRole('navigation', { name: /navegaci[oó]n principal/i })
    .getByRole('link', { name: label });
}
