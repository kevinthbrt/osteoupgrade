import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { useAdminGuard } from '@/lib/adminGuard';
import type { Tables } from '@/lib/database.types';
import * as haptics from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { BRAND, usePaletteFor } from '@/lib/theme';

type Profile = Tables<'profiles'>;

const ROLE_LABEL: Record<string, string> = { free: 'Gratuit', premium: 'Premium', admin: 'Admin' };
const ROLE_COLOR: Record<string, string> = { free: '#94a3b8', premium: BRAND, admin: '#8b5cf6' };
const ROLES: Array<'free' | 'premium' | 'admin'> = ['free', 'premium', 'admin'];

export default function AdminUsersScreen() {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const { checked, isAdmin } = useAdminGuard();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
      .order('created_at', { ascending: false })
      .limit(30);
    setResults(data ?? []);
    setLoading(false);
  }, []);

  const onChange = (text: string) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(text), 350);
  };

  const changeRole = async (newRole: 'free' | 'premium' | 'admin') => {
    if (!selected || saving) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', selected.id);
    if (error) {
      Alert.alert('Erreur', "Impossible de modifier le rôle : " + error.message);
    } else {
      haptics.success();
      setSelected({ ...selected, role: newRole });
      setResults((prev) => prev.map((p) => (p.id === selected.id ? { ...p, role: newRole } : p)));
    }
    setSaving(false);
  };

  if (!checked || !isAdmin) {
    return (
      <View style={[s.center, { flex: 1 }]}><ActivityIndicator size="large" color={BRAND} /></View>
    );
  }

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={[s.searchBar, { backgroundColor: C.card, borderColor: C.border }]}>
            <Ionicons name="search" size={18} color={C.textMuted} />
            <TextInput
              style={[s.input, { color: C.text }]}
              placeholder="Email ou nom…"
              placeholderTextColor={C.textMuted}
              value={query}
              onChangeText={onChange}
              autoCapitalize="none"
              autoFocus
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
          <EmptyState icon="people-outline" title="Rechercher un utilisateur" message="Tape un email ou un nom pour commencer." />
        ) : results.length === 0 ? (
          <EmptyState icon="sad-outline" title="Aucun résultat" message={`Aucun utilisateur pour "${query}".`} />
        ) : (
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {results.map((p) => (
              <Pressable key={p.id} onPress={() => setSelected(p)}>
                <GlassCard style={s.row}>
                  <View style={[s.avatar, { backgroundColor: ROLE_COLOR[p.role] }]}>
                    <Text style={s.avatarText}>{(p.full_name ?? p.email).charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rowName, { color: C.text }]} numberOfLines={1}>{p.full_name ?? '—'}</Text>
                    <Text style={[s.rowEmail, { color: C.textSecondary }]} numberOfLines={1}>{p.email}</Text>
                  </View>
                  <View style={[s.roleBadge, { backgroundColor: ROLE_COLOR[p.role] + '22' }]}>
                    <Text style={[s.roleBadgeText, { color: ROLE_COLOR[p.role] }]}>{ROLE_LABEL[p.role]}</Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Détail utilisateur */}
        <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
          <View style={s.modalBackdrop}>
            <View style={[s.modalSheet, { backgroundColor: C.cardSolid }]}>
              {selected && (
                <>
                  <View style={s.modalHead}>
                    <View style={[s.avatarLg, { backgroundColor: ROLE_COLOR[selected.role] }]}>
                      <Text style={s.avatarLgText}>{(selected.full_name ?? selected.email).charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[s.modalName, { color: C.text }]}>{selected.full_name ?? 'Sans nom'}</Text>
                    <Text style={[s.modalEmail, { color: C.textSecondary }]}>{selected.email}</Text>
                  </View>

                  {selected.subscription_status ? (
                    <Text style={[s.modalInfo, { color: C.textSecondary }]}>
                      Abonnement : {selected.subscription_status}
                      {selected.subscription_end_date ? ` · jusqu'au ${new Date(selected.subscription_end_date).toLocaleDateString('fr-FR')}` : ''}
                    </Text>
                  ) : null}
                  <Text style={[s.modalInfo, { color: C.textSecondary }]}>
                    Inscrit le {new Date(selected.created_at).toLocaleDateString('fr-FR')}
                  </Text>

                  <Text style={[s.modalSectionTitle, { color: C.text }]}>Rôle</Text>
                  <View style={s.roleOptions}>
                    {ROLES.map((r) => (
                      <Pressable key={r} onPress={() => changeRole(r)} disabled={saving} style={{ flex: 1 }}>
                        <View style={[
                          s.roleOption,
                          { borderColor: selected.role === r ? ROLE_COLOR[r] : C.border },
                          selected.role === r && { backgroundColor: ROLE_COLOR[r] + '18' },
                        ]}>
                          {saving && selected.role !== r ? null : (
                            <Text style={[s.roleOptionText, { color: selected.role === r ? ROLE_COLOR[r] : C.text }]}>
                              {ROLE_LABEL[r]}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable onPress={() => setSelected(null)} style={s.closeBtn}>
                    <Text style={[s.closeBtnText, { color: C.textSecondary }]}>Fermer</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, fontSize: 15 },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rowName: { fontSize: 14, fontWeight: '700' },
  rowEmail: { fontSize: 12, marginTop: 1 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHead: { alignItems: 'center', gap: 4, marginBottom: 4 },
  avatarLg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarLgText: { color: '#fff', fontWeight: '800', fontSize: 26 },
  modalName: { fontSize: 18, fontWeight: '800' },
  modalEmail: { fontSize: 13 },
  modalInfo: { fontSize: 13 },
  modalSectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  roleOptions: { flexDirection: 'row', gap: 8 },
  roleOption: { paddingVertical: 12, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  roleOptionText: { fontSize: 13, fontWeight: '700' },
  closeBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  closeBtnText: { fontSize: 14, fontWeight: '600' },
});
