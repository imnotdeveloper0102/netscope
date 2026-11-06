export const colors = {
  background: '#0B1220',
  backgroundSoft: '#111A2E',
  text: '#F2F2F7',
  textMuted: '#9AA3B2',
  textFaint: '#6B7280',
  accent: '#5B9DFF',
  accentSoft: 'rgba(91, 157, 255, 0.16)',
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF453A',
  glassBorder: 'rgba(255, 255, 255, 0.28)',
  glassFill: 'rgba(255, 255, 255, 0.08)',
  glassFillStrong: 'rgba(255, 255, 255, 0.14)',
  divider: 'rgba(255, 255, 255, 0.10)',
} as const;

export const radius = {
  card: 20,
  sheet: 24,
  button: 16,
  input: 16,
  pill: 999,
  small: 12,
} as const;

export const blur = {
  intensity: 55,
  tint: 'dark',
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export const spring = {
  damping: 14,
  stiffness: 400,
} as const;
