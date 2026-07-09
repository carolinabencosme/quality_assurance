/** Configuración OIDC — Authorization Code + PKCE (cliente público SPA). */

import { BUSINESS_SCOPES } from './permissions';

const keycloakBase = (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? '/keycloak').replace(/\/$/, '');
const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'inventory-realm';
const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'inventory-frontend';
const appOrigin =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export const OIDC = {
  keycloakBase,
  realm,
  clientId,
  appOrigin,
  callbackPath: '/auth/callback',
  scopes: ['openid', 'profile', 'email', ...BUSINESS_SCOPES].join(' '),
} as const;

export function oidcRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${OIDC.callbackPath}`;
  }
  return `${OIDC.appOrigin}${OIDC.callbackPath}`;
}

export function oidcAuthUrl(): string {
  return `${OIDC.keycloakBase}/realms/${OIDC.realm}/protocol/openid-connect/auth`;
}

export function oidcTokenUrl(): string {
  return `${OIDC.keycloakBase}/realms/${OIDC.realm}/protocol/openid-connect/token`;
}

export function oidcLogoutUrl(): string {
  return `${OIDC.keycloakBase}/realms/${OIDC.realm}/protocol/openid-connect/logout`;
}
