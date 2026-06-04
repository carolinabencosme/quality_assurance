import { axiosClient, ApiError } from './axiosClient';

export { ApiError };

export async function apiGet<T>(path: string): Promise<T> {
  const { data } = await axiosClient.get<T>(path);
  return data;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await axiosClient.post<T>(path, body);
  return data;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const { data } = await axiosClient.put<T>(path, body);
  return data;
}

export async function apiDelete(path: string): Promise<void> {
  await axiosClient.delete(path);
}
