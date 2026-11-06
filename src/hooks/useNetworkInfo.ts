import { useEffect } from 'react';
import { useScanStore } from '../store/useScanStore';

export function useNetworkInfo() {
  const networkInfo = useScanStore((s) => s.networkInfo);
  const refreshNetworkInfo = useScanStore((s) => s.refreshNetworkInfo);
  const error = useScanStore((s) => s.error);

  useEffect(() => {
    refreshNetworkInfo();
  }, [refreshNetworkInfo]);

  return { networkInfo, refreshNetworkInfo, error };
}
