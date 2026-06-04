import { getValidAccessToken, clearSession } from './auth';
import type { ApiErrorBody } from './types/api';

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

async function parseErrorMessage(response: Response): Promise<string> {
  let message = `Error del servidor (${response.status})`;
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.message) message = body.message;
  } catch {
    /* ignore non-JSON */
  }
  return message;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/?reason=session';
    }
    throw new ApiError('Sesión no válida', 401);
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
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
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path: string): Promise<void> {
  return apiRequest<void>(path, { method: 'DELETE' });
}
