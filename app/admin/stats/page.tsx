'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import {
  BarChart3,
  Users,
  Crown,
  Star,
  Mail,
  TrendingUp,
  TrendingDown,
  UserPlus,
  ArrowRight,
  Activity,
  Zap,
  Sparkles,
  Cpu,
  Laptop,
  MonitorSmartphone,
  GraduationCap,
  Flame,
  LifeBuoy,
  Coins,
} from 'lucide-react'

type Series = { date: string; count: number }[]

type Stats = {
  kpis: {
    total: number
    premium: number
    free: number
    admin: number
    foundingMembers: number
    newsletterOptIn: number
    signupsToday: number
    signups7d: number
    signups30d: number
    prevSignups30d: number
    conversionRate: number
    dau: number
    wau: number
    mau: number
    stickiness: number
    activationRate: number
  }
  daily: Series
  cumulative: { date: string; total: number }[]
  activeDaily: Series
  osteoflow: {
    users: number
    devices: number
    active30d: number
    active7d: number
    adoption: number
    platforms: { name: string; count: number }[]
    installsMonthly: { month: string; count: number }[]
    recentDevices: { platform: string; last_active_at: string | null; created_at: string | null }[]
  }
  ai: {
    calls30d: number
    callsTotal: number
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheEfficiency: number
    estCostEur: number
    byEndpoint: { endpoint: string; calls: number; inTok: number; outTok: number; cacheRead: number }[]
    daily: Series
  }
  engagement: {
    features: { key: string; label: string; users: number; actions: number; total: number }[]
    quizPassRate: number
    quizPassed: number
    quizTotal: number
    levelDistribution: { level: number; count: number }[]
    avgStreak: number
    bestStreak: number
    gamifiedUsers: number
  }
  support: { open: number; last30d: number; total: number }
  recent: { id: string; email: string | null; full_name: string | null; role: string | null; created_at: string | null }[]
  generatedAt: string
}

function fmtDay(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
function relativeDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ── Cumulative growth (area + line) ──────────────────────────────────────────
function GrowthChart({ data }: { data: { date: string; total: number }[] }) {
  const W = 720, H = 240, PAD_L = 40, PAD_R = 16, PAD_T = 16, PAD_B = 28
  if (data.length < 2) return null
  const max = Math.max(...data.map(d => d.total), 1)
  const min = Math.min(...data.map(d => d.total))
  const iw = W - PAD_L - PAD_R
  const ih = H - PAD_T - PAD_B
  const x = (i: number) => PAD_L + (i / (data.length - 1)) * iw
  const y = (v: number) => PAD_T + ih - ((v - min) / Math.max(max - min, 1)) * ih

  const linePts = data.map((d, i) => `${x(i)},${y(d.total)}`).join(' ')
  const areaPts = `${PAD_L},${PAD_T + ih} ${linePts} ${x(data.length - 1)},${PAD_T + ih}`

  const yTicks = 4
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round(min + ((max - min) * i) / yTicks))
  const xIdx = [0, Math.floor((data.length - 1) / 3), Math.floor((2 * (data.length - 1)) / 3), data.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Évolution cumulée des inscriptions">
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const yy = y(t)
        return (
          <g key={i}>
            <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD_L - 8} y={yy + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{t}</text>
          </g>
        )
      })}
      <polygon points={areaPts} fill="url(#growthFill)" />
      <polyline points={linePts} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {xIdx.map(i => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{fmtDay(data[i].date)}</text>
      ))}
    </svg>
  )
}

