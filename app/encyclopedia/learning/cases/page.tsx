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
  AlertCircle,
  FileText,
  BookOpen,
  FileQuestion,
  GraduationCap,
  TrendingUp
} from 'lucide-react'
import RelatedContent from '@/components/RelatedContent'

type ClinicalCase = {
  id: string
  title: string
  description: string
  region: string
  difficulty: 'débutant' | 'intermédiaire' | 'avancé'
  duration_minutes: number
  objectives: string[]
  patient_profile: string
  is_active: boolean
  created_at: string
}

type CaseProgress = {
  case_id: string
  completed: boolean
  score: number
  completed_at: string
}

export default function ClinicalCasesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<ClinicalCase[]>([])
  const [userProgress, setUserProgress] = useState<Record<string, CaseProgress>>({})
  const [profile, setProfile] = useState<any>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const regions = ['Cervical', 'Thoracique', 'Lombaire', 'Épaule', 'Genou', 'Hanche', 'Multi-régions']

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

      // Load clinical cases (mock data for now - you'll need to create the table)
      // TODO: Create clinical_cases tables in database
      const mockCases: ClinicalCase[] = [
        {
          id: '1',
          title: 'Cervicalgie post-traumatique',
          description: 'Patient de 35 ans consultant pour cervicalgie suite à un accident de voiture. Évaluez les drapeaux rouges et proposez une prise en charge appropriée.',
          region: 'Cervical',
          difficulty: 'débutant',
          duration_minutes: 15,
          objectives: [
            'Identifier les drapeaux rouges',
            'Réaliser un examen physique ciblé',
            'Proposer un plan de traitement adapté'
          ],
          patient_profile: 'Homme, 35 ans, actif',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Syndrome de conflit sous-acromial',
          description: 'Patiente de 48 ans, secrétaire, présentant une douleur d\'épaule progressive depuis 3 mois. Analysez la biomécanique et établissez un diagnostic différentiel.',
          region: 'Épaule',
          difficulty: 'intermédiaire',
          duration_minutes: 20,
          objectives: [
            'Réaliser les tests orthopédiques appropriés',
            'Établir un diagnostic différentiel',
            'Proposer un traitement conservateur complet',
            'Identifier les critères de référence'
          ],
          patient_profile: 'Femme, 48 ans, travail de bureau',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Lombalgie chronique complexe',
          description: 'Patient de 52 ans avec lombalgie chronique, irradiation membre inférieur et composante psychosociale. Cas complexe nécessitant une approche globale.',
          region: 'Lombaire',
          difficulty: 'avancé',
          duration_minutes: 30,
          objectives: [
            'Évaluer les facteurs biopsychosociaux',
            'Interpréter l\'imagerie médicale',
            'Gérer les attentes du patient',
            'Élaborer un plan de traitement multidisciplinaire',
            'Identifier les drapeaux jaunes'
          ],
          patient_profile: 'Homme, 52 ans, ouvrier du bâtiment',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          title: 'Lésion méniscale du genou',
          description: 'Sportif de 28 ans présentant une douleur au genou suite à un mouvement de rotation. Suspicion de lésion méniscale à confirmer.',
          region: 'Genou',
          difficulty: 'intermédiaire',
          duration_minutes: 20,
          objectives: [
            'Réaliser les tests méniscaux',
            'Différencier lésion méniscale vs ligamentaire',
            'Déterminer la nécessité d\'imagerie',
            'Proposer une prise en charge adaptée'
          ],
          patient_profile: 'Homme, 28 ans, footballeur amateur',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          title: 'Céphalée cervicogénique',
          description: 'Patiente de 42 ans souffrant de céphalées unilatérales avec raideur cervicale. Établissez le lien entre les symptômes et la région cervicale.',
          region: 'Cervical',
          difficulty: 'intermédiaire',
          duration_minutes: 18,
          objectives: [
            'Différencier céphalée cervicogénique vs migraine',
            'Identifier les dysfonctions cervicales',
            'Proposer un traitement ostéopathique ciblé',
            'Gérer les drapeaux rouges céphaliques'
          ],
          patient_profile: 'Femme, 42 ans, enseignante',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]

      setCases(mockCases)

      // Load user progress (mock for now)
      const mockProgress: Record<string, CaseProgress> = {
        '1': {
          case_id: '1',
          completed: true,
          score: 92,
          completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      }

      setUserProgress(mockProgress)
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
    // TODO: Navigate to case taking page
    alert(`🚧 Module Cas Pratiques en cours de développement.\n\nLe cas clinique sera bientôt disponible avec :\n- Scénario interactif étape par étape\n- Choix de décisions cliniques\n- Feedback détaillé\n- Scoring et explication des bonnes pratiques`)
  }

  const isAdmin = profile?.role === 'admin'

  const completedCount = Object.values(userProgress).filter(p => p.completed).length
  const avgScore = Object.values(userProgress).length > 0
    ? Math.round(Object.values(userProgress).reduce((acc, p) => acc + p.score, 0) / Object.values(userProgress).length)
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
                <span className="text-xs font-semibold text-amber-100">Cas Pratiques</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-100">
                Scénarios Cliniques Interactifs
              </h1>

              <p className="text-base md:text-lg text-amber-100 mb-6 max-w-2xl">
                Développez votre raisonnement clinique avec des cas pratiques réalistes et immersifs basés sur des situations réelles.
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
                  <option key={region} value={region}>{region}</option>
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
                  onClick={() => alert('🚧 Création de cas pratiques disponible prochainement')}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {filteredCases.map((caseItem) => {
            const progress = userProgress[caseItem.id]
            const isCompleted = progress?.completed

            return (
              <div
                key={caseItem.id}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-300 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                          {caseItem.region}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(caseItem.difficulty)}`}>
                          {getDifficultyIcon(caseItem.difficulty)} {caseItem.difficulty.charAt(0).toUpperCase() + caseItem.difficulty.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{caseItem.title}</h3>
                    </div>

                    {isCompleted && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Patient Profile */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Patient :</span>
                    <span>{caseItem.patient_profile}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4">{caseItem.description}</p>

                  {/* Objectives */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-slate-900">Objectifs d'apprentissage</span>
                    </div>
                    <ul className="space-y-1">
                      {caseItem.objectives.slice(0, 3).map((objective, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">▸</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                      {caseItem.objectives.length > 3 && (
                        <li className="text-xs text-slate-500 italic ml-4">
                          +{caseItem.objectives.length - 3} autres objectifs...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-1 mb-4 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>Durée estimée : {caseItem.duration_minutes} min</span>
                  </div>

                  {/* Score if completed */}
                  {isCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Votre performance</span>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-700">{progress.score}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartCase(caseItem.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                  >
                    <Play className="h-5 w-5" />
                    {isCompleted ? 'Refaire le cas' : 'Commencer le cas'}
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
        <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-2xl p-6 border border-amber-100 mb-8">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Comment fonctionnent les cas pratiques ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Analysez</h4>
              <p className="text-sm text-slate-600">Prenez connaissance du cas clinique et des informations du patient</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Décidez</h4>
              <p className="text-sm text-slate-600">Faites vos choix cliniques à chaque étape du raisonnement</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Apprenez</h4>
              <p className="text-sm text-slate-600">Recevez un feedback détaillé et comprenez les meilleures pratiques</p>
            </div>
          </div>
        </div>

        {/* Related Modules */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <RelatedContent
            title="📚 Explorer aussi"
            items={[
              {
                id: 'quizzes',
                title: 'Quiz',
                description: 'Testez vos connaissances avec des quiz interactifs et feedback instantané',
                module: 'Apprentissage',
                href: '/encyclopedia/learning/quizzes',
                gradient: 'from-purple-500 to-indigo-600',
                icon: FileQuestion
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
