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
import { HtmlView } from '@/components/HtmlView';
import { useAuth } from '@/lib/auth';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Subpart = Tables<'elearning_subparts'>;

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export default function SubpartScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [subpart, setSubpart] = useState<Subpart | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!id || !session?.user) return;
    const uid = session.user.id;
    Promise.all([
      supabase.from('elearning_subparts').select('*').eq('id', id).maybeSingle(),
      supabase.from('elearning_subpart_progress').select('id').eq('subpart_id', id).eq('user_id', uid).maybeSingle(),
    ]).then(([sp, prog]) => {
      setSubpart(sp.data);
      // Présence d'une ligne = terminé (modèle identique au site web)
      setCompleted(!!prog.data);
      setLoading(false);
    });
  }, [id, session]);

  const toggleComplete = async () => {
    if (!subpart || !session?.user || marking) return;
    setMarking(true);
    const uid = session.user.id;
    const next = !completed;
    if (next) {
      // Terminé = on insère/conserve une ligne (comme le site web)
      await supabase.from('elearning_subpart_progress').upsert(
        { user_id: uid, subpart_id: subpart.id, completed_at: new Date().toISOString() },
        { onConflict: 'subpart_id,user_id' }
      );
    } else {
      // Annuler = on supprime la ligne
      await supabase
        .from('elearning_subpart_progress')
        .delete()
        .eq('subpart_id', subpart.id)
        .eq('user_id', uid);
    }
    setCompleted(next);
    setMarking(false);
  };

  const vimeoId = subpart?.vimeo_url ? extractVimeoId(subpart.vimeo_url) : null;
  const embedUrl = vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=0&color=4169F6` : null;

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: C.text }]} numberOfLines={2}>
            {subpart?.title ?? 'Leçon'}
          </Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Video player */}
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
                <LinearGradient colors={GRADIENTS.brand} style={s.noVideoIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="videocam-off" size={28} color="#fff" />
                </LinearGradient>
                <Text style={[s.noVideoText, { color: C.textSecondary }]}>Aucune vidéo disponible</Text>
              </GlassCard>
            )}

            {/* PDF link */}
            {subpart?.pdf_url && (
              <Pressable onPress={() => Linking.openURL(subpart.pdf_url!)}>
                <GlassCard style={s.pdfRow}>
                  <LinearGradient colors={GRADIENTS.red} style={s.pdfIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="document-text" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.pdfLabel, { color: C.text }]}>{subpart.pdf_name ?? 'Document PDF'}</Text>
                    <Text style={[s.pdfSub, { color: C.textSecondary }]}>Ouvrir dans le navigateur</Text>
                  </View>
                  <Ionicons name="open-outline" size={18} color={C.textMuted} />
                </GlassCard>
              </Pressable>
            )}

            {/* Description */}
            {subpart?.description_html ? (
              <GlassCard style={s.descCard}>
                <Text style={[s.descTitle, { color: C.text }]}>Description</Text>
                <HtmlView html={subpart.description_html} />
              </GlassCard>
            ) : null}

            {/* Mark complete */}
            <Pressable onPress={toggleComplete} disabled={marking}>
              <LinearGradient
                colors={completed ? GRADIENTS.green : GRADIENTS.brand}
                style={s.completeBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {marking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={completed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color="#fff" />
                    <Text style={s.completeBtnText}>
                      {completed ? 'Terminé ✓' : 'Marquer comme terminé'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
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

  pdfRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  pdfIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pdfLabel: { fontSize: 14, fontWeight: '600' },
  pdfSub: { fontSize: 12, marginTop: 1 },

  descCard: { padding: 16, gap: 8 },
  descTitle: { fontSize: 15, fontWeight: '700' },
  descText: { fontSize: 14, lineHeight: 20 },

  completeBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
