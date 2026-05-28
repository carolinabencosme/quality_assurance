import { useCallback, useEffect, useState } from 'react';

import { getSetupInfo } from '@/lib/api';
import type { SetupInfo } from '@/types/setup';

export function useSetupInfo() {
  const [info, setInfo] = useState<SetupInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSetupInfo();
      setInfo(data);
    } catch (e) {
      setInfo(null);
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { info, error, loading, reload: load };
}
