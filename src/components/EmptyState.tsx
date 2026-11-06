import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { GlassCard } from './GlassCard';
import { colors } from '../theme/tokens';

export function EmptyState({ message }: { message: string }) {
  return (
    <GlassCard>
      <Text style={styles.text}>{message}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 15, textAlign: 'center', paddingVertical: 8 },
});
