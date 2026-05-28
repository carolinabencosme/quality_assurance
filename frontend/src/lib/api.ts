import type { SetupInfo } from '@/types/setup';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

export async function getSetupInfo(): Promise<SetupInfo> {
  const response = await fetch(`${apiBase}/setup/info`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<SetupInfo>;
}
