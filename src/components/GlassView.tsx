import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, spring } from '../theme/tokens';

interface GlassViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
}

/**
 * Khung kính của riêng NetScope, viết mới trong app này, không dùng
 * thư viện ReactNative-UI. Một lớp BlurView duy nhất làm nền mờ thật,
 * kèm viền trắng mờ, bo cong và bóng nhẹ. Không lồng 2 lớp blur.
 */
export function GlassView({ children, style, intensity = 55, borderRadius = radius.card }: GlassViewProps) {
  return (
    <View style={[styles.glass, { borderRadius }, style]}>
      <BlurView intensity={intensity} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius }]} />
      <View style={[styles.content, { borderRadius }]}>{children}</View>
    </View>
  );
}

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  primary?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Nút kính: bấm vào co lại kiểu spring, thả ra nảy về kích thước cũ. */
export function GlassButton({ label, onPress, primary, style }: GlassButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.93, spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring);
      }}
      onPress={onPress}
      style={style}>
      <Animated.View style={[styles.button, primary && styles.buttonPrimary, animatedStyle]}>
        <Text style={[styles.buttonText, primary ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  content: {
    overflow: 'hidden',
  },
  button: {
    borderRadius: radius.button,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
  },
  buttonPrimary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonTextPrimary: { color: '#000000' },
  buttonTextSecondary: { color: '#FFFFFF' },
});
