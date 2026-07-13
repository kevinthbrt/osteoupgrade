import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
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
import { WebView } from 'react-native-webview';
import ImageViewing from 'react-native-image-viewing';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/lib/auth';
import type { Tables } from '@/lib/database.types';
import * as haptics from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';
import { topoRegionLabel } from '@/lib/topography';

type TopoView = Tables<'elearning_topographic_views'>;
type Role = 'free' | 'premium' | 'admin' | null;

function stripHtml(html: string | null): string {
  return (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Rendu HTML réel (gras, retours à la ligne...) sur fond sombre, avec son
// propre scroll interne — utilisé dans le pied de la visionneuse d'images.
function descriptionHtmlDoc(html: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { -webkit-tap-highlight-color: transparent; }
  body { margin: 0; padding: 4px 2px 24px; font-family: -apple-system, system-ui, sans-serif;
    font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.9); background: transparent; }
  a { color: #7dabff; }
  b, strong { color: #fff; }
  div:empty { min-height: 0.6em; }
</style>
</head><body>${html}</body></html>`;
}

export default function TopographieRegionScreen() {
  const { region } = useLocalSearchParams<{ region: string }>();
  const { session } = useAuth();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [views, setViews] = useState<TopoView[]>([]);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  // Réinitialise le volet description à chaque changement d'image
  useEffect(() => { setDescExpanded(false); }, [viewerIndex]);

  const load = useCallback(async () => {
    if (!region) return;
    const [vRes, pRes] = await Promise.all([
      supabase.from('elearning_topographic_views').select('*').eq('region', region).eq('is_active', true).order('display_order'),
      session?.user
        ? supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setViews(vRes.data ?? []);
    setRole((pRes.data?.role ?? null) as Role);
    setLoading(false);
  }, [region, session]);

  useEffect(() => { load(); }, [load]);

  const isPremium = role === 'premium' || role === 'admin';

  const openViewer = (index: number) => {
    const view = views[index];
    if (!isPremium && !view.is_free_access) return; // verrouillé
    haptics.selection();
    setViewerIndex(index);
  };

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: C.text }]}>{topoRegionLabel(region ?? '')}</Text>
            <Text style={[s.sub, { color: C.textSecondary }]}>{views.length} vue{views.length > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : views.length === 0 ? (
          <EmptyState icon="image-outline" title="Aucune vue" message="Pas de vue topographique pour cette région." />
        ) : (
          <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 60 : 40 }]} showsVerticalScrollIndicator={false}>
            <View style={s.grid}>
              {views.map((v, i) => {
                const locked = !isPremium && !v.is_free_access;
                return (
                  <Pressable key={v.id} style={s.gridItem} onPress={() => openViewer(i)}>
                    <GlassCard style={s.card}>
                      {v.image_url ? (
                        <Image source={v.image_url} style={[s.thumb, locked && { opacity: 0.4 }]} contentFit="cover" />
                      ) : (
                        <LinearGradient colors={GRADIENTS.blue} style={s.thumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                          <Ionicons name="image" size={22} color="#fff" />
                        </LinearGradient>
                      )}
                      {locked && (
                        <View style={s.lockOverlay}>
                          <Ionicons name="lock-closed" size={18} color="#fff" />
                        </View>
                      )}
                      <Text style={[s.cardTitle, { color: C.text }]} numberOfLines={2}>{v.name}</Text>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Visionneuse plein écran avec pinch-to-zoom */}
        <ImageViewing
          images={views.filter((v) => v.image_url).map((v) => ({ uri: v.image_url! }))}
          imageIndex={viewerIndex ?? 0}
          visible={viewerIndex !== null}
          onRequestClose={() => setViewerIndex(null)}
          FooterComponent={({ imageIndex }) => {
            const v = views[imageIndex];
            if (!v) return null;
            const hasDesc = !!stripHtml(v.description);
            return (
              <View style={s.viewerFooter}>
                <View style={s.viewerFooterHead}>
                  <Text style={s.viewerTitle} numberOfLines={descExpanded ? 2 : 1}>{v.name}</Text>
                  {hasDesc && (
                    <Pressable onPress={() => setDescExpanded((e) => !e)} style={s.descBtn}>
                      <Ionicons name={descExpanded ? 'chevron-down' : 'document-text-outline'} size={14} color="#fff" />
                      <Text style={s.descBtnText}>{descExpanded ? 'Masquer' : 'Description'}</Text>
                    </Pressable>
                  )}
                </View>
                {/* Description en HTML réel (gras, retours à la ligne...), directement
                    dans le pied de la visionneuse — évite les soucis d'empilement de Modal */}
                {descExpanded && hasDesc && (
                  <View style={s.descPanel}>
                    <WebView
                      source={{ html: descriptionHtmlDoc(v.description ?? '') }}
                      style={{ flex: 1, backgroundColor: 'transparent' }}
                      originWhitelist={['*']}
                      scrollEnabled
                      javaScriptEnabled
                    />
                  </View>
                )}
              </View>
            );
          }}
        />
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
  scroll: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  card: { padding: 8, gap: 8, overflow: 'hidden' },
  thumb: { width: '100%', height: 120, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lockOverlay: { position: 'absolute', top: 8, left: 8, right: 8, height: 120, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '600', paddingHorizontal: 4, paddingBottom: 4 },
  viewerFooter: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34, gap: 10 },
  viewerFooterHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700' },
  descBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  descBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  descPanel: { height: 220, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' },
});
