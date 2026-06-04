const keycloakBase = (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? '/keycloak').replace(/\/$/, '');
const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'inventory-realm';
const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'inventory-frontend';

const ACCESS_COOKIE = 'inventory_access';
const REFRESH_KEY = 'inventory_refresh';
const EXPIRES_KEY = 'inventory_expires_at';
const SKEW_MS = 30_000;

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function tokenUrl() {
  return `${keycloakBase}/realms/${realm}/protocol/openid-connect/token`;
}

function setCookie(accessToken: string, maxAgeSec: number) {
  if (typeof document === 'undefined') return;
  // JWT ya es URL-safe; encodeURIComponent rompe algunos parsers de cookie/middleware
  document.cookie = `${ACCESS_COOKIE}=${accessToken}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

export function clearSession() {
  if (typeof document !== 'undefined') {
    document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }
}

export function persistSession(tokens: TokenResponse) {
  const expiresIn = tokens.expires_in ?? 3600;
  setCookie(tokens.access_token, expiresIn);
  if (typeof localStorage !== 'undefined' && tokens.refresh_token) {
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresIn * 1000));
  }
}

function getExpiresAt(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(EXPIRES_KEY);
  return raw ? Number(raw) : null;
}

function getRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return readAccessFromCookie();
}

function readAccessFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ACCESS_COOKIE}=`));
  if (!match) return null;
  const raw = match.slice(ACCESS_COOKIE.length + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  let response: Response;
  try {
    response = await fetch(tokenUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch {
    throw new AuthError('No se pudo conectar con Keycloak.');
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = (await response.json()) as { error_description?: string; error?: string };
      detail = err.error_description ?? err.error ?? detail;
    } catch {
      if (response.status >= 500) {
        detail =
          'Keycloak no disponible. Si usas Docker, reinicia con docker compose up --build.';
      }
    }
    throw new AuthError(detail, response.status);
  }

  return response.json() as Promise<TokenResponse>;
}

export async function login(username: string, password: string): Promise<string> {
  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      username,
      password,
    }),
  );
  persistSession(tokens);
  return tokens.access_token;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const tokens = await requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refresh,
      }),
    );
    persistSession(tokens);
    return tokens.access_token;
  } catch {
    clearSession();
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const access = readAccessFromCookie();
  const expiresAt = getExpiresAt();

  if (access && expiresAt && Date.now() < expiresAt - SKEW_MS) {
    return access;
  }

  const refreshed = await refreshAccessToken();
  if (refreshed) return refreshed;

  if (access && !expiresAt) {
    return access;
  }

  clearSession();
  return null;
}

export function logout() {
  clearSession();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
