'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  Target,
  Plus,
  Play,
  CheckCircle,
  Clock,
  Loader2,
  BookOpen,
  Trophy,
  TrendingUp,
  Edit3,
  Trash2,
  Lock
} from 'lucide-react'
import { getAllCases, getUserCasesProgress, deleteCase, type ClinicalCase, type ClinicalCaseProgress } from '@/lib/clinical-cases-api'

export default function ClinicalCasesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<ClinicalCase[]>([])
  const [userProgress, setUserProgress] = useState<Record<string, ClinicalCaseProgress>>({})
  const [profile, setProfile] = useState<any>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const regions = [
    'cervical', 'atm', 'crane', 'thoracique', 'lombaire', 'sacro-iliaque',
    'cotes', 'epaule', 'coude', 'poignet', 'main', 'hanche', 'genou',
    'cheville', 'pied', 'neurologique', 'vasculaire', 'systemique'
  ]

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

      // Load clinical cases
      const casesData = await getAllCases({ is_active: true })
      setCases(casesData)

      // Load user progress
      const progressData = await getUserCasesProgress(user.id)
      setUserProgress(progressData)
    } catch (error) {
      console.error('Error loading cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'débutant':
        return 'bg-green-100 text-green-700'
      case 'intermédiaire':
        return 'bg-amber-100 text-amber-700'
      case 'avancé':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'débutant':
        return '🌱'
      case 'intermédiaire':
        return '🔥'
      case 'avancé':
        return '⚡'
      default:
        return '●'
    }
  }

  const filteredCases = cases.filter(caseItem => {
    if (selectedRegion !== 'all' && caseItem.region !== selectedRegion) return false
    if (selectedDifficulty !== 'all' && caseItem.difficulty !== selectedDifficulty) return false
    return caseItem.is_active
  })

  const handleStartCase = (caseId: string) => {
    router.push(`/encyclopedia/learning/cases/${caseId}`)
  }

  const handleEditCase = (caseId: string) => {
    router.push(`/admin/cases/${caseId}/edit`)
  }

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cas ? Cette action est irréversible.')) {
      return
    }

    try {
      const success = await deleteCase(caseId)
      if (success) {
        alert('✅ Cas supprimé avec succès')
        loadData()
      } else {
        alert('❌ Erreur lors de la suppression du cas')
      }
    } catch (error) {
      console.error('Error deleting case:', error)
      alert('❌ Erreur lors de la suppression du cas')
    }
  }

  const canAccessCase = (caseItem: ClinicalCase) => {
    if (!profile) return false
    if (caseItem.is_free_access) return true
    return ['premium_silver', 'premium_gold', 'admin'].includes(profile.role)
  }

  const isAdmin = profile?.role === 'admin'

  const completedCount = Object.values(userProgress).filter(p => p.completed).length
  const avgScore = Object.values(userProgress).length > 0
    ? Math.round(Object.values(userProgress).reduce((acc, p) => acc + p.total_score, 0) / Object.values(userProgress).length)
    : 0

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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/30 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <button
              onClick={() => router.push('/elearning')}
              className="text-sm text-amber-100 hover:text-white mb-4 flex items-center gap-2"
            >
              ← Retour à E-Learning
            </button>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <Target className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-xs font-semibold text-amber-100">Cas Cliniques</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-100">
                Cas Cliniques Interactifs
              </h1>

              <p className="text-base md:text-lg text-amber-100 mb-6 max-w-2xl">
                Développez votre raisonnement clinique avec des cas pratiques structurés en chapitres et modules interactifs.
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-lg">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">{filteredCases.length}</div>
                  <div className="text-xs text-amber-200">Cas disponibles</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">{completedCount}</div>
                  <div className="text-xs text-amber-200">Complétés</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">{avgScore > 0 ? `${avgScore}%` : '-'}</div>
                  <div className="text-xs text-amber-200">Score moyen</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Région anatomique</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="all">Toutes les régions</option>
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Niveau</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="all">Tous les niveaux</option>
                <option value="débutant">🌱 Débutant</option>
                <option value="intermédiaire">🔥 Intermédiaire</option>
                <option value="avancé">⚡ Avancé</option>
              </select>
            </div>

            {isAdmin && (
              <div className="flex items-end">
                <button
                  onClick={() => router.push('/admin/cases/new')}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Créer un cas
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredCases.map((caseItem) => {
            const progress = userProgress[caseItem.id]
            const isCompleted = progress?.completed
            const hasAccess = canAccessCase(caseItem)

            return (
              <div
                key={caseItem.id}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-300 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {caseItem.photo_url && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={caseItem.photo_url}
                      alt={caseItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="h-12 w-12 mx-auto mb-2" />
                          <p className="font-semibold">Premium</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                          {caseItem.region.charAt(0).toUpperCase() + caseItem.region.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(caseItem.difficulty)}`}>
                          {getDifficultyIcon(caseItem.difficulty)} {caseItem.difficulty.charAt(0).toUpperCase() + caseItem.difficulty.slice(1)}
                        </span>
                        {caseItem.is_free_access && (
                          <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                            Gratuit
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{caseItem.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {isCompleted && (
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      )}

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCase(caseItem.id)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier le cas"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCase(caseItem.id)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer le cas"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{caseItem.duration_minutes} min</span>
                    </div>
                    {progress && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-amber-700">{progress.completion_percentage}%</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {progress && progress.completion_percentage > 0 && (
                    <div className="mb-4">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                          style={{ width: `${progress.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => hasAccess ? handleStartCase(caseItem.id) : null}
                    disabled={!hasAccess}
                    className={`w-full px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      hasAccess
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {hasAccess ? (
                      <>
                        {isCompleted ? <BookOpen className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        {isCompleted ? 'Revoir le cas' : progress ? 'Continuer' : 'Commencer'}
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        Réservé Premium
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredCases.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun cas trouvé</h3>
            <p className="text-slate-600">Modifiez vos filtres pour voir plus de cas pratiques</p>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-2xl p-6 border border-amber-100">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            Structure d'un cas clinique
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Chapitres</h4>
              <p className="text-sm text-slate-600">Organisation thématique du cas</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Modules</h4>
              <p className="text-sm text-slate-600">Vidéos, images et contenu pédagogique</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Quiz</h4>
              <p className="text-sm text-slate-600">Évaluez vos connaissances</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">4️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Progression</h4>
              <p className="text-sm text-slate-600">Suivez votre avancement</p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
