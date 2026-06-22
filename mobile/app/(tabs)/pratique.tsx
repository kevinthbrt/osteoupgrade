import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GRADIENTS, usePaletteFor } from '@/lib/theme';

export default function PratiqueScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.container}>
          <LinearGradient colors={GRADIENTS.orange} style={s.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="fitness" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[s.title, { color: C.text }]}>Pratique</Text>
          <Text style={[s.muted, { color: C.textSecondary }]}>
            Vidéos de techniques par région — bientôt disponible.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  icon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  muted: { textAlign: 'center', fontSize: 14 },
});
