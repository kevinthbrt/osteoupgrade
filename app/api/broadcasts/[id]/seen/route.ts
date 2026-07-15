import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('admin_broadcast_views')
    .upsert({ broadcast_id: params.id, user_email: user.email }, { onConflict: 'broadcast_id,user_email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
