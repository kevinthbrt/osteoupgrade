'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Stethoscope,
  GraduationCap,
  Wrench,
  Calendar,
  Search,
  Trophy,
  Flame,
  Award,
  ArrowRight,
  Loader2,
  Zap,
  Dumbbell,
  LogIn,
  Crown,
  Gift,
  Copy,
  Check,
  Users,
  Wallet,
  Lock
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [badges, setBadges] = useState<{ id: string; name: string; icon: string | null; description?: string | null }[]>([])
  const [referralData, setReferralData] = useState<{ code: string | null; referrals_count: number; available_earnings: number } | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [stats, setStats] = useState({
    level: 1, totalXp: 0, currentStreak: 0, unlockedAchievements: 0,
    weekLogins: 0, weekElearning: 0, weekPractice: 0, weekTesting: 0,
    elearningProgress: 0, practiceProgress: 0, testingProgress: 0,
    totalLogins: 0, totalElearningCompleted: 0, totalPracticeViewed: 0, totalTestingViewed: 0
  })

  const badgeIconMap: Record<string, ComponentType<{ className?: string }>> = {
    GraduationCap, Zap, Calendar, Dumbbell, Flame, LogIn
  }

  useEffect(() => { loadDashboardData(); trackDailyLogin() }, [])

  const trackDailyLogin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.rpc('record_user_login', { p_user_id: user.id })
    } catch (e) { console.error(e) }
  }

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/profile', { cache: 'no-store' })
      if (!response.ok) { setProfile({ role: 'free', full_name: 'Invité' }); setLoading(false); return }
      const { user, profile: profileData } = await response.json()
      if (profileData) setProfile(profileData)

      const { data: gs } = await supabase.from('user_gamification_stats').select('*').eq('user_id', user.id).single()
      if (gs) {
        const { count: achievementsCount } = await supabase.from('user_achievements').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        setStats({
          level: gs.level || 1, totalXp: gs.total_xp || 0, currentStreak: gs.current_streak || 0,
          unlockedAchievements: achievementsCount || 0, weekLogins: gs.week_logins || 0,
          weekElearning: gs.week_elearning || 0, weekPractice: gs.week_practice || 0,
          weekTesting: gs.week_testing || 0, elearningProgress: gs.elearning_progress || 0,
          practiceProgress: gs.practice_progress || 0, testingProgress: gs.testing_progress || 0,
          totalLogins: gs.total_logins || 0, totalElearningCompleted: gs.total_elearning_completed || 0,
          totalPracticeViewed: gs.total_practice_viewed || 0, totalTestingViewed: gs.total_testing_viewed || 0
        })
      }

      const { data: achievements } = await supabase
        .from('user_achievements').select('achievement:achievements(id, name, icon, description)')
        .eq('user_id', user.id).order('unlocked_at', { ascending: false }).limit(6)
      if (achievements) {
        setBadges(achievements.map((item: any) =>
          Array.isArray(item.achievement) ? item.achievement[0] ?? null : item.achievement
        ).filter(Boolean))
      }

      if (profileData?.role === 'premium' || profileData?.role === 'admin') {
        try {
          const [codeRes, earningsRes] = await Promise.all([fetch('/api/referrals/my-code'), fetch('/api/referrals/earnings')])
          const referralCode = codeRes.ok ? (await codeRes.json()).referralCode : null
          const earningsData = earningsRes.ok ? await earningsRes.json() : null
          setReferralData({ code: referralCode, referrals_count: earningsData?.transactions?.length || 0, available_earnings: earningsData?.summary?.available_amount || 0 })
        } catch (e) { console.error(e) }
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const copyReferralCode = () => {
    if (referralData?.code) {
      navigator.clipboard.writeText(referralData.code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const modules = [
    { id: 'pratique', title: 'Pratique', description: 'Techniques ostéopathiques en vidéo, par région anatomique', icon: Stethoscope, href: '/pratique', count: '150+ vidéos', gradient: 'from-pink-500 to-rose-600', emoji: '🩺' },
    { id: 'elearning', title: 'E-Learning', description: 'Cours, tests orthopédiques, diagnostics et quiz interactifs', icon: GraduationCap, href: '/elearning', count: '500+ contenus', gradient: 'from-blue-500 to-cyan-500', emoji: '📚' },
    { id: 'outils', title: 'Outils', description: 'Exercices thérapeutiques et fiches patients', icon: Wrench, href: '/outils', count: '150+ exercices', gradient: 'from-orange-500 to-red-500', emoji: '🛠️' },
    { id: 'parrainage', title: 'Parrainage', description: 'Parrainez vos collègues et gagnez 10% de commission', icon: Gift, href: '/parrainage', count: '10% cashback', gradient: 'from-amber-400 to-yellow-500', emoji: '🎁' },
  ]

  const xpToNextLevel = 500
  const xpProgress = Math.min((stats.totalXp % xpToNextLevel) / xpToNextLevel * 100, 100)

  const weekProgress = [
    { label: 'E-Learning', value: stats.weekElearning, max: 7, color: 'from-blue-500 to-cyan-500', icon: GraduationCap },
    { label: 'Pratique', value: stats.weekPractice, max: 7, color: 'from-pink-500 to-rose-500', icon: Stethoscope },
    { label: 'Tests', value: stats.weekTesting, max: 7, color: 'from-violet-500 to-indigo-500', icon: Zap },
  ]

  const badgeColors = [
    'from-sky-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-violet-400 to-purple-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-cyan-400 to-sky-500',
  ]

  if (loading) return (
    <AuthLayout>
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          {/* Blobs vivants */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-sky-400/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-6">
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">Bienvenue 👋</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {profile?.full_name || 'Docteur'}
                </h1>
                <p className="text-slate-400 text-sm mt-1.5">Continuez votre progression.</p>
              </div>

              {/* Quick stats pills */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-white text-sm font-semibold">Niv. {stats.level}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-white text-sm font-semibold">{stats.currentStreak} jours</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <Zap className="h-4 w-4 text-sky-400" />
                  <span className="text-white text-sm font-semibold">{stats.totalXp} XP</span>
                </div>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative max-w-xl mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un cours, technique, test..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/15 transition-all"
              />
            </form>

            {/* XP progress bar */}
            <div className="flex items-center gap-3 max-w-xl">
              <span className="text-xs text-slate-400 flex-shrink-0">XP</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-700"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{stats.totalXp % xpToNextLevel}/{xpToNextLevel}</span>
            </div>
          </div>
        </div>

        {/* ── Fondue header → body ────────────────────────────────────── */}
        <div className="h-16 bg-gradient-to-b from-blue-950 via-blue-900/60 to-blue-100/70 pointer-events-none" />

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-2 pb-10 space-y-8">
          {/* Blobs de fond */}
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />

          {/* Bannière Premium */}
          {profile?.role === 'free' && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-5 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-900/20">
                  <Crown className="h-6 w-6 text-amber-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900">Débloquez tout OsteoUpgrade</p>
                  <p className="text-amber-800/80 text-sm mt-0.5">150+ vidéos · 500+ contenus · Exercices patients — dès 29€/mois</p>
                </div>
                <button
                  onClick={() => router.push('/settings/subscription')}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-900 text-amber-100 text-sm font-bold hover:bg-amber-800 transition-colors shadow-md"
                >
                  Passer Premium <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Cette semaine ──────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-sky-500 to-sky-700" />
              <h2 className="text-sm font-bold text-slate-800 tracking-wide">Cette semaine</h2>
            </div>
            <div className="rounded-2xl bg-sky-100/75 backdrop-blur-2xl border border-sky-300/50 shadow-lg ring-1 ring-inset ring-white/40 px-5 py-5 space-y-4">
              {weekProgress.map(({ label, value, max, color, icon: Icon }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/70 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                      style={{ width: `${Math.min(value / max * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-sky-200/50 grid grid-cols-3 gap-2">
                {[
                  { label: 'Connexions', value: stats.totalLogins },
                  { label: 'Leçons', value: stats.totalElearningCompleted },
                  { label: 'Actions', value: stats.totalPracticeViewed + stats.totalTestingViewed },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white/65 py-2.5 text-center border border-sky-200/50">
                    <div className="text-xl font-bold text-slate-900">{value}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Modules ────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
              <h2 className="text-sm font-bold text-slate-800 tracking-wide">Modules d'apprentissage</h2>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg border border-blue-300/50 bg-blue-100/75 backdrop-blur-2xl ring-1 ring-inset ring-white/40">
              {modules.map((module, i) => {
                const Icon = module.icon
                return (
                  <button
                    key={module.id}
                    onClick={() => router.push(module.href)}
                    className={`group w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/40 transition-colors ${i < modules.length - 1 ? 'border-b border-blue-200/50' : ''}`}
                  >
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${module.gradient} shadow-md group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{module.title}</p>
                      <p className="text-sm text-slate-500 truncate">{module.description}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="hidden sm:block text-sm font-medium text-slate-400">{module.count}</span>
                      <span className="text-xl">{module.emoji}</span>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Ambassadeur ────────────────────────────────────────── */}
          {(profile?.role === 'premium' || profile?.role === 'admin') && referralData && (
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Espace Ambassadeur</h2>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-amber-300/60 bg-amber-100/70 backdrop-blur-2xl ring-1 ring-inset ring-white/40">
                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-900" />
                  <p className="text-sm font-semibold text-amber-900">10% de commission sur chaque abonnement annuel parrainé</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-amber-200/50">
                  <div className="px-5 py-4">
                    <p className="text-xs text-slate-500 mb-1.5">Votre code</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold text-slate-900 tracking-widest">{referralData.code || '—'}</span>
                      <button onClick={copyReferralCode} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/60 hover:bg-amber-100 text-slate-400 hover:text-amber-700 transition-colors">
                        {codeCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {codeCopied && <p className="text-[11px] text-emerald-600 mt-1">Copié !</p>}
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs text-slate-500 mb-1.5">Filleuls</p>
                    <p className="text-2xl font-bold text-slate-900">{referralData.referrals_count}<span className="text-sm font-normal text-slate-400 ml-1">parrainés</span></p>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Cagnotte</p>
                      <p className="text-2xl font-bold text-slate-900">{((referralData.available_earnings || 0) / 100).toFixed(2)}€</p>
                    </div>
                    <button onClick={() => router.push('/settings/referrals')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors">
                      Gérer <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Badges ─────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-500 to-indigo-600" />
              <h2 className="text-sm font-bold text-slate-800 tracking-wide">
                Badges débloqués
                {stats.unlockedAchievements > 0 && <span className="ml-1.5 text-xs font-normal text-slate-500">{stats.unlockedAchievements} au total</span>}
              </h2>
            </div>
            <div className="rounded-2xl bg-indigo-100/70 backdrop-blur-2xl border border-indigo-300/50 shadow-lg ring-1 ring-inset ring-white/40 overflow-hidden">
              {badges.length > 0 ? (
                <div className="grid sm:grid-cols-2">
                  {badges.slice(0, 4).map((badge, i) => {
                    const BadgeIcon = badge.icon ? badgeIconMap[badge.icon] : null
                    return (
                      <div key={badge.id} className={`flex items-center gap-3 px-5 py-3.5 ${i % 2 === 0 && i + 1 < Math.min(badges.length, 4) ? 'sm:border-r border-indigo-200/50' : ''} ${i < Math.min(badges.length, 4) - 2 ? 'border-b border-indigo-200/50' : i < Math.min(badges.length, 4) - 1 && Math.min(badges.length, 4) % 2 !== 0 ? 'border-b border-indigo-200/50' : ''}`}>
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${badgeColors[i % badgeColors.length]} shadow-sm`}>
                          {BadgeIcon ? <BadgeIcon className="h-4 w-4 text-white" /> : <span className="text-sm">🏅</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{badge.name}</p>
                          <p className="text-xs text-slate-500 truncate">{badge.description || 'Badge débloqué'}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                  <Award className="h-8 w-8 text-indigo-200 mb-2" />
                  <p className="text-sm text-slate-500">Aucun badge débloqué pour le moment</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </AuthLayout>
  )
}
