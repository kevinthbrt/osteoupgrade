import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function FlashcardsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="albums-outline" size={48} color="#208AEF" />
      <Text style={styles.title}>Flashcards</Text>
      <Text style={styles.muted}>
        Révision par répétition espacée — écran à construire prochainement.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#11181C' },
  muted: { color: '#60646C', textAlign: 'center' },
});
