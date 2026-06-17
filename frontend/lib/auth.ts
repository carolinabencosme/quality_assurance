import {
  OIDC,
  oidcAuthUrl,
  oidcLogoutUrl,
  oidcRedirectUri,
  oidcTokenUrl,
} from '@/lib/oidc-config';
import { generateRandomString, sha256Base64Url } from '@/lib/pkce';

const ACCESS_COOKIE = 'inventory_access';
const REFRESH_KEY = 'inventory_refresh';
const EXPIRES_KEY = 'inventory_expires_at';
const ID_TOKEN_KEY = 'inventory_id_token';
const SKEW_MS = 30_000;

const PKCE_VERIFIER_KEY = 'oidc_code_verifier';
const PKCE_STATE_KEY = 'oidc_state';
const PKCE_RETURN_KEY = 'oidc_return_to';

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
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

function setCookie(accessToken: string, maxAgeSec: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_COOKIE}=${accessToken}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

function clearPkceSession() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_STATE_KEY);
  sessionStorage.removeItem(PKCE_RETURN_KEY);
}

export function clearSession() {
  if (typeof document !== 'undefined') {
    document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
  }
  clearPkceSession();
}

export function persistSession(tokens: TokenResponse) {
  const expiresIn = tokens.expires_in ?? 3600;
  setCookie(tokens.access_token, expiresIn);
  if (typeof localStorage !== 'undefined') {
    if (tokens.refresh_token) {
      localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
      localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresIn * 1000));
    }
    if (tokens.id_token) {
      localStorage.setItem(ID_TOKEN_KEY, tokens.id_token);
    }
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

function getIdToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(ID_TOKEN_KEY);
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
    response = await fetch(oidcTokenUrl(), {
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
        detail = 'Keycloak no disponible. Reinicia Docker Compose si es necesario.';
      }
    }
    throw new AuthError(detail, response.status);
  }

  return response.json() as Promise<TokenResponse>;
}

/**
 * Inicia Authorization Code + PKCE — redirige a la pantalla de login de Keycloak.
 */
export async function startLogin(returnPath = '/dashboard'): Promise<void> {
  if (typeof window === 'undefined') return;

  const codeVerifier = generateRandomString();
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = generateRandomString();

  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(PKCE_STATE_KEY, state);
  sessionStorage.setItem(PKCE_RETURN_KEY, returnPath);

  const params = new URLSearchParams({
    client_id: OIDC.clientId,
    redirect_uri: oidcRedirectUri(),
    response_type: 'code',
    scope: OIDC.scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(`${oidcAuthUrl()}?${params.toString()}`);
}

/**
 * Intercambia el authorization code por tokens (callback OIDC).
 */
export async function completeLoginFromCallback(code: string, state: string): Promise<string> {
  const expectedState = sessionStorage.getItem(PKCE_STATE_KEY);
  const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  const returnTo = sessionStorage.getItem(PKCE_RETURN_KEY) ?? '/dashboard';

  if (!codeVerifier || !expectedState || state !== expectedState) {
    clearPkceSession();
    throw new AuthError('Estado de autenticación inválido. Intenta de nuevo.');
  }

  clearPkceSession();

  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OIDC.clientId,
      code,
      redirect_uri: oidcRedirectUri(),
      code_verifier: codeVerifier,
    }),
  );

  persistSession(tokens);
  return returnTo;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const tokens = await requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: OIDC.clientId,
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

/** Cierra sesión local y en Keycloak (SSO logout). */
export function logout(): void {
  const idToken = getIdToken();
  clearSession();

  if (typeof window === 'undefined') return;

  const params = new URLSearchParams({
    client_id: OIDC.clientId,
    post_logout_redirect_uri: `${window.location.origin}/`,
  });
  if (idToken) {
    params.set('id_token_hint', idToken);
  }

  window.location.assign(`${oidcLogoutUrl()}?${params.toString()}`);
}
