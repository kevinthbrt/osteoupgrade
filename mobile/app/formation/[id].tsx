import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { canAccessFormation, type Role } from '@/lib/access';
import { useAuth } from '@/lib/auth';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Formation = Tables<'elearning_formations'>;
type Chapter = Tables<'elearning_chapters'>;
type Subpart = Tables<'elearning_subparts'>;

type SubpartWithProgress = Subpart & {
  completed: boolean;
  quizId: string | null;
  quizPassed: boolean;
  locked: boolean;
};
type ChapterWithSubparts = Chapter & { subparts: SubpartWithProgress[] };

export default function FormationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [formation, setFormation] = useState<Formation | null>(null);
  const [chapters, setChapters] = useState<ChapterWithSubparts[]>([]);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!id || !session?.user) return;
    const uid = session.user.id;

    const [fRes, cRes, progRes, pRes] = await Promise.all([
      supabase.from('elearning_formations').select('*').eq('id', id).maybeSingle(),
      supabase.from('elearning_chapters').select('*').eq('formation_id', id).order('order_index'),
      supabase.from('elearning_subpart_progress').select('subpart_id').eq('user_id', uid),
      supabase.from('profiles').select('role').eq('id', uid).maybeSingle(),
    ]);

    setFormation(fRes.data);
    setRole((pRes.data?.role ?? null) as Role);

    const chapterIds = (cRes.data ?? []).map((c) => c.id);
    const { data: spData } = chapterIds.length
      ? await supabase.from('elearning_subparts').select('*').in('chapter_id', chapterIds).order('order_index')
      : { data: [] as Subpart[] };

    const subpartIds = (spData ?? []).map((sp) => sp.id);

    // Quiz actifs par sous-partie + tentatives réussies de l'utilisateur
    const [quizRes, attemptRes] = await Promise.all([
      subpartIds.length
        ? supabase.from('elearning_quizzes').select('id, subpart_id, passing_score').eq('is_active', true).in('subpart_id', subpartIds)
        : Promise.resolve({ data: [] as { id: string; subpart_id: string; passing_score: number }[] }),
      supabase.from('elearning_quiz_attempts').select('quiz_id, passed').eq('user_id', uid).eq('passed', true),
    ]);

    const quizBySubpart = new Map<string, string>(); // subpart_id -> quiz_id
    for (const q of quizRes.data ?? []) quizBySubpart.set(q.subpart_id, q.id);
    const passedQuizIds = new Set<string>((attemptRes.data ?? []).map((a) => a.quiz_id));

    // Suivi e-learning = présence d'une ligne (cf. site web)
    const completedSet = new Set<string>((progRes.data ?? []).map((p) => p.subpart_id));

    // Calcul de l'accessibilité : une sous-partie est accessible si la précédente
    // (sur toute la formation aplatie) est accessible ET son quiz est réussi (ou absent).
    const flat = (cRes.data ?? []).flatMap((ch) => (spData ?? []).filter((sp) => sp.chapter_id === ch.id));
    const accessible = new Set<string>();
    for (let i = 0; i < flat.length; i++) {
      if (i === 0) { accessible.add(flat[i].id); continue; }
      const prev = flat[i - 1];
      const prevQuizId = quizBySubpart.get(prev.id) ?? null;
      const prevQuizPassed = !prevQuizId || passedQuizIds.has(prevQuizId);
      if (accessible.has(prev.id) && prevQuizPassed) accessible.add(flat[i].id);
    }

    const built: ChapterWithSubparts[] = (cRes.data ?? []).map((ch) => ({
      ...ch,
      subparts: (spData ?? [])
        .filter((sp) => sp.chapter_id === ch.id)
        .map((sp) => {
          const quizId = quizBySubpart.get(sp.id) ?? null;
          return {
            ...sp,
            completed: completedSet.has(sp.id),
            quizId,
            quizPassed: quizId ? passedQuizIds.has(quizId) : true,
            locked: !accessible.has(sp.id),
          };
        }),
    }));

    setChapters(built);
    if (built.length > 0) setExpanded(new Set([built[0].id]));
    setLoading(false);
  }, [id, session]);

  // Recharge à chaque focus pour refléter un quiz réussi / une leçon validée au retour
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleChapter = (chId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(chId) ? next.delete(chId) : next.add(chId);
      return next;
    });

  const totalSubparts = chapters.reduce((acc, ch) => acc + ch.subparts.length, 0);
  const completedSubparts = chapters.reduce((acc, ch) => acc + ch.subparts.filter((s) => s.completed).length, 0);
  const progress = totalSubparts > 0 ? completedSubparts / totalSubparts : 0;

  const accessDenied = !loading && formation != null && !canAccessFormation(role, formation.is_private, formation.is_free_access);

  if (accessDenied) {
    return (
      <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.back}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </Pressable>
            <Text style={[s.headerTitle, { color: C.text }]} numberOfLines={1}>{formation?.title ?? 'Formation'}</Text>
          </View>
          <View style={s.gateWrap}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={s.gateIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="star" size={40} color="#fff" />
            </LinearGradient>
            <Text style={[s.gateTitle, { color: C.text }]}>Contenu Premium</Text>
            <Text style={[s.gateSub, { color: C.textSecondary }]}>
              Cette formation est réservée aux abonnés Premium. Passe à l'offre Premium sur le site OsteoUpgrade pour y accéder.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: C.text }]} numberOfLines={1}>
            {formation?.title ?? 'Formation'}
          </Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Progress card */}
            {totalSubparts > 0 && (
              <GlassCard style={s.progressCard}>
                <View style={s.progressRow}>
                  <Text style={[s.progressLabel, { color: C.text }]}>
                    {completedSubparts} / {totalSubparts} leçons terminées
                  </Text>
                  <Text style={[s.progressPct, { color: BRAND }]}>
                    {Math.round(progress * 100)} %
                  </Text>
                </View>
                <View style={[s.progressBar, { backgroundColor: C.border }]}>
                  <LinearGradient
                    colors={GRADIENTS.brand}
                    style={[s.progressFill, { width: `${progress * 100}%` }]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                </View>
              </GlassCard>
            )}

            {/* Chapters */}
            {chapters.map((ch) => {
              const open = expanded.has(ch.id);
              const chCompleted = ch.subparts.filter((s) => s.completed).length;
              return (
                <View key={ch.id}>
                  <Pressable onPress={() => toggleChapter(ch.id)}>
                    <GlassCard style={s.chapterHeader}>
                      <LinearGradient
                        colors={GRADIENTS.blue}
                        style={s.chapterNum}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Text style={s.chapterNumText}>{ch.order_index}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.chapterTitle, { color: C.text }]}>{ch.title}</Text>
                        <Text style={[s.chapterSub, { color: C.textSecondary }]}>
                          {chCompleted}/{ch.subparts.length} leçons
                        </Text>
                      </View>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={C.textMuted}
                      />
                    </GlassCard>
                  </Pressable>

                  {open && ch.subparts.map((sp) => (
                    <Pressable
                      key={sp.id}
                      onPress={() => { if (!sp.locked) router.push(`/subpart/${sp.id}`); }}
                      style={[s.subpartRow, sp.locked && { opacity: 0.55 }]}>
                      <View style={[s.subpartCheck, sp.completed && s.subpartCheckDone]}>
                        {sp.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.subpartTitle, { color: C.text }]}>{sp.title}</Text>
                        <View style={s.subpartMeta}>
                          {sp.vimeo_url && <Ionicons name="play-circle" size={13} color={C.textMuted} />}
                          {sp.pdf_url && <Ionicons name="document-text" size={13} color={C.textMuted} />}
                          {sp.quizId && (
                            <View style={[s.quizTag, sp.quizPassed ? s.quizTagDone : s.quizTagTodo]}>
                              <Ionicons name={sp.quizPassed ? 'checkmark-circle' : 'help-circle'} size={11} color={sp.quizPassed ? '#16a34a' : BRAND} />
                              <Text style={[s.quizTagText, { color: sp.quizPassed ? '#16a34a' : BRAND }]}>Quiz</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {sp.locked ? (
                        <Ionicons name="lock-closed" size={15} color={C.textMuted} />
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                      )}
                    </Pressable>
                  ))}
                  {/* Message d'aide si une leçon est bloquée par un quiz */}
                  {open && ch.subparts.some((sp) => sp.locked) && (
                    <Text style={[s.lockHint, { color: C.textMuted }]}>
                      Réussis le quiz de la leçon précédente pour débloquer la suite.
                    </Text>
                  )}
                </View>
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, gap: 10, paddingBottom: 100 },

  progressCard: { padding: 16, gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 14, fontWeight: '600' },
  progressPct: { fontSize: 14, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },

  chapterHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  chapterNum: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chapterNumText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  chapterTitle: { fontSize: 15, fontWeight: '700' },
  chapterSub: { fontSize: 12, marginTop: 1 },

  subpartRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  subpartCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  subpartCheckDone: { backgroundColor: BRAND, borderColor: BRAND },
  subpartTitle: { fontSize: 14, fontWeight: '500' },
  subpartMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  quizTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  quizTagTodo: { backgroundColor: 'rgba(37,99,235,0.1)' },
  quizTagDone: { backgroundColor: 'rgba(34,197,94,0.12)' },
  quizTagText: { fontSize: 10, fontWeight: '700' },
  lockHint: { fontSize: 12, fontStyle: 'italic', paddingHorizontal: 20, paddingVertical: 8 },

  gateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  gateIcon: { width: 88, height: 88, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  gateTitle: { fontSize: 22, fontWeight: '800' },
  gateSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
