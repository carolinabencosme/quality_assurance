import { apiGet, apiPut } from '@/lib/api';

export const MANAGED_REALM_ROLES = [
  'inventory-admin',
  'warehouse-manager',
  'inventory-clerk',
  'inventory-viewer',
] as const;

export type ManagedRealmRole = typeof MANAGED_REALM_ROLES[number];

export type KeycloakUser = {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  roles: ManagedRealmRole[];
};

export function listUsers(): Promise<KeycloakUser[]> {
  return apiGet<KeycloakUser[]>('/users');
}

export function setUserEnabled(id: string, enabled: boolean): Promise<KeycloakUser> {
  return apiPut<KeycloakUser>(`/users/${id}/enabled`, { enabled });
}

export function setUserRoles(id: string, roles: ManagedRealmRole[]): Promise<KeycloakUser> {
  return apiPut<KeycloakUser>(`/users/${id}/roles`, { roles });
}
