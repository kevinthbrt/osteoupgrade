import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { verifyAdmin } from '@/lib/api-guards'
import { appFromUserAgent, slugSchema } from '@/lib/funnels'
import { UTM_KEYS } from '@/lib/utm'

/**
 * Mesure d'audience des pages funnel.
 *
 * Écrit dans une table qui n'est lue que par l'admin. Aucune donnée
 * personnelle : l'identifiant de visiteur est un UUID tiré dans le navigateur,
 * l'IP ne sert qu'au comptage anti-abus, et du user-agent on ne garde que la
 * famille de navigateur intégré (Instagram, Facebook, autre).
 *
 * Un échec est silencieux côté client : la mesure ne doit jamais empêcher un
 * visiteur d'acheter.
 */

const bodySchema = z.object({
  slug: slugSchema,
  type: z.enum(['view', 'form_view', 'cta_click', 'optin_error', 'checkout_started']),
  utm: z.record(z.string().max(200)).optional(),
  visitor_id: z.string().trim().max(64).optional(),
  /** Raison d'un échec d'inscription. Ignorée pour les autres types. */
  detail: z.string().trim().max(200).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed } = rateLimit(`funnel-track:${ip}`, { limit: 120, windowSeconds: 600 })
    if (!allowed) {
      // 204 plutôt que 429 : le client n'a rien à réessayer ni à afficher.
      return new NextResponse(null, { status: 204 })
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const { slug, type, visitor_id } = parsed.data

    const utm: Record<string, string> = {}
    for (const key of UTM_KEYS) {
      const value = parsed.data.utm?.[key]
      if (value) utm[key] = value.slice(0, 200)
    }

    const { data: funnel } = await supabaseAdmin
      .from('funnels')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (!funnel) return new NextResponse(null, { status: 204 })

    // Un administrateur connecté qui relit ou teste sa page n'est pas un
    // prospect. Ses événements sont gardés, pour le débogage, mais écartés des
    // statistiques : sans ça, trois essais de paiement suffisaient à afficher
    // « 4 vers paiement » sur une page que personne n'avait encore vue.
    const internal = await verifyAdmin()

    await supabaseAdmin.from('funnel_events').insert({
      funnel_id: funnel.id,
      type,
      visitor_id: visitor_id || null,
      utm,
      internal,
      app: appFromUserAgent(req.headers.get('user-agent')),
      detail: type === 'optin_error' ? parsed.data.detail || null : null,
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Funnel track error:', err)
    return new NextResponse(null, { status: 204 })
  }
}
