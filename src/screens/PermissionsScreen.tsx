import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassView';
import { usePermissions, type PermissionStatus } from '../hooks/usePermissions';
import { colors, spacing } from '../theme/tokens';

const statusText: Record<PermissionStatus, string> = {
  granted: 'Đã cấp quyền',
  denied: 'Đã từ chối, có thể xin lại',
  blocked: 'Đã từ chối vĩnh viễn, cần mở Cài đặt hệ thống',
  unavailable: 'Thiết bị không hỗ trợ quyền này',
  unknown: 'Chưa kiểm tra',
};

export function PermissionsScreen() {
  const { status, checkLocation, requestLocation, openSettings } = usePermissions();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkLocation().then(() => setChecked(true));
  }, [checkLocation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quyền cần thiết</Text>
      <GlassCard>
        <Text style={styles.body}>NetScope cần quyền vị trí để đọc tên Wi-Fi và quét mạng xung quanh. Android yêu cầu quyền này cho Wi-Fi, không phải để theo dõi vị trí của bạn.</Text>
        <Text style={styles.body}>Nếu dịch vụ vị trí đang tắt, bật Vị trí trong Cài đặt hệ thống rồi quay lại.</Text>
        <Text style={styles.status}>Trạng thái: {checked ? statusText[status] : 'Đang kiểm tra...'}</Text>
      </GlassCard>
      <GlassButton label="Xin quyền vị trí" primary onPress={requestLocation} />
      <GlassButton label="Mở Cài đặt hệ thống" onPress={openSettings} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  status: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
