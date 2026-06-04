const ACCESS_COOKIE = 'inventory_access';
const KEYCLOAK_CLIENT = 'inventory-backend';

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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractRoles(payload: Record<string, unknown>): string[] {
  const roles: string[] = [];

  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  if (realmAccess?.roles) roles.push(...realmAccess.roles);

  const resourceAccess = payload.resource_access as Record<string, { roles?: string[] }> | undefined;
  const clientRoles = resourceAccess?.[KEYCLOAK_CLIENT]?.roles;
  if (clientRoles) roles.push(...clientRoles);

  return roles;
}

export function hasPermission(permission: string): boolean {
  const token = readAccessFromCookie();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  return extractRoles(payload).includes(permission);
}

export function canManageProducts(): boolean {
  return hasPermission('product:manage');
}
