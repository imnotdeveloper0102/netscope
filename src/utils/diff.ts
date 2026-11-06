import type { DeviceInfo, ScanRecord } from '../services/bridge/NetScopeBridge';

export interface LocalDiff {
  newDevices: DeviceInfo[];
  disappearedDevices: DeviceInfo[];
  unchangedDevices: DeviceInfo[];
}

export function diffScans(oldScan: ScanRecord, newScan: ScanRecord): LocalDiff {
  const oldByIp = new Map(oldScan.devices.map((d) => [d.ip, d]));
  const newByIp = new Map(newScan.devices.map((d) => [d.ip, d]));
  return {
    newDevices: newScan.devices.filter((d) => !oldByIp.has(d.ip)),
    disappearedDevices: oldScan.devices.filter((d) => !newByIp.has(d.ip)),
    unchangedDevices: newScan.devices.filter((d) => oldByIp.has(d.ip)),
  };
}
