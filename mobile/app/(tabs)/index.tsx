import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Dimensions,
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
import { useAuth } from '@/lib/auth';
import { getRecent, type RecentItem } from '@/lib/recent';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

const { width } = Dimensions.get('window');
const TILE_W = (width - 40 - 12) / 2;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

// XP nécessaire pour le prochain niveau (palier simple de 500 XP/niveau)
function levelProgress(level: number, xp: number) {
  const perLevel = 500;
  const base = (level - 1) * perLevel;
  const into = Math.max(0, xp - base);
  return Math.min(1, into / perLevel);
}

type Dash = {
  firstName: string;
  level: number;
  xp: number;
  streak: number;
  bestStreak: number;
  formationsCount: number;
  lessonsDone: number;
  lessonsTotal: number;
  dueFlashcards: number;
  recent: RecentItem | null;
};

const EMPTY: Dash = {
  firstName: '',
  level: 1,
  xp: 0,
  streak: 0,
  bestStreak: 0,
  formationsCount: 0,
  lessonsDone: 0,
  lessonsTotal: 0,
  dueFlashcards: 0,
  recent: null,
};

export default function DashboardScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const C = usePaletteFor(scheme);

  const [d, setD] = useState<Dash>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const uid = session.user.id;
    const now = new Date().toISOString();

    const [profile, gam, formations, lessonsDoneRes, subpartsTotalRes, dueCards, recent] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', uid).maybeSingle(),
      supabase.from('user_gamification_stats').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('elearning_formations').select('id', { count: 'exact', head: true }),
      // Suivi = présence d'une ligne (pas de colonne "completed")
      supabase.from('elearning_subpart_progress').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('elearning_subparts').select('id', { count: 'exact', head: true }),
      supabase.from('flashcard_progress').select('id', { count: 'exact', head: true }).eq('user_id', uid).lte('next_review_at', now),
      getRecent(uid),
    ]);

    setD({
      firstName: profile.data?.full_name?.split(' ')[0] ?? '',
      level: gam.data?.level ?? 1,
      xp: gam.data?.total_xp ?? 0,
      streak: gam.data?.current_streak ?? 0,
      bestStreak: gam.data?.best_streak ?? 0,
      formationsCount: formations.count ?? 0,
      lessonsDone: lessonsDoneRes.count ?? 0,
      lessonsTotal: subpartsTotalRes.count ?? 0,
      dueFlashcards: dueCards.count ?? 0,
      recent,
    });
    setLoading(false);
  }, [session]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <LinearGradient colors={C.bgGradient} style={s.fill}>
        <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
      </LinearGradient>
    );
  }

  const lessonPct = d.lessonsTotal > 0 ? d.lessonsDone / d.lessonsTotal : 0;
  const lvlPct = levelProgress(d.level, d.xp);

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}>

          {/* ── En-tête ── */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={[s.greeting, { color: C.textSecondary }]}>{getGreeting()},</Text>
              <Text style={[s.name, { color: C.text }]}>{d.firstName || 'Ostéopathe'} 👋</Text>
            </View>
            <Pressable onPress={() => router.push('/search')} style={[s.searchBtn, { backgroundColor: C.card, borderColor: C.border }]}>
              <Ionicons name="search" size={20} color={C.text} />
            </Pressable>
            <Pressable onPress={() => router.push('/profil')}>
              <LinearGradient colors={GRADIENTS.brand} style={s.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={s.avatarText}>
                  {(d.firstName || session?.user?.email || '?').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* ── Carte niveau / XP / streak (dégradé signature) ── */}
          <View style={s.heroCard}>
            <LinearGradient colors={GRADIENTS.brand} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={s.heroTop}>
              <View>
                <Text style={s.heroLabel}>NIVEAU {d.level}</Text>
                <Text style={s.heroXp}>{d.xp.toLocaleString('fr-FR')} XP</Text>
              </View>
              <View style={s.streakBox}>
                <Ionicons name="flame" size={20} color="#FFD60A" />
                <Text style={s.streakNum}>{d.streak}</Text>
                <Text style={s.streakLabel}>jours</Text>
              </View>
            </View>
            <View style={s.heroBarBg}>
              <View style={[s.heroBarFill, { width: `${Math.round(lvlPct * 100)}%` }]} />
            </View>
            <Text style={s.heroBarText}>
              {Math.round(lvlPct * 100)} % vers le niveau {d.level + 1} · record {d.bestStreak} j 🔥
            </Text>
          </View>

          {/* ── CTA Flashcards à réviser ── */}
          {d.dueFlashcards > 0 && (
            <Pressable onPress={() => router.push('/flashcards')}>
              <GlassCard style={s.dueCard}>
                <LinearGradient colors={GRADIENTS.violet} style={s.dueIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="albums" size={22} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[s.dueTitle, { color: C.text }]}>{d.dueFlashcards} carte{d.dueFlashcards > 1 ? 's' : ''} à réviser</Text>
                  <Text style={[s.dueSub, { color: C.textSecondary }]}>C'est le moment de réviser !</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
              </GlassCard>
            </Pressable>
          )}

          {/* ── Progression e-learning ── */}
          <GlassCard style={s.progressCard}>
            <View style={s.progressHead}>
              <Text style={[s.cardTitle, { color: C.text }]}>Ma progression</Text>
              <Text style={[s.progressPct, { color: BRAND }]}>{Math.round(lessonPct * 100)} %</Text>
            </View>
            <View style={[s.barBg, { backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(37,99,235,0.12)' }]}>
              <LinearGradient colors={GRADIENTS.blue} style={[s.barFill, { width: `${Math.round(lessonPct * 100)}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            </View>
            <Text style={[s.progressSub, { color: C.textSecondary }]}>
              {d.lessonsDone} / {d.lessonsTotal || '—'} leçons complétées
            </Text>
          </GlassCard>

          {/* ── Stats rapides ── */}
          <View style={s.statsRow}>
            <StatCard color={GRADIENTS.blue} icon="school" value={d.formationsCount} label="Formations" C={C} />
            <StatCard color={GRADIENTS.green} icon="checkmark-done" value={d.lessonsDone} label="Complétées" C={C} />
            <StatCard color={GRADIENTS.orange} icon="flame" value={d.streak} label="Série" C={C} />
          </View>

          {/* ── Accès rapide ── */}
          <Text style={[s.section, { color: C.text }]}>Accès rapide</Text>
          <View style={s.tiles}>
            <Tile icon="school" label="Mes cours" sub="Formations vidéo" gradient={GRADIENTS.blue} onPress={() => router.push('/cours')} />
            <Tile icon="albums" label="Flashcards" sub={`${d.dueFlashcards} à réviser`} gradient={GRADIENTS.violet} onPress={() => router.push('/flashcards')} />
            <Tile icon="fitness" label="Pratique" sub="Techniques" gradient={GRADIENTS.orange} onPress={() => router.push('/pratique')} />
            <Tile icon="body" label="Tests ortho" sub="Examen clinique" gradient={GRADIENTS.green} onPress={() => router.push('/tests')} />
          </View>

          {/* ── Reprendre (dernière leçon / vidéo ouverte) ── */}
          {d.recent && (
            <>
              <Text style={[s.section, { color: C.text }]}>Reprendre</Text>
              <Pressable onPress={() => router.push((d.recent!.kind === 'video' ? `/video/${d.recent!.id}` : `/subpart/${d.recent!.id}`) as never)}>
                <GlassCard style={s.resumeCard}>
                  {d.recent.thumb ? (
                    <Image source={d.recent.thumb} style={s.resumeThumb} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={d.recent.kind === 'video' ? GRADIENTS.orange : GRADIENTS.brand} style={s.resumeThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name={d.recent.kind === 'video' ? 'fitness' : 'play'} size={28} color="#fff" />
                    </LinearGradient>
                  )}
                  <View style={s.resumeBody}>
                    <Text style={[s.resumeTag, { color: C.textSecondary }]}>{d.recent.subtitle ?? ''}</Text>
                    <Text style={[s.resumeTitle, { color: C.text }]} numberOfLines={2}>{d.recent.title}</Text>
                    <View style={s.resumeBtn}>
                      <Ionicons name="play-circle" size={16} color={BRAND} />
                      <Text style={[s.resumeBtnText, { color: BRAND }]}>Reprendre</Text>
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

function StatCard({ color, icon, value, label, C }: { color: [string, string]; icon: keyof typeof Ionicons.glyphMap; value: number; label: string; C: ReturnType<typeof usePaletteFor> }) {
  return (
    <GlassCard style={s.statCard}>
      <LinearGradient colors={color} style={s.statIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={18} color="#fff" />
      </LinearGradient>
      <Text style={[s.statValue, { color: C.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: C.textSecondary }]}>{label}</Text>
    </GlassCard>
  );
}

function Tile({ icon, label, sub, gradient, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; gradient: [string, string]; onPress: () => void }) {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={s.tile}>
        <LinearGradient colors={gradient} style={s.tileIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={icon} size={24} color="#fff" />
        </LinearGradient>
        <Text style={[s.tileLabel, { color: C.text }]}>{label}</Text>
        <Text style={[s.tileSub, { color: C.textSecondary }]} numberOfLines={1}>{sub}</Text>
      </GlassCard>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  searchBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  greeting: { fontSize: 15 },
  name: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // Hero (niveau/XP)
  heroCard: { borderRadius: 24, overflow: 'hidden', padding: 20, gap: 12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  heroXp: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 2 },
  streakBox: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  streakNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  streakLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  heroBarBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  heroBarFill: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  heroBarText: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },

  // Due flashcards CTA
  dueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  dueIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dueTitle: { fontSize: 15, fontWeight: '700' },
  dueSub: { fontSize: 12, marginTop: 2 },

  // Progression
  progressCard: { padding: 18, gap: 10 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  progressPct: { fontSize: 16, fontWeight: '800' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  progressSub: { fontSize: 12 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 14, gap: 6, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },

  section: { fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: -4 },

  // Tiles
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: TILE_W, padding: 16, gap: 8 },
  tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 15, fontWeight: '700' },
  tileSub: { fontSize: 12 },

  // Resume
  resumeCard: { flexDirection: 'row', overflow: 'hidden' },
  resumeThumb: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  resumeBody: { flex: 1, padding: 14, justifyContent: 'center', gap: 2 },
  resumeTag: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  resumeTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  resumeBtnText: { fontSize: 14, fontWeight: '600' },
});
