import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { verifyAdmin } from '@/lib/api-guards'
import { describeValidationError, funnelInputSchema } from '@/lib/funnels'

/** GET : un funnel, ses leads récents et ses compteurs d'événements. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: funnel, error } = await supabaseAdmin
    .from('funnels')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error) {
    console.error('Erreur de lecture du funnel:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!funnel) {
    return NextResponse.json({ error: 'Funnel introuvable' }, { status: 404 })
  }

  // Les 50 derniers leads pour la liste, mais les compteurs agrégés en SQL :
  // les compter à partir des lignes ramenées les aurait plafonnés à la limite
  // de lignes de PostgREST, sans erreur pour le signaler.
  const [{ data: leads }, { data: statsRows }] = await Promise.all([
    supabaseAdmin
      .from('funnel_leads')
      .select('id, email, full_name, utm, created_at, deadline_at')
      .eq('funnel_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin.rpc('funnel_stats', { p_funnel_ids: [params.id] }),
  ])

  const row = statsRows?.[0]
  const stats = {
    view: Number(row?.views ?? 0),
    cta_click: Number(row?.cta_clicks ?? 0),
    optin: Number(row?.optins ?? 0),
    checkout_started: Number(row?.checkouts ?? 0),
  }

  return NextResponse.json({ funnel, leads: leads ?? [], stats })
}

/** PATCH : mise à jour complète du funnel (le formulaire renvoie tout). */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = funnelInputSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: describeValidationError(parsed.error) },
      { status: 400 }
    )
  }

  const input = parsed.data

  const { data: current } = await supabaseAdmin
    .from('funnels')
    .select('status, published_at')
    .eq('id', params.id)
    .maybeSingle()

  if (!current) {
    return NextResponse.json({ error: 'Funnel introuvable' }, { status: 404 })
  }

  // `published_at` date la PREMIÈRE publication : la réécrire à chaque
  // enregistrement ferait passer une campagne de six mois pour une nouveauté.
  const published_at =
    input.status === 'published' ? current.published_at ?? new Date().toISOString() : current.published_at

  const { error } = await supabaseAdmin
    .from('funnels')
    .update({ ...input, published_at })
    .eq('id', params.id)

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 409 })
    }
    console.error('Erreur de mise à jour du funnel:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/**
 * DELETE : suppression.
 *
 * Les leads et événements partent avec (ON DELETE CASCADE). Les contacts
 * `mail_contacts` créés par les opt-ins, eux, restent : ils appartiennent à la
 * liste de diffusion, pas à la page qui les a captés.
 */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('funnels').delete().eq('id', params.id)

  if (error) {
    console.error('Erreur de suppression du funnel:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
