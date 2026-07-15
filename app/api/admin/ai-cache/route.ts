import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Last 200 rows for the chart + rolling 7-day window for KPIs
  const [recentRes, statsRes] = await Promise.all([
    supabase
      .from('ai_cache_logs')
      .select('created_at, endpoint, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('ai_cache_logs')
      .select('endpoint, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const rows = statsRes.data ?? []

  // Cost constants ($ per token) — claude-sonnet-4-6
  const INPUT_COST   = 3.00  / 1_000_000
  const OUTPUT_COST  = 15.00 / 1_000_000
  const CACHE_WRITE  = 3.75  / 1_000_000
  const CACHE_READ   = 0.30  / 1_000_000

  type EndpointStats = {
    calls: number
    cache_hits: number
    cache_misses: number
    total_cache_creation: number
    total_cache_read: number
    total_input: number
    total_output: number
    cost_actual: number
    cost_without_cache: number
  }
  const byEndpoint: Record<string, EndpointStats> = {}

  for (const r of rows) {
    const ep = r.endpoint as string
    if (!byEndpoint[ep]) {
      byEndpoint[ep] = { calls: 0, cache_hits: 0, cache_misses: 0, total_cache_creation: 0, total_cache_read: 0, total_input: 0, total_output: 0, cost_actual: 0, cost_without_cache: 0 }
    }
    const s = byEndpoint[ep]
    s.calls++
    s.total_input += r.input_tokens ?? 0
    s.total_output += r.output_tokens ?? 0
    s.total_cache_creation += r.cache_creation_tokens ?? 0
    s.total_cache_read += r.cache_read_tokens ?? 0
    if ((r.cache_read_tokens ?? 0) > 0) s.cache_hits++
    else s.cache_misses++

    s.cost_actual += (r.input_tokens ?? 0) * INPUT_COST
      + (r.output_tokens ?? 0) * OUTPUT_COST
      + (r.cache_creation_tokens ?? 0) * CACHE_WRITE
      + (r.cache_read_tokens ?? 0) * CACHE_READ

    // Without cache: all tokens (input + would-be-catalog) billed at full input rate
    const total_input_equiv = (r.input_tokens ?? 0) + (r.cache_creation_tokens ?? 0) + (r.cache_read_tokens ?? 0)
    s.cost_without_cache += total_input_equiv * INPUT_COST + (r.output_tokens ?? 0) * OUTPUT_COST
  }

  return NextResponse.json({ stats: byEndpoint, recent: recentRes.data ?? [] })
}
