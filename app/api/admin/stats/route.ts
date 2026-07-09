import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  is_founding_member: boolean | null
  newsletter_opt_in: boolean | null
  created_at: string | null
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  // ── Admin guard ──────────────────────────────────────────────────────────
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── Fetch all profiles (minimal columns) ────────────────────────────────
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, is_founding_member, newsletter_opt_in, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const profiles = (data || []) as ProfileRow[]

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const ms = (n: number) => n * 24 * 60 * 60 * 1000

  // ── KPIs ─────────────────────────────────────────────────────────────────
  let premium = 0, free = 0, admin = 0, foundingMembers = 0, newsletterOptIn = 0
  let signupsToday = 0, signups7d = 0, signups30d = 0, prevSignups30d = 0

  for (const p of profiles) {
    if (p.role === 'premium') premium++
    else if (p.role === 'admin') admin++
    else free++
    if (p.is_founding_member) foundingMembers++
    if (p.newsletter_opt_in) newsletterOptIn++

    if (p.created_at) {
      const t = new Date(p.created_at).getTime()
      if (t >= startOfToday.getTime()) signupsToday++
      if (t >= now.getTime() - ms(7)) signups7d++
      if (t >= now.getTime() - ms(30)) signups30d++
      else if (t >= now.getTime() - ms(60)) prevSignups30d++
    }
  }

  const total = profiles.length
  // Conversion = share of non-admin accounts that are premium
  const nonAdmin = free + premium
  const conversionRate = nonAdmin > 0 ? Math.round((premium / nonAdmin) * 1000) / 10 : 0

  // ── Daily signup series over the last 90 days (zero-filled) ──────────────
  const RANGE_DAYS = 90
  const dailyMap = new Map<string, number>()
  for (let i = RANGE_DAYS - 1; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - ms(i))
    dailyMap.set(dayKey(d), 0)
  }
  // Cumulative total that existed before the visible window starts
  const windowStart = startOfToday.getTime() - ms(RANGE_DAYS - 1)
  let baseline = 0
  for (const p of profiles) {
    if (!p.created_at) continue
    const t = new Date(p.created_at).getTime()
    if (t < windowStart) { baseline++; continue }
    const key = dayKey(new Date(p.created_at))
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + 1)
  }

  const daily: { date: string; count: number }[] = []
  const cumulative: { date: string; total: number }[] = []
  let running = baseline
  for (const [date, count] of dailyMap) {
    running += count
    daily.push({ date, count })
    cumulative.push({ date, total: running })
  }

  // ── Recent signups ───────────────────────────────────────────────────────
  const recent = [...profiles]
    .reverse()
    .slice(0, 8)
    .map(p => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      created_at: p.created_at,
    }))

  return NextResponse.json({
    kpis: {
      total,
      premium,
      free,
      admin,
      foundingMembers,
      newsletterOptIn,
      signupsToday,
      signups7d,
      signups30d,
      prevSignups30d,
      conversionRate,
    },
    daily,
    cumulative,
    recent,
    generatedAt: now.toISOString(),
  })
}
