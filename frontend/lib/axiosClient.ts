import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getValidAccessToken, clearSession } from './auth';
import type { ApiErrorBody } from './types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? '/api/v1').replace(/\/$/, '');

export const axiosClient = axios.create({
  baseURL: apiBase,
  headers: { Accept: 'application/json' },
});

function redirectToLogin() {
  clearSession();
  if (typeof window !== 'undefined') {
    window.location.href = '/?reason=session';
  }
}

function messageFromError(error: AxiosError<ApiErrorBody>): string {
  const data = error.response?.data;
  if (data?.message) return data.message;
  if (error.response?.status === 403) return 'Sin permiso para este recurso';
  if (error.response?.status) return `Error del servidor (${error.response.status})`;
  return error.message || 'Error de red';
}

axiosClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getValidAccessToken();
  if (!token) {
    redirectToLogin();
    return Promise.reject(new ApiError('Sesión no válida', 401));
  }
  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;

    if (status === 401) {
      redirectToLogin();
      return Promise.reject(new ApiError('Sesión expirada', 401));
    }

    if (status === 403) {
      return Promise.reject(
        new ApiError(
          error.response?.data?.message ?? 'Sin permiso para este recurso',
          403,
          error.response?.data?.correlationId,
        ),
      );
    }

    if (error.response) {
      return Promise.reject(
        new ApiError(
          messageFromError(error),
          status ?? 500,
          error.response.data?.correlationId,
        ),
      );
    }

    return Promise.reject(new ApiError(error.message || 'Error de red', 0));
  },
);
