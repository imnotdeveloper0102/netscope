import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GlassView, GlassButton } from './GlassView';
import { colors } from '../theme/tokens';

interface ScanProgressBarProps {
  scanned: number;
  total: number;
  scanning: boolean;
  onCancel: () => void;
}

export function ScanProgressBar({ scanned, total, scanning, onCancel }: ScanProgressBarProps) {
  const progress = total > 0 ? scanned / total : 0;
  const barStyle = useAnimatedStyle(() => ({
    width: `${withSpring(progress * 100, { damping: 20, stiffness: 200 })}%`,
  }));

  if (!scanning && scanned === 0) return null;

  return (
    <GlassView style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>
          {scanning ? `Đang quét ${scanned}/${total}` : `Xong ${scanned}/${total}`}
        </Text>
        {scanning ? <GlassButton label="Hủy" onPress={onCancel} /> : null}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  track: { height: 8, borderRadius: 999, backgroundColor: colors.divider, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 999, backgroundColor: colors.accent },
});
