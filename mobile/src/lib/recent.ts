import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mémorise la dernière leçon / vidéo ouverte pour proposer "Reprendre"
 * sur le dashboard. Stocké localement (par utilisateur) — pas de schéma DB.
 */
export type RecentItem = {
  kind: 'subpart' | 'video';
  id: string;
  title: string;
  subtitle?: string;
  thumb?: string | null;
  at: number; // timestamp
};

const KEY = (userId: string) => `recent:${userId}`;

export async function saveRecent(userId: string | undefined, item: Omit<RecentItem, 'at'>) {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(KEY(userId), JSON.stringify({ ...item, at: Date.now() }));
  } catch {
    // silencieux : la reprise est un confort, pas critique
  }
}

export async function getRecent(userId: string | undefined): Promise<RecentItem | null> {
  if (!userId) return null;
  try {
    const raw = await AsyncStorage.getItem(KEY(userId));
    return raw ? (JSON.parse(raw) as RecentItem) : null;
  } catch {
    return null;
  }
}
