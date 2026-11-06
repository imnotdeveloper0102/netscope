import { useScanStore } from '../store/useScanStore';

export function useScan() {
  const scanning = useScanStore((s) => s.scanning);
  const scanned = useScanStore((s) => s.scanned);
  const total = useScanStore((s) => s.total);
  const devices = useScanStore((s) => s.devices);
  const startScan = useScanStore((s) => s.startScan);
  const cancelScan = useScanStore((s) => s.cancelScan);
  return { scanning, scanned, total, devices, startScan, cancelScan };
}
