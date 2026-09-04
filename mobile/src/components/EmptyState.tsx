import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { GRADIENTS, usePaletteFor } from '@/lib/theme';

/**
 * État vide / erreur soigné et réutilisable.
 * `variant` change la couleur de l'icône (info neutre vs erreur).
 */
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  variant = 'info',
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  variant?: 'info' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}) {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const grad = variant === 'error' ? GRADIENTS.red : GRADIENTS.brand;

  return (
    <View style={s.wrap}>
      <LinearGradient colors={grad} style={s.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={30} color="#fff" />
      </LinearGradient>
      <Text style={[s.title, { color: C.text }]}>{title}</Text>
      {message ? <Text style={[s.msg, { color: C.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={[s.btn, { borderColor: C.border }]}>
          <Ionicons name="refresh" size={16} color={C.text} />
          <Text style={[s.btnText, { color: C.text }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  icon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  msg: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginTop: 4 },
  btnText: { fontSize: 14, fontWeight: '600' },
});
