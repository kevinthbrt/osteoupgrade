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
import * as haptics from '@/lib/haptics';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Quiz = Tables<'elearning_quizzes'>;
type Question = Tables<'elearning_quiz_questions'>;
type Answer = Tables<'elearning_quiz_answers'>;

type QuestionWithAnswers = Question & { answers: Answer[] };

export default function QuizScreen() {
  // id = quiz id
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);

  // état de passage
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: quizData } = await supabase
        .from('elearning_quizzes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setQuiz(quizData);

      const { data: qData } = await supabase
        .from('elearning_quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index');

      const qIds = (qData ?? []).map((q) => q.id);
      const { data: aData } = qIds.length
        ? await supabase.from('elearning_quiz_answers').select('*').in('question_id', qIds).order('order_index')
        : { data: [] as Answer[] };

      const built: QuestionWithAnswers[] = (qData ?? []).map((q) => ({
        ...q,
        answers: (aData ?? []).filter((a) => a.question_id === q.id),
      }));
      setQuestions(built);
      setLoading(false);
    })();
  }, [id]);

  const current = questions[index];
  const total = questions.length;

  const toggleAnswer = (answerId: string) => {
    if (!current) return;
    haptics.selection();
    const isMulti = current.question_type === 'multiple_answer';
    setAnswers((prev) => {
      const cur = prev[current.id] ?? [];
      if (isMulti) {
        return {
          ...prev,
          [current.id]: cur.includes(answerId) ? cur.filter((a) => a !== answerId) : [...cur, answerId],
        };
      }
      return { ...prev, [current.id]: [answerId] };
    });
  };

  const isSelected = (answerId: string) => (answers[current?.id ?? ''] ?? []).includes(answerId);
  const isAnswered = (qId: string) => (answers[qId] ?? []).length > 0;

  const finish = useCallback(async () => {
    if (!quiz || !session?.user) return;
    setSaving(true);

    let correctCount = 0;
    for (const q of questions) {
      const userSel = answers[q.id] ?? [];
      const correct = q.answers.filter((a) => a.is_correct).map((a) => a.id);
      const ok = userSel.length === correct.length && userSel.every((a) => correct.includes(a));
      if (ok) correctCount++;
    }
    const finalScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = finalScore >= quiz.passing_score;

    passed ? haptics.success() : haptics.warning();
    setScore(finalScore);
    setShowResults(true);

    // Enregistre la tentative (même schéma que le web)
    await supabase.from('elearning_quiz_attempts').insert({
      quiz_id: quiz.id,
      user_id: session.user.id,
      score: finalScore,
      total_questions: total,
      correct_answers: correctCount,
      passed,
      answers_data: answers,
      completed_at: new Date().toISOString(),
    });

    // Quiz réussi → auto-valide la sous-partie (présence de ligne, comme le web)
    if (passed) {
      await supabase.from('elearning_subpart_progress').upsert(
        { user_id: session.user.id, subpart_id: quiz.subpart_id, completed_at: new Date().toISOString() },
        { onConflict: 'subpart_id,user_id' },
      );
    }
    setSaving(false);
  }, [quiz, session, questions, answers, total]);

  const retry = () => {
    setIndex(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const next = () => {
    if (index < total - 1) setIndex((i) => i + 1);
    else finish();
  };

  if (loading) {
    return (
      <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
      </LinearGradient>
    );
  }

  // ── Écran de résultats ──
  if (showResults) {
    const passed = score >= (quiz?.passing_score ?? 100);
    return (
      <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={s.resultWrap}>
            <LinearGradient
              colors={passed ? GRADIENTS.green : GRADIENTS.orange}
              style={s.resultIcon}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name={passed ? 'trophy' : 'flag'} size={44} color="#fff" />
            </LinearGradient>
            <Text style={[s.resultTitle, { color: C.text }]}>
              {passed ? 'Félicitations !' : 'Pas tout à fait…'}
            </Text>
            <Text style={[s.resultSub, { color: C.textSecondary }]}>
              {passed
                ? 'Quiz réussi, la leçon est validée.'
                : `Il faut ${quiz?.passing_score}% pour valider ce quiz.`}
            </Text>

            <GlassCard style={s.scoreCard}>
              <Text style={[s.scoreValue, { color: passed ? '#16a34a' : '#ea580c' }]}>{score}%</Text>
              <View style={[s.scoreBar, { backgroundColor: C.border }]}>
                <LinearGradient
                  colors={passed ? GRADIENTS.green : GRADIENTS.orange}
                  style={[s.scoreFill, { width: `${score}%` }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={[s.scoreMeta, { color: C.textSecondary }]}>
                {Math.round((score / 100) * total)} / {total} bonnes réponses · requis {quiz?.passing_score}%
              </Text>
            </GlassCard>

            <View style={s.resultActions}>
              {!passed && (
                <Pressable style={{ flex: 1 }} onPress={retry}>
                  <View style={[s.btn, s.btnSecondary]}>
                    <Ionicons name="refresh" size={18} color={BRAND} />
                    <Text style={[s.btnText, { color: BRAND }]}>Réessayer</Text>
                  </View>
                </Pressable>
              )}
              <Pressable style={{ flex: 1 }} onPress={() => router.back()}>
                <LinearGradient colors={passed ? GRADIENTS.green : GRADIENTS.brand} style={s.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={[s.btnText, { color: '#fff' }]}>{passed ? 'Continuer' : 'Fermer'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Écran question ──
  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="close" size={24} color={C.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: C.text }]} numberOfLines={1}>{quiz?.title ?? 'Quiz'}</Text>
        </View>

        {/* Progression */}
        <View style={s.progressWrap}>
          <View style={s.progressRow}>
            <Text style={[s.progressText, { color: C.textSecondary }]}>Question {index + 1} / {total}</Text>
            <Text style={[s.progressText, { color: C.textSecondary }]}>{Math.round(((index + 1) / total) * 100)}%</Text>
          </View>
          <View style={[s.progressBg, { backgroundColor: C.border }]}>
            <LinearGradient colors={GRADIENTS.brand} style={[s.progressFill, { width: `${((index + 1) / total) * 100}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
        </View>

        {current ? (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <GlassCard style={s.questionCard}>
              <Text style={[s.questionText, { color: C.text }]}>{current.question_text}</Text>
              {current.question_type === 'multiple_answer' && (
                <View style={s.multiHint}>
                  <Ionicons name="information-circle" size={14} color={BRAND} />
                  <Text style={[s.multiHintText, { color: BRAND }]}>Plusieurs réponses possibles</Text>
                </View>
              )}
            </GlassCard>

            {current.answers.map((a) => {
              const sel = isSelected(a.id);
              return (
                <Pressable key={a.id} onPress={() => toggleAnswer(a.id)}>
                  <View style={[s.answer, { borderColor: sel ? BRAND : C.border, backgroundColor: sel ? 'rgba(37,99,235,0.08)' : C.card }]}>
                    <View style={[s.radio, { borderColor: sel ? BRAND : C.textMuted, backgroundColor: sel ? BRAND : 'transparent' }]}>
                      {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text style={[s.answerText, { color: C.text }]}>{a.answer_text}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Navigation */}
        <View style={s.navBar}>
          <Pressable
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            style={[s.navPrev, index === 0 && { opacity: 0.4 }]}>
            <Text style={[s.navPrevText, { color: C.textSecondary }]}>Précédent</Text>
          </Pressable>
          <Pressable onPress={next} disabled={!current || !isAnswered(current.id) || saving}>
            <LinearGradient
              colors={GRADIENTS.brand}
              style={[s.navNext, (!current || !isAnswered(current.id)) && { opacity: 0.5 }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.navNextText}>{index === total - 1 ? 'Terminer' : 'Suivant'}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700' },

  progressWrap: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 12, fontWeight: '600' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  scroll: { padding: 16, gap: 10 },
  questionCard: { padding: 18, gap: 10 },
  questionText: { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  multiHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  multiHintText: { fontSize: 12, fontWeight: '600' },

  answer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  answerText: { flex: 1, fontSize: 15, fontWeight: '500' },

  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  navPrev: { paddingVertical: 12, paddingHorizontal: 16 },
  navPrevText: { fontSize: 15, fontWeight: '600' },
  navNext: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
  navNextText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  resultIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  resultTitle: { fontSize: 26, fontWeight: '800' },
  resultSub: { fontSize: 15, textAlign: 'center' },
  scoreCard: { width: '100%', padding: 20, gap: 10, alignItems: 'center', marginTop: 8 },
  scoreValue: { fontSize: 44, fontWeight: '800' },
  scoreBar: { width: '100%', height: 10, borderRadius: 5, overflow: 'hidden' },
  scoreFill: { height: 10, borderRadius: 5 },
  scoreMeta: { fontSize: 13 },
  resultActions: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14 },
  btnSecondary: { borderWidth: 2, borderColor: BRAND },
  btnText: { fontWeight: '700', fontSize: 15 },
});
