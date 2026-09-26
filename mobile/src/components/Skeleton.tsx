import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useColorScheme, View, type ViewStyle } from 'react-native';

/**
 * Bloc de chargement animé (shimmer d'opacité). Sert à composer des skeletons
 * plus fidèles au contenu qu'un simple spinner.
 */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { backgroundColor: dark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)', borderRadius: 10, opacity },
        style,
      ]}
    />
  );
}

/** Skeleton d'une carte "liste" (vignette + 2 lignes) — réutilisé cours/pratique. */
export function ListCardSkeleton() {
  return (
    <View style={s.card}>
      <Skeleton style={{ width: 84, height: 84, borderRadius: 14 }} />
      <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
        <Skeleton style={{ width: '75%', height: 15 }} />
        <Skeleton style={{ width: '50%', height: 12 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 20 },
});
