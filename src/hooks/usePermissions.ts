import { useCallback, useState } from 'react';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'unknown';

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>('unknown');

  const permissionName = (): any => {
    if (Number(Platform.Version) >= 33) return PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES;
    return PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  };

  const checkLocation = useCallback(async (): Promise<PermissionStatus> => {
    if (Platform.OS !== 'android') return 'unavailable';
    try {
      const granted = await PermissionsAndroid.check(permissionName());
      const mapped: PermissionStatus = granted ? 'granted' : 'denied';
      setStatus(mapped);
      return mapped;
    } catch {
      setStatus('unknown');
      return 'unknown';
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<PermissionStatus> => {
    if (Platform.OS !== 'android') return 'unavailable';
    try {
      const result = await PermissionsAndroid.request(permissionName(), {
        title: 'Quyền vị trí',
        message: 'NetScope cần quyền vị trí để đọc tên Wi-Fi và quét mạng xung quanh.',
        buttonPositive: 'Cho phép',
        buttonNegative: 'Từ chối',
      });
      const mapped: PermissionStatus =
        result === PermissionsAndroid.RESULTS.GRANTED ? 'granted'
        : result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked'
        : 'denied';
      setStatus(mapped);
      return mapped;
    } catch {
      setStatus('unknown');
      return 'unknown';
    }
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return { status, checkLocation, requestLocation, openSettings };
}
