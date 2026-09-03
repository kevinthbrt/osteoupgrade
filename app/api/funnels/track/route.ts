import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { slugSchema } from '@/lib/funnels'
import { UTM_KEYS } from '@/lib/utm'

/**
 * Mesure d'audience des pages funnel (vues, clics CTA, départs au paiement).
 *
 * Écrit dans une table qui n'est lue que par l'admin. Aucune donnée
 * personnelle : l'identifiant de visiteur est un UUID tiré dans le navigateur,
 * et l'IP ne sert qu'au comptage anti-abus, sans être stockée.
 *
 * Un échec est silencieux côté client : la mesure ne doit jamais empêcher un
 * visiteur d'acheter.
 */

const bodySchema = z.object({
  slug: slugSchema,
  type: z.enum(['view', 'cta_click', 'checkout_started']),
  utm: z.record(z.string().max(200)).optional(),
  visitor_id: z.string().trim().max(64).optional(),
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

    await supabaseAdmin.from('funnel_events').insert({
      funnel_id: funnel.id,
      type,
      visitor_id: visitor_id || null,
      utm,
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Funnel track error:', err)
    return new NextResponse(null, { status: 204 })
  }
}
