'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp,
  Award,
  Target,
  Flame,
  Trophy,
  Calendar,
  CheckCircle,
  Star,
  Zap,
  BookOpen,
  FileQuestion,
  TestTube,
  Loader2,
  ArrowUp,
  ArrowDown,
  Medal,
  Crown
} from 'lucide-react'

type UserStats = {
  level: number
  current_xp: number
  total_xp: number
  xp_for_next_level: number
  streak_days: number
  best_streak: number
  achievements_unlocked: number
  total_achievements: number
  courses_completed: number
  quizzes_completed: number
  cases_completed: number
  avg_quiz_score: number
  avg_case_score: number
  study_hours: number
  last_activity: string
}

type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at?: string
  category: 'progress' | 'mastery' | 'streak' | 'special'
  points: number
}

export default function StatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Mock stats for now - will be connected to real data
      const mockStats: UserStats = {
        level: 12,
        current_xp: 2450,
        total_xp: 8950,
        xp_for_next_level: 3000,
        streak_days: 7,
        best_streak: 21,
        achievements_unlocked: 15,
        total_achievements: 48,
        courses_completed: 8,
        quizzes_completed: 24,
        cases_completed: 12,
        avg_quiz_score: 87,
        avg_case_score: 92,
        study_hours: 42.5,
        last_activity: new Date().toISOString()
      }

      setStats(mockStats)

      // Mock achievements
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: 'Premier Pas',
          description: 'Complétez votre premier cours',
          icon: '🎓',
          unlocked: true,
          unlocked_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'progress',
          points: 50
        },
        {
          id: '2',
          title: 'Série de 7',
          description: 'Maintenez une série de 7 jours consécutifs',
          icon: '🔥',
          unlocked: true,
          unlocked_at: new Date().toISOString(),
          category: 'streak',
          points: 100
        },
        {
          id: '3',
          title: 'Quiz Master',
          description: 'Obtenez 100% à un quiz',
          icon: '🎯',
          unlocked: true,
          unlocked_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'mastery',
          points: 150
        },
        {
          id: '4',
          title: 'Clinicien Aguerri',
          description: 'Complétez 10 cas pratiques',
          icon: '⚕️',
          unlocked: true,
          unlocked_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'progress',
          points: 200
        },
        {
          id: '5',
          title: 'Série de 21',
          description: 'Maintenez une série de 21 jours consécutifs',
          icon: '⚡',
          unlocked: false,
          category: 'streak',
          points: 300
        },
        {
          id: '6',
          title: 'Expert Cervical',
          description: 'Maîtrisez tous les cours de la région cervicale',
          icon: '🦴',
          unlocked: false,
          category: 'mastery',
          points: 250
        },
        {
          id: '7',
          title: 'Chercheur Assidu',
          description: 'Accumulez 100 heures d\'étude',
          icon: '📚',
          unlocked: false,
          category: 'special',
          points: 500
        },
        {
          id: '8',
          title: 'Niveau 25',
          description: 'Atteignez le niveau 25',
          icon: '👑',
          unlocked: false,
          category: 'progress',
          points: 1000
        }
      ]

      setAchievements(mockAchievements)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  const xpProgress = (stats.current_xp / stats.xp_for_next_level) * 100
  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const recentAchievements = unlockedAchievements
    .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
    .slice(0, 3)

  return (
    <AuthLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-12">
            <div className="max-w-6xl">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-8 w-8 text-purple-200" />
                <h1 className="text-3xl md:text-4xl font-bold">
                  Vos Statistiques
                </h1>
              </div>

              <p className="text-purple-100 mb-8 max-w-2xl">
                Suivez votre progression, célébrez vos réussites et dépassez vos objectifs d'apprentissage.
              </p>

              {/* Top Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="h-5 w-5 text-yellow-300" />
                    <span className="text-xs text-purple-200">Niveau</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.level}</div>
                  <div className="text-xs text-purple-200 mt-1">+2 ce mois</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <Flame className="h-5 w-5 text-orange-300" />
                    <span className="text-xs text-purple-200">Série</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.streak_days}</div>
                  <div className="text-xs text-purple-200 mt-1">jours consécutifs</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="h-5 w-5 text-blue-300" />
                    <span className="text-xs text-purple-200">Badges</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.achievements_unlocked}</div>
                  <div className="text-xs text-purple-200 mt-1">sur {stats.total_achievements}</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="h-5 w-5 text-green-300" />
                    <span className="text-xs text-purple-200">Heures</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.study_hours}</div>
                  <div className="text-xs text-purple-200 mt-1">d'apprentissage</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Progression */}
          <div className="lg:col-span-2 space-y-6">
            {/* XP Progress */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Progression XP</h3>
                  <p className="text-sm text-slate-600">Niveau {stats.level}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">{stats.current_xp} XP</div>
                  <div className="text-xs text-slate-500">{stats.xp_for_next_level - stats.current_xp} XP pour le niveau {stats.level + 1}</div>
                </div>
              </div>

              <div className="relative">
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${xpProgress}%` }}
                  >
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1">
                  <Crown className="h-8 w-8 text-yellow-400 drop-shadow-lg" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-700">{Math.round(xpProgress)}%</div>
                  <div className="text-xs text-blue-600 mt-1">Complété</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-2xl font-bold text-purple-700">{stats.total_xp}</div>
                  <div className="text-xs text-purple-600 mt-1">XP Total</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                  <div className="text-2xl font-bold text-pink-700">#{Math.floor(Math.random() * 1000) + 1}</div>
                  <div className="text-xs text-pink-600 mt-1">Classement</div>
                </div>
              </div>
            </div>

            {/* Modules Stats */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Performance par Module</h3>

              <div className="space-y-4">
                {/* Cours */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Cours</div>
                        <div className="text-xs text-slate-600">{stats.courses_completed} complétés</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUp className="h-4 w-4" />
                        <span className="font-semibold">+12%</span>
                      </div>
                      <div className="text-xs text-slate-500">vs semaine dernière</div>
                    </div>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                {/* Quiz */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <FileQuestion className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Quiz</div>
                        <div className="text-xs text-slate-600">{stats.quizzes_completed} complétés • {stats.avg_quiz_score}% moy.</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUp className="h-4 w-4" />
                        <span className="font-semibold">+8%</span>
                      </div>
                      <div className="text-xs text-slate-500">vs semaine dernière</div>
                    </div>
                  </div>
                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.avg_quiz_score}%` }} />
                  </div>
                </div>

                {/* Cas Pratiques */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-white rounded-xl border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500 rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Cas Pratiques</div>
                        <div className="text-xs text-slate-600">{stats.cases_completed} complétés • {stats.avg_case_score}% moy.</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUp className="h-4 w-4" />
                        <span className="font-semibold">+15%</span>
                      </div>
                      <div className="text-xs text-slate-500">vs semaine dernière</div>
                    </div>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.avg_case_score}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Achievements & Goals */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Badges Récents</h3>
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>

              <div className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-3 bg-gradient-to-r from-yellow-50 to-white rounded-xl border border-yellow-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-sm">{achievement.title}</div>
                        <div className="text-xs text-slate-600">{achievement.description}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-yellow-600 font-medium">{achievement.points} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {/* Navigate to all achievements */}}
                className="w-full mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Voir tous les badges ({stats.total_achievements})
              </button>
            </div>

            {/* Streak Info */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Série Actuelle</h3>
                <Flame className="h-6 w-6 text-yellow-300" />
              </div>

              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-2">{stats.streak_days}</div>
                <div className="text-orange-100">jours consécutifs</div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-100">Meilleure série</span>
                  <span className="font-bold">{stats.best_streak} jours</span>
                </div>
              </div>

              <div className="text-xs text-orange-100 text-center">
                Continuez comme ça ! 14 jours pour débloquer "Série de 21" 🎯
              </div>
            </div>

            {/* Next Goals */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Prochains Objectifs</h3>
                <Target className="h-5 w-5 text-blue-500" />
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">Niveau 13</span>
                    <span className="text-xs text-slate-600">{Math.round(xpProgress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${xpProgress}%` }} />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">10 cours complétés</span>
                    <span className="text-xs text-slate-600">80%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">Série de 14 jours</span>
                    <span className="text-xs text-slate-600">50%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Achievements Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Tous les Badges</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-60 grayscale'
                }`}
              >
                <div className="text-4xl mb-2 text-center">{achievement.icon}</div>
                <div className="text-center">
                  <div className="font-semibold text-slate-900 text-sm mb-1">{achievement.title}</div>
                  <div className="text-xs text-slate-600 mb-2">{achievement.description}</div>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium text-yellow-600">{achievement.points} XP</span>
                  </div>
                  {achievement.unlocked && achievement.unlocked_at && (
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(achievement.unlocked_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
