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

      // Get gamification stats
      const { data: gamificationStats } = await supabase
        .from('user_gamification_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (gamificationStats) {
        // Get achievements count
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

      // Load referral data for Gold members
      if (profileData?.role === 'premium_gold') {
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
      description: 'Techniques ostéopathiques en vidéo organisées par région anatomique',
      icon: Stethoscope,
      href: '/pratique',
      gradient: 'from-pink-500 via-pink-600 to-rose-600',
      bgPattern: 'bg-pink-50',
      count: '150+ vidéos',
      emoji: '🩺',
      features: ['HVLA', 'Mobilisation', 'Techniques tissulaires']
    },
    {
      id: 'elearning',
      title: 'E-Learning',
      description: 'Tout le contenu théorique : cours, tests ortho, diagnostics, topographie et quiz',
      icon: GraduationCap,
      href: '/elearning',
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      bgPattern: 'bg-blue-50',
      count: '500+ contenus',
      emoji: '📚',
      features: ['Cours', 'Tests ortho', 'Diagnostics', 'Quiz']
    },
    {
      id: 'outils',
      title: 'Outils',
      description: 'Exercices thérapeutiques et outils pratiques pour vos patients',
      icon: Wrench,
      href: '/outils',
      gradient: 'from-orange-500 via-orange-600 to-red-600',
      bgPattern: 'bg-orange-50',
      count: '150+ exercices',
      emoji: '🛠️',
      features: ['Exercices par région', 'Fiches patients', 'Protocoles']
    },
    {
      id: 'seminaires',
      title: 'Séminaires',
      description: 'Formations présentielles pour approfondir vos compétences',
      icon: Calendar,
      href: '/seminaires',
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      bgPattern: 'bg-amber-50',
      count: 'Sessions',
      emoji: '📅',
      features: ['Ateliers', 'Intervenants', 'Réseau']
    }
  ]

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen pb-12">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white mb-6 shadow-xl">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-sky-400 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative px-6 py-6 md:px-8 md:py-8">
            <div className="max-w-6xl mx-auto">
              {/* Welcome Message */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Bienvenue</div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {profile?.full_name || 'Docteur'} 👋
                  </h1>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-6 max-w-2xl">
                Développez vos compétences en ostéopathie avec nos modules interactifs
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative max-w-2xl mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une technique, pathologie, cours, test..."
                  className="w-full pl-11 pr-6 py-3 rounded-xl bg-white/95 backdrop-blur-sm border-2 border-white/50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-white transition-all shadow-lg text-sm"
                />
                {searchQuery && (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg"
                  >
                    Rechercher
                  </button>
                )}
              </form>

              {/* Progression & Badges Section */}
              <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-600 p-6 shadow-2xl border border-white/10">
                <div className="flex items-start justify-between text-white mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-purple-100">
                      <Trophy className="h-4 w-4 text-yellow-300" />
                      Progression globale
                    </div>
                    <div className="text-3xl font-bold mt-1">Niveau {stats.level}</div>
                    <div className="text-sm text-purple-100">
                      {stats.totalXp % 500}/{500} XP jusqu'au niveau {stats.level + 1}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{stats.totalXp}</div>
                    <div className="text-xs text-purple-100">XP total</div>
                  </div>
                </div>

                <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden mb-5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400"
                    style={{ width: `${Math.min((stats.totalXp % 500) / 500 * 100, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="rounded-2xl bg-white/15 p-3 text-white">
                    <div className="flex items-center gap-2 text-xs text-purple-100">
                      <Flame className="h-4 w-4 text-orange-200" />
                      Série
                    </div>
                    <div className="text-2xl font-bold mt-1">{stats.currentStreak}</div>
                    <div className="text-xs text-purple-100">jours</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-3 text-white">
                    <div className="flex items-center gap-2 text-xs text-purple-100">
                      <LogIn className="h-4 w-4 text-emerald-200" />
                      Connexions
                    </div>
                    <div className="text-2xl font-bold mt-1">{stats.totalLogins}</div>
                    <div className="text-xs text-purple-100">total</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-3 text-white">
                    <div className="flex items-center gap-2 text-xs text-purple-100">
                      <GraduationCap className="h-4 w-4 text-sky-200" />
                      E-learning
                    </div>
                    <div className="text-2xl font-bold mt-1">{stats.totalElearningCompleted}</div>
                    <div className="text-xs text-purple-100">leçons</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-3 text-white">
                    <div className="flex items-center gap-2 text-xs text-purple-100">
                      <Zap className="h-4 w-4 text-yellow-200" />
                      Activité
                    </div>
                    <div className="text-2xl font-bold mt-1">{stats.totalPracticeViewed + stats.totalTestingViewed}</div>
                    <div className="text-xs text-purple-100">actions</div>
                  </div>
                </div>

                {/* Badges Section Inside Purple Block */}
                <div className="pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-white font-semibold mb-3">
                    <Award className="h-4 w-4 text-yellow-300" />
                    Badges débloqués
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {badges.length > 0 ? (
                      badges.slice(0, 6).map((badge, index) => {
                        const BadgeIcon = badge.icon ? badgeIconMap[badge.icon] : null
                        const colorClasses = [
                          'bg-emerald-50 text-emerald-600',
                          'bg-sky-50 text-sky-600',
                          'bg-indigo-50 text-indigo-600',
                          'bg-amber-50 text-amber-600',
                          'bg-rose-50 text-rose-600',
                          'bg-purple-50 text-purple-600'
                        ]
                        const colorClass = colorClasses[index % colorClasses.length]
                        return (
                          <div
                            key={badge.id}
                            className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2"
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass} flex-shrink-0`}>
                              {BadgeIcon ? (
                                <BadgeIcon className="h-4 w-4" />
                              ) : (
                                <span className="text-sm">🏅</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-slate-900 truncate">{badge.name}</div>
                              <div className="text-xs text-slate-500 truncate">
                                {badge.description || 'Badge débloqué'}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-full text-sm text-purple-100">Aucun badge débloqué pour le moment.</div>
                    )}
                  </div>

                  {stats.unlockedAchievements > badges.length && (
                    <div className="mt-3 text-xs text-purple-100 text-center">
                      +{stats.unlockedAchievements - badges.length} autres badges débloqués
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium upgrade banner - free users only */}
        {profile?.role === 'free' && (
          <div className="mb-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 p-6 shadow-xl border border-yellow-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-yellow-900/20 flex items-center justify-center shadow-inner">
                  <Crown className="h-8 w-8 text-yellow-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-extrabold text-yellow-900 mb-1 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Débloquez tout OsteoUpgrade
                  </h3>
                  <p className="text-sm text-yellow-900/80 max-w-lg">
                    Accès illimité aux 150+ vidéos Pratique, 500+ contenus E-Learning, exercices patients et bien plus. Rejoignez les membres Premium dès maintenant.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/settings/subscription')}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-900 text-yellow-100 font-bold hover:bg-yellow-800 transition-all shadow-lg whitespace-nowrap"
                >
                  <Crown className="h-5 w-5" />
                  Passer Premium
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ambassador Space - Only for Premium Gold */}
        {profile?.role === 'premium_gold' && referralData && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6 text-yellow-900">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-900/20 rounded-lg">
                    <Crown className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Espace Ambassadeur Gold</h2>
                </div>
                <p className="text-yellow-900/80 text-sm">
                  Parrainez vos collègues et gagnez 10% de commission sur chaque abonnement annuel
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {/* Referral Code Card */}
                  <div className="bg-white border-2 border-yellow-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold text-gray-900">Votre code</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-3 font-mono text-2xl font-bold text-yellow-900 text-center">
                        {referralData.code || '---'}
                      </div>
                      <button
                        onClick={copyReferralCode}
                        className="p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                        title="Copier le code"
                      >
                        {codeCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">
                      {codeCopied ? '✅ Code copié !' : 'Partagez ce code avec vos collègues'}
                    </p>
                  </div>

                  {/* Referrals Count Card */}
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Filleuls</h3>
                    </div>
                    <div className="text-4xl font-bold text-blue-600 mb-1">
                      {referralData.referrals_count}
                    </div>
                    <p className="text-sm text-gray-600">
                      {referralData.referrals_count === 0
                        ? 'Aucun filleul pour le moment'
                        : referralData.referrals_count === 1
                        ? '1 personne parrainée'
                        : `${referralData.referrals_count} personnes parrainées`}
                    </p>
                  </div>

                  {/* Earnings Card */}
                  <div className="bg-white border-2 border-green-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Wallet className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Cagnotte</h3>
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-1">
                      {((referralData.available_earnings || 0) / 100).toFixed(2)}€
                    </div>
                    <p className="text-sm text-gray-600">
                      {referralData.available_earnings >= 1000
                        ? 'Vous pouvez demander un versement'
                        : `Minimum 10€ pour un versement`}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => router.push('/settings/referrals')}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-yellow-900 font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Crown className="h-5 w-5" />
                  Accéder à mon espace ambassadeur complet
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Modules Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Brain className="h-7 w-7 text-sky-600" />
                Vos Modules d'Apprentissage
              </h2>
              <p className="text-slate-600 mt-1">Sélectionnez un module pour commencer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, index) => {
              const Icon = module.icon

              return (
                <button
                  key={module.id}
                  onClick={() => router.push(module.href)}
                  className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-transparent p-6 text-left shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Animated gradient border on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="absolute inset-[2px] bg-white rounded-2xl" />

                  {/* Background pattern */}
                  <div className={`absolute top-0 right-0 w-40 h-40 ${module.bgPattern} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-500`} />

                  <div className="relative z-10">
                    {/* Icon + Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-3xl transform transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                        {module.emoji}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {module.title}
                    </h3>

                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {module.description}
                    </p>

                    {/* Count badge */}
                    <div className="mb-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        {module.count}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-sky-600 transition-colors">
                      <span className="text-xs font-semibold">Explorer</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
