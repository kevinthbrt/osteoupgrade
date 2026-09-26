import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { BRAND, PALETTE } from '@/lib/theme';

// Ré-export pour compatibilité avec les écrans existants
export { BRAND, PALETTE };

export default function TabsLayout() {
  const scheme = useColorScheme();
  const C = PALETTE[scheme === 'dark' ? 'dark' : 'light'];
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Détermine si l'onglet Admin doit apparaître. La vraie protection reste
  // la policy RLS is_admin() côté base — ceci ne fait que cacher l'entrée
  // de navigation pour les comptes non-admin.
  useEffect(() => {
    if (!session?.user) { setIsAdmin(false); return; }
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      setIsAdmin(data?.role === 'admin');
    });
  }, [session]);

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
        name="clinique"
        options={{
          title: 'Clinique',
          tabBarIcon: ({ color, size }) => <Ionicons name="body" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" color={color} size={size} />,
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
