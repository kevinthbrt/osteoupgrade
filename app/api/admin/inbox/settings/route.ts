import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getInboxSettings } from '@/lib/inbox'
import { aiAvailable } from '@/lib/inbox-ai'
import { isCategory } from '@/lib/inbox-render'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ settings: await getInboxSettings(), aiAvailable: aiAvailable() })
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.from_name === 'string' && body.from_name.trim()) updates.from_name = body.from_name.trim().slice(0, 80)
  if (typeof body.signature === 'string') updates.signature = body.signature.slice(0, 2000)
  if (body.default_layout === 'simple' || body.default_layout === 'brand') updates.default_layout = body.default_layout
  if (typeof body.quote_original === 'boolean') updates.quote_original = body.quote_original
  if (typeof body.ai_enabled === 'boolean') updates.ai_enabled = body.ai_enabled
  if (Array.isArray(body.notify_categories)) updates.notify_categories = body.notify_categories.filter(isCategory)

  const { error } = await supabaseAdmin.from('inbox_settings').upsert({ id: 1, ...updates })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: await getInboxSettings() })
}
