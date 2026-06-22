import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, useColorScheme } from 'react-native';

export const BRAND = '#208AEF';

export const PALETTE = {
  light: {
    bg: '#F2F2F7',
    card: 'rgba(255,255,255,0.75)',
    cardSolid: '#FFFFFF',
    tabBar: 'rgba(248,248,248,0.92)',
    text: '#11181C',
    textSecondary: '#60646C',
    inactive: '#8E8E93',
    border: 'rgba(0,0,0,0.08)',
    glassOverlay: 'rgba(255,255,255,0.4)',
  },
  dark: {
    bg: '#000000',
    card: 'rgba(28,28,30,0.75)',
    cardSolid: '#1C1C1E',
    tabBar: 'rgba(18,18,18,0.92)',
    text: '#FFFFFF',
    textSecondary: '#EBEBF599',
    inactive: '#636366',
    border: 'rgba(255,255,255,0.08)',
    glassOverlay: 'rgba(255,255,255,0.06)',
  },
} as const;

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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cours"
        options={{
          title: 'Cours',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="flashcards"
        options={{
          title: 'Flashcards',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pratique"
        options={{
          title: 'Pratique',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
