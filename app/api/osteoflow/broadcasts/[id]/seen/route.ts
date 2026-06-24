import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'

export const dynamic = 'force-dynamic'

const EXPECTED_SECRET = process.env.OSTEOFLOW_PROXY_SECRET

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const tokenUser = await getOsteoflowSessionUser(req)
  const authHeader = req.headers.get('x-osteoflow-secret')
  if (!tokenUser && (!EXPECTED_SECRET || authHeader !== EXPECTED_SECRET)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json()
  const email = tokenUser?.email ?? body.email
  if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('admin_broadcast_views')
    .upsert({ broadcast_id: params.id, user_email: email }, { onConflict: 'broadcast_id,user_email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
