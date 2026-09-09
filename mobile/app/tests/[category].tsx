import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import * as haptics from '@/lib/haptics';
import { metricColor, parseIndications, pctValue } from '@/lib/ortho';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Test = Tables<'orthopedic_tests'>;
type Cluster = Tables<'orthopedic_test_clusters'>;

const ALL = '__all__';

export default function TestCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const cat = decodeURIComponent(category ?? '');
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [tests, setTests] = useState<Test[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [indication, setIndication] = useState<string>(ALL);

  const load = useCallback(async () => {
    if (!cat) return;
    const [tRes, cRes] = await Promise.all([
      supabase.from('orthopedic_tests').select('*').eq('category', cat).order('name'),
      supabase.from('orthopedic_test_clusters').select('*').eq('region', cat),
    ]);
    setTests(tRes.data ?? []);
    setClusters(cRes.data ?? []);
    setLoading(false);
  }, [cat]);

  useEffect(() => { load(); }, [load]);

  // Indications distinctes de la région
  const indications = useMemo(() => {
    const set = new Set<string>();
    for (const t of tests) for (const ind of parseIndications(t.indications)) set.add(ind);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [tests]);

  const filtered = useMemo(() => {
    if (indication === ALL) return tests;
    return tests.filter((t) => parseIndications(t.indications).includes(indication));
  }, [tests, indication]);

  const pickIndication = (ind: string) => { haptics.selection(); setIndication(ind); };

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: C.text }]}>{cat}</Text>
            <Text style={[s.sub, { color: C.textSecondary }]}>
              {tests.length} test{tests.length > 1 ? 's' : ''}{clusters.length > 0 ? ` · ${clusters.length} cluster${clusters.length > 1 ? 's' : ''}` : ''}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : tests.length === 0 && clusters.length === 0 ? (
          <EmptyState icon="flask-outline" title="Aucun test" message={`Pas de test pour ${cat}.`} />
        ) : (
          <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]} showsVerticalScrollIndicator={false}>

            {/* Clusters de la région */}
            {clusters.length > 0 && (
              <>
                <Text style={[s.section, { color: C.text }]}>Clusters</Text>
                {clusters.map((cl) => (
                  <Pressable key={cl.id} onPress={() => router.push(`/ortho-cluster/${cl.id}`)}>
                    <GlassCard style={s.clusterCard}>
                      <LinearGradient colors={GRADIENTS.violet} style={s.clusterIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name="git-network" size={18} color="#fff" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.clusterName, { color: C.text }]} numberOfLines={2}>{cl.name}</Text>
                        {cl.sensitivity != null || cl.specificity != null ? (
                          <Text style={[s.clusterMeta, { color: C.textSecondary }]}>
                            Se {pctValue(cl.sensitivity)} · Sp {pctValue(cl.specificity)}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                    </GlassCard>
                  </Pressable>
                ))}
              </>
            )}

            {/* Filtre par indication */}
            {indications.length > 0 && (
              <>
                <Text style={[s.section, { color: C.text }]}>Indication</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsBar} contentContainerStyle={s.chipsRow}>
                  <Chip label="Voir tout" active={indication === ALL} onPress={() => pickIndication(ALL)} C={C} />
                  {indications.map((ind) => (
                    <Chip key={ind} label={ind} active={indication === ind} onPress={() => pickIndication(ind)} C={C} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Tests filtrés */}
            <Text style={[s.section, { color: C.text }]}>
              {indication === ALL ? 'Tous les tests' : indication} · {filtered.length}
            </Text>
            {filtered.map((t) => (
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
                    <Metric label="Sensibilité" value={pctValue(t.sensitivity)} color={metricColor(t.sensitivity)} C={C} />
                    <Metric label="Spécificité" value={pctValue(t.specificity)} color={metricColor(t.specificity)} C={C} />
                    <Metric label="RV+" value={t.rv_positive?.toFixed(1) ?? '—'} color={C.text} C={C} />
                    <Metric label="RV−" value={t.rv_negative?.toFixed(2) ?? '—'} color={C.text} C={C} />
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

function Chip({ label, active, onPress, C }: { label: string; active: boolean; onPress: () => void; C: ReturnType<typeof usePaletteFor> }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, { borderColor: active ? BRAND : C.border, backgroundColor: active ? BRAND : C.card }]}>
      <Text style={[s.chipText, { color: active ? '#fff' : C.text }]} numberOfLines={1}>{label}</Text>
    </Pressable>
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
  section: { fontSize: 16, fontWeight: '700', marginTop: 4 },

  clusterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  clusterIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  clusterName: { fontSize: 15, fontWeight: '700' },
  clusterMeta: { fontSize: 12, marginTop: 2 },

  chipsBar: { flexGrow: 0, flexShrink: 0 },
  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2, paddingRight: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, maxWidth: 260 },
  chipText: { fontSize: 13, fontWeight: '600' },

  card: { padding: 14, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 16, fontWeight: '800' },
  metricLabel: { fontSize: 10, marginTop: 1 },
});
