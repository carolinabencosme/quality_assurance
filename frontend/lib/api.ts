import { getValidAccessToken, clearSession } from './auth';

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? '/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/?reason=session';
    }
    throw new ApiError('Sesión no válida', 401);
  }

  const response = await fetch(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (response.status === 401) {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/?reason=session';
    }
    throw new ApiError('Sesión expirada', 401);
  }
  if (response.status === 403) {
    throw new ApiError('Sin permiso para este recurso', 403);
  }
  if (!response.ok) {
    throw new ApiError(`Error del servidor (${response.status})`, response.status);
  }

  return response.json() as Promise<T>;
}
