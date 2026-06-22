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
import { WebView } from 'react-native-webview';

import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/lib/auth';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Video = Tables<'practice_videos'>;

function formatDuration(secs: number | null): string {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m} min ${String(s).padStart(2, '0')} s`;
}

function getEmbedUrl(v: Video): string | null {
  if (v.vimeo_id) return `https://player.vimeo.com/video/${v.vimeo_id}?autoplay=0&color=4169F6`;
  if (v.vimeo_url) {
    const m = v.vimeo_url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=0&color=4169F6`;
  }
  return null;
}

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('practice_videos').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setVideo(data);
      setLoading(false);
      // Track view
      if (data && session?.user) {
        supabase.from('user_practice_progress').upsert(
          { user_id: session.user.id, practice_video_id: data.id, viewed_at: new Date().toISOString(), completed: false },
          { onConflict: 'user_id,practice_video_id' }
        ).then(() => {});
      }
    });
  }, [id, session]);

  const embedUrl = video ? getEmbedUrl(video) : null;

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: C.text }]} numberOfLines={2}>
            {video?.title ?? 'Vidéo'}
          </Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {embedUrl ? (
              <View style={s.videoWrapper}>
                <WebView
                  source={{ uri: embedUrl }}
                  style={s.webview}
                  allowsFullscreenVideo
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled
                />
              </View>
            ) : (
              <GlassCard style={s.noVideo}>
                <LinearGradient colors={GRADIENTS.orange} style={s.noVideoIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="videocam-off" size={28} color="#fff" />
                </LinearGradient>
                <Text style={[s.noVideoText, { color: C.textSecondary }]}>Vidéo non disponible</Text>
              </GlassCard>
            )}

            {video && (
              <GlassCard style={s.info}>
                <View style={s.infoRow}>
                  <LinearGradient colors={GRADIENTS.orange} style={s.regionBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="body" size={14} color="#fff" />
                  </LinearGradient>
                  <Text style={[s.region, { color: C.textSecondary }]}>{video.region}</Text>
                  {video.duration_seconds ? (
                    <>
                      <View style={[s.dot, { backgroundColor: C.textMuted }]} />
                      <Text style={[s.duration, { color: C.textSecondary }]}>{formatDuration(video.duration_seconds)}</Text>
                    </>
                  ) : null}
                </View>
                <Text style={[s.videoTitle, { color: C.text }]}>{video.title}</Text>
                {video.description ? (
                  <Text style={[s.desc, { color: C.textSecondary }]}>{video.description}</Text>
                ) : null}
              </GlassCard>
            )}
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  scroll: { padding: 16, gap: 14, paddingBottom: 100 },

  videoWrapper: { height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  webview: { flex: 1 },

  noVideo: { alignItems: 'center', padding: 32, gap: 12 },
  noVideoIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  noVideoText: { fontSize: 14 },

  info: { padding: 16, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regionBadge: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  region: { fontSize: 13, fontWeight: '500' },
  dot: { width: 3, height: 3, borderRadius: 2 },
  duration: { fontSize: 13 },
  videoTitle: { fontSize: 18, fontWeight: '700' },
  desc: { fontSize: 14, lineHeight: 20 },
});
