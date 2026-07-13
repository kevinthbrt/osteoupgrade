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

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import * as haptics from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';
import { TOPO_CATEGORIES, topoRegionLabel } from '@/lib/topography';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Tête et Cou': 'person',
  'Membre Supérieur': 'body',
  Tronc: 'body',
  'Membre Inférieur': 'walk',
  Général: 'pulse',
};

export default function TopographieScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

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

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: C.text }]}>Topographie</Text>
            <Text style={[s.sub, { color: C.textSecondary }]}>{totalViews} vue{totalViews > 1 ? 's' : ''} anatomique{totalViews > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : totalViews === 0 ? (
          <EmptyState icon="map-outline" title="Aucune vue" message="Les vues topographiques apparaîtront ici." />
        ) : (
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 60 : 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BRAND} />}>
            {Object.entries(TOPO_CATEGORIES).map(([category, regions]) => {
              const available = regions.filter((r) => counts[r] > 0);
              if (available.length === 0) return null;
              return (
                <View key={category} style={{ gap: 10 }}>
                  <View style={s.categoryHead}>
                    <Ionicons name={CATEGORY_ICONS[category] ?? 'body'} size={15} color={C.textSecondary} />
                    <Text style={[s.categoryTitle, { color: C.textSecondary }]}>{category}</Text>
                  </View>
                  <View style={s.grid}>
                    {available.map((region) => (
                      <Pressable
                        key={region}
                        style={s.gridItem}
                        onPress={() => { haptics.selection(); router.push(`/topographie/${region}`); }}>
                        <GlassCard style={s.regionCard}>
                          <LinearGradient colors={GRADIENTS.blue} style={s.regionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <Ionicons name="scan" size={18} color="#fff" />
                          </LinearGradient>
                          <Text style={[s.regionName, { color: C.text }]} numberOfLines={1}>{topoRegionLabel(region)}</Text>
                          <Text style={[s.regionCount, { color: C.textSecondary }]}>{counts[region]} vue{counts[region] > 1 ? 's' : ''}</Text>
                        </GlassCard>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 1 },
  scroll: { padding: 16, gap: 18 },
  categoryHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '31%' },
  regionCard: { padding: 12, gap: 6, alignItems: 'center' },
  regionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  regionName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  regionCount: { fontSize: 10, textAlign: 'center' },
});
