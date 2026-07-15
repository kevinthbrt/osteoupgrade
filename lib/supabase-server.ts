import { createClient } from '@supabase/supabase-js'

// Client Supabase côté serveur avec permissions admin
// Utilisé uniquement dans les API routes et webhooks
//
// IMPORTANT : le client Supabase appelle `fetch()` en interne pour parler à
// PostgREST. Sur Vercel, le Data Cache de Next.js intercepte tout `fetch()`
// exécuté côté serveur et le met en cache — y compris ces appels — et ce
// cache est PERSISTANT ENTRE LES DÉPLOIEMENTS. `export const dynamic =
// 'force-dynamic'` sur une route ne suffit pas à empêcher ça de façon fiable
// pour un fetch déclenché par une lib tierce en profondeur de la pile d'appel.
// Conséquence concrète observée : une lecture de `profiles.role` a continué
// à renvoyer une ancienne valeur pendant des heures et à travers plusieurs
// déploiements, après une mise à jour en base — un vrai risque de sécurité
// pour toute vérification de rôle. On force donc `cache: 'no-store'` sur
// TOUS les appels de ce client, sans exception.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' })
    }
  }
)
