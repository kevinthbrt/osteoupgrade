import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type Profile = Tables<'profiles'>;

export default function ProfilScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [session]);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(profile?.full_name ?? session?.user?.email ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#208AEF" />
      ) : (
        <>
          <Text style={styles.name}>{profile?.full_name ?? 'Utilisateur'}</Text>
          <Text style={styles.email}>{session?.user?.email}</Text>
          {profile?.role ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{profile.role.toUpperCase()}</Text>
            </View>
          ) : null}
        </>
      )}

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 32, gap: 12, paddingTop: 48 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#11181C' },
  email: { fontSize: 14, color: '#60646C' },
  roleBadge: {
    backgroundColor: '#E6F4FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: { color: '#208AEF', fontWeight: '700', fontSize: 12 },
  signOut: {
    marginTop: 'auto',
    backgroundColor: '#FEE',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  signOutText: { color: '#D32F2F', fontWeight: '700', fontSize: 16 },
});
