'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Target, Play, Clock, Award, CheckCircle2, Loader2, Filter } from 'lucide-react'
import type { ClinicalCase, ClinicalCaseProgress } from '@/types/encyclopedia'

export default function ClinicalCasesListPage() {
  const router = useRouter()
  const [cases, setCases] = useState<ClinicalCase[]>([])
  const [userProgress, setUserProgress] = useState<Record<string, ClinicalCaseProgress>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      // Load clinical cases
      const { data: casesData } = await supabase
        .from('clinical_cases')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (casesData) {
        setCases(casesData)
      }

      // Load user progress
      if (user) {
        const { data: progressData } = await supabase
          .from('clinical_case_progress')
          .select('*')
          .eq('user_id', user.id)

        if (progressData) {
          const progressMap: Record<string, ClinicalCaseProgress> = {}
          progressData.forEach(progress => {
            progressMap[progress.case_id] = progress
          })
          setUserProgress(progressMap)
        }
      }
    } catch (error) {
      console.error('Error loading cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = cases.filter(clinicalCase => {
    if (selectedCategory !== 'all' && clinicalCase.category !== selectedCategory) return false
    if (selectedDifficulty !== 'all' && clinicalCase.difficulty !== selectedDifficulty) return false
    return true
  })

  const categories = Array.from(new Set(cases.map(c => c.category).filter(Boolean)))
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Cas Pratiques</h1>
            <p className="text-slate-600 mt-1">Mettez en pratique vos compétences cliniques</p>
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
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              <option value="all">Toutes</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      {filteredCases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun cas pratique disponible</h3>
          <p className="text-slate-600">Revenez plus tard pour de nouveaux cas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCases.map(clinicalCase => {
            const progress = userProgress[clinicalCase.id]
            const isCompleted = progress?.completed
            const isInProgress = progress && !progress.completed

            return (
              <div
                key={clinicalCase.id}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-300 p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-5 transition-opacity" />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  {isCompleted && (
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Complété
                    </div>
                  )}
                  {isInProgress && (
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      En cours
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {clinicalCase.title}
                </h3>

                {clinicalCase.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {clinicalCase.description}
                  </p>
                )}

                {/* Patient Context */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-1">👤 Contexte patient</p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {clinicalCase.patient_context}
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {clinicalCase.category && (
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                      {clinicalCase.category}
                    </span>
                  )}
                  {clinicalCase.difficulty && (
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      clinicalCase.difficulty === 'débutant'
                        ? 'bg-green-100 text-green-700'
                        : clinicalCase.difficulty === 'intermédiaire'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {clinicalCase.difficulty}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {clinicalCase.estimated_duration_minutes && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span>{clinicalCase.estimated_duration_minutes} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Award className="h-4 w-4" />
                    <span>{clinicalCase.xp_reward} XP</span>
                  </div>
                </div>

                {/* Progress bar if in progress */}
                {progress && !isCompleted && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">Progression</span>
                      <span className="font-semibold text-slate-900">
                        Étape {progress.current_step_number}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                        style={{ width: `${(progress.current_step_number / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Button */}
                <button
                  onClick={() => router.push(`/encyclopedia/learning/cases/${clinicalCase.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold transition-all shadow-lg"
                >
                  <Play className="h-4 w-4" />
                  <span>
                    {isCompleted ? 'Revoir' : isInProgress ? 'Continuer' : 'Commencer'}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
