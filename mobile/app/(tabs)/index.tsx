import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { BRAND, PALETTE } from './_layout';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

type Stats = { formations: number; completed: number; total: number };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

// Carte liquid glass — blur + gradient overlay
function GlassCard({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
}) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return (
    <Pressable onPress={onPress} style={[s.glassWrap, style]}>
      <BlurView
        intensity={dark ? 40 : 60}
        tint={dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.45)' },
        ]}
      />
      {children}
    </Pressable>
  );
}

// Tuile de raccourci rapide
function QuickTile({
  icon,
  label,
  gradient,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  gradient: [string, string];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.tile}>
      <LinearGradient colors={gradient} style={s.tileGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={28} color="#fff" />
      </LinearGradient>
      <Text style={s.tileLabel}>{label}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const C = PALETTE[dark ? 'dark' : 'light'];

  const [stats, setStats] = useState<Stats>({ formations: 0, completed: 0, total: 0 });
  const [firstName, setFirstName] = useState('');
  const [recentFormation, setRecentFormation] = useState<{ title: string; photo_url: string | null } | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;

    // Prénom
    supabase.from('profiles').select('full_name').eq('id', uid).maybeSingle().then(({ data }) => {
      if (data?.full_name) setFirstName(data.full_name.split(' ')[0]);
    });

    // Stats formations
    supabase.from('elearning_formations').select('id, title, photo_url', { count: 'exact' })
      .order('created_at', { ascending: false })
      .then(({ data, count }) => {
        setStats((s) => ({ ...s, formations: count ?? 0 }));
        if (data?.[0]) setRecentFormation({ title: data[0].title, photo_url: data[0].photo_url });
      });

    // Progression
    supabase.from('elearning_subpart_progress').select('completed', { count: 'exact' })
      .eq('user_id', uid)
      .then(({ count }) => {
        const total = count ?? 0;
        supabase.from('elearning_subpart_progress').select('id', { count: 'exact' })
          .eq('user_id', uid).eq('completed', true)
          .then(({ count: done }) => {
            setStats((s) => ({ ...s, completed: done ?? 0, total }));
          });
      });
  }, [session]);

  const progress = stats.total > 0 ? stats.completed / stats.total : 0;

  return (
    <LinearGradient
      colors={dark ? ['#0A0A0F', '#0D1117', '#111827'] : ['#E8F4FD', '#F0F8FF', '#F8FAFF']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
          showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={s.hero}>
            <View>
              <Text style={[s.greeting, { color: C.textSecondary }]}>{getGreeting()},</Text>
              <Text style={[s.name, { color: C.text }]}>{firstName || 'Ostéopathe'} 👋</Text>
            </View>
            <GlassCard style={s.notifBtn}>
              <Ionicons name="notifications-outline" size={20} color={BRAND} style={{ margin: 10 }} />
            </GlassCard>
          </View>

          {/* ── Carte de progression ── */}
          <GlassCard style={s.progressCard}>
            <LinearGradient
              colors={['#208AEF22', '#208AEF08']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={[s.progressTitle, { color: C.text }]}>Ma progression</Text>
            <View style={s.progressBarBg}>
              <LinearGradient
                colors={['#208AEF', '#5CB8FF']}
                style={[s.progressBarFill, { width: `${Math.round(progress * 100)}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <View style={s.progressRow}>
              <Text style={[s.progressSub, { color: C.textSecondary }]}>
                {stats.completed} / {stats.total} leçons complétées
              </Text>
              <Text style={[s.progressPct, { color: BRAND }]}>
                {Math.round(progress * 100)} %
              </Text>
            </View>
          </GlassCard>

          {/* ── Stats rapides ── */}
          <View style={s.statsRow}>
            <GlassCard style={s.statCard}>
              <LinearGradient colors={['#208AEF', '#0066CC']} style={s.statIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="school" size={18} color="#fff" />
              </LinearGradient>
              <Text style={[s.statValue, { color: C.text }]}>{stats.formations}</Text>
              <Text style={[s.statLabel, { color: C.textSecondary }]}>Formations</Text>
            </GlassCard>
            <GlassCard style={s.statCard}>
              <LinearGradient colors={['#34C759', '#20A040']} style={s.statIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
              </LinearGradient>
              <Text style={[s.statValue, { color: C.text }]}>{stats.completed}</Text>
              <Text style={[s.statLabel, { color: C.textSecondary }]}>Complétées</Text>
            </GlassCard>
            <GlassCard style={s.statCard}>
              <LinearGradient colors={['#FF9500', '#FF6B00']} style={s.statIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="flame" size={18} color="#fff" />
              </LinearGradient>
              <Text style={[s.statValue, { color: C.text }]}>
                {stats.total - stats.completed}
              </Text>
              <Text style={[s.statLabel, { color: C.textSecondary }]}>Restantes</Text>
            </GlassCard>
          </View>

          {/* ── Raccourcis ── */}
          <Text style={[s.section, { color: C.text }]}>Accès rapide</Text>
          <View style={s.tiles}>
            <QuickTile icon="school-outline" label="Mes cours" gradient={['#208AEF', '#0055CC']} onPress={() => router.push('/cours')} />
            <QuickTile icon="albums-outline" label="Flashcards" gradient={['#AF52DE', '#7B2FBE']} onPress={() => router.push('/flashcards')} />
            <QuickTile icon="fitness-outline" label="Pratique" gradient={['#FF6B35', '#FF3B00']} onPress={() => router.push('/pratique')} />
            <QuickTile icon="flask-outline" label="Tests ortho" gradient={['#34C759', '#1A8C3A']} onPress={() => router.push('/pratique')} />
          </View>

          {/* ── Reprendre là où tu t'es arrêté ── */}
          {recentFormation && (
            <>
              <Text style={[s.section, { color: C.text }]}>Continuer</Text>
              <Pressable onPress={() => router.push('/cours')} style={s.resumeWrap}>
                <GlassCard style={s.resumeCard}>
                  {recentFormation.photo_url ? (
                    <Image source={recentFormation.photo_url} style={s.resumeThumb} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={['#208AEF', '#0055CC']} style={s.resumeThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name="play" size={28} color="#fff" />
                    </LinearGradient>
                  )}
                  <View style={s.resumeBody}>
                    <Text style={[s.resumeTitle, { color: C.text }]} numberOfLines={2}>
                      {recentFormation.title}
                    </Text>
                    <View style={s.resumeBtn}>
                      <Ionicons name="play-circle" size={16} color={BRAND} />
                      <Text style={[s.resumeBtnText, { color: BRAND }]}>Continuer</Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },

  // Hero
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  greeting: { fontSize: 15, fontWeight: '400' },
  name: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  notifBtn: { borderRadius: 16, overflow: 'hidden' },

  // Glass card
  glassWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Progress
  progressCard: { padding: 20, gap: 10 },
  progressTitle: { fontSize: 16, fontWeight: '700' },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(32,138,239,0.15)',
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressSub: { fontSize: 12 },
  progressPct: { fontSize: 14, fontWeight: '700' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 14, gap: 6, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },

  // Section title
  section: { fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: -4 },

  // Tiles
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: CARD_W, alignItems: 'center', gap: 8 },
  tileGradient: {
    width: CARD_W,
    height: CARD_W * 0.6,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontSize: 13, fontWeight: '600', color: '#11181C', textAlign: 'center' },

  // Resume
  resumeWrap: {},
  resumeCard: { flexDirection: 'row', overflow: 'hidden', gap: 0 },
  resumeThumb: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  resumeBody: { flex: 1, padding: 14, justifyContent: 'space-between' },
  resumeTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  resumeBtnText: { fontSize: 14, fontWeight: '600' },
});
