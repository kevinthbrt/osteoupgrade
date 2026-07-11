import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const tokenUser = await getOsteoflowSessionUser(req)
  if (!tokenUser) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const email = tokenUser.email
  if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('admin_broadcast_views')
    .upsert({ broadcast_id: params.id, user_email: email }, { onConflict: 'broadcast_id,user_email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
