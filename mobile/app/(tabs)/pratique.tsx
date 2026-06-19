import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function PratiqueScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="fitness-outline" size={48} color="#208AEF" />
      <Text style={styles.title}>Pratique</Text>
      <Text style={styles.muted}>
        Vidéos de techniques par région — écran à construire prochainement.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#11181C' },
  muted: { color: '#60646C', textAlign: 'center' },
});
