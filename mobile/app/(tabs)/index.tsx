import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type Formation = Tables<'elearning_formations'>;

export default function CoursScreen() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFormations = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from('elearning_formations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setFormations(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFormations();
  }, [loadFormations]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={formations}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFormations} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.muted}>
            {error ? `Erreur : ${error}` : 'Aucune formation disponible.'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.photo_url ? (
            <Image source={item.photo_url} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Text style={styles.thumbInitial}>{item.title.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            {item.is_free_access ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Accès gratuit</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { color: '#60646C', textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E1E6',
  },
  thumb: { width: 96, height: 96 },
  thumbPlaceholder: { backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  cardBody: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  cardDesc: { fontSize: 13, color: '#60646C' },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#E6F4FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { color: '#208AEF', fontSize: 11, fontWeight: '600' },
});
