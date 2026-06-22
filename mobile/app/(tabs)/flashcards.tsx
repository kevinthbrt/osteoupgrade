import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BRAND, PALETTE } from './_layout';

type Deck = Tables<'flashcard_decks'>;
type Card = Tables<'flashcards'>;
type Progress = Tables<'flashcard_progress'>;

const { width, height } = Dimensions.get('window');

// ── Couleurs par thème de deck ──────────────────────────────────────────────
const DECK_GRADIENTS: Record<string, [string, string]> = {
  anatomie: ['#208AEF', '#0055CC'],
  pathologie: ['#FF6B35', '#FF3B00'],
  technique: ['#AF52DE', '#7B2FBE'],
  physiologie: ['#34C759', '#1A8C3A'],
  default: ['#636366', '#48484A'],
};

function deckGradient(theme: string | null): [string, string] {
  if (!theme) return DECK_GRADIENTS.default;
  const key = Object.keys(DECK_GRADIENTS).find((k) => theme.toLowerCase().includes(k));
  return key ? DECK_GRADIENTS[key] : DECK_GRADIENTS.default;
}

// ── Carte animée (flip) ──────────────────────────────────────────────────────
function FlipCard({
  card,
  onRate,
}: {
  card: Card;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
}) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const C = PALETTE[dark ? 'dark' : 'light'];
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const flip = () => {
    if (flipped) return;
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    setFlipped(true);
  };

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  return (
    <View style={fc.container}>
      {/* Face avant — Question */}
      <Animated.View style={[fc.card, { transform: [{ rotateY: frontRotate }], opacity: frontOpacity }]}>
        <BlurView intensity={dark ? 40 : 60} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)' }]} />
        <View style={fc.badge}>
          <Text style={fc.badgeText}>QUESTION</Text>
        </View>
        <Text style={[fc.questionText, { color: C.text }]}>{card.question}</Text>
        <Pressable onPress={flip} style={fc.revealBtn}>
          <LinearGradient colors={[BRAND, '#0055CC']} style={fc.revealBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={fc.revealBtnText}>Révéler la réponse</Text>
            <Ionicons name="eye-outline" size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Face arrière — Réponse + notation */}
      <Animated.View style={[fc.card, fc.cardBack, { transform: [{ rotateY: backRotate }], opacity: backOpacity }]}>
        <BlurView intensity={dark ? 40 : 60} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)' }]} />
        <View style={[fc.badge, { backgroundColor: '#34C75922' }]}>
          <Text style={[fc.badgeText, { color: '#34C759' }]}>RÉPONSE</Text>
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Text style={[fc.answerText, { color: C.text }]}>{card.answer}</Text>
          {card.explanation ? (
            <Text style={[fc.explanationText, { color: C.textSecondary }]}>{card.explanation}</Text>
          ) : null}
        </ScrollView>
        <View style={fc.ratingRow}>
          {(
            [
              { r: 1 as const, label: 'Raté', color: '#FF3B30', icon: 'close-circle' },
              { r: 2 as const, label: 'Difficile', color: '#FF9500', icon: 'alert-circle' },
              { r: 3 as const, label: 'Bien', color: BRAND, icon: 'checkmark-circle' },
              { r: 4 as const, label: 'Facile', color: '#34C759', icon: 'rocket' },
            ] as const
          ).map(({ r, label, color, icon }) => (
            <Pressable key={r} onPress={() => onRate(r)} style={[fc.ratingBtn, { borderColor: color + '40' }]}>
              <Ionicons name={icon as any} size={22} color={color} />
              <Text style={[fc.ratingLabel, { color }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const fc = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  card: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    backfaceVisibility: 'hidden',
    justifyContent: 'space-between',
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardBack: {},
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: BRAND, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  questionText: { flex: 1, fontSize: 20, fontWeight: '700', lineHeight: 28, textAlignVertical: 'center' },
  revealBtn: { borderRadius: 14, overflow: 'hidden' },
  revealBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  revealBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  answerText: { fontSize: 17, fontWeight: '600', lineHeight: 24, marginBottom: 8 },
  explanationText: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  ratingLabel: { fontSize: 10, fontWeight: '600' },
});

// ── Algo SM-2 simplifié ─────────────────────────────────────────────────────
function sm2Next(p: Partial<Progress> | null, rating: 1 | 2 | 3 | 4) {
  const q = rating - 1; // 0..3
  let ef = Math.max(1.3, (p?.ease_factor ?? 2.5) + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02)));
  let rep = (p?.repetition ?? 0);
  let interval = 1;
  if (q < 2) { rep = 0; interval = 1; }
  else {
    rep += 1;
    if (rep === 1) interval = 1;
    else if (rep === 2) interval = 6;
    else interval = Math.round((p?.interval_days ?? 6) * ef);
  }
  const next = new Date();
  next.setDate(next.getDate() + interval);
  return { repetition: rep, ease_factor: ef, interval_days: interval, next_review_at: next.toISOString() };
}

// ── Écran principal ──────────────────────────────────────────────────────────
type Mode = 'decks' | 'session';

export default function FlashcardsScreen() {
  const { session } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const C = PALETTE[dark ? 'dark' : 'light'];

  const [mode, setMode] = useState<Mode>('decks');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);

  // Session
  const [sessionDeck, setSessionDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [dueCount, setDueCount] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  // Chargement des decks
  useEffect(() => {
    supabase.from('flashcard_decks').select('*').order('created_at').then(({ data }) => {
      setDecks(data ?? []);
      setLoadingDecks(false);
    });
  }, []);

  // Calcul des cartes à revoir par deck
  useEffect(() => {
    if (!session?.user || decks.length === 0) return;
    const now = new Date().toISOString();
    decks.forEach((deck) => {
      supabase.from('flashcard_progress')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id)
        .eq('deck_id', deck.id)
        .lte('next_review_at', now)
        .then(({ count }) => setDueCount((d) => ({ ...d, [deck.id]: count ?? 0 })));
    });
  }, [decks, session]);

  const startSession = useCallback(async (deck: Deck) => {
    if (!session?.user) return;
    setSessionLoading(true);
    setSessionDeck(deck);
    setDone(false);
    setCardIndex(0);

    const now = new Date().toISOString();
    // Cartes dues en priorité, puis nouvelles (sans progress)
    const { data: progressed } = await supabase.from('flashcard_progress')
      .select('card_id').eq('user_id', session.user.id).eq('deck_id', deck.id).lte('next_review_at', now);

    const dueIds = progressed?.map((p) => p.card_id) ?? [];
    let queue: Card[] = [];

    if (dueIds.length > 0) {
      const { data } = await supabase.from('flashcards').select('*').in('id', dueIds).order('position');
      queue = data ?? [];
    }

    // Compléter avec de nouvelles cartes si < 20
    if (queue.length < 20) {
      const { data: allCards } = await supabase.from('flashcards').select('*').eq('deck_id', deck.id).order('position');
      const seenIds = new Set(dueIds);
      const newCards = (allCards ?? []).filter((c) => !seenIds.has(c.id));
      queue = [...queue, ...newCards.slice(0, 20 - queue.length)];
    }

    setCards(queue.slice(0, 20));
    setMode('session');
    setSessionLoading(false);
  }, [session]);

  const handleRate = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    if (!session?.user || !sessionDeck) return;
    const card = cards[cardIndex];

    // Charger la progression actuelle
    const { data: existing } = await supabase.from('flashcard_progress')
      .select('*').eq('user_id', session.user.id).eq('card_id', card.id).maybeSingle();

    const update = sm2Next(existing, rating);

    if (existing) {
      await supabase.from('flashcard_progress').update({ ...update, last_rating: rating, reviewed_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('flashcard_progress').insert({ user_id: session.user.id, card_id: card.id, deck_id: sessionDeck.id, ...update, last_rating: rating, reviewed_at: new Date().toISOString() });
    }

    if (cardIndex + 1 >= cards.length) {
      setDone(true);
    } else {
      setCardIndex((i) => i + 1);
    }
  }, [session, sessionDeck, cards, cardIndex]);

  // ── Vue : liste des decks ──────────────────────────────────────────────────
  if (mode === 'decks') {
    return (
      <LinearGradient colors={dark ? ['#0A0A0F', '#0D1117'] : ['#F5EFFE', '#F8FAFF']} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={dl.header}>
            <Text style={[dl.title, { color: C.text }]}>Flashcards</Text>
            <Text style={[dl.sub, { color: C.textSecondary }]}>Répétition espacée (SM-2)</Text>
          </View>
          {loadingDecks ? (
            <View style={dl.centered}><ActivityIndicator size="large" color={BRAND} /></View>
          ) : (
            <ScrollView contentContainerStyle={[dl.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]} showsVerticalScrollIndicator={false}>
              {decks.map((deck) => {
                const grad = deckGradient(deck.theme);
                const due = dueCount[deck.id] ?? 0;
                return (
                  <Pressable key={deck.id} onPress={() => startSession(deck)} style={dl.deckWrap}>
                    <View style={dl.deckCard}>
                      <BlurView intensity={dark ? 40 : 60} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)' }]} />
                      <LinearGradient colors={grad} style={dl.deckIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name="albums" size={26} color="#fff" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[dl.deckTitle, { color: C.text }]} numberOfLines={1}>{deck.title}</Text>
                        <Text style={[dl.deckSub, { color: C.textSecondary }]}>{deck.total_cards} cartes</Text>
                        {deck.description ? <Text style={[dl.deckDesc, { color: C.textSecondary }]} numberOfLines={1}>{deck.description}</Text> : null}
                      </View>
                      <View style={[dl.dueBadge, { backgroundColor: due > 0 ? BRAND : C.border }]}>
                        <Text style={[dl.dueText, { color: due > 0 ? '#fff' : C.textSecondary }]}>{due > 0 ? `${due} à revoir` : '✓'}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Vue : session de révision ──────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  const current = cards[cardIndex];

  return (
    <LinearGradient colors={dark ? ['#0A0A0F', '#0D1117'] : ['#F5EFFE', '#F8FAFF']} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={sv.header}>
          <Pressable onPress={() => { setMode('decks'); setCards([]); }} style={sv.back}>
            <Ionicons name="chevron-back" size={22} color={BRAND} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[sv.deckName, { color: C.text }]} numberOfLines={1}>{sessionDeck?.title}</Text>
            <Text style={[sv.progress, { color: C.textSecondary }]}>{done ? cards.length : cardIndex + 1} / {cards.length}</Text>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={[sv.progressBg, { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <LinearGradient
            colors={[BRAND, '#5CB8FF']}
            style={[sv.progressFill, { width: `${done ? 100 : (cardIndex / cards.length) * 100}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        {/* Carte ou écran de fin */}
        <View style={sv.cardArea}>
          {done ? (
            <View style={sv.doneWrap}>
              <Text style={{ fontSize: 64 }}>🎉</Text>
              <Text style={[sv.doneTitle, { color: C.text }]}>Session terminée !</Text>
              <Text style={[sv.doneSub, { color: C.textSecondary }]}>{cards.length} cartes révisées</Text>
              <Pressable onPress={() => { setMode('decks'); setCards([]); }} style={sv.doneBtn}>
                <LinearGradient colors={[BRAND, '#0055CC']} style={sv.doneBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={sv.doneBtnText}>Retour aux decks</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : current ? (
            <FlipCard key={current.id} card={current} onRate={handleRate} />
          ) : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const dl = StyleSheet.create({
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 12 },
  deckWrap: {},
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  deckIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  deckTitle: { fontSize: 16, fontWeight: '700' },
  deckSub: { fontSize: 12, marginTop: 2 },
  deckDesc: { fontSize: 12, marginTop: 2 },
  dueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dueText: { fontSize: 11, fontWeight: '700' },
});

const sv = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  deckName: { fontSize: 16, fontWeight: '700' },
  progress: { fontSize: 12 },
  progressBg: { height: 4, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 4 },
  cardArea: { flex: 1, marginHorizontal: 16, marginBottom: Platform.OS === 'ios' ? 100 : 24 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  doneTitle: { fontSize: 26, fontWeight: '800' },
  doneSub: { fontSize: 15 },
  doneBtn: { marginTop: 16, borderRadius: 16, overflow: 'hidden', alignSelf: 'stretch' },
  doneBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
