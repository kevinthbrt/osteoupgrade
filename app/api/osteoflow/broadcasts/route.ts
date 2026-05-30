import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const EXPECTED_SECRET = process.env.OSTEOFLOW_PROXY_SECRET || 'a8c0fcc6aa558582564131768fd6aa6b0628b84ac0abe494948b088f086be1a6'

// GET /api/osteoflow/broadcasts
// Returns all active broadcasts targeting osteoflow or both.
// Seen state is tracked locally in Osteoflow's SQLite — not filtered here.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('x-osteoflow-secret')
  if (authHeader !== EXPECTED_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: broadcasts, error } = await supabaseAdmin
    .from('admin_broadcasts')
    .select('*')
    .in('target', ['osteoflow', 'both'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ broadcasts: broadcasts ?? [] })
}
