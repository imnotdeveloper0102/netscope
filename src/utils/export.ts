import type { DeviceInfo } from '../services/bridge/NetScopeBridge';

export function devicesToCsv(devices: DeviceInfo[]): string {
  const lines = ['ip,hostname,mac,latencyMs,isGateway,isSelf'];
  for (const d of devices) {
    lines.push(`${d.ip},${d.hostname ?? ''},${d.mac ?? ''},${d.latencyMs ?? ''},${d.isGateway},${d.isSelf}`);
  }
  return lines.join('\n');
}

export function devicesToJson(devices: DeviceInfo[]): string {
  return JSON.stringify(devices, null, 2);
}
