import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { supabase } from '@/lib/supabase';
import { BRAND, GRADIENTS, usePaletteFor } from '@/lib/theme';

type Result = {
  id: string;
  title: string;
  subtitle: string;
  module: 'Cours' | 'Pratique' | 'Flashcards';
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
};

function stripHtml(s: string | null): string {
  return (s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function SearchScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);

    const like = `%${term}%`;
    const [formations, subparts, videos, decks] = await Promise.all([
      supabase.from('elearning_formations').select('id, title, description').or(`title.ilike.${like},description.ilike.${like}`).limit(10),
      supabase.from('elearning_subparts').select('id, title').ilike('title', like).limit(10),
      supabase.from('practice_videos').select('id, title, description, region').eq('is_active', true).or(`title.ilike.${like},description.ilike.${like},region.ilike.${like}`).limit(15),
      supabase.from('flashcard_decks').select('id, title, description').or(`title.ilike.${like},description.ilike.${like}`).limit(10),
    ]);

    const out: Result[] = [];
    for (const f of formations.data ?? [])
      out.push({ id: f.id, title: f.title, subtitle: stripHtml(f.description) || 'Formation', module: 'Cours', href: `/formation/${f.id}`, icon: 'school', gradient: GRADIENTS.blue });
    for (const sp of subparts.data ?? [])
      out.push({ id: sp.id, title: sp.title, subtitle: 'Leçon e-learning', module: 'Cours', href: `/subpart/${sp.id}`, icon: 'play-circle', gradient: GRADIENTS.blue });
    for (const v of videos.data ?? [])
      out.push({ id: v.id, title: v.title, subtitle: stripHtml(v.description) || `Région : ${v.region}`, module: 'Pratique', href: `/video/${v.id}`, icon: 'fitness', gradient: GRADIENTS.orange });
    for (const dk of decks.data ?? [])
      out.push({ id: dk.id, title: dk.title, subtitle: stripHtml(dk.description) || 'Deck de flashcards', module: 'Flashcards', href: `/flashcards`, icon: 'albums', gradient: GRADIENTS.violet });

    setResults(out);
    setLoading(false);
  }, []);

  const onChange = (text: string) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(text), 300);
  };

  // Groupe par module
  const groups = results.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.module] ??= []).push(r);
    return acc;
  }, {});

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        {/* Barre de recherche */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={[s.searchBar, { backgroundColor: C.card, borderColor: C.border }]}>
            <Ionicons name="search" size={18} color={C.textMuted} />
            <TextInput
              style={[s.input, { color: C.text }]}
              placeholder="Cours, techniques, flashcards…"
              placeholderTextColor={C.textMuted}
              value={query}
              onChangeText={onChange}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => { Keyboard.dismiss(); runSearch(query); }}
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                <Ionicons name="close-circle" size={18} color={C.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
        ) : !searched ? (
          <View style={s.center}>
            <LinearGradient colors={GRADIENTS.brand} style={s.emptyIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="search" size={32} color="#fff" />
            </LinearGradient>
            <Text style={[s.emptyTitle, { color: C.text }]}>Recherche globale</Text>
            <Text style={[s.emptySub, { color: C.textSecondary }]}>
              Trouve instantanément une formation, une leçon, une technique ou un deck.
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={s.center}>
            <Ionicons name="sad-outline" size={40} color={C.textMuted} />
            <Text style={[s.emptyTitle, { color: C.text }]}>Aucun résultat</Text>
            <Text style={[s.emptySub, { color: C.textSecondary }]}>Essaie avec d'autres mots-clés.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={[s.count, { color: C.textSecondary }]}>
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </Text>
            {Object.entries(groups).map(([module, items]) => (
              <View key={module} style={{ gap: 8 }}>
                <Text style={[s.groupTitle, { color: C.text }]}>{module} · {items.length}</Text>
                {items.map((r) => (
                  <Pressable key={`${r.module}-${r.id}`} onPress={() => { Keyboard.dismiss(); router.push(r.href as never); }}>
                    <GlassCard style={s.row}>
                      <LinearGradient colors={r.gradient} style={s.rowIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name={r.icon} size={18} color="#fff" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.rowTitle, { color: C.text }]} numberOfLines={1}>{r.title}</Text>
                        <Text style={[s.rowSub, { color: C.textSecondary }]} numberOfLines={1}>{r.subtitle}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                    </GlassCard>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, fontSize: 15 },

  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  count: { fontSize: 13, fontWeight: '600' },
  groupTitle: { fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 1 },
});
