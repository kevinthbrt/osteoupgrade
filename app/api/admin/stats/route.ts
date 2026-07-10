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
const MS_DAY = 24 * 60 * 60 * 1000

// ── AI pricing (USD / million tokens), used to estimate spend ────────────────
// Rates for the models currently used by OsteoFlow's AI endpoints.
const AI_PRICING: Record<string, { in: number; out: number; cacheWrite: number; cacheRead: number }> = {
  'claude-sonnet-4-6': { in: 3, out: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  'claude-sonnet-4-5': { in: 3, out: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  'claude-3-5-sonnet': { in: 3, out: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  'claude-3-5-haiku': { in: 0.8, out: 4, cacheWrite: 1, cacheRead: 0.08 },
  default: { in: 3, out: 15, cacheWrite: 3.75, cacheRead: 0.3 },
}
const USD_TO_EUR = 0.92

export async function GET() {
  // ── Admin guard ──────────────────────────────────────────────────────────
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── Fetch everything in parallel (all tables are small) ──────────────────
  const [
    profilesRes,
    loginsRes,
    osteoflowRes,
    aiRes,
    gamiRes,
    elearningRes,
    quizRes,
    practiceRes,
    flashcardRes,
    ticketsRes,
  ] = await Promise.all([
    supabaseAdmin.from('profiles')
      .select('id, email, full_name, role, is_founding_member, newsletter_opt_in, created_at')
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('user_login_tracking').select('user_id, login_date'),
    supabaseAdmin.from('osteoflow_sessions').select('user_id, device_id, device_name, last_active_at, created_at'),
    supabaseAdmin.from('ai_cache_logs').select('created_at, endpoint, model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens'),
    supabaseAdmin.from('user_gamification_stats').select('user_id, level, total_xp, current_streak, best_streak'),
    supabaseAdmin.from('elearning_subpart_progress').select('user_id, completed_at'),
    supabaseAdmin.from('elearning_quiz_attempts').select('user_id, passed, completed_at'),
    supabaseAdmin.from('user_practice_progress').select('user_id, viewed_at'),
    supabaseAdmin.from('flashcard_progress').select('user_id, reviewed_at'),
    supabaseAdmin.from('support_tickets').select('status, created_at'),
  ])

  if (profilesRes.error) return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })

  const profiles = (profilesRes.data || []) as ProfileRow[]
  const logins = (loginsRes.data || []) as { user_id: string; login_date: string }[]
  const osteoflow = (osteoflowRes.data || []) as { user_id: string; device_id: string | null; device_name: string | null; last_active_at: string | null; created_at: string | null }[]
  const aiLogs = (aiRes.data || []) as { created_at: string | null; endpoint: string | null; model: string | null; input_tokens: number | null; output_tokens: number | null; cache_creation_tokens: number | null; cache_read_tokens: number | null }[]
  const gami = (gamiRes.data || []) as { user_id: string; level: number | null; total_xp: number | null; current_streak: number | null; best_streak: number | null }[]
  const elearning = (elearningRes.data || []) as { user_id: string; completed_at: string | null }[]
  const quizzes = (quizRes.data || []) as { user_id: string; passed: boolean | null; completed_at: string | null }[]
  const practice = (practiceRes.data || []) as { user_id: string; viewed_at: string | null }[]
  const flashcards = (flashcardRes.data || []) as { user_id: string; reviewed_at: string | null }[]
  const tickets = (ticketsRes.data || []) as { status: string | null; created_at: string | null }[]

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const ms = (n: number) => n * MS_DAY
  const since = (n: number) => now.getTime() - ms(n)

  // ── Account KPIs ──────────────────────────────────────────────────────────
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
      if (t >= since(7)) signups7d++
      if (t >= since(30)) signups30d++
      else if (t >= since(60)) prevSignups30d++
    }
  }

  const total = profiles.length
  const nonAdmin = free + premium
  const conversionRate = nonAdmin > 0 ? Math.round((premium / nonAdmin) * 1000) / 10 : 0

  // ── Signup daily / cumulative series (90 days, zero-filled) ──────────────
  const RANGE_DAYS = 90
  const emptySeries = () => {
    const m = new Map<string, number>()
    for (let i = RANGE_DAYS - 1; i >= 0; i--) m.set(dayKey(new Date(startOfToday.getTime() - ms(i))), 0)
    return m
  }
  const windowStart = startOfToday.getTime() - ms(RANGE_DAYS - 1)

  const dailyMap = emptySeries()
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

  // ── Activity: DAU / WAU / MAU + active-users daily series ────────────────
  const activeMap = emptySeries()
  const usersToday = new Set<string>(), usersWeek = new Set<string>(), usersMonth = new Set<string>()
  for (const l of logins) {
    if (!l.login_date) continue
    const t = new Date(l.login_date + 'T00:00:00').getTime()
    if (l.login_date === dayKey(startOfToday)) usersToday.add(l.user_id)
    if (t >= since(7)) usersWeek.add(l.user_id)
    if (t >= since(30)) usersMonth.add(l.user_id)
    if (activeMap.has(l.login_date)) activeMap.set(l.login_date, (activeMap.get(l.login_date) || 0) + 1)
  }
  const activeDaily = [...activeMap].map(([date, count]) => ({ date, count }))
  const dau = usersToday.size, wau = usersWeek.size, mau = usersMonth.size
  const stickiness = mau > 0 ? Math.round((dau / mau) * 1000) / 10 : 0
  // Activation = share of accounts that logged in during the last 30 days
  const activationRate = nonAdmin > 0 ? Math.round((mau / nonAdmin) * 1000) / 10 : 0

  // ── OsteoFlow adoption ────────────────────────────────────────────────────
  const ofUsers = new Set<string>(), ofDevices = new Set<string>()
  const ofActive30 = new Set<string>(), ofActive7 = new Set<string>()
  const platformCounts = new Map<string, number>()
  const ofMonthly = new Map<string, number>()
  for (const s of osteoflow) {
    ofUsers.add(s.user_id)
    if (s.device_id) ofDevices.add(s.device_id)
    const last = s.last_active_at ? new Date(s.last_active_at).getTime() : 0
    if (last >= since(30)) ofActive30.add(s.user_id)
    if (last >= since(7)) ofActive7.add(s.user_id)
    const plat = normalizePlatform(s.device_name)
    platformCounts.set(plat, (platformCounts.get(plat) || 0) + 1)
    if (s.created_at) {
      const mk = s.created_at.slice(0, 7)
      ofMonthly.set(mk, (ofMonthly.get(mk) || 0) + 1)
    }
  }
  const ofPlatforms = [...platformCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  const ofInstallsMonthly = [...ofMonthly].sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ month, count }))
  const recentDevices = [...osteoflow]
    .sort((a, b) => new Date(b.last_active_at || 0).getTime() - new Date(a.last_active_at || 0).getTime())
    .slice(0, 8)
    .map(s => ({ platform: normalizePlatform(s.device_name), last_active_at: s.last_active_at, created_at: s.created_at }))
  const ofAdoption = premium + free > 0 ? Math.round((ofUsers.size / (premium + free)) * 1000) / 10 : 0

  // ── AI usage ──────────────────────────────────────────────────────────────
  const byEndpoint = new Map<string, { calls: number; inTok: number; outTok: number; cacheRead: number }>()
  const aiDailyMap = emptySeries()
  let aiCalls30 = 0, aiIn = 0, aiOut = 0, aiCacheRead = 0, aiCacheWrite = 0, costUsd = 0
  for (const a of aiLogs) {
    const inp = a.input_tokens || 0, out = a.output_tokens || 0
    const cw = a.cache_creation_tokens || 0, cr = a.cache_read_tokens || 0
    const ep = a.endpoint || 'inconnu'
    const cur = byEndpoint.get(ep) || { calls: 0, inTok: 0, outTok: 0, cacheRead: 0 }
    cur.calls++; cur.inTok += inp; cur.outTok += out; cur.cacheRead += cr
    byEndpoint.set(ep, cur)

    const price = AI_PRICING[a.model || ''] || AI_PRICING.default
    costUsd += (inp * price.in + out * price.out + cw * price.cacheWrite + cr * price.cacheRead) / 1_000_000

    if (a.created_at) {
      const t = new Date(a.created_at).getTime()
      if (t >= since(30)) { aiCalls30++; aiIn += inp; aiOut += out; aiCacheRead += cr; aiCacheWrite += cw }
      const key = dayKey(new Date(a.created_at))
      if (aiDailyMap.has(key)) aiDailyMap.set(key, (aiDailyMap.get(key) || 0) + 1)
    }
  }
  const aiByEndpoint = [...byEndpoint].map(([endpoint, v]) => ({ endpoint, ...v })).sort((a, b) => b.calls - a.calls)
  const aiDaily = [...aiDailyMap].map(([date, count]) => ({ date, count }))
  const cacheEfficiency = (aiIn + aiCacheRead) > 0 ? Math.round((aiCacheRead / (aiIn + aiCacheRead)) * 100) : 0

  // ── Feature adoption (distinct users + action count, last 30 days) ───────
  const featureStat = (rows: { user_id: string }[], tsField: string) => {
    const users = new Set<string>()
    let actions30 = 0, total = 0
    for (const r of rows as any[]) {
      total++
      const ts = r[tsField]
      if (ts && new Date(ts).getTime() >= since(30)) { actions30++; users.add(r.user_id) }
    }
    return { users: users.size, actions30, total }
  }
  const elearningStat = featureStat(elearning, 'completed_at')
  const practiceStat = featureStat(practice, 'viewed_at')
  const flashcardStat = featureStat(flashcards, 'reviewed_at')
  const quizStat = featureStat(quizzes, 'completed_at')
  const quizPassed = quizzes.filter(q => q.passed).length
  const quizPassRate = quizzes.length > 0 ? Math.round((quizPassed / quizzes.length) * 100) : 0

  const features = [
    { key: 'elearning', label: 'E-learning', users: elearningStat.users, actions: elearningStat.actions30, total: elearningStat.total },
    { key: 'quiz', label: 'Quiz', users: quizStat.users, actions: quizStat.actions30, total: quizzes.length },
    { key: 'practice', label: 'Vidéos pratique', users: practiceStat.users, actions: practiceStat.actions30, total: practiceStat.total },
    { key: 'flashcards', label: 'Flashcards', users: flashcardStat.users, actions: flashcardStat.actions30, total: flashcardStat.total },
  ].sort((a, b) => b.actions - a.actions)

  // ── Gamification distribution ────────────────────────────────────────────
  const levelBuckets = new Map<number, number>()
  let bestStreak = 0
  for (const g of gami) {
    const lvl = g.level || 1
    levelBuckets.set(lvl, (levelBuckets.get(lvl) || 0) + 1)
    if ((g.best_streak || 0) > bestStreak) bestStreak = g.best_streak || 0
  }
  const levelDistribution = [...levelBuckets].sort((a, b) => a[0] - b[0]).map(([level, count]) => ({ level, count }))
  const avgStreak = gami.length > 0 ? Math.round((gami.reduce((s, g) => s + (g.current_streak || 0), 0) / gami.length) * 10) / 10 : 0

  // ── Support ───────────────────────────────────────────────────────────────
  const ticketsOpen = tickets.filter(t => t.status === 'in_progress').length
  const tickets30d = tickets.filter(t => t.created_at && new Date(t.created_at).getTime() >= since(30)).length

  // ── Recent signups ────────────────────────────────────────────────────────
  const recent = [...profiles].reverse().slice(0, 8).map(p => ({
    id: p.id, email: p.email, full_name: p.full_name, role: p.role, created_at: p.created_at,
  }))

  return NextResponse.json({
    kpis: {
      total, premium, free, admin, foundingMembers, newsletterOptIn,
      signupsToday, signups7d, signups30d, prevSignups30d, conversionRate,
      dau, wau, mau, stickiness, activationRate,
    },
    daily,
    cumulative,
    activeDaily,
    osteoflow: {
      users: ofUsers.size,
      devices: ofDevices.size,
      active30d: ofActive30.size,
      active7d: ofActive7.size,
      adoption: ofAdoption,
      platforms: ofPlatforms,
      installsMonthly: ofInstallsMonthly,
      recentDevices,
    },
    ai: {
      calls30d: aiCalls30,
      callsTotal: aiLogs.length,
      inputTokens: aiIn,
      outputTokens: aiOut,
      cacheReadTokens: aiCacheRead,
      cacheEfficiency,
      estCostEur: Math.round(costUsd * USD_TO_EUR * 100) / 100,
      byEndpoint: aiByEndpoint,
      daily: aiDaily,
    },
    engagement: {
      features,
      quizPassRate,
      quizPassed,
      quizTotal: quizzes.length,
      levelDistribution,
      avgStreak,
      bestStreak,
      gamifiedUsers: gami.length,
    },
    support: { open: ticketsOpen, last30d: tickets30d, total: tickets.length },
    recent,
    generatedAt: now.toISOString(),
  })
}

function normalizePlatform(name: string | null): string {
  if (!name) return 'Autre'
  const n = name.toLowerCase()
  if (n.includes('win')) return 'Windows'
  if (n.includes('mac')) return 'macOS'
  if (n.includes('linux')) return 'Linux'
  if (n.includes('iphone') || n.includes('ipad') || n.includes('ios')) return 'iOS'
  if (n.includes('android')) return 'Android'
  return name
}
