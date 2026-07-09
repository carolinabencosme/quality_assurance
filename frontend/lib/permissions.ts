const ACCESS_COOKIE = 'inventory_access';
const KEYCLOAK_CLIENT =
  process.env.NEXT_PUBLIC_KEYCLOAK_API_CLIENT_ID ?? 'inventory-api';

export const BUSINESS_SCOPES = [
  'product:view',
  'product:manage',
  'stock:view',
  'stock:manage',
  'report:view',
  'user:manage',
  'audit:view',
] as const;

/** Espejo de composites en keycloak/realm-export.json */
const REALM_ROLE_PERMISSIONS: Record<string, string[]> = {
  'inventory-admin': [
    'product:view', 'product:manage', 'stock:view', 'stock:manage',
    'report:view', 'audit:view', 'user:manage',
  ],
  'warehouse-manager': [
    'product:view', 'product:manage', 'stock:view', 'stock:manage', 'report:view',
  ],
  'inventory-clerk': ['product:view', 'stock:view', 'stock:manage'],
  'inventory-viewer': ['product:view', 'stock:view', 'report:view'],
};

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
  const roles = new Set<string>();

  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  if (realmAccess?.roles) {
    for (const realmRole of realmAccess.roles) {
      const perms = REALM_ROLE_PERMISSIONS[realmRole];
      if (perms) perms.forEach((permission) => roles.add(permission));
    }
  }

  const resourceAccess = payload.resource_access as Record<string, { roles?: string[] }> | undefined;
  const clientRoles = resourceAccess?.[KEYCLOAK_CLIENT]?.roles;
  if (clientRoles) clientRoles.forEach((role) => roles.add(role));

  const hasRoleBackedPermissions = Array.from(roles).some((role) =>
    BUSINESS_SCOPES.includes(role as typeof BUSINESS_SCOPES[number]),
  );
  const scope = payload.scope;
  const scopeCandidates: string[] = [];
  if (typeof scope === 'string') {
    scopeCandidates.push(...scope.split(/\s+/));
  } else if (Array.isArray(scope)) {
    scopeCandidates.push(...scope.filter((candidate): candidate is string => typeof candidate === 'string'));
  }
  for (const candidate of scopeCandidates) {
    if (!BUSINESS_SCOPES.includes(candidate as typeof BUSINESS_SCOPES[number])) continue;
    if (hasRoleBackedPermissions && !roles.has(candidate)) continue;
    roles.add(candidate);
  }

  return Array.from(roles);
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

export function canManageUsers(): boolean {
  return hasPermission('user:manage');
}

export function canViewAudit(): boolean {
  return hasPermission('audit:view');
}

export function canManageStock(): boolean {
  return hasPermission('stock:manage');
}

export function canViewStock(): boolean {
  return hasPermission('stock:view') || canManageStock();
}
