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

import { GlassCard } from '@/components/GlassCard';
import { useAdminGuard } from '@/lib/adminGuard';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Stats = {
  totalUsers: number;
  free: number;
  premium: number;
  admin: number;
  newThisWeek: number;
  active7d: number;
  ticketsPending: number;
  ticketsInProgress: number;
  ticketsResolved: number;
};

const EMPTY: Stats = {
  totalUsers: 0, free: 0, premium: 0, admin: 0,
  newThisWeek: 0, active7d: 0,
  ticketsPending: 0, ticketsInProgress: 0, ticketsResolved: 0,
};

export default function AdminHubScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const { checked, isAdmin } = useAdminGuard();

  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const weekAgoDate = weekAgo.slice(0, 10);

    const [profiles, tickets, logins] = await Promise.all([
      supabase.from('profiles').select('role, created_at'),
      supabase.from('support_tickets').select('status'),
      supabase.from('user_login_tracking').select('user_id').gte('login_date', weekAgoDate),
    ]);

    const roles = { free: 0, premium: 0, admin: 0 };
    let newThisWeek = 0;
    for (const p of profiles.data ?? []) {
      if (p.role in roles) roles[p.role as keyof typeof roles]++;
      if (p.created_at >= weekAgo) newThisWeek++;
    }

    const ticketCounts = { pending: 0, in_progress: 0, resolved: 0 };
    for (const t of tickets.data ?? []) {
      if (t.status in ticketCounts) ticketCounts[t.status as keyof typeof ticketCounts]++;
    }

    const activeUsers = new Set((logins.data ?? []).map((l) => l.user_id));

    setStats({
      totalUsers: profiles.data?.length ?? 0,
      free: roles.free, premium: roles.premium, admin: roles.admin,
      newThisWeek, active7d: activeUsers.size,
      ticketsPending: ticketCounts.pending,
      ticketsInProgress: ticketCounts.in_progress,
      ticketsResolved: ticketCounts.resolved,
    });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (!checked || !isAdmin) {
    return (
      <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
      </LinearGradient>
    );
  }

  const openTickets = stats.ticketsPending + stats.ticketsInProgress;

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <LinearGradient colors={GRADIENTS.violet} style={s.headerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="shield-checkmark" size={18} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={[s.title, { color: C.text }]}>Administration</Text>
            <Text style={[s.sub, { color: C.textSecondary }]}>Vue d'ensemble</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : (
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BRAND} />}>

            {/* Utilisateurs */}
            <View style={s.statsRow}>
              <Stat icon="people" value={stats.totalUsers} label="Utilisateurs" color={GRADIENTS.blue} C={C} />
              <Stat icon="person-add" value={stats.newThisWeek} label="Nouveaux (7j)" color={GRADIENTS.green} C={C} />
              <Stat icon="pulse" value={stats.active7d} label="Actifs (7j)" color={GRADIENTS.orange} C={C} />
            </View>

            {/* Répartition rôles */}
            <GlassCard style={s.card}>
              <Text style={[s.cardTitle, { color: C.text }]}>Répartition des comptes</Text>
              <RoleRow label="Gratuit" value={stats.free} total={stats.totalUsers} color="#94a3b8" C={C} />
              <RoleRow label="Premium" value={stats.premium} total={stats.totalUsers} color={BRAND} C={C} />
              <RoleRow label="Admin" value={stats.admin} total={stats.totalUsers} color="#8b5cf6" C={C} />
            </GlassCard>

            {/* Accès rapide */}
            <Pressable onPress={() => router.push('/admin/users')}>
              <GlassCard style={s.linkCard}>
                <LinearGradient colors={GRADIENTS.blue} style={s.linkIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="people" size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[s.linkTitle, { color: C.text }]}>Utilisateurs</Text>
                  <Text style={[s.linkSub, { color: C.textSecondary }]}>Rechercher, gérer les rôles</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </GlassCard>
            </Pressable>

            <Pressable onPress={() => router.push('/admin/support')}>
              <GlassCard style={s.linkCard}>
                <LinearGradient colors={GRADIENTS.orange} style={s.linkIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="chatbubbles" size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[s.linkTitle, { color: C.text }]}>Support client</Text>
                  <Text style={[s.linkSub, { color: C.textSecondary }]}>
                    {openTickets > 0 ? `${openTickets} ticket${openTickets > 1 ? 's' : ''} ouvert${openTickets > 1 ? 's' : ''}` : 'Aucun ticket ouvert'}
                  </Text>
                </View>
                {openTickets > 0 && (
                  <View style={s.badge}><Text style={s.badgeText}>{openTickets}</Text></View>
                )}
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </GlassCard>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function Stat({ icon, value, label, color, C }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: [string, string]; C: ReturnType<typeof usePaletteFor> }) {
  return (
    <GlassCard style={s.statCard}>
      <LinearGradient colors={color} style={s.statIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={16} color="#fff" />
      </LinearGradient>
      <Text style={[s.statValue, { color: C.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: C.textSecondary }]}>{label}</Text>
    </GlassCard>
  );
}

function RoleRow({ label, value, total, color, C }: { label: string; value: number; total: number; color: string; C: ReturnType<typeof usePaletteFor> }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={{ gap: 4 }}>
      <View style={s.roleRowHead}>
        <Text style={[s.roleLabel, { color: C.text }]}>{label}</Text>
        <Text style={[s.roleValue, { color: C.textSecondary }]}>{value}</Text>
      </View>
      <View style={[s.roleBar, { backgroundColor: C.border }]}>
        <View style={[s.roleBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  headerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 1 },
  scroll: { padding: 16, gap: 12 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 12, gap: 5, alignItems: 'center' },
  statIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  card: { padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  roleRowHead: { flexDirection: 'row', justifyContent: 'space-between' },
  roleLabel: { fontSize: 13, fontWeight: '600' },
  roleValue: { fontSize: 13, fontWeight: '700' },
  roleBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  roleBarFill: { height: 6, borderRadius: 3 },

  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  linkIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 15, fontWeight: '700' },
  linkSub: { fontSize: 12, marginTop: 1 },
  badge: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
