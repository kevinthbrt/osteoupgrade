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

  // Compteurs agrégés en une passe plutôt qu'une requête par funnel : la liste
  // en afficherait autant qu'il y a de campagnes.
  const ids = (funnels ?? []).map((f) => f.id)
  const counts = new Map<string, { leads: number; views: number }>()

  if (ids.length > 0) {
    const [{ data: leads }, { data: events }] = await Promise.all([
      supabaseAdmin.from('funnel_leads').select('funnel_id').in('funnel_id', ids),
      supabaseAdmin.from('funnel_events').select('funnel_id').in('funnel_id', ids).eq('type', 'view'),
    ])

    for (const row of leads ?? []) {
      const entry = counts.get(row.funnel_id) ?? { leads: 0, views: 0 }
      entry.leads += 1
      counts.set(row.funnel_id, entry)
    }
    for (const row of events ?? []) {
      const entry = counts.get(row.funnel_id) ?? { leads: 0, views: 0 }
      entry.views += 1
      counts.set(row.funnel_id, entry)
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
