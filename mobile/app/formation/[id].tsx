import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '@/lib/auth';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Formation = Tables<'elearning_formations'>;
type Chapter = Tables<'elearning_chapters'>;
type Subpart = Tables<'elearning_subparts'>;

type SubpartWithProgress = Subpart & { completed: boolean };
type ChapterWithSubparts = Chapter & { subparts: SubpartWithProgress[] };

export default function FormationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [formation, setFormation] = useState<Formation | null>(null);
  const [chapters, setChapters] = useState<ChapterWithSubparts[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!id || !session?.user) return;
    const uid = session.user.id;

    const [fRes, cRes, spRes, progRes] = await Promise.all([
      supabase.from('elearning_formations').select('*').eq('id', id).maybeSingle(),
      supabase.from('elearning_chapters').select('*').eq('formation_id', id).order('order_index'),
      supabase.from('elearning_subparts').select('*').order('order_index'),
      supabase.from('elearning_subpart_progress').select('subpart_id, completed').eq('user_id', uid),
    ]);

    setFormation(fRes.data);

    const progressMap = new Map<string, boolean>();
    for (const p of progRes.data ?? []) progressMap.set(p.subpart_id, p.completed);

    const built: ChapterWithSubparts[] = (cRes.data ?? []).map((ch) => ({
      ...ch,
      subparts: (spRes.data ?? [])
        .filter((sp) => sp.chapter_id === ch.id)
        .map((sp) => ({ ...sp, completed: progressMap.get(sp.id) ?? false })),
    }));

    setChapters(built);
    if (built.length > 0) setExpanded(new Set([built[0].id]));
    setLoading(false);
  }, [id, session]);

  useEffect(() => { load(); }, [load]);

  const toggleChapter = (chId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(chId) ? next.delete(chId) : next.add(chId);
      return next;
    });

  const totalSubparts = chapters.reduce((acc, ch) => acc + ch.subparts.length, 0);
  const completedSubparts = chapters.reduce((acc, ch) => acc + ch.subparts.filter((s) => s.completed).length, 0);
  const progress = totalSubparts > 0 ? completedSubparts / totalSubparts : 0;

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
                      onPress={() => router.push(`/subpart/${sp.id}`)}
                      style={s.subpartRow}>
                      <View style={[s.subpartCheck, sp.completed && s.subpartCheckDone]}>
                        {sp.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.subpartTitle, { color: C.text }]}>{sp.title}</Text>
                        <View style={s.subpartMeta}>
                          {sp.vimeo_url && <Ionicons name="play-circle" size={13} color={C.textMuted} />}
                          {sp.pdf_url && <Ionicons name="document-text" size={13} color={C.textMuted} />}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                    </Pressable>
                  ))}
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
  subpartMeta: { flexDirection: 'row', gap: 6, marginTop: 3 },
});
