import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassView';
import { NetScopeBridge, COMMON_PORTS, type PortResult } from '../services/bridge/NetScopeBridge';
import { useSettingsStore } from '../store/useSettingsStore';
import { getStrings } from '../i18n';
import { colors, spacing } from '../theme/tokens';
import { formatLatency } from '../utils/format';
import type { RootParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootParamList, 'DeviceDetail'>;

export function DeviceDetailScreen({ route, navigation }: Props) {
  const { device } = route.params;
  const language = useSettingsStore((s) => s.language);
  const t = getStrings(language);
  const [ports, setPorts] = useState<PortResult[]>([]);
  const [name, setName] = useState(device.customName ?? '');
  const [note, setNote] = useState(device.note ?? '');
  const [trusted, setTrusted] = useState(device.trusted);
  const [scanning, setScanning] = useState(false);

  const scanPorts = async () => {
    setScanning(true);
    try {
      const results = await NetScopeBridge.scanPorts(device.ip, COMMON_PORTS, 1000);
      setPorts(results);
    } catch (e: any) {
      setPorts([]);
    } finally {
      setScanning(false);
    }
  };

  const save = async () => {
    await NetScopeBridge.saveDeviceName(device.ip, name, note);
    await NetScopeBridge.setDeviceTrusted(device.ip, trusted);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GlassButton label={t.common.back} onPress={() => navigation.goBack()} />
      <Text style={styles.title}>{device.customName || device.hostname || device.ip}</Text>
      <GlassCard>
        <Text style={styles.row}>IP: {device.ip}</Text>
        <Text style={styles.row}>Hostname: {device.hostname ?? 'Không khả dụng'}</Text>
        <Text style={styles.row}>MAC: {device.mac ?? device.macUnavailableReason ?? 'Không khả dụng'}</Text>
        <Text style={styles.row}>Hãng: {device.vendor ?? 'Không khả dụng'}</Text>
        <Text style={styles.row}>Độ trễ: {formatLatency(device.latencyMs)}</Text>
        <Text style={styles.row}>{device.isGateway ? 'Router' : device.isSelf ? 'Thiết bị này' : ''}</Text>
      </GlassCard>
      <TextInput style={styles.input} placeholder="Tên riêng" placeholderTextColor={colors.textFaint} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Ghi chú" placeholderTextColor={colors.textFaint} value={note} onChangeText={setNote} />
      <View style={styles.rowButtons}>
        <GlassButton label={trusted ? 'Đã tin cậy' : 'Đánh dấu tin cậy'} primary={trusted} onPress={() => setTrusted(!trusted)} />
        <GlassButton label={t.common.save} primary onPress={save} />
      </View>
      <GlassButton label={scanning ? 'Đang quét cổng...' : 'Quét cổng phổ biến'} onPress={scanPorts} />
      {ports.map((port) => (
        <GlassCard key={port.port}>
          <Text style={styles.row}>{port.port} {port.service ? `(${port.service})` : ''} — {port.state}</Text>
          {port.banner ? <Text style={styles.banner}>{port.banner}</Text> : null}
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  row: { color: colors.text, fontSize: 14, paddingVertical: 4 },
  banner: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  input: { backgroundColor: colors.glassFill, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, color: colors.text, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  rowButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
