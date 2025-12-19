'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Eye, BarChart3, Loader2 } from 'lucide-react'
import type { Quiz, QuizStatistics } from '@/types/encyclopedia'

export default function AdminQuizListPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setQuizzes(data)
    } catch (error) {
      console.error('Error loading quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) return

    try {
      const { error } = await supabase.from('quiz').delete().eq('id', id)
      if (error) throw error
      loadQuizzes()
    } catch (error) {
      console.error('Error deleting quiz:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestion des Quiz</h1>
            <p className="text-slate-600 mt-1">Créez et gérez les quiz de l'encyclopédie</p>
          </div>
          <button
            onClick={() => router.push('/admin/encyclopedia/quiz/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Nouveau Quiz
          </button>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun quiz</h3>
            <p className="text-slate-600 mb-6">Commencez par créer votre premier quiz</p>
            <button
              onClick={() => router.push('/admin/encyclopedia/quiz/new')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Créer un quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{quiz.title}</h3>
                      {!quiz.is_active && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Inactif
                        </span>
                      )}
                      {quiz.difficulty && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
                    {quiz.description && (
                      <p className="text-slate-600 mb-3">{quiz.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-slate-500">
                      {quiz.category && <span>📚 {quiz.category}</span>}
                      {quiz.duration_minutes && <span>⏱️ {quiz.duration_minutes} min</span>}
                      <span>🎯 Note de passage : {quiz.passing_score}%</span>
                      <span>⭐ XP : {quiz.xp_reward}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/encyclopedia/learning/quizzes/${quiz.id}`)}
                      className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Voir"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => router.push(`/admin/encyclopedia/quiz/${quiz.id}/edit`)}
                      className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
