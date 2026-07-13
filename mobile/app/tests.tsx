import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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

import { BodyMap, NON_BODY_CATEGORIES } from '@/components/BodyMap';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import * as haptics from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

export default function TestsScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

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

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: C.text }]}>Tests orthopédiques</Text>
            <Text style={[s.sub, { color: C.textSecondary }]}>Touche une région du corps</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : Object.keys(counts).length === 0 ? (
          <EmptyState icon="body-outline" title="Aucun test" message="Les tests orthopédiques apparaîtront ici." />
        ) : (
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 60 : 40 }]}
            showsVerticalScrollIndicator={false}>
            {/* Carte du corps */}
            <View style={s.bodyWrap}>
              <BodyMap available={available} selected={selected} onSelect={open} width={230} />
            </View>

            {/* Régions non-anatomiques */}
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

            {/* Liste complète des régions (repli tapable) */}
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
  scroll: { padding: 16, gap: 14 },
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
});
