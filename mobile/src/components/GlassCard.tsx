import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useColorScheme, View, type ViewStyle } from 'react-native';

import { usePaletteFor } from '@/lib/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  intensity?: number;
  radius?: number;
};

/**
 * Surface "liquid glass" : BlurView + voile translucide + bordure subtile.
 * Aligné sur la classe .glass-card du site web.
 */
export function GlassCard({ children, style, onPress, intensity, radius = 20 }: Props) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const C = usePaletteFor(scheme);
  const Wrapper: typeof Pressable | typeof View = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        { borderRadius: radius, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.glassBorder },
        style as ViewStyle,
      ]}>
      <BlurView
        intensity={intensity ?? (dark ? 30 : 50)}
        tint={dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.glassOverlay }]} />
      {children}
    </Wrapper>
  );
}
