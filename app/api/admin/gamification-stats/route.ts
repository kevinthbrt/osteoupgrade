import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  // Verify caller is admin
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Use service role to bypass RLS and fetch all gamification stats
  const { data, error } = await supabaseAdmin
    .from('user_gamification_stats')
    .select('user_id, level, total_xp, current_streak, last_login_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ stats: data || [] })
}
