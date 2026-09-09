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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { getNativeVimeoUrl, NATIVE_VIMEO_ENABLED, vimeoIdFrom } from '@/lib/vimeo';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Video = Tables<'practice_videos'>;
type ViewMode = 'categories' | 'scroll';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const TAB_H = Platform.OS === 'ios' ? 83 : 60;
const SLIDE_H = SCREEN_H - TAB_H;

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

function regionLabel(slug: string) { return REGION_LABELS[slug] ?? slug; }
function formatDuration(secs: number | null) {
  if (!secs) return '';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}
function getEmbedUrl(v: Video): string | null {
  if (v.vimeo_id) return `https://player.vimeo.com/video/${v.vimeo_id}?autoplay=1&color=4169F6`;
  if (v.vimeo_url) {
    const m = v.vimeo_url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1&color=4169F6`;
  }
  return null;
}

// Overlay d'infos réutilisé (titre, région, durée) — non bloquant
function SlideInfo({ video }: { video: Video }) {
  return (
    <View style={sl.info} pointerEvents="none">
      <View style={sl.regionPill}>
        <Text style={sl.regionPillText}>{regionLabel(video.region)}</Text>
      </View>
      <Text style={sl.title} numberOfLines={2}>{video.title}</Text>
      {video.description ? (
        <Text style={sl.desc} numberOfLines={2}>{video.description}</Text>
      ) : null}
      {video.duration_seconds ? (
        <View style={sl.metaRow}>
          <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={sl.metaText}>{formatDuration(video.duration_seconds)}</Text>
        </View>
      ) : null}
    </View>
  );
}

// Lecteur natif expo-video (monté seulement quand on a une URL directe)
function NativeVideo({ url, video }: { url: string; video: Video }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = false;
    p.play();
  });
  return (
    <>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls
        allowsFullscreen
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={sl.overlay} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} pointerEvents="none" />
      <SlideInfo video={video} />
    </>
  );
}

// ── Slide plein écran avec player inline ────────────────────────────────────
function VideoSlide({ video, active }: { video: Video; active: boolean }) {
  const embedUrl = getEmbedUrl(video);
  const [nativeUrl, setNativeUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const triedRef = useRef(false);

  // Quand la slide devient active, tente de récupérer une URL native (une fois)
  useEffect(() => {
    if (!NATIVE_VIMEO_ENABLED || !active || triedRef.current) return;
    triedRef.current = true;
    const vid = vimeoIdFrom(video.vimeo_id, video.vimeo_url);
    if (!vid) return;
    setResolving(true);
    getNativeVimeoUrl(vid).then((u) => {
      setNativeUrl(u);
      setResolving(false);
    });
  }, [active, video]);

  // Slide inactive → vignette + infos
  if (!active) {
    return (
      <View style={sl.slide}>
        {video.thumbnail_url ? (
          <Image source={video.thumbnail_url} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={GRADIENTS.orange} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={sl.overlay} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
        <View style={sl.playWrap} pointerEvents="none">
          <View style={sl.playBtn}><Ionicons name="play" size={32} color="#fff" /></View>
        </View>
        <SlideInfo video={video} />
      </View>
    );
  }

  // Slide active
  return (
    <View style={sl.slide}>
      {nativeUrl ? (
        // Lecteur natif (Vimeo Pro → URL directe)
        <NativeVideo url={nativeUrl} video={video} />
      ) : resolving ? (
        // En attente de l'URL directe : vignette + spinner
        <>
          {video.thumbnail_url ? (
            <Image source={video.thumbnail_url} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={GRADIENTS.orange} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          )}
          <View style={sl.playWrap}><ActivityIndicator size="large" color="#fff" /></View>
          <SlideInfo video={video} />
        </>
      ) : embedUrl ? (
        // Repli : WebView Vimeo (si l'URL native a échoué / non configurée)
        <WebView
          source={{ uri: embedUrl }}
          style={StyleSheet.absoluteFill}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
      ) : (
        <LinearGradient colors={GRADIENTS.orange} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      )}
    </View>
  );
}

// ── Vue Catégories (accordéon) ───────────────────────────────────────────────
function CategoriesView({ videos, C, refreshing, onRefresh }: { videos: Video[]; C: ReturnType<typeof usePaletteFor>; refreshing: boolean; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const availableRegions = REGION_ORDER.filter((r) => videos.some((v) => v.region === r));

  const toggle = (r: string) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(r) ? next.delete(r) : next.add(r);
    return next;
  });

  return (
    <ScrollView
      contentContainerStyle={[cv.scroll, { paddingBottom: TAB_H + 16 }, availableRegions.length === 0 && { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}>
      {availableRegions.length === 0 ? (
        <EmptyState icon="fitness-outline" title="Aucune vidéo" message="Les techniques de pratique apparaîtront ici." />
      ) : availableRegions.map((r) => {
        const regionVideos = videos.filter((v) => v.region === r);
        const open = expanded.has(r);
        return (
          <View key={r}>
            <Pressable onPress={() => toggle(r)}>
              <GlassCard style={cv.regionHeader}>
                <LinearGradient colors={GRADIENTS.orange} style={cv.regionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="body" size={18} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[cv.regionName, { color: C.text }]}>{regionLabel(r)}</Text>
                  <Text style={[cv.regionCount, { color: C.textSecondary }]}>{regionVideos.length} vidéo{regionVideos.length > 1 ? 's' : ''}</Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
              </GlassCard>
            </Pressable>

            {open && regionVideos.map((v) => (
              <Pressable key={v.id} onPress={() => router.push(`/video/${v.id}`)}>
                <GlassCard style={cv.videoCard}>
                  {v.thumbnail_url ? (
                    <Image source={v.thumbnail_url} style={cv.thumb} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={GRADIENTS.orange} style={cv.thumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name="play" size={20} color="#fff" />
                    </LinearGradient>
                  )}
                  <View style={cv.videoBody}>
                    <Text style={[cv.videoTitle, { color: C.text }]} numberOfLines={2}>{v.title}</Text>
                    {v.duration_seconds ? (
                      <Text style={[cv.videoDuration, { color: C.textSecondary }]}>{formatDuration(v.duration_seconds)}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="play-circle" size={26} color={BRAND} style={{ alignSelf: 'center', marginRight: 8 }} />
                </GlassCard>
              </Pressable>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── Écran principal ──────────────────────────────────────────────────────────
export default function PratiqueScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
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
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const availableRegions = REGION_ORDER.filter((r) => videos.some((v) => v.region === r));
  const filtered = selectedRegion ? videos.filter((v) => v.region === selectedRegion) : videos;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setVisibleIndex(viewableItems[0].index ?? 0);
  }).current;

  const switchMode = (mode: ViewMode) => {
    setViewMode(mode);
    setVisibleIndex(0);
    setSelectedRegion(null);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  return (
    <LinearGradient
      colors={viewMode === 'scroll' ? ['#000', '#000'] : C.bgGradient}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header avec toggle */}
        <View style={[hd.bar, viewMode === 'scroll' && hd.barDark]}>
          <Text style={[hd.title, { color: viewMode === 'scroll' ? '#fff' : C.text }]}>Pratique</Text>
          <View style={[hd.toggle, viewMode === 'scroll' && hd.toggleDark]}>
            <Pressable
              style={[hd.toggleBtn, viewMode === 'categories' && hd.toggleBtnActive]}
              onPress={() => switchMode('categories')}>
              <Ionicons name="list" size={16} color={viewMode === 'categories' ? '#fff' : (viewMode === 'scroll' ? 'rgba(255,255,255,0.6)' : C.textSecondary)} />
              <Text style={[hd.toggleText, viewMode === 'categories' && hd.toggleTextActive, viewMode === 'scroll' && { color: 'rgba(255,255,255,0.6)' }]}>
                Catégories
              </Text>
            </Pressable>
            <Pressable
              style={[hd.toggleBtn, viewMode === 'scroll' && hd.toggleBtnActive]}
              onPress={() => switchMode('scroll')}>
              <Ionicons name="phone-portrait" size={16} color={viewMode === 'scroll' ? '#fff' : C.textSecondary} />
              <Text style={[hd.toggleText, viewMode === 'scroll' && hd.toggleTextActive]}>
                Scroll
              </Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : viewMode === 'categories' ? (
          <CategoriesView videos={videos} C={C} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        ) : (
          // ── Mode Scroll TikTok ──
          <View style={{ flex: 1 }}>
            {/* Filtre régions horizontal */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sc.filterBar} contentContainerStyle={sc.filterRow}>
              <Pressable
                style={[sc.chip, !selectedRegion && sc.chipActive]}
                onPress={() => { setSelectedRegion(null); listRef.current?.scrollToOffset({ offset: 0, animated: true }); }}>
                <Text style={[sc.chipText, !selectedRegion && sc.chipTextActive]}>Tout</Text>
              </Pressable>
              {availableRegions.map((r) => (
                <Pressable
                  key={r}
                  style={[sc.chip, selectedRegion === r && sc.chipActive]}
                  onPress={() => { setSelectedRegion(r); listRef.current?.scrollToOffset({ offset: 0, animated: true }); }}>
                  <Text style={[sc.chipText, selectedRegion === r && sc.chipTextActive]}>{regionLabel(r)}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Compteur */}
            <View style={sc.counter} pointerEvents="none">
              <Text style={sc.counterText}>{visibleIndex + 1} / {filtered.length}</Text>
            </View>

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
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// Styles header
const hd = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  barDark: { backgroundColor: '#000' },
  title: { fontSize: 24, fontWeight: '800' },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 12, padding: 3, gap: 2 },
  toggleDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: BRAND },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#fff' },
});

// Styles mode catégories
const cv = StyleSheet.create({
  scroll: { padding: 16, gap: 8 },
  regionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  regionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  regionName: { fontSize: 16, fontWeight: '700' },
  regionCount: { fontSize: 12, marginTop: 1 },
  videoCard: { flexDirection: 'row', overflow: 'hidden', marginLeft: 12, marginBottom: 4 },
  thumb: { width: 80, height: 72, alignItems: 'center', justifyContent: 'center' },
  videoBody: { flex: 1, padding: 10, gap: 4, justifyContent: 'center' },
  videoTitle: { fontSize: 14, fontWeight: '600' },
  videoDuration: { fontSize: 12 },
});

// Styles mode scroll
const sl = StyleSheet.create({
  slide: { width: SCREEN_W, height: SLIDE_H, backgroundColor: '#111', overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFillObject, top: '35%' },
  playWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  playBtnActive: { backgroundColor: 'rgba(37,99,235,0.65)', borderColor: BRAND },
  info: { position: 'absolute', bottom: 28, left: 16, right: 16 },
  regionPill: { alignSelf: 'flex-start', backgroundColor: BRAND, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 8 },
  regionPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 24, marginBottom: 4 },
  desc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
});

const sc = StyleSheet.create({
  filterBar: { flexGrow: 0, flexShrink: 0 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#000' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  chipActive: { backgroundColor: BRAND, borderColor: BRAND },
  chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  counter: { position: 'absolute', right: 16, top: 60, zIndex: 5 },
  counterText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
});
