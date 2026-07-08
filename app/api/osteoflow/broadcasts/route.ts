import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const EXPECTED_SECRET = process.env.OSTEOFLOW_PROXY_SECRET

// Dedicated admin client whose underlying fetch always bypasses the Next.js
// Data Cache. Without this, supabase-js's internal fetch can be cached by Next,
// freezing the broadcasts list to an old snapshot even on a force-dynamic route.
const supabaseNoStore = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: 'no-store' }),
    },
  }
)

// GET /api/osteoflow/broadcasts
// Returns all active broadcasts targeting osteoflow or both.
// Seen state is tracked locally in Osteoflow's SQLite — not filtered here.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('x-osteoflow-secret')
  if (authHeader !== EXPECTED_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data, error } = await supabaseNoStore
    .from('admin_broadcasts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter in JS — avoids any .in() Supabase client quirks
  const broadcasts = (data ?? []).filter(
    (b: { target: string }) => b.target === 'osteoflow' || b.target === 'both'
  )

  return NextResponse.json({ broadcasts }, {
    headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
  })
}
