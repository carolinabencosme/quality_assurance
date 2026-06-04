import { getAccessToken } from '@/lib/auth';

type JwtPayload = {
  preferred_username?: string;
  sub?: string;
  name?: string;
  email?: string;
  realm_access?: { roles?: string[] };
};

export type SessionUser = {
  username: string;
  name: string | null;
  email: string | null;
  initials: string;
  roles: string[];
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as JwtPayload;
  } catch {
    return null;
  }
}

function initialsFrom(username: string, name: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function getSessionUser(): SessionUser | null {
  const token = getAccessToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const username = payload.preferred_username ?? payload.sub ?? 'usuario';
  const name = payload.name?.trim() || null;
  const email = payload.email?.trim() || null;
  const roles = payload.realm_access?.roles ?? [];

  return {
    username,
    name,
    email,
    initials: initialsFrom(username, name),
    roles,
  };
}
