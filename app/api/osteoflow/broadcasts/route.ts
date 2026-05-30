import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const EXPECTED_SECRET = process.env.OSTEOFLOW_PROXY_SECRET

// GET /api/osteoflow/broadcasts?email=xxx
// Returns broadcasts targeting osteoflow/both, with unseen list for given email.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('x-osteoflow-secret')
  if (!EXPECTED_SECRET || authHeader !== EXPECTED_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ broadcasts: [], unseen: [] })

  const { data: broadcasts, error } = await supabaseAdmin
    .from('admin_broadcasts')
    .select('*')
    .in('target', ['osteoflow', 'both'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!broadcasts?.length) return NextResponse.json({ broadcasts: [], unseen: [] })

  const ids = broadcasts.map(b => b.id)
  const { data: views } = await supabaseAdmin
    .from('admin_broadcast_views')
    .select('broadcast_id')
    .eq('user_email', email)
    .in('broadcast_id', ids)

  const seenIds = new Set((views ?? []).map(v => v.broadcast_id))
  const unseen = broadcasts.filter(b => !seenIds.has(b.id))

  return NextResponse.json({ broadcasts, unseen })
}
