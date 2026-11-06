import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isCategory } from '@/lib/inbox-render'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (typeof body.mark_done === 'boolean') updates.mark_done = body.mark_done
  if (isCategory(body.category)) updates.category = body.category
  if (Number.isFinite(Number(body.priority)) && body.priority !== undefined) updates.priority = Number(body.priority)
  if (typeof body.pattern === 'string' && body.pattern.trim()) updates.pattern = body.pattern.trim().toLowerCase().slice(0, 200)
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('inbox_rules').update(updates).eq('id', params.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rule: data })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { error } = await supabaseAdmin.from('inbox_rules').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
