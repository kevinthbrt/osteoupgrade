import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Test = Tables<'orthopedic_tests'>;

// Petit indicateur sens/spéc coloré (repère de qualité diagnostique)
function metricColor(v: number | null): string {
  if (v == null) return '#94a3b8';
  if (v >= 0.8) return '#16a34a';
  if (v >= 0.6) return '#f59e0b';
  return '#ef4444';
}
function pct(v: number | null): string {
  return v == null ? '—' : `${Math.round(v * 100)}%`;
}

export default function TestCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const cat = decodeURIComponent(category ?? '');
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!cat) return;
    const { data } = await supabase
      .from('orthopedic_tests')
      .select('*')
      .eq('category', cat)
      .order('name');
    setTests(data ?? []);
    setLoading(false);
  }, [cat]);

  useEffect(() => { load(); }, [load]);

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: C.text }]}>{cat}</Text>
            <Text style={[s.sub, { color: C.textSecondary }]}>{tests.length} test{tests.length > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : tests.length === 0 ? (
          <EmptyState icon="flask-outline" title="Aucun test" message={`Pas de test pour ${cat}.`} />
        ) : (
          <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]} showsVerticalScrollIndicator={false}>
            {tests.map((t) => (
              <Pressable key={t.id} onPress={() => router.push(`/ortho-test/${t.id}`)}>
                <GlassCard style={s.card}>
                  <View style={s.cardHead}>
                    <LinearGradient colors={GRADIENTS.green} style={s.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name="body" size={18} color="#fff" />
                    </LinearGradient>
                    <Text style={[s.cardTitle, { color: C.text }]} numberOfLines={2}>{t.name}</Text>
                    {t.video_url ? <Ionicons name="play-circle" size={18} color={C.textMuted} /> : null}
                  </View>
                  <View style={s.metrics}>
                    <Metric label="Sensibilité" value={pct(t.sensitivity)} color={metricColor(t.sensitivity)} C={C} />
                    <Metric label="Spécificité" value={pct(t.specificity)} color={metricColor(t.specificity)} C={C} />
                    <Metric label="RV+" value={t.rv_positive?.toFixed(1) ?? '—'} color={C.text} C={C} />
                    <Metric label="RV−" value={t.rv_negative?.toFixed(1) ?? '—'} color={C.text} C={C} />
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function Metric({ label, value, color, C }: { label: string; value: string; color: string; C: ReturnType<typeof usePaletteFor> }) {
  return (
    <View style={s.metric}>
      <Text style={[s.metricValue, { color }]}>{value}</Text>
      <Text style={[s.metricLabel, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 1 },
  scroll: { padding: 16, gap: 12 },
  card: { padding: 14, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 16, fontWeight: '800' },
  metricLabel: { fontSize: 10, marginTop: 1 },
});
