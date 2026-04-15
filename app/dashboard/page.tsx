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
  Sparkles,
  Brain,
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
  BookOpen,
  ChevronRight
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
    level: 1,
    totalXp: 0,
    currentStreak: 0,
    unlockedAchievements: 0,
    weekLogins: 0,
    weekElearning: 0,
    weekPractice: 0,
    weekTesting: 0,
    elearningProgress: 0,
    practiceProgress: 0,
    testingProgress: 0,
    totalLogins: 0,
    totalElearningCompleted: 0,
    totalPracticeViewed: 0,
    totalTestingViewed: 0
  })

  const badgeIconMap: Record<string, ComponentType<{ className?: string }>> = {
    GraduationCap,
    Zap,
    Calendar,
    Dumbbell,
    Flame,
    LogIn
  }

  useEffect(() => {
    loadDashboardData()
    trackDailyLogin()
  }, [])

  const trackDailyLogin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc('record_user_login', { p_user_id: user.id })
      }
    } catch (error) {
      console.error('Erreur tracking login:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/profile', { cache: 'no-store' })

      if (!response.ok) {
        setProfile({ role: 'free', full_name: 'Invité' })
        setLoading(false)
        return
      }

      const { user, profile: profileData } = await response.json()

      if (profileData) {
        setProfile(profileData)
      }

      const { data: gamificationStats } = await supabase
        .from('user_gamification_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (gamificationStats) {
        const { count: achievementsCount } = await supabase
          .from('user_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setStats({
          level: gamificationStats.level || 1,
          totalXp: gamificationStats.total_xp || 0,
          currentStreak: gamificationStats.current_streak || 0,
          unlockedAchievements: achievementsCount || 0,
          weekLogins: gamificationStats.week_logins || 0,
          weekElearning: gamificationStats.week_elearning || 0,
          weekPractice: gamificationStats.week_practice || 0,
          weekTesting: gamificationStats.week_testing || 0,
          elearningProgress: gamificationStats.elearning_progress || 0,
          practiceProgress: gamificationStats.practice_progress || 0,
          testingProgress: gamificationStats.testing_progress || 0,
          totalLogins: gamificationStats.total_logins || 0,
          totalElearningCompleted: gamificationStats.total_elearning_completed || 0,
          totalPracticeViewed: gamificationStats.total_practice_viewed || 0,
          totalTestingViewed: gamificationStats.total_testing_viewed || 0
        })
      }

      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('achievement:achievements(id, name, icon, description)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
        .limit(6)

      if (achievements) {
        setBadges(
          achievements
            .map((item: { achievement: { id: string; name: string; icon: string | null; description?: string | null }[] | { id: string; name: string; icon: string | null; description?: string | null } | null }) => {
              if (Array.isArray(item.achievement)) {
                return item.achievement[0] ?? null
              }
              return item.achievement
            })
            .filter((achievement): achievement is { id: string; name: string; icon: string | null; description?: string | null } => Boolean(achievement))
        )
      }

      if (profileData?.role === 'premium' || profileData?.role === 'admin') {
        try {
          const [codeResponse, earningsResponse] = await Promise.all([
            fetch('/api/referrals/my-code'),
            fetch('/api/referrals/earnings')
          ])

          let referralCode = null
          let referralsCount = 0
          let availableEarnings = 0

          if (codeResponse.ok) {
            const codeData = await codeResponse.json()
            referralCode = codeData.referralCode
          }

          if (earningsResponse.ok) {
            const earningsData = await earningsResponse.json()
            referralsCount = earningsData.transactions?.length || 0
            availableEarnings = earningsData.summary?.available_amount || 0
          }

          setReferralData({
            code: referralCode,
            referrals_count: referralsCount,
            available_earnings: availableEarnings
          })
        } catch (error) {
          console.error('Error loading referral data:', error)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
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
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const modules = [
    {
      id: 'pratique',
      title: 'Pratique',
      description: 'Techniques ostéopathiques en vidéo, organisées par région anatomique',
      icon: Stethoscope,
      href: '/pratique',
      count: '150+ vidéos',
    },
    {
      id: 'elearning',
      title: 'E-Learning',
      description: 'Cours structurés, tests orthopédiques, diagnostics et quiz interactifs',
      icon: GraduationCap,
      href: '/elearning',
      count: '500+ contenus',
    },
    {
      id: 'outils',
      title: 'Outils',
      description: 'Exercices thérapeutiques et outils pratiques pour vos patients',
      icon: Wrench,
      href: '/outils',
      count: '150+ exercices',
    },
    {
      id: 'parrainage',
      title: 'Parrainage',
      description: 'Parrainez vos collègues et gagnez 10% de commission',
      icon: Gift,
      href: '/parrainage',
      count: '10% cashback',
    }
  ]

  const xpToNextLevel = 500
  const xpProgress = Math.min((stats.totalXp % xpToNextLevel) / xpToNextLevel * 100, 100)

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6 pb-12">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 text-white">
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
          {/* Soft glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-20" />

          <div className="relative px-6 py-7 md:px-8 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">Bonjour,</p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {profile?.full_name || 'Docteur'} 👋
                </h1>
                <p className="text-blue-200 text-sm mt-1.5">
                  Continuez votre progression en ostéopathie
                </p>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un cours, test..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
                />
              </form>
            </div>
          </div>
        </div>

        {/* ── Premium upgrade banner ───────────────────────────────── */}
        {profile?.role === 'free' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">Débloquez tout OsteoUpgrade</p>
              <p className="text-amber-700 text-xs mt-0.5">
                150+ vidéos · 500+ contenus · Exercices patients — à partir de 29€/mois
              </p>
            </div>
            <button
              onClick={() => router.push('/settings/subscription')}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              Passer Premium
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Niveau', value: stats.level, sub: `${stats.totalXp} XP total`, icon: Trophy, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Série', value: `${stats.currentStreak}j`, sub: 'jours consécutifs', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Leçons', value: stats.totalElearningCompleted, sub: 'complétées', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Activité', value: stats.totalPracticeViewed + stats.totalTestingViewed, sub: 'actions au total', icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg} mb-3`}>
                <Icon className={`h-4.5 w-4.5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label} · {sub}</div>
            </div>
          ))}
        </div>

        {/* ── Progression + Badges ─────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* XP Progress */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4.5 w-4.5 text-blue-600" />
                <span className="font-semibold text-slate-900 text-sm">Progression</span>
              </div>
              <span className="text-xs text-slate-500">Niveau {stats.level} → {stats.level + 1}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{stats.totalXp % xpToNextLevel} XP</span>
              <span>{xpToNextLevel} XP</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Connexions', value: stats.totalLogins, icon: LogIn },
                { label: 'E-Learning', value: stats.weekElearning, icon: GraduationCap },
                { label: 'Pratique', value: stats.weekPractice, icon: Stethoscope },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                  <div className="text-lg font-bold text-slate-900">{value}</div>
                  <div className="text-[10px] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-blue-600" />
                <span className="font-semibold text-slate-900 text-sm">Badges</span>
              </div>
              {stats.unlockedAchievements > 0 && (
                <span className="text-xs text-slate-500">{stats.unlockedAchievements} débloqué{stats.unlockedAchievements > 1 ? 's' : ''}</span>
              )}
            </div>

            {badges.length > 0 ? (
              <div className="space-y-2">
                {badges.slice(0, 4).map((badge, index) => {
                  const BadgeIcon = badge.icon ? badgeIconMap[badge.icon] : null
                  const colors = ['bg-blue-50 text-blue-600', 'bg-emerald-50 text-emerald-600', 'bg-violet-50 text-violet-600', 'bg-amber-50 text-amber-600']
                  return (
                    <div key={badge.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colors[index % colors.length]}`}>
                        {BadgeIcon ? <BadgeIcon className="h-4 w-4" /> : <span className="text-sm">🏅</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{badge.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{badge.description || 'Badge débloqué'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <Award className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">Aucun badge débloqué pour le moment</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Modules ──────────────────────────────────────────────── */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Modules d'apprentissage</h2>
            <p className="text-sm text-slate-500">Sélectionnez un module pour continuer</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <button
                  key={module.id}
                  onClick={() => router.push(module.href)}
                  className="group flex flex-col text-left bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-600 transition-colors duration-200">
                      <Icon className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-1">{module.title}</h3>
                  <p className="text-xs text-slate-500 flex-1 leading-relaxed mb-3">{module.description}</p>

                  <span className="self-start px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                    {module.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Ambassador space ─────────────────────────────────────── */}
        {(profile?.role === 'premium' || profile?.role === 'admin') && referralData && (
          <div className="rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-100 bg-amber-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Crown className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 text-sm">Espace Ambassadeur</p>
                <p className="text-amber-600 text-xs">10% de commission sur chaque abonnement annuel parrainé</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Code */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Votre code</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-slate-900 tracking-widest">
                    {referralData.code || '—'}
                  </span>
                  <button
                    onClick={copyReferralCode}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-500 transition-colors"
                  >
                    {codeCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {codeCopied && <p className="text-[11px] text-emerald-600 mt-1">Copié !</p>}
              </div>

              {/* Filleuls */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filleuls</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-slate-900">{referralData.referrals_count}</span>
                  <span className="text-xs text-slate-500 mb-0.5">parrainés</span>
                </div>
              </div>

              {/* Cagnotte */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cagnotte</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {((referralData.available_earnings || 0) / 100).toFixed(2)}€
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/settings/referrals')}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                >
                  Gérer
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthLayout>
  )
}
