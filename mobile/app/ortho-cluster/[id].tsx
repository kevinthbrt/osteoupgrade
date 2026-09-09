import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import type { Tables } from '@/lib/database.types';
import { metricColor, pctValue } from '@/lib/ortho';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Cluster = Tables<'orthopedic_test_clusters'>;
type Test = Tables<'orthopedic_tests'>;

export default function ClusterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [clRes, itemsRes] = await Promise.all([
        supabase.from('orthopedic_test_clusters').select('*').eq('id', id).maybeSingle(),
        supabase.from('orthopedic_test_cluster_items').select('test_id, order_index').eq('cluster_id', id).order('order_index'),
      ]);
      setCluster(clRes.data);
      const testIds = (itemsRes.data ?? []).map((i) => i.test_id);
      if (testIds.length) {
        const { data } = await supabase.from('orthopedic_tests').select('*').in('id', testIds);
        // Respecte l'ordre du cluster
        const order = new Map(testIds.map((tid, i) => [tid, i]));
        setTests((data ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)));
      }
      setLoading(false);
    })();
  }, [id]);

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: C.text }]} numberOfLines={2}>{cluster?.name ?? 'Cluster'}</Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Métriques du cluster */}
            {cluster && (cluster.sensitivity != null || cluster.specificity != null) && (
              <GlassCard style={s.metricsCard}>
                <Text style={[s.cardTitle, { color: C.text }]}>Valeurs du cluster</Text>
                <View style={s.metricsRow}>
                  <Metric label="Sensibilité" value={pctValue(cluster.sensitivity)} color={metricColor(cluster.sensitivity)} C={C} />
                  <Metric label="Spécificité" value={pctValue(cluster.specificity)} color={metricColor(cluster.specificity)} C={C} />
                  <Metric label="RV+" value={cluster.rv_positive?.toFixed(2) ?? '—'} color={C.text} C={C} />
                  <Metric label="RV−" value={cluster.rv_negative?.toFixed(2) ?? '—'} color={C.text} C={C} />
                </View>
              </GlassCard>
            )}

            {cluster?.description ? <Section title="Description" body={cluster.description} icon="document-text" C={C} /> : null}
            {cluster?.indications ? <Section title="Indications" body={cluster.indications} icon="alert-circle" C={C} /> : null}
            {cluster?.interest ? <Section title="Intérêt clinique" body={cluster.interest} icon="bulb" C={C} /> : null}

            {/* Tests du cluster */}
            <Text style={[s.section, { color: C.text }]}>Tests du cluster · {tests.length}</Text>
            {tests.map((t, i) => (
              <Pressable key={t.id} onPress={() => router.push(`/ortho-test/${t.id}`)}>
                <GlassCard style={s.testRow}>
                  <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.testName, { color: C.text }]} numberOfLines={2}>{t.name}</Text>
                    <Text style={[s.testMeta, { color: C.textSecondary }]}>Se {pctValue(t.sensitivity)} · Sp {pctValue(t.specificity)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
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

function Section({ title, body, icon, C }: { title: string; body: string; icon: keyof typeof Ionicons.glyphMap; C: ReturnType<typeof usePaletteFor> }) {
  return (
    <GlassCard style={s.sectionCard}>
      <View style={s.sectionHead}>
        <Ionicons name={icon} size={16} color={BRAND} />
        <Text style={[s.cardTitle, { color: C.text }]}>{title}</Text>
      </View>
      <Text style={[s.sectionBody, { color: C.textSecondary }]}>{body.replace(/<[^>]*>/g, '')}</Text>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  scroll: { padding: 16, gap: 14, paddingBottom: 100 },
  metricsCard: { padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { fontSize: 10, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  sectionCard: { padding: 16, gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBody: { fontSize: 14, lineHeight: 20 },
  testRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  testName: { fontSize: 14, fontWeight: '600' },
  testMeta: { fontSize: 12, marginTop: 2 },
});
