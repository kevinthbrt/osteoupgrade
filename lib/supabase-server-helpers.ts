import {
  createRouteHandlerClient as _createRouteHandlerClient,
  createMiddlewareClient as _createMiddlewareClient
} from '@supabase/auth-helpers-nextjs'
import type { cookies as CookiesFn } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

// Next.js intercepte tout fetch() exécuté côté serveur et le met en cache
// via son Data Cache — qui est PERSISTANT ENTRE LES DÉPLOIEMENTS sur Vercel.
// Ça inclut les appels internes des clients Supabase (auth-helpers-nextjs
// comme le client admin), et `export const dynamic = 'force-dynamic'` sur
// une route ne suffit pas à s'en protéger de façon fiable pour un fetch
// déclenché en profondeur dans une lib tierce (constaté en production :
// une lecture de profiles.role a continué de renvoyer une ancienne valeur
// pendant des heures, à travers plusieurs déploiements, après une mise à
// jour en base réelle). On force donc `cache: 'no-store'` sur tous les
// clients Supabase côté serveur créés via ces wrappers.
const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' })

export function createRouteHandlerClient(context: { cookies: typeof CookiesFn }) {
  return _createRouteHandlerClient(context, { options: { global: { fetch: noStoreFetch } } })
}

export function createMiddlewareClient(context: { req: NextRequest; res: NextResponse }) {
  return _createMiddlewareClient(context, { options: { global: { fetch: noStoreFetch } } })
}
