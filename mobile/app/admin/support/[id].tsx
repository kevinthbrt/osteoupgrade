import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAdminGuard } from '@/lib/adminGuard';
import type { Tables } from '@/lib/database.types';
import * as haptics from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { BRAND, usePaletteFor } from '@/lib/theme';

type Ticket = Tables<'support_tickets'>;
type Message = Tables<'support_messages'>;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Reçu', color: '#3b82f6' },
  in_progress: { label: 'En cours', color: '#f59e0b' },
  resolved: { label: 'Corrigé', color: '#16a34a' },
};
const STATUSES: Array<'pending' | 'in_progress' | 'resolved'> = ['pending', 'in_progress', 'resolved'];

export default function AdminTicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const { checked, isAdmin } = useAdminGuard();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const [tRes, mRes] = await Promise.all([
      supabase.from('support_tickets').select('*').eq('id', id).maybeSingle(),
      supabase.from('support_messages').select('*').eq('ticket_id', id).order('created_at'),
    ]);
    setTicket(tRes.data);
    setMessages(mRes.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const sendReply = async () => {
    const content = reply.trim();
    if (!content || !ticket || sending) return;
    setSending(true);
    const { error } = await supabase.from('support_messages').insert({
      ticket_id: ticket.id, sender: 'admin', content,
    });
    if (!error) {
      await supabase.from('support_tickets').update({
        last_admin_message_at: new Date().toISOString(),
        status: ticket.status === 'pending' ? 'in_progress' : ticket.status,
      }).eq('id', ticket.id);
      haptics.success();
      setReply('');
      await load();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setSending(false);
  };

  const changeStatus = async (status: 'pending' | 'in_progress' | 'resolved') => {
    if (!ticket || changingStatus) return;
    setChangingStatus(true);
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticket.id);
    if (!error) {
      haptics.selection();
      setTicket({ ...ticket, status });
    }
    setChangingStatus(false);
  };

  if (!checked || !isAdmin || loading) {
    return (
      <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.center}><ActivityIndicator size="large" color={BRAND} /></View>
      </LinearGradient>
    );
  }

  if (!ticket) {
    return (
      <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.center}><Text style={{ color: C.textSecondary }}>Ticket introuvable.</Text></View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={C.bgGradient} style={s.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.back}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: C.text }]} numberOfLines={1}>{ticket.title}</Text>
              <Pressable onPress={() => Linking.openURL(`mailto:${ticket.user_email}`)}>
                <Text style={[s.sub, { color: BRAND }]} numberOfLines={1}>{ticket.user_email}</Text>
              </Pressable>
            </View>
          </View>

          {/* Changement de statut */}
          <View style={s.statusRow}>
            {STATUSES.map((st) => {
              const cfg = STATUS_CONFIG[st];
              const active = ticket.status === st;
              return (
                <Pressable key={st} onPress={() => changeStatus(st)} disabled={changingStatus} style={{ flex: 1 }}>
                  <View style={[s.statusOption, { borderColor: active ? cfg.color : C.border, backgroundColor: active ? cfg.color + '18' : 'transparent' }]}>
                    <Text style={[s.statusOptionText, { color: active ? cfg.color : C.textSecondary }]}>{cfg.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <ScrollView ref={scrollRef} contentContainerStyle={s.thread} showsVerticalScrollIndicator={false}>
            {/* Message initial */}
            <View style={[s.bubble, s.bubbleUser, { backgroundColor: C.card }]}>
              <Text style={[s.bubbleText, { color: C.text }]}>{ticket.message}</Text>
              <Text style={[s.bubbleTime, { color: C.textMuted }]}>{new Date(ticket.created_at).toLocaleString('fr-FR')}</Text>
            </View>
            {ticket.attachment_url && (
              <Pressable onPress={() => Linking.openURL(ticket.attachment_url!)} style={s.attachment}>
                <Ionicons name="attach" size={14} color={BRAND} />
                <Text style={[s.attachmentText, { color: BRAND }]} numberOfLines={1}>{ticket.attachment_name ?? 'Pièce jointe'}</Text>
              </Pressable>
            )}

            {messages.map((m) => (
              <View key={m.id} style={[s.bubble, m.sender === 'admin' ? s.bubbleAdmin : s.bubbleUser, { backgroundColor: m.sender === 'admin' ? BRAND : C.card }]}>
                <Text style={[s.bubbleText, { color: m.sender === 'admin' ? '#fff' : C.text }]}>{m.content}</Text>
                <Text style={[s.bubbleTime, { color: m.sender === 'admin' ? 'rgba(255,255,255,0.7)' : C.textMuted }]}>
                  {new Date(m.created_at).toLocaleString('fr-FR')}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Répondre */}
          <View style={[s.replyBar, { borderTopColor: C.border }]}>
            <TextInput
              style={[s.replyInput, { color: C.text, backgroundColor: C.card }]}
              placeholder="Répondre au ticket…"
              placeholderTextColor={C.textMuted}
              value={reply}
              onChangeText={setReply}
              multiline
            />
            <Pressable onPress={sendReply} disabled={!reply.trim() || sending} style={[s.sendBtn, { opacity: !reply.trim() || sending ? 0.5 : 1 }]}>
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={16} color="#fff" />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 1 },

  statusRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  statusOption: { paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  statusOptionText: { fontSize: 12, fontWeight: '700' },

  thread: { padding: 16, gap: 10, paddingBottom: 20 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12, gap: 4 },
  bubbleUser: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleAdmin: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10 },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginLeft: 4 },
  attachmentText: { fontSize: 12, textDecorationLine: 'underline', maxWidth: 220 },

  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  replyInput: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
});
