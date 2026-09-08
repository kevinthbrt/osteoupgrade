import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/customers/[id]
 *
 * Fiche complète d'un compte : synthèse, chronologie, emails envoyés et leur
 * suivi, notes internes, enquêtes et réponses, tickets support et emails
 * reçus de cette adresse.
 *
 * Tout est rapproché par `user_id` OU par email : un événement peut précéder
 * la création du compte (opt-in funnel, relance envoyée à un prospect qui
 * s'inscrit ensuite), et il doit rester rattaché à la bonne personne.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: client, error } = await supabaseAdmin
    .from('admin_customer_overview')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!client) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const email = client.email as string
  // Valeur entre guillemets : la syntaxe `or` de PostgREST traite la virgule
  // comme un séparateur, et un email non cité casserait le filtre entier.
  const parIdOuEmail = `user_id.eq.${params.id},email.eq."${email.replace(/"/g, '')}"`

  const [evenements, emails, notes, enquetes, tickets, recus, parrainages] = await Promise.all([
    supabaseAdmin
      .from('customer_events')
      .select('*')
      .or(parIdOuEmail)
      .order('occurred_at', { ascending: false })
      .limit(200),
    supabaseAdmin
      .from('customer_emails')
      .select('id, subject, category, status, sent_at, delivered_at, opened_at, clicked_at, open_count, click_count, error, campaign_id, survey_id')
      .or(parIdOuEmail)
      .order('sent_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('customer_notes')
      .select('*')
      .or(parIdOuEmail)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('customer_surveys')
      .select('*')
      .or(parIdOuEmail)
      .order('sent_at', { ascending: false }),
    supabaseAdmin
      .from('support_tickets')
      .select('id, title, status, source, created_at')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('received_emails')
      .select('id, subject, received_at, is_read')
      .eq('from_email', email)
      .order('received_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('referral_transactions')
      .select('id, referred_user_id, commission_status, commission_amount, subscription_plan, created_at')
      .eq('referrer_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({
    client,
    evenements: evenements.data || [],
    emails: emails.data || [],
    notes: notes.data || [],
    enquetes: enquetes.data || [],
    tickets: tickets.data || [],
    emailsRecus: recus.data || [],
    parrainages: parrainages.data || [],
  })
}

/**
 * PATCH /api/admin/customers/[id]
 *
 * Modifie les étiquettes internes du compte. Volontairement limité à ce
 * champ : l'offre et le statut Fondateur restent pilotés par leurs routes
 * dédiées, qui portent leurs propres effets de bord (trigger SQL, emails).
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { admin_tags } = body

  if (!Array.isArray(admin_tags) || admin_tags.some((t: unknown) => typeof t !== 'string')) {
    return NextResponse.json({ error: 'Étiquettes invalides' }, { status: 400 })
  }

  // Normalisation : minuscules, sans doublon, 24 caractères et 12 étiquettes
  // au plus. Sans ça, « Relance » et « relance » deviennent deux filtres.
  const tags = Array.from(
    new Set(
      admin_tags
        .map((t: string) => t.trim().toLowerCase().slice(0, 24))
        .filter(Boolean)
    )
  ).slice(0, 12)

  const { error } = await supabaseAdmin.from('profiles').update({ admin_tags: tags }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, admin_tags: tags })
}
