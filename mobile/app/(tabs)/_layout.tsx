import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, useColorScheme } from 'react-native';

import { BRAND, PALETTE } from '@/lib/theme';

// Ré-export pour compatibilité avec les écrans existants
export { BRAND, PALETTE };

export default function TabsLayout() {
  const scheme = useColorScheme();
  const C = PALETTE[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: C.inactive,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopColor: C.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          ...(Platform.OS === 'ios' ? { position: 'absolute' } : {}),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cours"
        options={{
          title: 'Cours',
          tabBarIcon: ({ color, size }) => <Ionicons name="school" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="flashcards"
        options={{
          title: 'OsteoFlash',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pratique"
        options={{
          title: 'Pratique',
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
