import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

import { GlassCard } from '@/components/GlassCard';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Video = Tables<'practice_videos'>;

type RegionGroup = {
  region: string;
  videos: Video[];
};

function formatDuration(secs: number | null): string {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const REGION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  default: 'body',
  cervical: 'fitness',
  thoracique: 'fitness',
  lombaire: 'fitness',
  sacrum: 'fitness',
  crâne: 'skull',
  membre: 'hand-left',
  viscéral: 'heart',
};

function regionIcon(region: string): keyof typeof Ionicons.glyphMap {
  const key = Object.keys(REGION_ICONS).find((k) => region.toLowerCase().includes(k));
  return key ? REGION_ICONS[key] : 'body';
}

export default function PratiqueScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const [groups, setGroups] = useState<RegionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('practice_videos')
      .select('*')
      .eq('is_active', true)
      .order('region')
      .order('order_index', { nullsFirst: false });

    const map = new Map<string, Video[]>();
    for (const v of data ?? []) {
      if (!map.has(v.region)) map.set(v.region, []);
      map.get(v.region)!.push(v);
    }
    const built: RegionGroup[] = Array.from(map.entries()).map(([region, videos]) => ({ region, videos }));
    setGroups(built);
    if (built.length > 0) setExpanded(new Set([built[0].region]));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (region: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      return next;
    });

  const totalVideos = groups.reduce((a, g) => a + g.videos.length, 0);

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Text style={[s.title, { color: C.text }]}>Pratique</Text>
          <Text style={[s.sub, { color: C.textSecondary }]}>
            {totalVideos} vidéo{totalVideos > 1 ? 's' : ''} · {groups.length} régions
          </Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : (
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BRAND} />}>
            {groups.map((g) => {
              const open = expanded.has(g.region);
              return (
                <View key={g.region}>
                  <Pressable onPress={() => toggle(g.region)}>
                    <GlassCard style={s.regionHeader}>
                      <LinearGradient colors={GRADIENTS.orange} style={s.regionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name={regionIcon(g.region)} size={18} color="#fff" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.regionName, { color: C.text }]}>{g.region}</Text>
                        <Text style={[s.regionCount, { color: C.textSecondary }]}>{g.videos.length} vidéo{g.videos.length > 1 ? 's' : ''}</Text>
                      </View>
                      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
                    </GlassCard>
                  </Pressable>

                  {open && (
                    <View style={s.videoList}>
                      {g.videos.map((v) => (
                        <Pressable key={v.id} onPress={() => router.push(`/video/${v.id}`)}>
                          <GlassCard style={s.videoCard}>
                            {v.thumbnail_url ? (
                              <Image source={v.thumbnail_url} style={s.thumb} contentFit="cover" />
                            ) : (
                              <LinearGradient colors={GRADIENTS.orange} style={s.thumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Ionicons name="play" size={22} color="#fff" />
                              </LinearGradient>
                            )}
                            <View style={s.videoBody}>
                              <Text style={[s.videoTitle, { color: C.text }]} numberOfLines={2}>{v.title}</Text>
                              {v.duration_seconds ? (
                                <Text style={[s.videoDuration, { color: C.textSecondary }]}>
                                  <Ionicons name="time-outline" size={12} /> {formatDuration(v.duration_seconds)}
                                </Text>
                              ) : null}
                            </View>
                            <Ionicons name="play-circle" size={28} color={BRAND} style={{ alignSelf: 'center', marginRight: 8 }} />
                          </GlassCard>
                        </Pressable>
                      ))}
                    </View>
                  )}
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
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  scroll: { padding: 16, gap: 8 },

  regionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  regionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  regionName: { fontSize: 16, fontWeight: '700' },
  regionCount: { fontSize: 12, marginTop: 1 },

  videoList: { paddingLeft: 12, gap: 6, marginBottom: 4 },
  videoCard: { flexDirection: 'row', overflow: 'hidden' },
  thumb: { width: 80, height: 72, alignItems: 'center', justifyContent: 'center' },
  videoBody: { flex: 1, padding: 10, gap: 4, justifyContent: 'center' },
  videoTitle: { fontSize: 14, fontWeight: '600' },
  videoDuration: { fontSize: 12 },
});
