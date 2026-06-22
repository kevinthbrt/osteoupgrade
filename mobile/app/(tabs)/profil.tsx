import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
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

import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/lib/auth';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Profile = Tables<'profiles'>;
type Gam = Tables<'user_gamification_stats'>;

const ROLE_LABEL: Record<string, string> = { free: 'Gratuit', premium: 'Premium', admin: 'Admin' };

export default function ProfilScreen() {
  const { session, signOut } = useAuth();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gam, setGam] = useState<Gam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('user_gamification_stats').select('*').eq('user_id', uid).maybeSingle(),
    ]).then(([p, g]) => {
      setProfile(p.data);
      setGam(g.data);
      setLoading(false);
    });
  }, [session]);

  const initial = (profile?.full_name ?? session?.user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]} showsVerticalScrollIndicator={false}>

          {/* En-tête profil */}
          <View style={s.head}>
            <LinearGradient colors={GRADIENTS.brand} style={s.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.avatarText}>{initial}</Text>
            </LinearGradient>
            {loading ? (
              <ActivityIndicator color={BRAND} style={{ marginTop: 12 }} />
            ) : (
              <>
                <Text style={[s.name, { color: C.text }]}>{profile?.full_name ?? 'Utilisateur'}</Text>
                <Text style={[s.email, { color: C.textSecondary }]}>{session?.user?.email}</Text>
                {profile?.role ? (
                  <View style={s.roleBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#fff" />
                    <Text style={s.roleText}>{ROLE_LABEL[profile.role] ?? profile.role}</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>

          {/* Stats gamification */}
          {gam && (
            <View style={s.statsRow}>
              <GlassCard style={s.statCard}>
                <Text style={[s.statValue, { color: C.text }]}>{gam.level}</Text>
                <Text style={[s.statLabel, { color: C.textSecondary }]}>Niveau</Text>
              </GlassCard>
              <GlassCard style={s.statCard}>
                <Text style={[s.statValue, { color: C.text }]}>{gam.total_xp.toLocaleString('fr-FR')}</Text>
                <Text style={[s.statLabel, { color: C.textSecondary }]}>XP total</Text>
              </GlassCard>
              <GlassCard style={s.statCard}>
                <Text style={[s.statValue, { color: C.text }]}>{gam.best_streak}</Text>
                <Text style={[s.statLabel, { color: C.textSecondary }]}>Record série</Text>
              </GlassCard>
            </View>
          )}

          {/* Détail activité */}
          {gam && (
            <GlassCard style={s.activity}>
              <Text style={[s.cardTitle, { color: C.text }]}>Mon activité</Text>
              <Row icon="school" color={GRADIENTS.blue} label="Leçons e-learning" value={gam.total_elearning_completed} C={C} />
              <Row icon="fitness" color={GRADIENTS.orange} label="Vidéos de pratique" value={gam.total_practice_viewed} C={C} />
              <Row icon="flask" color={GRADIENTS.green} label="Tests consultés" value={gam.total_testing_viewed} C={C} />
              <Row icon="log-in" color={GRADIENTS.violet} label="Connexions totales" value={gam.total_logins} C={C} />
            </GlassCard>
          )}

          <Pressable style={s.signOut} onPress={signOut}>
            <Ionicons name="log-out-outline" size={18} color="#dc2626" />
            <Text style={s.signOutText}>Se déconnecter</Text>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Row({ icon, color, label, value, C }: { icon: keyof typeof Ionicons.glyphMap; color: [string, string]; label: string; value: number; C: ReturnType<typeof usePaletteFor> }) {
  return (
    <View style={s.row}>
      <LinearGradient colors={color} style={s.rowIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={16} color="#fff" />
      </LinearGradient>
      <Text style={[s.rowLabel, { color: C.text }]}>{label}</Text>
      <Text style={[s.rowValue, { color: C.textSecondary }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  head: { alignItems: 'center', gap: 6, paddingTop: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  email: { fontSize: 14 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BRAND, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 4 },
  roleText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 14, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, textAlign: 'center' },

  activity: { padding: 18, gap: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowValue: { fontSize: 15, fontWeight: '700' },

  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(220,38,38,0.1)', paddingVertical: 15, borderRadius: 14, marginTop: 4 },
  signOutText: { color: '#dc2626', fontWeight: '700', fontSize: 16 },
});
