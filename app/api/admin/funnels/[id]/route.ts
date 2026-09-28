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
  const [{ data: leads }, { data: statsRows }, { data: errorRows }] = await Promise.all([
    supabaseAdmin
      .from('funnel_leads')
      .select('id, email, full_name, utm, created_at, deadline_at, promo_code, promo_expires_at')
      .eq('funnel_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin.rpc('funnel_stats', { p_funnel_ids: [params.id] }),
    // Les derniers échecs d'inscription, tests écartés : leur raison et le
    // navigateur d'origine disent si le formulaire casse quelque part.
    supabaseAdmin
      .from('funnel_events')
      .select('detail, app, created_at')
      .eq('funnel_id', params.id)
      .eq('type', 'optin_error')
      .eq('internal', false)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const row = statsRows?.[0]
  const stats = {
    views: Number(row?.views ?? 0),
    visitors: Number(row?.visitors ?? 0),
    form_views: Number(row?.form_views ?? 0),
    cta_clicks: Number(row?.cta_clicks ?? 0),
    leads: Number(row?.leads ?? 0),
    optin_errors: Number(row?.optin_errors ?? 0),
    checkouts: Number(row?.checkouts ?? 0),
    inapp_visitors: Number(row?.inapp_visitors ?? 0),
    internal_events: Number(row?.internal_events ?? 0),
  }

  // Regroupement par raison et par navigateur : dix fois la même erreur dans
  // Instagram se lit mieux en une ligne qu'en dix.
  const groups = new Map<string, { detail: string; app: string; count: number; last_at: string }>()
  for (const e of errorRows ?? []) {
    const detail = e.detail || 'raison inconnue'
    const app = e.app || 'autre'
    const key = `${app}|${detail}`
    const g = groups.get(key)
    if (g) g.count += 1
    else groups.set(key, { detail, app, count: 1, last_at: e.created_at })
  }
  const optin_errors = Array.from(groups.values()).sort((a, b) => b.count - a.count)

  return NextResponse.json({ funnel, leads: leads ?? [], stats, optin_errors })
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
