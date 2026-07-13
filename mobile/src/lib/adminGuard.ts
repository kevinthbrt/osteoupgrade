import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * Vérifie que l'utilisateur connecté est admin avant d'afficher un écran
 * admin. La vraie barrière de sécurité est la policy RLS `is_admin()` côté
 * base (toute requête d'un non-admin échoue silencieusement) — ce hook est
 * une protection d'interface en plus, pour rediriger proprement plutôt que
 * d'afficher un écran vide/en erreur.
 */
export function useAdminGuard() {
  const { session } = useAuth();
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        const admin = data?.role === 'admin';
        setIsAdmin(admin);
        setChecked(true);
        if (!admin) router.replace('/');
      });
  }, [session]);

  return { checked, isAdmin };
}
