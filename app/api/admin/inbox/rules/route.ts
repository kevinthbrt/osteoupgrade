import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { reclassifyExisting } from '@/lib/inbox'
import { isCategory } from '@/lib/inbox-render'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const FIELDS = ['from', 'domain', 'subject', 'body']

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await supabaseAdmin
    .from('inbox_rules')
    .select('*')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rules: data || [] })
}

/**
 * POST /api/admin/inbox/rules
 * { field, pattern, category, mark_done?, priority?, applyToExisting? }
 */
export async function POST(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => ({}))

  const pattern = typeof body.pattern === 'string' ? body.pattern.trim().toLowerCase().slice(0, 200) : ''
  if (!FIELDS.includes(body.field)) return NextResponse.json({ error: 'Champ invalide' }, { status: 400 })
  if (!pattern) return NextResponse.json({ error: 'Motif requis' }, { status: 400 })
  if (!isCategory(body.category)) return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })

  // Une même règle saisie deux fois : on met à jour l'existante.
  const { data: existante } = await supabaseAdmin
    .from('inbox_rules')
    .select('id')
    .eq('field', body.field)
    .eq('pattern', pattern)
    .maybeSingle()

  const champs = {
    field: body.field,
    pattern,
    category: body.category,
    mark_done: Boolean(body.mark_done),
    priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : body.field === 'from' ? 50 : 100,
    is_active: true,
  }

  const { data: rule, error } = existante
    ? await supabaseAdmin.from('inbox_rules').update(champs).eq('id', existante.id).select('*').single()
    : await supabaseAdmin.from('inbox_rules').insert(champs).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = body.applyToExisting ? await reclassifyExisting() : null
  return NextResponse.json({ rule, reclassified: result })
}
