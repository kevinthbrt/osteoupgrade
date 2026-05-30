import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const EXPECTED_SECRET = process.env.OSTEOFLOW_PROXY_SECRET || 'a8c0fcc6aa558582564131768fd6aa6b0628b84ac0abe494948b088f086be1a6'

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

// Decode a Supabase JWT's payload without verifying — debug only.
function decodeJwtRef(token: string | undefined): string | null {
  try {
    if (!token) return null
    const payload = token.split('.')[1]
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return json.ref ?? null
  } catch {
    return null
  }
}

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

  // Debug: ?debug=1 reveals which Supabase project is actually contacted at
  // runtime + the raw, unfiltered row list. Remove once the issue is confirmed.
  if (req.nextUrl.searchParams.get('debug') === '1') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null
    const host = url ? new URL(url).host : null
    return NextResponse.json({
      debug: {
        supabase_url_host: host,
        service_role_project_ref: decodeJwtRef(process.env.SUPABASE_SERVICE_ROLE_KEY),
        total_rows_in_table: data?.length ?? 0,
        all_titles: (data ?? []).map((b: { title: string; target: string }) => ({
          title: b.title,
          target: b.target,
        })),
        returned_after_filter: broadcasts.length,
        now: new Date().toISOString(),
      },
      broadcasts,
    })
  }

  return NextResponse.json({ broadcasts }, {
    headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
  })
}
