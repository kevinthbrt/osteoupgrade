'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  FileQuestion,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

type QuizQuestion = {
  question: string
  options: string[]
  correctOptionIndex: number
  explanation: string
}

const THEMES = ['Anatomie', 'Biomécanique', 'HVLA', 'Mobilisation', 'Diagnostics', 'Tests Orthopédiques']
const DIFFICULTIES = [
  { value: 'facile', label: '⭐ Facile' },
  { value: 'moyen', label: '⭐⭐ Moyen' },
  { value: 'difficile', label: '⭐⭐⭐ Difficile' }
]

export default function NewQuizPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    theme: 'Anatomie',
    difficulty: 'facile',
    duration_minutes: 10
  })

  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: ''
    }
  ])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: ''
      }
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    setQuestions(updated)
  }

  const validateForm = (): boolean => {
    if (!quizData.title || !quizData.description) {
      setError('Le titre et la description sont obligatoires')
      return false
    }

    if (questions.length === 0) {
      setError('Le quiz doit contenir au moins une question')
      return false
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question) {
        setError(`Question ${i + 1}: Le texte de la question est obligatoire`)
        return false
      }
      if (q.options.some(opt => !opt)) {
        setError(`Question ${i + 1}: Toutes les options doivent être remplies`)
        return false
      }
      if (!q.explanation) {
        setError(`Question ${i + 1}: L'explication est obligatoire`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Vous devez être connecté')
        return
      }

      // Insert quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title,
          description: quizData.description,
          theme: quizData.theme,
          difficulty: quizData.difficulty,
          duration_minutes: quizData.duration_minutes,
          question_count: questions.length,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single()

      if (quizError) throw quizError

      // Insert questions
      const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question,
        options: q.options,
        correct_option_index: q.correctOptionIndex,
        explanation: q.explanation,
        order_index: index
      }))

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      setSuccess(true)
      setTimeout(() => {
        router.push('/encyclopedia/learning/quizzes')
      }, 2000)
    } catch (err: any) {
      console.error('Error creating quiz:', err)
      setError(err.message || 'Erreur lors de la création du quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="min-h-screen pb-12">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-3xl p-8 mb-8 shadow-2xl">
          <button
            onClick={() => router.push('/encyclopedia/learning/quizzes')}
            className="text-sm text-purple-100 hover:text-white mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux quiz
          </button>

          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <FileQuestion className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Créer un nouveau quiz</h1>
              <p className="text-purple-100">Créez un quiz interactif pour évaluer les connaissances</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Quiz créé avec succès ! Redirection...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Quiz Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Informations du quiz</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={quizData.title}
                  onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Ex: Anatomie Cervicale - Niveau 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={quizData.description}
                  onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  rows={3}
                  placeholder="Décrivez le contenu et les objectifs du quiz..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Thème *
                  </label>
                  <select
                    value={quizData.theme}
                    onChange={(e) => setQuizData({ ...quizData, theme: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    required
                  >
                    {THEMES.map(theme => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Difficulté *
                  </label>
                  <select
                    value={quizData.difficulty}
                    onChange={(e) => setQuizData({ ...quizData, difficulty: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    required
                  >
                    {DIFFICULTIES.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Durée (minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={quizData.duration_minutes}
                    onChange={(e) => setQuizData({ ...quizData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Questions ({questions.length})</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Ajouter une question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="border-2 border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Question {qIndex + 1}</h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Texte de la question *
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        rows={2}
                        placeholder="Posez votre question..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Options de réponse *
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correctOptionIndex === optIndex}
                              onChange={() => updateQuestion(qIndex, 'correctOptionIndex', optIndex)}
                              className="w-5 h-5 text-purple-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                              className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                              placeholder={`Option ${optIndex + 1}`}
                              required
                            />
                            {question.correctOptionIndex === optIndex && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                Correcte
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Sélectionnez la bonne réponse en cliquant sur le bouton radio
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Explication *
                      </label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        rows={2}
                        placeholder="Expliquez pourquoi cette réponse est correcte..."
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/encyclopedia/learning/quizzes')}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Créer le quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
