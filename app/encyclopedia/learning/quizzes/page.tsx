'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  FileQuestion,
  Plus,
  Play,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  BookOpen,
  Target,
  GraduationCap
} from 'lucide-react'
import RelatedContent from '@/components/RelatedContent'

type Quiz = {
  id: string
  title: string
  description: string
  theme: string
  difficulty: 'facile' | 'moyen' | 'difficile'
  question_count: number
  duration_minutes: number
  created_at: string
  is_active: boolean
}

type QuizAttempt = {
  quiz_id: string
  score: number
  completed_at: string
}

export default function QuizzesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [userAttempts, setUserAttempts] = useState<Record<string, QuizAttempt>>({})
  const [profile, setProfile] = useState<any>(null)
  const [selectedTheme, setSelectedTheme] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const themes = ['Anatomie', 'Biomécanique', 'HVLA', 'Mobilisation', 'Diagnostics', 'Tests Orthopédiques']

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

      // Load quizzes (mock data for now - you'll need to create the table)
      // TODO: Create quiz tables in database
      const mockQuizzes: Quiz[] = [
        {
          id: '1',
          title: 'Anatomie Cervicale - Niveau 1',
          description: 'Testez vos connaissances sur l\'anatomie de la région cervicale : vertèbres, muscles, ligaments et vascularisation.',
          theme: 'Anatomie',
          difficulty: 'facile',
          question_count: 15,
          duration_minutes: 10,
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '2',
          title: 'Biomécanique de l\'Épaule',
          description: 'Quiz avancé sur la biomécanique de l\'épaule : mouvements, stabilité, forces musculaires et pathomécanique.',
          theme: 'Biomécanique',
          difficulty: 'moyen',
          question_count: 20,
          duration_minutes: 15,
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '3',
          title: 'HVLA Thoracique - Maîtrise',
          description: 'Quiz expert sur les techniques HVLA thoraciques : indications, contre-indications, biomécanique et sécurité.',
          theme: 'HVLA',
          difficulty: 'difficile',
          question_count: 25,
          duration_minutes: 20,
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '4',
          title: 'Tests Orthopédiques du Genou',
          description: 'Évaluez votre maîtrise des tests orthopédiques du genou : sensibilité, spécificité et interprétation clinique.',
          theme: 'Tests Orthopédiques',
          difficulty: 'moyen',
          question_count: 18,
          duration_minutes: 12,
          created_at: new Date().toISOString(),
          is_active: true
        }
      ]

      setQuizzes(mockQuizzes)

      // Load user attempts (mock for now)
      const mockAttempts: Record<string, QuizAttempt> = {
        '1': {
          quiz_id: '1',
          score: 87,
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      }

      setUserAttempts(mockAttempts)
    } catch (error) {
      console.error('Error loading quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return 'bg-green-100 text-green-700'
      case 'moyen':
        return 'bg-amber-100 text-amber-700'
      case 'difficile':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return '⭐ Facile'
      case 'moyen':
        return '⭐⭐ Moyen'
      case 'difficile':
        return '⭐⭐⭐ Difficile'
      default:
        return difficulty
    }
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    if (selectedTheme !== 'all' && quiz.theme !== selectedTheme) return false
    if (selectedDifficulty !== 'all' && quiz.difficulty !== selectedDifficulty) return false
    return quiz.is_active
  })

  const handleStartQuiz = (quizId: string) => {
    router.push(`/encyclopedia/learning/quizzes/${quizId}/take`)
  }

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
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <button
              onClick={() => router.push('/elearning')}
              className="text-sm text-purple-100 hover:text-white mb-4 flex items-center gap-2"
            >
              ← Retour à E-Learning
            </button>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <FileQuestion className="h-3.5 w-3.5 text-purple-300" />
                <span className="text-xs font-semibold text-purple-100">Quiz Interactifs</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                Testez vos connaissances
              </h1>

              <p className="text-base md:text-lg text-purple-100 mb-6 max-w-2xl">
                Quiz interactifs avec feedback instantané pour évaluer et renforcer vos compétences en ostéopathie.
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-lg">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">{filteredQuizzes.length}</div>
                  <div className="text-xs text-purple-200">Quiz disponibles</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">{Object.keys(userAttempts).length}</div>
                  <div className="text-xs text-purple-200">Complétés</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">
                    {Object.values(userAttempts).length > 0
                      ? Math.round(Object.values(userAttempts).reduce((acc, a) => acc + a.score, 0) / Object.values(userAttempts).length)
                      : '-'}
                  </div>
                  <div className="text-xs text-purple-200">Score moyen</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Thème</label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="all">Tous les thèmes</option>
                {themes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Difficulté</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="all">Toutes les difficultés</option>
                <option value="facile">⭐ Facile</option>
                <option value="moyen">⭐⭐ Moyen</option>
                <option value="difficile">⭐⭐⭐ Difficile</option>
              </select>
            </div>

            {isAdmin && (
              <div className="flex items-end">
                <button
                  onClick={() => alert('🚧 Création de quiz disponible prochainement')}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Créer un quiz
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {filteredQuizzes.map((quiz) => {
            const attempt = userAttempts[quiz.id]
            const isCompleted = !!attempt

            return (
              <div
                key={quiz.id}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-300 p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">
                          {quiz.theme}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(quiz.difficulty)}`}>
                          {getDifficultyLabel(quiz.difficulty)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{quiz.title}</h3>
                    </div>

                    {isCompleted && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{quiz.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <FileQuestion className="h-4 w-4" />
                      <span>{quiz.question_count} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.duration_minutes} min</span>
                    </div>
                  </div>

                  {/* Score if completed */}
                  {isCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Dernier score</span>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-700">{attempt.score}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                  >
                    <Play className="h-5 w-5" />
                    {isCompleted ? 'Refaire le quiz' : 'Commencer'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredQuizzes.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileQuestion className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun quiz trouvé</h3>
            <p className="text-slate-600">Modifiez vos filtres pour voir plus de quiz</p>
          </div>
        )}

        {/* Related Modules */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <RelatedContent
            title="📚 Explorer aussi"
            items={[
              {
                id: 'cases',
                title: 'Cas Pratiques',
                description: 'Scénarios cliniques interactifs pour mettre en pratique vos compétences',
                module: 'Apprentissage',
                href: '/encyclopedia/learning/cases',
                gradient: 'from-amber-500 to-orange-600',
                icon: Target
              },
              {
                id: 'cours',
                title: 'Cours',
                description: 'Formations structurées par thématiques avec vidéos et progression',
                module: 'Apprentissage',
                href: '/elearning/cours',
                gradient: 'from-blue-500 to-cyan-600',
                icon: BookOpen
              },
              {
                id: 'elearning',
                title: 'Retour à E-Learning',
                description: 'Voir tous les modules de contenu théorique',
                module: 'Hub',
                href: '/elearning',
                gradient: 'from-blue-500 to-cyan-600',
                icon: GraduationCap
              }
            ]}
          />
        </div>
      </div>
    </AuthLayout>
  )
}
