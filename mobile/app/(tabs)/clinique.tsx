import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BodyMap, NON_BODY_CATEGORIES } from '@/components/BodyMap';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import * as haptics from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';
import { TOPO_CATEGORIES, topoRegionLabel } from '@/lib/topography';

type Segment = 'tests' | 'topo';

const TOPO_CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Tête et Cou': 'person',
  'Membre Supérieur': 'body',
  Tronc: 'body',
  'Membre Inférieur': 'walk',
  Général: 'pulse',
};

export default function CliniqueScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const [segment, setSegment] = useState<Segment>('tests');

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Text style={[s.title, { color: C.text }]}>Clinique</Text>
          <View style={[s.segmented, { backgroundColor: C.card, borderColor: C.border }]}>
            <SegmentBtn label="Tests" icon="body" active={segment === 'tests'} onPress={() => setSegment('tests')} />
            <SegmentBtn label="Topographie" icon="map" active={segment === 'topo'} onPress={() => setSegment('topo')} />
          </View>
        </View>

        {segment === 'tests' ? <TestsPanel C={C} /> : <TopographiePanel C={C} />}
      </SafeAreaView>
    </LinearGradient>
  );
}

function SegmentBtn({ label, icon, active, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => { haptics.selection(); onPress(); }} style={[s.segmentBtn, active && s.segmentBtnActive]}>
      <Ionicons name={icon} size={14} color={active ? '#fff' : '#64748b'} />
      <Text style={[s.segmentText, active && s.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ── Panneau Tests orthopédiques ──────────────────────────────────────────────
function TestsPanel({ C }: { C: ReturnType<typeof usePaletteFor> }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('orthopedic_tests').select('category');
    const map: Record<string, number> = {};
    for (const row of data ?? []) {
      const cat = (row as { category: string | null }).category;
      if (cat) map[cat] = (map[cat] ?? 0) + 1;
    }
    setCounts(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const available = new Set(Object.keys(counts));
  const nonBody = NON_BODY_CATEGORIES.filter((c) => available.has(c));

  const open = (category: string) => {
    haptics.selection();
    setSelected(category);
    router.push(`/tests/${encodeURIComponent(category)}`);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>;
  if (Object.keys(counts).length === 0) {
    return <EmptyState icon="body-outline" title="Aucun test" message="Les tests orthopédiques apparaîtront ici." />;
  }

  return (
    <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]} showsVerticalScrollIndicator={false}>
      <Text style={[s.panelHint, { color: C.textSecondary }]}>Touche une région du corps</Text>

      <View style={s.bodyWrap}>
        <BodyMap available={available} selected={selected} onSelect={open} width={230} />
      </View>

      {nonBody.length > 0 && (
        <>
          <Text style={[s.section, { color: C.text }]}>Autres tests</Text>
          <View style={s.chips}>
            {nonBody.map((cat) => (
              <Pressable key={cat} onPress={() => open(cat)}>
                <GlassCard style={s.chip}>
                  <LinearGradient colors={GRADIENTS.violet} style={s.chipIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="pulse" size={16} color="#fff" />
                  </LinearGradient>
                  <Text style={[s.chipText, { color: C.text }]}>{cat}</Text>
                  <Text style={[s.chipCount, { color: C.textSecondary }]}>{counts[cat]}</Text>
                </GlassCard>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={[s.section, { color: C.text }]}>Toutes les régions</Text>
      <View style={s.regionGrid}>
        {Object.keys(counts)
          .filter((c) => !NON_BODY_CATEGORIES.includes(c))
          .sort((a, b) => a.localeCompare(b, 'fr'))
          .map((cat) => (
            <Pressable key={cat} onPress={() => open(cat)} style={s.regionItem}>
              <GlassCard style={s.regionCard}>
                <Text style={[s.regionName, { color: C.text }]} numberOfLines={1}>{cat}</Text>
                <Text style={[s.regionCount, { color: C.textSecondary }]}>{counts[cat]} test{counts[cat] > 1 ? 's' : ''}</Text>
              </GlassCard>
            </Pressable>
          ))}
      </View>
    </ScrollView>
  );
}

// ── Panneau Topographie ──────────────────────────────────────────────────────
function TopographiePanel({ C }: { C: ReturnType<typeof usePaletteFor> }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('elearning_topographic_views').select('region').eq('is_active', true);
    const map: Record<string, number> = {};
    for (const row of data ?? []) map[row.region] = (map[row.region] ?? 0) + 1;
    setCounts(map);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalViews = Object.values(counts).reduce((a, b) => a + b, 0);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>;
  if (totalViews === 0) {
    return <EmptyState icon="map-outline" title="Aucune vue" message="Les vues topographiques apparaîtront ici." />;
  }

  return (
    <ScrollView
      contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BRAND} />}>
      <Text style={[s.panelHint, { color: C.textSecondary }]}>{totalViews} vue{totalViews > 1 ? 's' : ''} anatomique{totalViews > 1 ? 's' : ''}</Text>

      {Object.entries(TOPO_CATEGORIES).map(([category, regions]) => {
        const available = regions.filter((r) => counts[r] > 0);
        if (available.length === 0) return null;
        return (
          <View key={category} style={{ gap: 10 }}>
            <View style={s.categoryHead}>
              <Ionicons name={TOPO_CATEGORY_ICONS[category] ?? 'body'} size={15} color={C.textSecondary} />
              <Text style={[s.categoryTitle, { color: C.textSecondary }]}>{category}</Text>
            </View>
            <View style={s.grid}>
              {available.map((region) => (
                <Pressable
                  key={region}
                  style={s.gridItem}
                  onPress={() => { haptics.selection(); router.push(`/topographie/${region}`); }}>
                  <GlassCard style={s.regionCard2}>
                    <LinearGradient colors={GRADIENTS.blue} style={s.regionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name="scan" size={18} color="#fff" />
                    </LinearGradient>
                    <Text style={[s.regionName2, { color: C.text }]} numberOfLines={1}>{topoRegionLabel(region)}</Text>
                    <Text style={[s.regionCount2, { color: C.textSecondary }]}>{counts[region]} vue{counts[region] > 1 ? 's' : ''}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 },
  title: { fontSize: 26, fontWeight: '800' },

  segmented: { flexDirection: 'row', borderRadius: 12, padding: 3, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  segmentBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9 },
  segmentBtnActive: { backgroundColor: BRAND },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  segmentTextActive: { color: '#fff' },

  scroll: { padding: 16, gap: 14 },
  panelHint: { fontSize: 13, marginTop: -4 },
  bodyWrap: { alignItems: 'center', paddingVertical: 8 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  chipIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  chipCount: { fontSize: 12, fontWeight: '700' },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  regionItem: { width: '48%' },
  regionCard: { padding: 14, gap: 2 },
  regionName: { fontSize: 15, fontWeight: '700' },
  regionCount: { fontSize: 12 },

  categoryHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '31%' },
  regionCard2: { padding: 12, gap: 6, alignItems: 'center' },
  regionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  regionName2: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  regionCount2: { fontSize: 10, textAlign: 'center' },
});
