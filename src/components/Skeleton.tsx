import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';

export function Skeleton() {
  const style = useAnimatedStyle(() => ({
    opacity: withRepeat(withTiming(0.5, { duration: 900 }), -1, true),
  }));
  return (
    <GlassCard>
      <Animated.View style={[styles.line, style]} />
      <Animated.View style={[styles.lineShort, style]} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  line: { height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 10 },
  lineShort: { height: 14, width: '60%', borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.12)' },
});
