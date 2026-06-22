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

type Formation = Tables<'elearning_formations'>;

export default function CoursScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from('elearning_formations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setFormations(data ?? []);
    setLoading(false);
    setRefreshing(false);
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
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : (
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BRAND} />}>
            {formations.length === 0 ? (
              <Text style={[s.muted, { color: C.textSecondary }]}>
                {error ? `Erreur : ${error}` : 'Aucune formation disponible.'}
              </Text>
            ) : (
              formations.map((item) => (
                <Pressable key={item.id} onPress={() => router.push(`/formation/${item.id}`)}>
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
                        <Text style={[s.cardDesc, { color: C.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                      ) : null}
                      {item.is_free_access ? (
                        <View style={s.badge}>
                          <Text style={s.badgeText}>Accès gratuit</Text>
                        </View>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={C.textMuted} style={{ alignSelf: 'center', marginRight: 10 }} />
                  </GlassCard>
                </Pressable>
              ))
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
  badge: { alignSelf: 'flex-start', marginTop: 4, backgroundColor: 'rgba(37,99,235,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: BRAND, fontSize: 11, fontWeight: '600' },
});