// ── Generic daily bars ───────────────────────────────────────────────────────
function DailyBars({ data, color = '#38bdf8', unitLabel = 'inscription' }: { data: Series; color?: string; unitLabel?: string }) {
  const W = 720, H = 200, PAD_L = 32, PAD_R = 12, PAD_T = 12, PAD_B = 26
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  const iw = W - PAD_L - PAD_R
  const ih = H - PAD_T - PAD_B
  const bw = iw / data.length
  const yTicks = 3
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((max * i) / yTicks))
  const labelEvery = Math.ceil(data.length / 8)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Série journalière">
      {ticks.map((t, i) => {
        const yy = PAD_T + ih - (t / max) * ih
        return (
          <g key={i}>
            <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD_L - 6} y={yy + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{t}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const h = (d.count / max) * ih
        const xx = PAD_L + i * bw
        const yy = PAD_T + ih - h
        return (
          <g key={d.date}>
            <rect x={xx + bw * 0.15} y={yy} width={bw * 0.7} height={Math.max(h, d.count > 0 ? 2 : 0)} rx="2" fill={color}>
              <title>{`${fmtDay(d.date)} : ${d.count} ${unitLabel}${d.count > 1 ? 's' : ''}`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={xx + bw / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">{fmtDay(d.date)}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function KpiCard({ icon: Icon, label, value, sub, iconColor, iconBg }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: React.ReactNode
  iconColor: string
  iconBg: string
}) {
  return (
    <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-lg ring-1 ring-inset ring-white/60 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        </div>
      </div>
      {sub && <div className="mt-2 text-xs">{sub}</div>}
    </div>
  )
}

function SectionCard({ title, accent, icon: Icon, subtitle, children }: {
  title: string
  accent: string
  icon?: React.ComponentType<{ className?: string }>
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`h-5 w-1 rounded-full bg-gradient-to-b ${accent}`} />
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-wide">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Horizontal bar list ──────────────────────────────────────────────────────
function HBars({ rows, color }: { rows: { label: string; value: number; hint?: string }[]; color: string }) {
  const max = Math.max(...rows.map(r => r.value), 1)
  if (!rows.length) return <p className="text-sm text-slate-400">Aucune donnée.</p>
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-32 shrink-0 text-xs font-medium text-slate-600 truncate" title={r.label}>{r.label}</div>
          <div className="flex-1 h-6 rounded-lg bg-slate-100 overflow-hidden relative">
            <div className={`h-full rounded-lg ${color}`} style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value > 0 ? '6px' : 0 }} />
          </div>
          <div className="w-24 shrink-0 text-right text-xs font-semibold text-slate-700 tabular-nums">
            {r.value.toLocaleString('fr-FR')}
            {r.hint && <span className="text-slate-400 font-normal"> · {r.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminStatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAndLoad()
  }, [])

  const checkAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/dashboard'); return }

      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Impossible de charger les statistiques')
      setStats(await res.json())
    } catch (e: any) {
      setError(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const trend = useMemo(() => {
    if (!stats) return null
    const { signups30d, prevSignups30d } = stats.kpis
    if (prevSignups30d === 0) return signups30d > 0 ? 100 : 0
    return Math.round(((signups30d - prevSignups30d) / prevSignups30d) * 100)
  }, [stats])

  const dailyLast30 = useMemo(() => stats ? stats.daily.slice(-30) : [], [stats])
  const activeLast30 = useMemo(() => stats ? stats.activeDaily.slice(-30) : [], [stats])

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="relative">
            <AdminBackButton />
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Statistiques
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Croissance, activité, adoption OsteoFlow, usage IA et engagement produit
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
        </div>

        {/* BODY */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10 min-h-[60vh]">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-8">
            {loading && (
              <div className="py-24 text-center text-slate-500 text-sm">Chargement des statistiques…</div>
            )}
            {error && !loading && (
              <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">{error}</div>
            )}

            {stats && !loading && (
              <>
                {/* ═══ ACCOUNTS ═══ */}
                <section className="space-y-3">
                  <SectionLabel>Comptes &amp; inscriptions</SectionLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <KpiCard icon={Users} label="Utilisateurs" value={stats.kpis.total} iconColor="text-blue-600" iconBg="bg-blue-100"
                      sub={<span className="text-slate-400">{stats.kpis.free} gratuits · {stats.kpis.premium} premium</span>} />
                    <KpiCard icon={UserPlus} label="Inscrits (30j)" value={stats.kpis.signups30d} iconColor="text-sky-600" iconBg="bg-sky-100"
                      sub={trend !== null && (
                        <span className={`inline-flex items-center gap-1 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {trend >= 0 ? '+' : ''}{trend}% vs 30j préc.
                        </span>
                      )} />
                    <KpiCard icon={UserPlus} label="Inscrits (7j)" value={stats.kpis.signups7d} iconColor="text-indigo-600" iconBg="bg-indigo-100"
                      sub={<span className="text-slate-400">dont {stats.kpis.signupsToday} aujourd&apos;hui</span>} />
                    <KpiCard icon={Crown} label="Premium" value={stats.kpis.premium} iconColor="text-yellow-600" iconBg="bg-yellow-100"
                      sub={<span className="text-slate-400">{stats.kpis.conversionRate}% de conversion</span>} />
                    <KpiCard icon={Star} label="Membres fondateurs" value={stats.kpis.foundingMembers} iconColor="text-amber-600" iconBg="bg-amber-100" />
                    <KpiCard icon={Mail} label="Opt-in newsletter" value={stats.kpis.newsletterOptIn} iconColor="text-pink-600" iconBg="bg-pink-100"
                      sub={<span className="text-slate-400">{stats.kpis.total > 0 ? Math.round((stats.kpis.newsletterOptIn / stats.kpis.total) * 100) : 0}% des comptes</span>} />
                  </div>
                </section>

                {/* ═══ ACTIVITY ═══ */}
                <section className="space-y-3">
                  <SectionLabel>Activité &amp; rétention</SectionLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <KpiCard icon={Activity} label="Actifs aujourd'hui" value={stats.kpis.dau} iconColor="text-emerald-600" iconBg="bg-emerald-100" />
                    <KpiCard icon={Activity} label="Actifs 7j (WAU)" value={stats.kpis.wau} iconColor="text-teal-600" iconBg="bg-teal-100" />
                    <KpiCard icon={Activity} label="Actifs 30j (MAU)" value={stats.kpis.mau} iconColor="text-cyan-600" iconBg="bg-cyan-100" />
                    <KpiCard icon={Zap} label="Stickiness" value={`${stats.kpis.stickiness}%`} iconColor="text-orange-600" iconBg="bg-orange-100"
                      sub={<span className="text-slate-400">DAU / MAU</span>} />
                    <KpiCard icon={TrendingUp} label="Taux d'activation" value={`${stats.kpis.activationRate}%`} iconColor="text-violet-600" iconBg="bg-violet-100"
                      sub={<span className="text-slate-400">actifs 30j / comptes</span>} />
                    <KpiCard icon={LifeBuoy} label="Support ouvert" value={stats.support.open} iconColor="text-rose-600" iconBg="bg-rose-100"
                      sub={<span className="text-slate-400">{stats.support.last30d} tickets / 30j</span>} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Croissance cumulée des comptes" subtitle="90 derniers jours" accent="from-blue-500 to-blue-700">
                      <GrowthChart data={stats.cumulative} />
                    </SectionCard>
                    <SectionCard title="Utilisateurs actifs par jour" subtitle="connexions quotidiennes · 30 derniers jours" accent="from-emerald-400 to-emerald-600">
                      <DailyBars data={activeLast30} color="#10b981" unitLabel="actif" />
                    </SectionCard>
                  </div>

                  <SectionCard title="Inscriptions par jour" subtitle="30 derniers jours" accent="from-sky-400 to-sky-600">
                    <DailyBars data={dailyLast30} color="#38bdf8" unitLabel="inscription" />
                  </SectionCard>
                </section>

                {/* ═══ OSTEOFLOW ═══ */}
                <section className="space-y-3">
                  <SectionLabel>OsteoFlow — application cabinet</SectionLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard icon={Laptop} label="Utilisateurs OsteoFlow" value={stats.osteoflow.users} iconColor="text-indigo-600" iconBg="bg-indigo-100"
                      sub={<span className="text-slate-400">{stats.osteoflow.adoption}% des comptes</span>} />
                    <KpiCard icon={MonitorSmartphone} label="Appareils installés" value={stats.osteoflow.devices} iconColor="text-blue-600" iconBg="bg-blue-100" />
                    <KpiCard icon={Activity} label="Actifs 30j" value={stats.osteoflow.active30d} iconColor="text-emerald-600" iconBg="bg-emerald-100"
                      sub={<span className="text-slate-400">{stats.osteoflow.active7d} actifs 7j</span>} />
                    <KpiCard icon={Crown} label="Adoption premium" value={`${stats.osteoflow.adoption}%`} iconColor="text-amber-600" iconBg="bg-amber-100"
                      sub={<span className="text-slate-400">des comptes utilisent OsteoFlow</span>} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Répartition par plateforme" subtitle="appareils connectés" accent="from-indigo-400 to-indigo-600">
                      <HBars color="bg-gradient-to-r from-indigo-400 to-indigo-600"
                        rows={stats.osteoflow.platforms.map(p => ({ label: p.name, value: p.count }))} />
                    </SectionCard>
                    <SectionCard title="Nouvelles installations par mois" subtitle="premières connexions d'un appareil" accent="from-blue-400 to-blue-600">
                      {stats.osteoflow.installsMonthly.length ? (
                        <DailyBars
                          data={stats.osteoflow.installsMonthly.map(m => ({ date: m.month + '-01', count: m.count }))}
                          color="#6366f1" unitLabel="installation" />
                      ) : <p className="text-sm text-slate-400">Aucune donnée.</p>}
                    </SectionCard>
                  </div>

                  <SectionCard title="Appareils récemment actifs" accent="from-violet-400 to-violet-600">
                    {stats.osteoflow.recentDevices.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucun appareil.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {stats.osteoflow.recentDevices.map((d, i) => (
                          <div key={i} className="flex items-center gap-3 py-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                              <Laptop className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{d.platform}</p>
                              <p className="text-xs text-slate-400">Installé {relativeDate(d.created_at)}</p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">actif {relativeDate(d.last_active_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </section>

                {/* ═══ AI ═══ */}
                <section className="space-y-3">
                  <SectionLabel>Intelligence artificielle</SectionLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard icon={Sparkles} label="Appels IA (30j)" value={stats.ai.calls30d} iconColor="text-fuchsia-600" iconBg="bg-fuchsia-100"
                      sub={<span className="text-slate-400">{stats.ai.callsTotal} au total</span>} />
                    <KpiCard icon={Cpu} label="Tokens (30j)" value={fmtTokens(stats.ai.inputTokens + stats.ai.outputTokens)} iconColor="text-purple-600" iconBg="bg-purple-100"
                      sub={<span className="text-slate-400">{fmtTokens(stats.ai.inputTokens)} in · {fmtTokens(stats.ai.outputTokens)} out</span>} />
                    <KpiCard icon={Zap} label="Efficacité cache" value={`${stats.ai.cacheEfficiency}%`} iconColor="text-teal-600" iconBg="bg-teal-100"
                      sub={<span className="text-slate-400">tokens lus depuis le cache</span>} />
                    <KpiCard icon={Coins} label="Coût estimé (30j)" value={`${stats.ai.estCostEur} €`} iconColor="text-emerald-600" iconBg="bg-emerald-100"
                      sub={<span className="text-slate-400">basé sur tarifs Claude</span>} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Usage par fonctionnalité IA" subtitle="nombre d'appels par endpoint" accent="from-fuchsia-400 to-fuchsia-600">
                      <HBars color="bg-gradient-to-r from-fuchsia-400 to-fuchsia-600"
                        rows={stats.ai.byEndpoint.map(e => ({
                          label: aiLabel(e.endpoint),
                          value: e.calls,
                          hint: `${fmtTokens(e.inTok + e.outTok)} tok`,
                        }))} />
                    </SectionCard>
                    <SectionCard title="Appels IA par jour" subtitle="30 derniers jours" accent="from-purple-400 to-purple-600">
                      <DailyBars data={stats.ai.daily.slice(-30)} color="#a855f7" unitLabel="appel" />
                    </SectionCard>
                  </div>
                </section>

                {/* ═══ ENGAGEMENT ═══ */}
                <section className="space-y-3">
                  <SectionLabel>Adoption des fonctionnalités &amp; engagement</SectionLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard icon={GraduationCap} label="Réussite quiz" value={`${stats.engagement.quizPassRate}%`} iconColor="text-blue-600" iconBg="bg-blue-100"
                      sub={<span className="text-slate-400">{stats.engagement.quizPassed}/{stats.engagement.quizTotal} tentatives</span>} />
                    <KpiCard icon={Flame} label="Streak moyen" value={`${stats.engagement.avgStreak} j`} iconColor="text-orange-600" iconBg="bg-orange-100"
                      sub={<span className="text-slate-400">record : {stats.engagement.bestStreak} j</span>} />
                    <KpiCard icon={Users} label="Utilisateurs gamifiés" value={stats.engagement.gamifiedUsers} iconColor="text-violet-600" iconBg="bg-violet-100" />
                    <KpiCard icon={Zap} label="Fonctionnalité n°1" value={stats.engagement.features[0]?.label ?? '—'} iconColor="text-amber-600" iconBg="bg-amber-100"
                      sub={<span className="text-slate-400">{stats.engagement.features[0]?.actions ?? 0} actions / 30j</span>} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Actions par fonctionnalité" subtitle="activité sur 30 jours" accent="from-blue-400 to-indigo-600">
                      <HBars color="bg-gradient-to-r from-blue-400 to-indigo-600"
                        rows={stats.engagement.features.map(f => ({
                          label: f.label,
                          value: f.actions,
                          hint: `${f.users} util.`,
                        }))} />
                    </SectionCard>
                    <SectionCard title="Répartition des niveaux" subtitle="gamification" accent="from-amber-400 to-orange-600">
                      {stats.engagement.levelDistribution.length ? (
                        <HBars color="bg-gradient-to-r from-amber-400 to-orange-600"
                          rows={stats.engagement.levelDistribution.map(l => ({ label: `Niveau ${l.level}`, value: l.count }))} />
                      ) : <p className="text-sm text-slate-400">Aucune donnée.</p>}
                    </SectionCard>
                  </div>
                </section>

                {/* ═══ RECENT SIGNUPS ═══ */}
                <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80">
                    <div className="flex items-center gap-2.5">
                      <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600" />
                      <h2 className="text-sm font-bold text-slate-800 tracking-wide">Dernières inscriptions</h2>
                    </div>
                    <button onClick={() => router.push('/admin/users')} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                      Tous les utilisateurs <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    {stats.recent.length === 0 ? (
                      <p className="px-5 py-6 text-sm text-slate-500">Aucune inscription récente.</p>
                    ) : stats.recent.map((u, i) => (
                      <div key={u.id} className={`flex items-center gap-3 px-5 py-3 ${i < stats.recent.length - 1 ? 'border-b border-slate-100/80' : ''}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${u.role === 'premium' ? 'bg-yellow-500' : u.role === 'admin' ? 'bg-purple-600' : 'bg-slate-400'}`}>
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{u.full_name || u.email || 'Utilisateur'}</p>
                          {u.full_name && <p className="text-xs text-slate-500 truncate">{u.email}</p>}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{relativeDate(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-center text-[11px] text-slate-400">
                  Généré le {new Date(stats.generatedAt).toLocaleString('fr-FR')}
                </p>
              </>
            )}
          </div>
        </div>

      </div>
    </AuthLayout>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">{children}</h2>
  )
}

function aiLabel(endpoint: string): string {
  const map: Record<string, string> = {
    'structure-anamnesis': 'Structuration anamnèse',
    'generate-hypotheses': 'Génération hypothèses',
    'generate-exercise-prescription': 'Prescription exercices',
    'suggest-tests': 'Suggestion de tests',
  }
  return map[endpoint] || endpoint
}
