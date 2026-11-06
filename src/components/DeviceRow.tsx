import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { colors } from '../theme/tokens';
import { formatLatency } from '../utils/format';
import type { DeviceInfo } from '../services/bridge/NetScopeBridge';

interface DeviceRowProps {
  device: DeviceInfo;
  onPress: (device: DeviceInfo) => void;
}

export function DeviceRow({ device, onPress }: DeviceRowProps) {
  const name = device.customName || device.hostname || device.vendor || device.ip;
  return (
    <Pressable onPress={() => onPress(device)}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.ip}>{device.ip}</Text>
            <Text style={styles.meta}>
              {device.isGateway ? 'Router' : device.isSelf ? 'Thiết bị này' : ''}{' '}
              {device.isNew ? '• Mới' : ''}{' '}
              {device.trusted ? '• Tin cậy' : ''}
            </Text>
          </View>
          <Text style={styles.latency}>{formatLatency(device.latencyMs)}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  main: { flex: 1, marginRight: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  ip: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  meta: { color: colors.textFaint, fontSize: 12, marginTop: 4 },
  latency: { color: colors.accent, fontSize: 14, fontWeight: '600' },
});
