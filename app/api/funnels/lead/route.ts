import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { ensureMailContact, triggerAutomations } from '@/lib/automation-triggers'
import { funnelTriggerEvent, leadDeadlineFor, slugSchema } from '@/lib/funnels'
import { UTM_KEYS } from '@/lib/utm'

/**
 * Opt-in depuis une page funnel.
 *
 * Route publique : c'est la seule façon de capter un email avant la création
 * de compte, et donc de faire entrer un prospect dans les séquences. Elle est
 * volontairement étroite : elle n'écrit que dans `funnel_leads` et délègue
 * l'inscription aux séquences existantes via `triggerAutomations`.
 *
 * Ce que la route ne fait pas : créer de compte, accorder de droits, ni
 * accepter un slug de funnel non publié.
 */

const utmSchema = z.record(z.string().max(200)).optional()

const bodySchema = z.object({
  slug: slugSchema,
  email: z.string().trim().email().max(320),
  full_name: z.string().trim().max(120).optional(),
  utm: utmSchema,
  visitor_id: z.string().trim().max(64).optional(),
  landing_path: z.string().trim().max(300).optional(),
})

/** Ne conserve que les clés d'attribution connues. */
function pickUtm(raw: Record<string, string> | undefined): Record<string, string> {
  if (!raw) return {}
  const utm: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    if (raw[key]) utm[key] = raw[key].slice(0, 200)
  }
  return utm
}

export async function POST(req: NextRequest) {
  try {
    // Un formulaire public sans limite est une liste de diffusion offerte au
    // premier script venu.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfter } = rateLimit(`funnel-lead:${ip}`, { limit: 10, windowSeconds: 600 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Requête invalide' },
        { status: 400 }
      )
    }

    const { slug, email, full_name, visitor_id, landing_path } = parsed.data
    const utm = pickUtm(parsed.data.utm)

    // Le funnel doit exister ET être publié : sans ce filtre, un brouillon en
    // cours de rédaction collecterait déjà des emails.
    const { data: funnel } = await supabaseAdmin
      .from('funnels')
      .select('id, slug, deadline_mode, deadline_at, deadline_days')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (!funnel) {
      return NextResponse.json({ error: 'Page introuvable' }, { status: 404 })
    }

    const deadline = leadDeadlineFor(funnel, new Date())

    // Le contact d'abord, la séquence ensuite et jamais l'inverse.
    // `triggerAutomations` sort dès qu'aucune séquence active ne correspond à
    // l'événement : lui déléguer la création du contact ferait perdre toutes
    // les adresses captées tant que la séquence du funnel n'est pas écrite,
    // c'est-à-dire dans l'état normal juste après la publication d'une page.
    const { contactId, error: contactError } = await ensureMailContact({
      email,
      full_name,
      metadata: { funnel_slug: slug, ...utm },
    })

    if (contactError) {
      console.error('Funnel opt-in : contact:', contactError)
    }

    // L'inscription à la liste est acquise à ce stade ; l'échec d'une séquence
    // ne doit donc pas faire échouer l'opt-in du visiteur.
    const triggerResult = await triggerAutomations(funnelTriggerEvent(slug), {
      contact_id: contactId ?? undefined,
      contact_email: email,
      full_name,
      metadata: { funnel_slug: slug, ...utm },
    })

    if (triggerResult.errors.length > 0) {
      console.error('Funnel opt-in : erreurs d’automatisation:', triggerResult.errors)
    }

    const contact = contactId ? { id: contactId } : null

    // Un renvoi du formulaire ne doit PAS repousser l'échéance : sinon il
    // suffirait de se réinscrire pour rouvrir indéfiniment une offre fermée.
    // On distingue donc création et mise à jour, plutôt qu'un upsert qui
    // réécrirait `deadline_at` à chaque envoi.
    const { data: existing } = await supabaseAdmin
      .from('funnel_leads')
      .select('id, deadline_at')
      .eq('funnel_id', funnel.id)
      .eq('email', email)
      .maybeSingle()

    let lead: { id: string; deadline_at: string | null } | null = null

    if (existing) {
      // Mise à jour minimale : on ne renseigne que ce qu'on vient d'apprendre.
      // `utm` et `deadline_at` gardent la valeur du premier contact.
      const patch: Record<string, unknown> = {}
      if (full_name) patch.full_name = full_name
      if (contact?.id) patch.contact_id = contact.id

      if (Object.keys(patch).length === 0) {
        // Rien de neuf à écrire : un `update({})` partirait quand même en base
        // pour ne rien changer.
        lead = existing
      } else {
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('funnel_leads')
          .update(patch)
          .eq('id', existing.id)
          .select('id, deadline_at')
          .single()

        if (updateError) {
          console.error('Erreur de mise à jour du lead:', updateError.message)
          return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
        }
        lead = updated
      }
    } else {
      const { data: created, error: insertError } = await supabaseAdmin
        .from('funnel_leads')
        .insert({
          funnel_id: funnel.id,
          email,
          full_name: full_name || null,
          contact_id: contact?.id ?? null,
          utm,
          landing_path: landing_path || null,
          referrer: req.headers.get('referer')?.slice(0, 200) || null,
          deadline_at: deadline?.toISOString() ?? null,
        })
        .select('id, deadline_at')
        .single()

      if (insertError) {
        console.error('Erreur d’enregistrement du lead:', insertError.message)
        return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
      }
      lead = created
    }

    if (!lead) {
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
    }

    await supabaseAdmin.from('funnel_events').insert({
      funnel_id: funnel.id,
      lead_id: lead.id,
      type: 'optin',
      visitor_id: visitor_id || null,
      utm,
    })

    return NextResponse.json({
      ok: true,
      deadline_at: lead.deadline_at,
      enrolled: triggerResult.enrolled,
    })
  } catch (err) {
    console.error('Funnel lead error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
