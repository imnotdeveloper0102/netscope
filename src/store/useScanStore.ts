import { create } from 'zustand';
import { NetScopeBridge, type DeviceInfo, type NetworkInfo, type ScanRecord } from '../services/bridge/NetScopeBridge';

interface ScanState {
  networkInfo: NetworkInfo | null;
  devices: DeviceInfo[];
  scanning: boolean;
  scanned: number;
  total: number;
  lastScanAt: number | null;
  history: ScanRecord[];
  error: string | null;
  refreshNetworkInfo: () => Promise<void>;
  startScan: () => Promise<void>;
  cancelScan: () => void;
  loadHistory: () => Promise<void>;
  setDevices: (devices: DeviceInfo[]) => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  networkInfo: null,
  devices: [],
  scanning: false,
  scanned: 0,
  total: 0,
  lastScanAt: null,
  history: [],
  error: null,
  refreshNetworkInfo: async () => {
    try {
      const info = await NetScopeBridge.getNetworkInfo();
      set({ networkInfo: info, error: null });
    } catch (e: any) {
      set({ error: e?.message ?? 'Không đọc được thông tin mạng' });
    }
  },
  startScan: async () => {
    const { networkInfo } = get();
    if (!networkInfo?.ip) {
      set({ error: 'Chưa có IP Wi-Fi, kiểm tra lại kết nối' });
      return;
    }
    set({ scanning: true, scanned: 0, total: 254, devices: [], error: null });
    const progressSub = NetScopeBridge.onScanProgress((event) => {
      set({ scanned: event.scanned, total: event.total });
    });
    const deviceSub = NetScopeBridge.onDeviceFound((device) => {
      set((state) => ({ devices: [...state.devices, device] }));
    });
    const finishedSub = NetScopeBridge.onScanFinished((event) => {
      set({ scanning: false, lastScanAt: Date.now(), devices: event.devices });
    });
    try {
      await NetScopeBridge.startLanScan(networkInfo.ip, 24, 1000, 64);
      set({ scanning: false, lastScanAt: Date.now() });
      await get().loadHistory();
    } catch (e: any) {
      if (e?.code !== 'SCAN_CANCELLED') {
        set({ error: e?.message ?? 'Quét lỗi', scanning: false });
      } else {
        set({ scanning: false });
      }
    } finally {
      progressSub?.remove();
      deviceSub?.remove();
      finishedSub?.remove();
    }
  },
  cancelScan: () => {
    NetScopeBridge.cancelScan();
    set({ scanning: false });
  },
  loadHistory: async () => {
    try {
      const history = await NetScopeBridge.getScanHistory();
      set({ history });
    } catch (e: any) {
      set({ error: e?.message ?? 'Không đọc được lịch sử' });
    }
  },
  setDevices: (devices) => set({ devices }),
}));
