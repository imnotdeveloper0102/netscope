import React, { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView } from './GlassView';
import { spacing } from '../theme/tokens';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Thẻ kính dùng chung cho 5 tab: padding 16, bo 20, 1 lớp blur. */
export function GlassCard({ children, style }: GlassCardProps) {
  return <GlassView style={[styles.card, style]}>{children}</GlassView>;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
});
