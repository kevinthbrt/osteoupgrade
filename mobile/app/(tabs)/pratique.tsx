import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Video = Tables<'practice_videos'>;

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

// Correspondance slug DB → label affiché (identique au site web)
const REGION_LABELS: Record<string, string> = {
  cervical: 'Cervicales',
  thoracique: 'Thoracique',
  lombaire: 'Lombaires',
  epaule: 'Épaule',
  coude: 'Coude',
  poignet: 'Poignet + main',
  bassin: 'Bassin',
  hanche: 'Hanche',
  genou: 'Genou',
  pied_cheville: 'Pied & Cheville',
};

const REGION_ORDER = Object.keys(REGION_LABELS);

function regionLabel(slug: string): string {
  return REGION_LABELS[slug] ?? slug;
}

function formatDuration(secs: number | null): string {
  if (!secs) return '';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

// ── Carte vidéo plein écran (style TikTok) ─────────────────────────────────
function VideoSlide({ video, active }: { video: Video; active: boolean }) {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const TAB_H = Platform.OS === 'ios' ? 83 : 60;
  const SLIDE_H = SCREEN_H - TAB_H;

  return (
    <Pressable onPress={() => router.push(`/video/${video.id}`)} style={[s.slide, { height: SLIDE_H }]}>
      {/* Vignette / fond */}
      {video.thumbnail_url ? (
        <Image source={video.thumbnail_url} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <LinearGradient colors={GRADIENTS.orange} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      )}

      {/* Dégradé overlay bas */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        style={s.overlay}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />

      {/* Bouton play centré */}
      <View style={s.playWrap}>
        <View style={[s.playBtn, active && s.playBtnActive]}>
          <Ionicons name="play" size={active ? 36 : 28} color="#fff" />
        </View>
      </View>

      {/* Infos bas */}
      <View style={s.info}>
        <View style={s.regionPill}>
          <Text style={s.regionPillText}>{regionLabel(video.region)}</Text>
        </View>
        <Text style={s.videoTitle} numberOfLines={2}>{video.title}</Text>
        {video.description ? (
          <Text style={s.videoDesc} numberOfLines={2}>{video.description}</Text>
        ) : null}
        <View style={s.meta}>
          {video.duration_seconds ? (
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={s.metaText}>{formatDuration(video.duration_seconds)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Actions droite */}
      <View style={s.actions}>
        <Pressable style={s.actionBtn} onPress={() => router.push(`/video/${video.id}`)}>
          <Ionicons name="play-circle" size={32} color="#fff" />
          <Text style={s.actionLabel}>Voir</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function PratiqueScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('practice_videos')
      .select('*')
      .eq('is_active', true)
      .order('region')
      .order('order_index', { nullsFirst: false });
    setVideos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = selectedRegion
    ? videos.filter((v) => v.region === selectedRegion)
    : videos;

  // Régions disponibles dans l'ordre du site web
  const availableRegions = REGION_ORDER.filter((r) => videos.some((v) => v.region === r));

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setVisibleIndex(viewableItems[0].index ?? 0);
  }).current;

  const TAB_H = Platform.OS === 'ios' ? 83 : 60;
  const SLIDE_H = SCREEN_H - TAB_H;

  return (
    <View style={s.root}>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
      ) : (
        <>
          {/* Filtre régions (overlay en haut) */}
          <SafeAreaView style={s.filterBar} edges={['top']} pointerEvents="box-none">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
              <Pressable
                style={[s.filterChip, !selectedRegion && s.filterChipActive]}
                onPress={() => { setSelectedRegion(null); listRef.current?.scrollToOffset({ offset: 0, animated: true }); }}>
                <Text style={[s.filterChipText, !selectedRegion && s.filterChipTextActive]}>Tout</Text>
              </Pressable>
              {availableRegions.map((r) => (
                <Pressable
                  key={r}
                  style={[s.filterChip, selectedRegion === r && s.filterChipActive]}
                  onPress={() => { setSelectedRegion(r); listRef.current?.scrollToOffset({ offset: 0, animated: true }); }}>
                  <Text style={[s.filterChipText, selectedRegion === r && s.filterChipTextActive]}>
                    {regionLabel(r)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>

          {/* Compteur */}
          <View style={s.counter} pointerEvents="none">
            <Text style={s.counterText}>{visibleIndex + 1} / {filtered.length}</Text>
          </View>

          {/* Feed vertical TikTok */}
          <FlatList
            ref={listRef}
            data={filtered}
            keyExtractor={(v) => v.id}
            renderItem={({ item, index }) => (
              <VideoSlide video={item} active={index === visibleIndex} />
            )}
            pagingEnabled
            snapToInterval={SLIDE_H}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
            getItemLayout={(_, index) => ({ length: SLIDE_H, offset: SLIDE_H * index, index })}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },

  slide: { width: SCREEN_W, backgroundColor: '#111', overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFillObject, top: '40%' },

  playWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  playBtnActive: { backgroundColor: 'rgba(37,99,235,0.6)', borderColor: BRAND },

  info: { position: 'absolute', bottom: 20, left: 16, right: 70 },
  regionPill: {
    alignSelf: 'flex-start', backgroundColor: BRAND,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 8,
  },
  regionPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  videoTitle: { color: '#fff', fontSize: 17, fontWeight: '700', lineHeight: 22, marginBottom: 4 },
  videoDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  meta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  actions: { position: 'absolute', right: 12, bottom: 80, gap: 20 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionLabel: { color: '#fff', fontSize: 10, fontWeight: '600' },

  filterBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  filterChipActive: { backgroundColor: BRAND, borderColor: BRAND },
  filterChipText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },

  counter: { position: 'absolute', top: 100, right: 16, zIndex: 10 },
  counterText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
});
