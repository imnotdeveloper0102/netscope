import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { GlassCard } from './GlassCard';
import { colors } from '../theme/tokens';
import type { WifiNetwork } from '../services/bridge/NetScopeBridge';

interface ChannelGraphProps {
  networks: WifiNetwork[];
  band: '2.4' | '5';
}

export function ChannelGraph({ networks, band }: ChannelGraphProps) {
  const channels = band === '2.4' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [36, 40, 44, 48, 149, 153, 157, 161];
  const counts = channels.map((ch) => networks.filter((n) => n.channel === ch).length);
  const max = Math.max(1, ...counts);
  const barWidth = 22;
  const gap = 6;
  const width = channels.length * (barWidth + gap);
  const height = 120;

  return (
    <GlassCard>
      <Text style={styles.title}>Kênh {band} GHz</Text>
      <Svg width={width} height={height}>
        {counts.map((count, i) => {
          const h = (count / max) * 80;
          return (
            <Rect
              key={channels[i]}
              x={i * (barWidth + gap)}
              y={height - 30 - h}
              width={barWidth}
              height={h}
              rx={6}
              fill={count === 0 ? colors.success : colors.accent}
            />
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {channels.map((ch) => (
          <Text key={ch} style={[styles.label, { width: barWidth + gap }]}>{ch}</Text>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  labels: { flexDirection: 'row', marginTop: 4 },
  label: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
