import { create } from 'zustand';

interface SettingsState {
  strangerCheckEnabled: boolean;
  scanTimeoutMs: number;
  scanConcurrency: number;
  language: 'vi' | 'en';
  firstRunWarningSeen: boolean;
  setStrangerCheckEnabled: (enabled: boolean) => void;
  setScanTimeoutMs: (value: number) => void;
  setScanConcurrency: (value: number) => void;
  setLanguage: (language: 'vi' | 'en') => void;
  setFirstRunWarningSeen: (seen: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  strangerCheckEnabled: false,
  scanTimeoutMs: 1000,
  scanConcurrency: 64,
  language: 'vi',
  firstRunWarningSeen: false,
  setStrangerCheckEnabled: (enabled) => set({ strangerCheckEnabled: enabled }),
  setScanTimeoutMs: (value) => set({ scanTimeoutMs: value }),
  setScanConcurrency: (value) => set({ scanConcurrency: value }),
  setLanguage: (language) => set({ language }),
  setFirstRunWarningSeen: (seen) => set({ firstRunWarningSeen: seen }),
}));
