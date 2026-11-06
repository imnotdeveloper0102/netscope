import { diffScans } from '../src/utils/diff';
import type { DeviceInfo, ScanRecord } from '../src/services/bridge/NetScopeBridge';

function device(ip: string): DeviceInfo {
  return { ip, hostname: null, mac: null, macUnavailableReason: null, latencyMs: null, isGateway: false, isSelf: false, isNew: false, vendor: null, customName: null, note: null, trusted: false, openPorts: [] };
}

function record(devices: DeviceInfo[]): ScanRecord {
  return { id: 1, timestamp: 1000, subnet: '192.168.1.0/24', deviceCount: devices.length, devices };
}

describe('diffScans', () => {
  test('detects new, disappeared and unchanged', () => {
    const oldScan = record([device('192.168.1.1'), device('192.168.1.2')]);
    const newScan = record([device('192.168.1.2'), device('192.168.1.3')]);
    const diff = diffScans(oldScan, newScan);
    expect(diff.newDevices.map((d) => d.ip)).toEqual(['192.168.1.3']);
    expect(diff.disappearedDevices.map((d) => d.ip)).toEqual(['192.168.1.1']);
    expect(diff.unchangedDevices.map((d) => d.ip)).toEqual(['192.168.1.2']);
  });
});
