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
  Lock,
  Laptop,
  Download
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

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-0 right-1/4 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl animate-pulse translate-x-1/3 translate-y-1/3" style={{ animationDuration: '7s', animationDelay: '0.5s' }} />
          <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-blue-300/15 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl p-6 md:p-8 shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-6">
                <div>
                  <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide">Bienvenue 👋</p>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                    {profile?.full_name || 'Docteur'}
                  </h1>
                  <p className="text-blue-300/70 text-sm mt-1.5">Continuez votre progression.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 bg-yellow-400/15 backdrop-blur-sm border border-yellow-300/25 rounded-full px-4 py-2 shadow-sm">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-white text-sm font-semibold">Niv. {stats.level}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-orange-400/15 backdrop-blur-sm border border-orange-300/25 rounded-full px-4 py-2 shadow-sm">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-white text-sm font-semibold">{stats.currentStreak} jours</span>
                  </div>
                  <div className="flex items-center gap-2 bg-sky-400/15 backdrop-blur-sm border border-sky-300/25 rounded-full px-4 py-2 shadow-sm">
                    <Zap className="h-4 w-4 text-sky-300" />
                    <span className="text-white text-sm font-semibold">{stats.totalXp} XP</span>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSearch} className="relative max-w-xl mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/60" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un cours, technique, test..." className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white placeholder-blue-300/50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:bg-white/18 transition-all" />
              </form>
              <div className="flex items-center gap-3 max-w-xl">
                <span className="text-xs text-blue-300/60 flex-shrink-0 font-medium">XP</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 transition-all duration-700 shadow-[0_0_8px_rgba(56,189,248,0.6)]" style={{ width: `${xpProgress}%` }} />
                </div>
                <span className="text-xs text-blue-300/60 flex-shrink-0">{stats.totalXp % xpToNextLevel}/{xpToNextLevel}</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent blur-sm" />
        </div>

        {/* Body */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10 space-y-8">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/45 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/3 right-0 w-80 h-80 bg-sky-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/35 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          <div className="pointer-events-none absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '3s' }} />
          <div className="pointer-events-none absolute bottom-1/3 left-1/2 w-56 h-56 bg-blue-300/25 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '0.5s' }} />

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
                <button onClick={() => router.push('/settings/subscription')} className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-900 text-amber-100 text-sm font-bold hover:bg-amber-800 transition-colors shadow-md">
                  Passer Premium <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <section className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-sky-500 to-sky-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Cette semaine</h2>
              </div>
              <div className="rounded-2xl bg-sky-100/85 backdrop-blur-2xl border border-sky-300/70 shadow-xl ring-1 ring-inset ring-white/60 px-5 py-5 space-y-4">
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
                      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${Math.min(value / max * 100, 100)}%` }} />
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
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-500 to-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">
                  Badges débloqués
                  {stats.unlockedAchievements > 0 && <span className="ml-1.5 text-xs font-normal text-slate-500">{stats.unlockedAchievements} au total</span>}
                </h2>
              </div>
              <div className="rounded-2xl bg-indigo-100/85 backdrop-blur-2xl border border-indigo-300/70 shadow-xl ring-1 ring-inset ring-white/60 overflow-hidden">
                {badges.length > 0 ? (
                  badges.slice(0, 4).map((badge, i) => {
                    const BadgeIcon = badge.icon ? badgeIconMap[badge.icon] : null
                    return (
                      <div key={badge.id} className={`flex items-center gap-3 px-5 py-3.5 ${i < Math.min(badges.length, 4) - 1 ? 'border-b border-indigo-200/50' : ''}`}>
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${badgeColors[i % badgeColors.length]} shadow-sm`}>
                          {BadgeIcon ? <BadgeIcon className="h-4 w-4 text-white" /> : <span className="text-sm">🏅</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{badge.name}</p>
                          <p className="text-xs text-slate-500 truncate">{badge.description || 'Badge débloqué'}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                    <Award className="h-8 w-8 text-indigo-200 mb-2" />
                    <p className="text-sm text-slate-500">Aucun badge débloqué pour le moment</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
              <h2 className="text-sm font-bold text-slate-800 tracking-wide">Modules d'apprentissage</h2>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-blue-300/70 bg-blue-100/85 backdrop-blur-2xl ring-1 ring-inset ring-white/60">
              {modules.map((module, i) => {
                const Icon = module.icon
                return (
                  <button key={module.id} onClick={() => router.push(module.href)} className={`group w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/40 transition-colors ${i < modules.length - 1 ? 'border-b border-blue-200/50' : ''}`}>
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

          {(profile?.role === 'premium' || profile?.role === 'admin') && referralData && (
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Espace Ambassadeur</h2>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-amber-300/75 bg-amber-100/85 backdrop-blur-2xl ring-1 ring-inset ring-white/60">
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

          {(profile?.role === 'premium' || profile?.role === 'admin') && (
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-500 to-violet-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Osteoflow — Logiciel de cabinet</h2>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-violet-300/70 bg-violet-100/85 backdrop-blur-2xl ring-1 ring-inset ring-white/60">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-white" />
                  <p className="text-sm font-semibold text-white">Inclus avec votre abonnement Premium</p>
                </div>
                <div className="px-5 py-5">
                  <p className="text-sm text-slate-600 mb-5">Gérez vos patients, consultations et dossiers directement depuis votre ordinateur. Toutes les données restent sur votre machine. Connectez-vous avec votre compte OsteoUpgrade pour activer la licence.</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="/api/osteoflow/download?platform=mac" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-md">
                      <Download className="h-4 w-4" />
                      Mac (Intel)
                    </a>
                    <a href="/api/osteoflow/download?platform=mac-arm64" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-md">
                      <Download className="h-4 w-4" />
                      Mac (Apple Silicon)
                    </a>
                    <a href="/api/osteoflow/download?platform=windows" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-md">
                      <Download className="h-4 w-4" />
                      Windows
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </AuthLayout>
  )
}
