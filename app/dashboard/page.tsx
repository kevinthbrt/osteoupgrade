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
  Loader2
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
    unlockedAchievements: 0
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
          unlockedAchievements: achievementsCount || 0
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
      count: '150+ vidéos',
      features: ['HVLA', 'Mobilisation', 'Techniques tissulaires']
    },
    {
      id: 'elearning',
      title: 'E-Learning',
      description: 'Tout le contenu théorique : cours, tests ortho, diagnostics, topographie, quiz et cas pratiques',
      icon: GraduationCap,
      href: '/elearning',
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      count: '500+ contenus',
      features: ['Cours', 'Tests ortho', 'Diagnostics', 'Quiz', 'Cas pratiques']
    },
    {
      id: 'outils',
      title: 'Outils',
      description: 'Exercices thérapeutiques et outils pratiques pour vos patients',
      icon: Wrench,
      href: '/outils',
      gradient: 'from-orange-500 via-orange-600 to-red-600',
      count: '150+ exercices',
      features: ['Exercices par région', 'Fiches patients', 'Protocoles']
    },
    {
      id: 'testing',
      title: 'Testing 3D',
      description: 'Explorez l\'anatomie en 3D et réalisez des tests orthopédiques interactifs',
      icon: TestTube,
      href: '/testing',
      gradient: 'from-purple-500 via-purple-600 to-indigo-600',
      count: 'Modèle 3D',
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
      <div className="min-h-screen">
        {/* Header with Search */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Bienvenue, {profile?.full_name || 'Docteur'} 👋
          </h1>

          {/* Global Search */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une technique, pathologie, cours, test..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-sm"
            />
          </form>
        </div>

        {/* Gamification - Compact */}
        {stats.totalXp > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 mb-8 shadow-lg">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="font-semibold">Niveau {stats.level}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-300">{stats.totalXp.toLocaleString()} XP</span>
                </div>

                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <span className="font-semibold">{stats.currentStreak} jours</span>
                </div>

                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-400" />
                  <span className="font-semibold">{stats.unlockedAchievements} badges</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/stats')}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm font-semibold"
              >
                Voir progression détaillée →
              </button>
            </div>
          </div>
        )}

        {/* Main Modules Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => {
              const Icon = module.icon

              return (
                <button
                  key={module.id}
                  onClick={() => router.push(module.href)}
                  className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-sky-300 p-8 text-left shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                  <div className="relative">
                    {/* Icon + Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${module.gradient} shadow-lg transform transition-transform group-hover:scale-110`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {module.count}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {module.title}
                    </h3>

                    <p className="text-slate-600 mb-4 leading-relaxed">
                      {module.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {module.features.map((feature, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-sky-600 transition-colors">
                      <span className="text-sm font-semibold">Explorer le module</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Secondary Links */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push('/seminaires')}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white border-2 border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all group"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-900">Séminaires</div>
              <div className="text-xs text-slate-600">Formations présentielles</div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors ml-auto" />
          </button>

          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all group"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-900">Paramètres</div>
              <div className="text-xs text-slate-600">Profil et abonnement</div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors ml-auto" />
          </button>

          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-2 border-transparent shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="text-left text-white">
                <div className="font-semibold">Administration</div>
                <div className="text-xs text-purple-100">Gestion de la plateforme</div>
              </div>
              <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1 ml-auto" />
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
