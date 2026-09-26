import AsyncStorage from '@react-native-async-storage/async-storage';
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

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { ListCardSkeleton } from '@/components/Skeleton';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { canAccessFormation, type Role } from '@/lib/access';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Formation = Tables<'elearning_formations'>;

const CACHE_KEY = 'cache:formations';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function CoursScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const { session } = useAuth();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [fRes, pRes] = await Promise.all([
      supabase.from('elearning_formations').select('*').order('created_at', { ascending: false }),
      session?.user
        ? supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (fRes.error) {
      setError(fRes.error.message);
    } else {
      setFormations(fRes.data ?? []);
      // Met en cache pour un affichage instantané / hors-ligne au prochain lancement
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fRes.data ?? [])).catch(() => {});
    }
    setRole((pRes.data?.role ?? null) as Role);
    setLoading(false);
    setRefreshing(false);
  }, [session]);

  // Affiche d'abord le cache (instantané / hors-ligne), puis rafraîchit
  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then((raw) => {
      if (raw) {
        try {
          const cached = JSON.parse(raw) as Formation[];
          setFormations(cached);
          setLoading(false);
        } catch {}
      }
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Text style={[s.title, { color: C.text }]}>Mes cours</Text>
          <Text style={[s.sub, { color: C.textSecondary }]}>
            {formations.length} formation{formations.length > 1 ? 's' : ''} disponible{formations.length > 1 ? 's' : ''}
          </Text>
        </View>

        {loading ? (
          <View style={[s.scroll, { paddingTop: 8 }]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <GlassCard key={i} style={{ padding: 0 }}><ListCardSkeleton /></GlassCard>
            ))}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BRAND} />}>
            {formations.length === 0 ? (
              error ? (
                <EmptyState variant="error" icon="cloud-offline-outline" title="Impossible de charger les cours"
                  message={error} actionLabel="Réessayer" onAction={() => { setRefreshing(true); load(); }} />
              ) : (
                <EmptyState icon="school-outline" title="Aucune formation"
                  message="Les formations apparaîtront ici dès qu'elles seront disponibles." />
              )
            ) : (
              formations.map((item) => {
                const locked = !canAccessFormation(role, item.is_private, item.is_free_access);
                return (
                <Pressable
                  key={item.id}
                  onPress={() => { if (!locked) router.push(`/formation/${item.id}`); }}>
                  <GlassCard style={s.card}>
                    {item.photo_url ? (
                      <Image source={item.photo_url} style={s.thumb} contentFit="cover" />
                    ) : (
                      <LinearGradient colors={GRADIENTS.brand} style={s.thumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name="school" size={28} color="#fff" />
                      </LinearGradient>
                    )}
                    <View style={s.body}>
                      <Text style={[s.cardTitle, { color: C.text }]} numberOfLines={2}>{item.title}</Text>
                      {item.description ? (
                        <Text style={[s.cardDesc, { color: C.textSecondary }]} numberOfLines={2}>{stripHtml(item.description)}</Text>
                      ) : null}
                      {locked ? (
                        <View style={[s.badge, s.badgePremium]}>
                          <Ionicons name="star" size={10} color="#a16207" />
                          <Text style={[s.badgeText, { color: '#a16207' }]}>Premium</Text>
                        </View>
                      ) : item.is_free_access ? (
                        <View style={s.badge}>
                          <Text style={s.badgeText}>Accès gratuit</Text>
                        </View>
                      ) : null}
                    </View>
                    <Ionicons
                      name={locked ? 'lock-closed' : 'chevron-forward'}
                      size={locked ? 16 : 18}
                      color={C.textMuted}
                      style={{ alignSelf: 'center', marginRight: 10 }}
                    />
                  </GlassCard>
                </Pressable>
                );
              })
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
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  scroll: { padding: 16, gap: 12 },
  muted: { textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', overflow: 'hidden' },
  thumb: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDesc: { fontSize: 13 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', marginTop: 4, backgroundColor: 'rgba(37,99,235,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgePremium: { backgroundColor: 'rgba(234,179,8,0.15)' },
  badgeText: { color: BRAND, fontSize: 11, fontWeight: '600' },
});
