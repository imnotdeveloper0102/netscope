import { useSettingsStore } from '../src/store/useSettingsStore';

describe('settings store', () => {
  test('defaults are Vietnamese, timeout 1000ms, stranger check off', () => {
    const state = useSettingsStore.getState();
    expect(state.language).toBe('vi');
    expect(state.scanTimeoutMs).toBe(1000);
    expect(state.scanConcurrency).toBe(64);
    expect(state.strangerCheckEnabled).toBe(false);
    expect(state.firstRunWarningSeen).toBe(false);
  });

  test('setLanguage switches to English', () => {
    useSettingsStore.getState().setLanguage('en');
    expect(useSettingsStore.getState().language).toBe('en');
    useSettingsStore.getState().setLanguage('vi');
  });
});
