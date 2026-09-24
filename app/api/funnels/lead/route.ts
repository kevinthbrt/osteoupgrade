import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { ensureMailContact, triggerAutomations } from '@/lib/automation-triggers'
import {
  OPTIN_COOKIE_MAX_AGE,
  funnelTriggerEvent,
  leadDeadlineFor,
  optinCookieName,
  slugSchema,
} from '@/lib/funnels'
import {
  PROMO_MONTHS,
  PROMO_PERCENT,
  createLeadPromo,
  formatPromoDate,
} from '@/lib/funnel-promo'
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
  first_name: z.string().trim().max(80).optional(),
  last_name: z.string().trim().max(80).optional(),
  /** Conservé pour les formulaires qui n'envoient qu'un seul champ. */
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

    const { slug, email, visitor_id, landing_path } = parsed.data
    const utm = pickUtm(parsed.data.utm)

    // `ensureMailContact` attend un nom complet qu'il redécoupe. On recompose
    // donc à partir des deux champs du formulaire quand ils sont fournis.
    const full_name =
      [parsed.data.first_name, parsed.data.last_name].filter(Boolean).join(' ').trim() ||
      parsed.data.full_name ||
      undefined

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

    // Étiquette le contact avec le funnel d'origine.
    //
    // `mail_contacts` est une base unique, partagée avec les autres sources.
    // Sans cette étiquette, rien ne distinguerait plus tard quelqu'un venu
    // pour sept vidéos sur le cabinet d'un inscrit à la lettre d'information :
    // on ne saurait ni le segmenter, ni lui écrire en connaissance de cause.
    if (contactId) {
      const { data: actuel } = await supabaseAdmin
        .from('mail_contacts')
        .select('tags')
        .eq('id', contactId)
        .maybeSingle()

      const etiquette = `funnel:${slug}`
      const tags: string[] = Array.isArray(actuel?.tags) ? actuel.tags : []

      if (!tags.includes(etiquette)) {
        const { error: tagError } = await supabaseAdmin
          .from('mail_contacts')
          .update({ tags: [...tags, etiquette] })
          .eq('id', contactId)
        if (tagError) console.error('Funnel opt-in, étiquetage:', tagError.message)
      }
    }

    const contact = contactId ? { id: contactId } : null

    // Un renvoi du formulaire ne doit PAS repousser l'échéance : sinon il
    // suffirait de se réinscrire pour rouvrir indéfiniment une offre fermée.
    // On distingue donc création et mise à jour, plutôt qu'un upsert qui
    // réécrirait `deadline_at` à chaque envoi. La règle vaut aussi pour la
    // remise : un code déjà émis est renvoyé tel quel, avec sa date d'origine.
    const { data: existing } = await supabaseAdmin
      .from('funnel_leads')
      .select('id, deadline_at, promo_code, promo_code_id, promo_expires_at')
      .eq('funnel_id', funnel.id)
      .eq('email', email)
      .maybeSingle()

    type Lead = {
      id: string
      deadline_at: string | null
      promo_code: string | null
      promo_code_id: string | null
      promo_expires_at: string | null
    }

    // Le code n'est créé que s'il n'en existe pas encore. Un lead sans code est
    // soit un nouveau venu, soit quelqu'un dont la création a échoué chez
    // Stripe la première fois : dans les deux cas une remise lui est due.
    // Quelqu'un qui en a déjà un ne peut pas s'en fabriquer un second en
    // renvoyant le formulaire, même expiré.
    let promo: { code: string; id: string; expiresAt: Date } | null = null
    if (!existing?.promo_code) {
      try {
        promo = await createLeadPromo(slug.replace(/-/g, '').slice(0, 8))
      } catch (err) {
        // Stripe indisponible ne doit pas coûter l'adresse email : le lead est
        // enregistré sans code, et la séquence se replie sur un message sans
        // remise plutôt que d'en promettre une qui n'existe pas.
        console.error('Funnel opt-in, création du code promo:', err)
      }
    }

    let lead: Lead | null = null

    if (existing) {
      // Mise à jour minimale : on ne renseigne que ce qu'on vient d'apprendre.
      // `utm` et `deadline_at` gardent la valeur du premier contact.
      const patch: Record<string, unknown> = {}
      if (full_name) patch.full_name = full_name
      if (contact?.id) patch.contact_id = contact.id
      if (promo) {
        patch.promo_code = promo.code
        patch.promo_code_id = promo.id
        patch.promo_expires_at = promo.expiresAt.toISOString()
      }

      if (Object.keys(patch).length === 0) {
        // Rien de neuf à écrire : un `update({})` partirait quand même en base
        // pour ne rien changer.
        lead = existing as Lead
      } else {
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('funnel_leads')
          .update(patch)
          .eq('id', existing.id)
          .select('id, deadline_at, promo_code, promo_code_id, promo_expires_at')
          .single()

        if (updateError) {
          console.error('Erreur de mise à jour du lead:', updateError.message)
          return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
        }
        lead = updated as Lead
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
          promo_code: promo?.code ?? null,
          promo_code_id: promo?.id ?? null,
          promo_expires_at: promo?.expiresAt.toISOString() ?? null,
        })
        .select('id, deadline_at, promo_code, promo_code_id, promo_expires_at')
        .single()

      if (insertError) {
        console.error('Erreur d’enregistrement du lead:', insertError.message)
        return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
      }
      lead = created as Lead
    }

    if (!lead) {
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
    }

    // La séquence part APRÈS l'enregistrement du lead, parce qu'elle a besoin
    // du code : les clés passées ici deviennent les variables `{{...}}` des
    // gabarits, sans modification du moteur d'envoi.
    //
    // L'inscription à la liste est acquise à ce stade ; l'échec d'une séquence
    // ne doit donc pas faire échouer l'opt-in du visiteur.
    const promoExpire = lead.promo_expires_at ? new Date(lead.promo_expires_at) : null
    const triggerResult = await triggerAutomations(funnelTriggerEvent(slug), {
      contact_id: contactId ?? undefined,
      contact_email: email,
      full_name,
      metadata: {
        funnel_slug: slug,
        ...utm,
        promo_code: lead.promo_code ?? '',
        promo_expires: promoExpire ? formatPromoDate(promoExpire) : '',
        promo_percent: String(PROMO_PERCENT),
        promo_months: String(PROMO_MONTHS),
      },
    })

    if (triggerResult.errors.length > 0) {
      console.error('Funnel opt-in : erreurs d’automatisation:', triggerResult.errors)
    }

    await supabaseAdmin.from('funnel_events').insert({
      funnel_id: funnel.id,
      lead_id: lead.id,
      type: 'optin',
      visitor_id: visitor_id || null,
      utm,
    })

    // Le code est renvoyé au navigateur pour être affiché sur l'écran de
    // confirmation. C'est le seul endroit où la page peut le montrer : le
    // cookie de déverrouillage ne contient qu'un drapeau, donc un rendu
    // serveur ultérieur ne sait pas quel visiteur il sert.
    const response = NextResponse.json({
      ok: true,
      deadline_at: lead.deadline_at,
      enrolled: triggerResult.enrolled,
      promo: lead.promo_code
        ? {
            code: lead.promo_code,
            expires_at: lead.promo_expires_at,
            percent: PROMO_PERCENT,
            months: PROMO_MONTHS,
          }
        : null,
    })

    // Déverrouille les blocs réservés de cette page. Lisible par le script de
    // la page (pas `httpOnly`) pour qu'elle sache qu'elle peut se rafraîchir,
    // et limité à ce funnel : s'inscrire à une campagne n'ouvre pas les autres.
    response.cookies.set(optinCookieName(slug), '1', {
      path: '/',
      maxAge: OPTIN_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (err) {
    console.error('Funnel lead error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
