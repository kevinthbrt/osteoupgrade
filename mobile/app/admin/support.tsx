import { Ionicons } from '@expo/vector-icons';
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
import { useAdminGuard } from '@/lib/adminGuard';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, usePaletteFor } from '@/lib/theme';

type Ticket = Tables<'support_tickets'>;
type Filter = 'all' | 'pending' | 'in_progress' | 'resolved';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'Reçu', color: '#3b82f6', icon: 'time' },
  in_progress: { label: 'En cours', color: '#f59e0b', icon: 'build' },
  resolved: { label: 'Corrigé', color: '#16a34a', icon: 'checkmark-circle' },
};
const FILTERS: Filter[] = ['all', 'pending', 'in_progress', 'resolved'];
const FILTER_LABEL: Record<Filter, string> = { all: 'Tous', pending: 'Reçus', in_progress: 'En cours', resolved: 'Corrigés' };

export default function AdminSupportScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const { checked, isAdmin } = useAdminGuard();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    let q = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setTickets(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (!checked || !isAdmin) {
    return <View style={[s.center, { flex: 1 }]}><ActivityIndicator size="large" color={BRAND} /></View>;
  }

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: C.text }]}>Support client</Text>
            <Text style={[s.sub, { color: C.textSecondary }]}>{tickets.length} ticket{tickets.length > 1 ? 's' : ''}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[s.chip, { borderColor: filter === f ? BRAND : C.border, backgroundColor: filter === f ? BRAND : C.card }]}>
              <Text style={[s.chipText, { color: filter === f ? '#fff' : C.text }]}>{FILTER_LABEL[f]}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : tickets.length === 0 ? (
          <EmptyState icon="checkmark-done-circle-outline" title="Aucun ticket" message="Rien à traiter pour ce filtre." />
        ) : (
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BRAND} />}>
            {tickets.map((t) => {
              const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.pending;
              return (
                <Pressable key={t.id} onPress={() => router.push(`/admin/support/${t.id}`)}>
                  <GlassCard style={s.card}>
                    <View style={s.cardHead}>
                      <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
                      <Text style={[s.cardTitle, { color: C.text }]} numberOfLines={1}>{t.title}</Text>
                    </View>
                    <Text style={[s.cardMsg, { color: C.textSecondary }]} numberOfLines={2}>{t.message}</Text>
                    <View style={s.cardFoot}>
                      <Text style={[s.cardEmail, { color: C.textMuted }]} numberOfLines={1}>{t.user_email}</Text>
                      <View style={[s.statusBadge, { backgroundColor: cfg.color + '22' }]}>
                        <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                        <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 1 },
  filterRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  scroll: { padding: 16, paddingTop: 4, gap: 10, paddingBottom: 60 },
  card: { padding: 14, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  cardMsg: { fontSize: 13, lineHeight: 18 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  cardEmail: { fontSize: 11, flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
});
