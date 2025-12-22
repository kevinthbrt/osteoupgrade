'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Stethoscope,
  GraduationCap,
  Wrench,
  TestTube,
  Calendar,
  Settings,
  Search,
  Trophy,
  Flame,
  Award,
  ArrowRight,
  Loader2,
  Sparkles,
  Target,
  BookOpen,
  Brain
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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
    testingProgress: 0
  })

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
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setProfile({ role: 'free', full_name: 'Invité' })
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
          testingProgress: gamificationStats.testing_progress || 0
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
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
      description: 'Tout le contenu théorique : cours, tests ortho, diagnostics, topographie, quiz et cas pratiques',
      icon: GraduationCap,
      href: '/elearning',
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      bgPattern: 'bg-blue-50',
      count: '500+ contenus',
      emoji: '📚',
      features: ['Cours', 'Tests ortho', 'Diagnostics', 'Quiz', 'Cas pratiques']
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
      id: 'testing',
      title: 'Testing 3D',
      description: 'Explorez l\'anatomie en 3D et réalisez des tests orthopédiques interactifs',
      icon: TestTube,
      href: '/testing',
      gradient: 'from-purple-500 via-purple-600 to-indigo-600',
      bgPattern: 'bg-purple-50',
      count: 'Modèle 3D',
      emoji: '🧬',
      features: ['Anatomie 3D', 'Tests interactifs', 'Zones cliquables']
    }
  ]

  const isAdmin = profile?.role === 'admin'

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

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all cursor-pointer" onClick={() => router.push('/stats')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-slate-300 font-medium">Niveau</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.level}</div>
                  <div className="text-xs text-slate-400">{stats.totalXp.toLocaleString()} XP</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all cursor-pointer" onClick={() => router.push('/stats')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-slate-300 font-medium">Série</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.currentStreak}</div>
                  <div className="text-xs text-slate-400">jours</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all cursor-pointer" onClick={() => router.push('/stats')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-slate-300 font-medium">Badges</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.unlockedAchievements}</div>
                  <div className="text-xs text-slate-400">débloqués</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all cursor-pointer" onClick={() => router.push('/stats')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-slate-300 font-medium">Progression</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round((stats.elearningProgress + stats.practiceProgress + stats.testingProgress) / 3)}%
                  </div>
                  <div className="text-xs text-slate-400">globale</div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-amber-300" />
                  <span className="text-xs text-slate-300 font-medium">Badges acquis</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.unlockedAchievements}</div>
                    <div className="text-xs text-slate-400">badges débloqués</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/stats')}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                  >
                    Voir mes badges
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative max-w-2xl">
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
            </div>
          </div>
        </div>

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

        {/* Quick Access Section */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 border-2 border-slate-200 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Accès Rapide
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/seminaires')}
              className="group flex items-center gap-4 px-6 py-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-slate-900 text-lg">Séminaires</div>
                <div className="text-sm text-slate-600">Formations présentielles</div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => router.push('/settings')}
              className="group flex items-center gap-4 px-6 py-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-slate-900 text-lg">Paramètres</div>
                <div className="text-sm text-slate-600">Profil et abonnement</div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
            </button>

            {isAdmin ? (
              <button
                onClick={() => router.push('/admin')}
                className="group flex items-center gap-4 px-6 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-2 border-transparent shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div className="text-left flex-1 text-white">
                  <div className="font-bold text-lg">Administration</div>
                  <div className="text-sm text-purple-100">Gestion plateforme</div>
                </div>
                <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/stats')}
                className="group flex items-center gap-4 px-6 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 border-2 border-transparent shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="text-left flex-1 text-white">
                  <div className="font-bold text-lg">Statistiques</div>
                  <div className="text-sm text-indigo-100">Progression détaillée</div>
                </div>
                <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
