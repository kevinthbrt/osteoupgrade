import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { verifyAdmin } from '@/lib/api-guards'
import { describeValidationError, funnelInputSchema } from '@/lib/funnels'

/** GET : liste des funnels, avec le compte de leads et de vues. */
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: funnels, error } = await supabaseAdmin
    .from('funnels')
    .select(
      'id, slug, name, status, plan_type, deadline_mode, deadline_at, deadline_days, published_at, created_at, updated_at'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur de lecture des funnels:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Agrégation faite en SQL (`funnel_stats`), et non en comptant des lignes
  // ramenées ici : PostgREST plafonne le nombre de lignes par requête, donc
  // au-delà de ce plafond les compteurs se seraient figés silencieusement.
  const ids = (funnels ?? []).map((f) => f.id)
  const counts = new Map<string, { leads: number; views: number }>()

  if (ids.length > 0) {
    const { data: stats, error: statsError } = await supabaseAdmin.rpc('funnel_stats', {
      p_funnel_ids: ids,
    })

    if (statsError) {
      // Les compteurs ne valent pas de faire échouer la liste des funnels.
      console.error('Erreur de lecture des statistiques:', statsError.message)
    }

    for (const row of stats ?? []) {
      counts.set(row.funnel_id, { leads: Number(row.leads), views: Number(row.views) })
    }
  }

  return NextResponse.json({
    funnels: (funnels ?? []).map((f) => ({
      ...f,
      leads_count: counts.get(f.id)?.leads ?? 0,
      views_count: counts.get(f.id)?.views ?? 0,
    })),
  })
}

/** POST : création d'un funnel. */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await verifyAdmin())) {
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

  const { data, error } = await supabaseAdmin
    .from('funnels')
    .insert({
      ...input,
      created_by: user.id,
      published_at: input.status === 'published' ? new Date().toISOString() : null,
    })
    .select('id, slug')
    .single()

  if (error) {
    // 23505 = violation d'unicité : ici, toujours le slug.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 409 })
    }
    console.error('Erreur de création du funnel:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ funnel: data }, { status: 201 })
}
