import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { templateFields } from '@/lib/inbox'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const { fields, error: invalid } = templateFields(body)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('inbox_templates')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { error } = await supabaseAdmin.from('inbox_templates').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
