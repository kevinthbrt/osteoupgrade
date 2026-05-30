import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/broadcasts?target=osteoupgrade
// Returns broadcasts targeting the given platform that user hasn't seen yet,
// plus ALL active broadcasts (for the bell — user may want to re-read).
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ broadcasts: [], unseen: [] })

  const target = req.nextUrl.searchParams.get('target') ?? 'osteoupgrade'

  // All active broadcasts for this target
  const { data: broadcasts, error } = await supabaseAdmin
    .from('admin_broadcasts')
    .select('*')
    .in('target', [target, 'both'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!broadcasts?.length) return NextResponse.json({ broadcasts: [], unseen: [] })

  // Which ones has this user already seen?
  const ids = broadcasts.map(b => b.id)
  const { data: views } = await supabaseAdmin
    .from('admin_broadcast_views')
    .select('broadcast_id')
    .eq('user_email', user.email)
    .in('broadcast_id', ids)

  const seenIds = new Set((views ?? []).map(v => v.broadcast_id))
  const unseen = broadcasts.filter(b => !seenIds.has(b.id))

  return NextResponse.json({ broadcasts, unseen })
}
