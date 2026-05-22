import { authHeaders } from './auth';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { headers: authHeaders() });
  if (response.status === 401) throw new Error('401 — Inicia sesión');
  if (response.status === 403) throw new Error('403 — Sin permiso');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
