import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import { metricColor, parseVideo, pctValue as pct, watchUrl, youtubeHtml } from '@/lib/ortho';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Test = Tables<'orthopedic_tests'>;

export default function OrthoTestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('orthopedic_tests').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setTest(data);
      setLoading(false);
      // Suivi (alimente le compteur "tests consultés" de la gamification)
      if (data && session?.user) {
        supabase.from('user_testing_progress').upsert(
          { user_id: session.user.id, test_id: data.id, viewed_at: new Date().toISOString() },
          { onConflict: 'user_id,test_id' },
        ).then(() => {});
      }
    });
  }, [id, session]);

  const video = test ? parseVideo(test.video_url) : null;

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: C.text }]} numberOfLines={2}>{test?.name ?? 'Test'}</Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : !test ? (
          <View style={s.center}><Text style={{ color: C.textSecondary }}>Test introuvable.</Text></View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Vidéo */}
            {video ? (
              <View style={{ gap: 8 }}>
                <View style={s.videoWrap}>
                  <WebView
                    source={
                      video.kind === 'youtube'
                        ? { html: youtubeHtml(video.id), baseUrl: 'https://www.youtube.com' }
                        : { uri: video.url }
                    }
                    style={{ flex: 1 }}
                    originWhitelist={['*']}
                    allowsFullscreenVideo
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled
                    domStorageEnabled
                  />
                </View>
                {/* Repli si l'auteur a désactivé la lecture intégrée (erreur 150/152) */}
                <Pressable onPress={() => Linking.openURL(watchUrl(video))} style={s.watchLink}>
                  <Ionicons name={video.kind === 'youtube' ? 'logo-youtube' : 'logo-vimeo'} size={16} color={C.textSecondary} />
                  <Text style={[s.watchLinkText, { color: C.textSecondary }]}>
                    La vidéo ne se lance pas ? Regarder sur {video.kind === 'youtube' ? 'YouTube' : 'Vimeo'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Métriques diagnostiques */}
            <GlassCard style={s.metricsCard}>
              <Text style={[s.cardTitle, { color: C.text }]}>Valeurs diagnostiques</Text>
              <View style={s.metricsRow}>
                <Metric label="Sensibilité" value={pct(test.sensitivity)} color={metricColor(test.sensitivity)} C={C} />
                <Metric label="Spécificité" value={pct(test.specificity)} color={metricColor(test.specificity)} C={C} />
                <Metric label="RV+" value={test.rv_positive?.toFixed(2) ?? '—'} color={C.text} C={C} />
                <Metric label="RV−" value={test.rv_negative?.toFixed(2) ?? '—'} color={C.text} C={C} />
              </View>
            </GlassCard>

            {test.description ? <Section title="Description" body={test.description} icon="document-text" C={C} /> : null}
            {test.indications ? <Section title="Indications" body={test.indications} icon="alert-circle" C={C} /> : null}
            {test.interest ? <Section title="Intérêt clinique" body={test.interest} icon="bulb" C={C} /> : null}
            {test.sources ? <Section title="Sources" body={test.sources} icon="library" C={C} /> : null}
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
    <GlassCard style={s.section}>
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
  videoWrap: { height: 210, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  watchLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  watchLinkText: { fontSize: 12, textDecorationLine: 'underline' },
  metricsCard: { padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { fontSize: 10, marginTop: 2 },
  section: { padding: 16, gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBody: { fontSize: 14, lineHeight: 20 },
});
