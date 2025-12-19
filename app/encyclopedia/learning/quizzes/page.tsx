'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileQuestion, Play, Clock, Award, Target, Loader2, Filter } from 'lucide-react'
import type { Quiz, QuizAttempt } from '@/types/encyclopedia'

export default function QuizzesListPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [userAttempts, setUserAttempts] = useState<Record<string, QuizAttempt>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      // Load quizzes
      const { data: quizzesData } = await supabase
        .from('quiz')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (quizzesData) {
        setQuizzes(quizzesData)
      }

      // Load user's best attempts
      if (user) {
        const { data: attemptsData } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('score', { ascending: false })

        if (attemptsData) {
          // Keep only best attempt per quiz
          const bestAttempts: Record<string, QuizAttempt> = {}
          attemptsData.forEach(attempt => {
            if (!bestAttempts[attempt.quiz_id] || (attempt.score || 0) > (bestAttempts[attempt.quiz_id].score || 0)) {
              bestAttempts[attempt.quiz_id] = attempt
            }
          })
          setUserAttempts(bestAttempts)
        }
      }
    } catch (error) {
      console.error('Error loading quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    if (selectedCategory !== 'all' && quiz.category !== selectedCategory) return false
    if (selectedDifficulty !== 'all' && quiz.difficulty !== selectedDifficulty) return false
    return true
  })

  const categories = Array.from(new Set(quizzes.map(q => q.category).filter(Boolean)))
  const difficulties = ['débutant', 'intermédiaire', 'avancé']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <FileQuestion className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Quiz</h1>
            <p className="text-slate-600 mt-1">Testez vos connaissances et validez vos acquis</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Filter className="h-5 w-5 text-slate-600" />
          <span className="font-semibold text-slate-900">Filtres</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            >
              <option value="all">Toutes</option>
              {categories.map(cat => (
                <option key={cat} value={cat || ''}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Difficulté</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            >
              <option value="all">Toutes</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileQuestion className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun quiz disponible</h3>
          <p className="text-slate-600">Revenez plus tard pour de nouveaux quiz</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map(quiz => {
            const userAttempt = userAttempts[quiz.id]
            const hasPassed = userAttempt?.passed

            return (
              <div
                key={quiz.id}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-300 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                    <FileQuestion className="h-6 w-6 text-white" />
                  </div>
                  {userAttempt && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      hasPassed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {hasPassed ? '✓ Réussi' : `${userAttempt.score}%`}
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                  {quiz.title}
                </h3>

                {quiz.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {quiz.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {quiz.category && (
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                      {quiz.category}
                    </span>
                  )}
                  {quiz.difficulty && (
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      quiz.difficulty === 'débutant'
                        ? 'bg-green-100 text-green-700'
                        : quiz.difficulty === 'intermédiaire'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {quiz.difficulty}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {quiz.duration_minutes && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.duration_minutes} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Target className="h-4 w-4" />
                    <span>{quiz.passing_score}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Award className="h-4 w-4" />
                    <span>{quiz.xp_reward} XP</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={() => router.push(`/encyclopedia/learning/quizzes/${quiz.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold transition-all shadow-lg"
                >
                  <Play className="h-4 w-4" />
                  <span>{userAttempt ? 'Recommencer' : 'Commencer'}</span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
