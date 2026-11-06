import { NativeEventEmitter, NativeModules } from 'react-native';

export interface DeviceInfo {
  ip: string;
  hostname: string | null;
  mac: string | null;
  macUnavailableReason: string | null;
  latencyMs: number | null;
  isGateway: boolean;
  isSelf: boolean;
  isNew: boolean;
  vendor: string | null;
  customName: string | null;
  note: string | null;
  trusted: boolean;
  openPorts: number[];
}

export interface NetworkInfo {
  ssid: string | null;
  ssidUnavailableReason: string | null;
  bssid: string | null;
  ip: string | null;
  subnetMask: string | null;
  gateway: string | null;
  dns1: string | null;
  dns2: string | null;
  frequencyMhz: number | null;
  channel: number | null;
  band: string | null;
  linkSpeedMbps: number | null;
  rssiDbm: number | null;
}

export interface WifiNetwork {
  ssid: string;
  bssid: string;
  frequencyMhz: number;
  channel: number;
  levelDbm: number;
  capabilities: string;
}

export interface WifiScan {
  throttled: boolean;
  nextAllowedInMs?: number;
  unavailableReason?: string;
  suggestedChannel24?: number;
  suggestedChannel5?: number;
  networks: WifiNetwork[];
}

export interface PortResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  latencyMs: number | null;
  banner: string | null;
  service: string | null;
}

export interface ScanRecord {
  id: number;
  timestamp: number;
  subnet: string;
  deviceCount: number;
  devices: DeviceInfo[];
}

export interface ScanDiff {
  newDevices: DeviceInfo[];
  disappearedDevices: DeviceInfo[];
  unchangedDevices: DeviceInfo[];
}

const NetScope = NativeModules.NetScope;
const emitter = NetScope ? new NativeEventEmitter<any>(NetScope) : null;

function requireNative(): any {
  if (!NetScope) {
    throw new Error('NetScope native module chưa khả dụng, cần build EAS sau prebuild');
  }
  return NetScope;
}

export const NetScopeBridge = {
  isAvailable(): boolean {
    return !!NetScope;
  },
  getNetworkInfo(): Promise<NetworkInfo> {
    return requireNative().getNetworkInfo();
  },
  getWifiInfo(): Promise<NetworkInfo> {
    return requireNative().getWifiInfo();
  },
  startLanScan(localIp: string, prefix: number, timeoutMs = 1000, concurrency = 64): Promise<number> {
    return requireNative().startLanScan(localIp, prefix, timeoutMs, concurrency);
  },
  cancelScan(): void {
    requireNative().cancelScan();
  },
  scanPorts(ip: string, ports: number[], timeoutMs = 1000): Promise<PortResult[]> {
    return requireNative().scanPorts(ip, ports, timeoutMs);
  },
  getWifiNetworks(): Promise<WifiScan> {
    return requireNative().getWifiNetworks();
  },
  pingHost(host: string, count = 4): Promise<{ host: string; sent: number; received: number; packetLossPercent: number; minMs: number | null; avgMs: number | null; maxMs: number | null; latenciesMs: (number | null)[] }> {
    return requireNative().pingHost(host, count);
  },
  traceroute(host: string, maxHops = 30): Promise<{ hop: number; ip: string | null; latencyMs: number | null }[]> {
    return requireNative().traceroute(host, maxHops);
  },
  dnsLookup(host: string): Promise<{ host: string; addresses: string[]; lookupMs: number }> {
    return requireNative().dnsLookup(host);
  },
  wakeOnLan(mac: string, broadcastIp = '255.255.255.255'): Promise<boolean> {
    return requireNative().wakeOnLan(mac, broadcastIp);
  },
  getScanHistory(): Promise<ScanRecord[]> {
    return requireNative().getScanHistory();
  },
  saveDeviceName(key: string, name: string, note: string): Promise<boolean> {
    return requireNative().saveDeviceName(key, name, note);
  },
  setDeviceTrusted(key: string, trusted: boolean): Promise<boolean> {
    return requireNative().setDeviceTrusted(key, trusted);
  },
  compareScans(firstIndex: number, secondIndex: number): Promise<ScanDiff> {
    return requireNative().compareScans(firstIndex, secondIndex);
  },
  exportScan(index: number, format: 'csv' | 'json'): Promise<string> {
    return requireNative().exportScan(index, format);
  },
  setStrangerCheckEnabled(enabled: boolean): Promise<boolean> {
    return requireNative().setStrangerCheckEnabled(enabled);
  },
  onScanProgress(listener: (event: { scanned: number; total: number }) => void) {
    return emitter?.addListener('NetScopeScanProgress', listener);
  },
  onDeviceFound(listener: (device: DeviceInfo) => void) {
    return emitter?.addListener('NetScopeDeviceFound', listener);
  },
  onScanFinished(listener: (event: { total: number; devices: DeviceInfo[] }) => void) {
    return emitter?.addListener('NetScopeScanFinished', listener);
  },
};

export const COMMON_PORTS = [21, 22, 23, 53, 80, 443, 445, 554, 3306, 3389, 5432, 6379, 8080, 8443];
