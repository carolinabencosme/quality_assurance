const keycloakBase =
  import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8081';
const realm = import.meta.env.VITE_KEYCLOAK_REALM ?? 'inventory-realm';
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'inventory-frontend';

const TOKEN_KEY = 'inventory_access_token';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username,
    password,
  });

  const response = await fetch(
    `${keycloakBase}/realms/${realm}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(`Login failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string };
  sessionStorage.setItem(TOKEN_KEY, data.access_token);
  return data.access_token;
}

export function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
