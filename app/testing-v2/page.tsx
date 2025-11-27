'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { generateConsultationPDF } from '@/utils/generateConsultationPDF'
import {
  Activity,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Map,
  Filter,
  FileText,
  Save,
  Download,
  Info,
  Zap,
  TrendingUp,
  Clock,
  Brain,
  Move,
  RefreshCw,
  MapPin,
  Target,
  Sparkles,
  Stethoscope,
  Image as ImageIcon
} from 'lucide-react'

interface TriageAnswers {
  region?: string
  painType?: string
  painOnset?: string
  aggravatingFactors?: string
  radiationPattern?: string
  neurologicalSymptoms?: boolean
  relievingMovement?: string
}

interface PathologyMatch {
  pathology: any
  matchScore: number
  matchedCriteria: string[]
  tests: any[]
  clusters: any[]
}

interface ConsultationData {
  patientName: string
  patientAge: string
  consultationDate: string
  region: string
  triageAnswers: TriageAnswers
  selectedPathologies: any[]
  testResults: any[]
  notes: string
}

interface ConsultationEpisode {
  region: string
  triageAnswers: TriageAnswers
  filteredPathologies: PathologyMatch[]
  selectedPathology: any
  testResults: any[]
}

const REGIONS = [
  { value: 'cervical', label: 'Cervical', icon: '🔵', description: 'Cou et nuque' },
  { value: 'thoracique', label: 'Thoracique', icon: '🟢', description: 'Haut du dos' },
  { value: 'lombaire', label: 'Lombaire', icon: '🟠', description: 'Bas du dos' },
  { value: 'epaule', label: 'Épaule', icon: '🔴', description: 'Articulation de l\'épaule' },
  { value: 'coude', label: 'Coude', icon: '🟣', description: 'Articulation du coude' },
  { value: 'poignet', label: 'Poignet', icon: '🟡', description: 'Poignet et main' },
  { value: 'main', label: 'Main', icon: '✋', description: 'Main et doigts' },
  { value: 'hanche', label: 'Hanche', icon: '🔶', description: 'Articulation de la hanche' },
  { value: 'genou', label: 'Genou', icon: '🔷', description: 'Articulation du genou' },
  { value: 'cheville', label: 'Cheville', icon: '🟤', description: 'Cheville' },
  { value: 'pied', label: 'Pied', icon: '👣', description: 'Pied et orteils' }
]

const TRIAGE_QUESTIONS = [
  {
    id: 'painType',
    question: 'La douleur est-elle mécanique ou inflammatoire ?',
    icon: Activity,
    color: 'from-blue-500 to-blue-600',
    options: [
      { 
        value: 'mecanique', 
        label: 'Mécanique',
        description: 'Augmentée au mouvement, soulagée au repos',
        icon: '⚙️'
      },
      { 
        value: 'inflammatoire', 
        label: 'Inflammatoire',
        description: 'Réveils nocturnes, raideur matinale, soulagée par AINS',
        icon: '🔥'
      },
      { 
        value: 'mixte', 
        label: 'Mixte',
        description: 'Caractéristiques des deux',
        icon: '⚡'
      }
    ]
  },
  {
    id: 'painOnset',
    question: 'Comment la douleur est-elle apparue ?',
    icon: Clock,
    color: 'from-purple-500 to-purple-600',
    options: [
      { 
        value: 'brutale', 
        label: 'Brutale / Précise',
        description: 'Structurel (ligament, disque, articulation, déchirure)',
        icon: '💥'
      },
      { 
        value: 'brutale_fond_chronique', 
        label: 'Brutale sous fond chronique',
        description: 'Aggravation aiguë d\'une condition chronique',
        icon: '⚡'
      },
      { 
        value: 'progressive', 
        label: 'Progressive',
        description: 'Sans facteur déclenchant → inflammatoire ou dégénératif',
        icon: '📈'
      },
      { 
        value: 'charge_repetee', 
        label: 'Charge répétée',
        description: 'Après mouvements répétitifs → tendinopathie / surcharge',
        icon: '🔄'
      }
    ]
  },
  {
    id: 'aggravatingFactors',
    question: 'Qu\'est-ce qui aggrave la douleur ?',
    icon: TrendingUp,
    color: 'from-orange-500 to-orange-600',
    options: [
      { 
        value: 'mouvement', 
        label: 'Mouvement / Charge',
        description: 'Douleur mécanique',
        icon: '🏃'
      },
      { 
        value: 'repos', 
        label: 'Repos / Position fixe',
        description: 'Inflammatoire, discal, chimique',
        icon: '🛋️'
      },
      { 
        value: 'les_deux', 
        label: 'Les deux',
        description: 'Complexe ou mixte',
        icon: '🔀'
      }
    ]
  },
  {
    id: 'radiationPattern',
    question: 'La douleur irradie-t-elle vers une autre zone ?',
    icon: Zap,
    color: 'from-green-500 to-green-600',
    options: [
      { 
        value: 'radiculaire', 
        label: 'Oui, trajet précis',
        description: 'Radiculaire, suit un dermatome',
        icon: '⚡'
      },
      { 
        value: 'referree', 
        label: 'Oui, flou / diffus',
        description: 'Douleur référée (discale, facettaire, musculaire)',
        icon: '☁️'
      },
      { 
        value: 'locale', 
        label: 'Non, locale',
        description: 'Structure locale uniquement',
        icon: '📍'
      }
    ]
  },
  {
    id: 'neurologicalSymptoms',
    question: 'Ressentez-vous des picotements, perte de force ou engourdissements ?',
    icon: Brain,
    color: 'from-red-500 to-red-600',
    options: [
      { 
        value: true, 
        label: 'Oui',
        description: 'Suspicion neuro (radiculaire, canal, compression)',
        icon: '⚠️'
      },
      { 
        value: false, 
        label: 'Non',
        description: 'Loco-régional',
        icon: '✅'
      }
    ]
  },
  {
    id: 'relievingMovement',
    question: 'Un mouvement particulier soulage-t-il la douleur ?',
    icon: Move,
    color: 'from-indigo-500 to-indigo-600',
    options: [
      { 
        value: 'extension', 
        label: 'Extension',
        description: 'Suggère origine discale',
        icon: '↗️'
      },
      { 
        value: 'flexion', 
        label: 'Flexion',
        description: 'Suggère facettaire / sténose',
        icon: '↙️'
      },
      { 
        value: 'rotation_gauche', 
        label: 'Rotation gauche',
        description: 'Rotation du tronc/cou vers la gauche',
        icon: '↶'
      },
      { 
        value: 'rotation_droite', 
        label: 'Rotation droite',
        description: 'Rotation du tronc/cou vers la droite',
        icon: '↷'
      },
      { 
        value: 'inclinaison_gauche', 
        label: 'Inclinaison gauche',
        description: 'Inclinaison latérale gauche',
        icon: '⤺'
      },
      { 
        value: 'inclinaison_droite', 
        label: 'Inclinaison droite',
        description: 'Inclinaison latérale droite',
        icon: '⤻'
      },
      { 
        value: 'appliquer_chaud', 
        label: 'Appliquer du chaud',
        description: 'Chaleur soulage (musculaire, inflammatoire)',
        icon: '🔥'
      },
      { 
        value: 'auto_massage', 
        label: 'Auto-massage',
        description: 'Massage de la zone douloureuse',
        icon: '👐'
      },
      { 
        value: 'mouvement', 
        label: 'Le mouvement',
        description: 'Mouvement en général soulage',
        icon: '🚶'
      },
      { 
        value: 'etirement_musculaire', 
        label: 'Étirement musculaire',
        description: 'Étirements soulagent',
        icon: '🤸'
      },
      { 
        value: 'aucun', 
        label: 'Aucun',
        description: 'Musculaire/inflammatoire/complexe',
        icon: '❌'
      }
    ]
  }
]

export default function TestingV2Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  const [currentStep, setCurrentStep] = useState<'region' | 'triage' | 'pathologies' | 'tests'>('region')
  const [triageStep, setTriageStep] = useState(0)
  const [triageAnswers, setTriageAnswers] = useState<TriageAnswers>({})
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  
  const [allPathologies, setAllPathologies] = useState<any[]>([])
  const [filteredPathologies, setFilteredPathologies] = useState<PathologyMatch[]>([])
  const [selectedPathology, setSelectedPathology] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [episodes, setEpisodes] = useState<ConsultationEpisode[]>([])
  
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    patientName: '',
    patientAge: '',
    consultationDate: new Date().toISOString().split('T')[0],
    region: '',
    triageAnswers: {},
    selectedPathologies: [],
    testResults: [],
    notes: ''
  })
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAccess()
    loadPathologies()
  }, [])

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData?.role === 'free') {
      alert('Cette fonctionnalité est réservée aux utilisateurs Premium')
      router.push('/dashboard')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  const loadPathologies = async () => {
    try {
      const { data: pathologiesData } = await supabase
        .from('pathologies')
        .select('*')
        .eq('is_active', true)

      const { data: triageData } = await supabase
        .from('pathology_triage_criteria')
        .select('*')

      const { data: testLinks } = await supabase
        .from('pathology_tests')
        .select('*, test:orthopedic_tests(*)')
        .order('recommended_order')

      const { data: clusterLinks } = await supabase
        .from('pathology_clusters')
        .select('*, cluster:orthopedic_test_clusters(*)')
        .order('recommended_order')

      const pathologiesWithData = pathologiesData?.map(pathology => {
        const triage = triageData?.find(t => t.pathology_id === pathology.id)
        const tests = testLinks?.filter(l => l.pathology_id === pathology.id).map(l => ({
          ...l.test,
          relevance_score: l.relevance_score,
          notes: l.notes
        })) || []
        const clusters = clusterLinks?.filter(l => l.pathology_id === pathology.id).map(l => l.cluster) || []

        return {
          ...pathology,
          triage_criteria: triage,
          tests,
          clusters
        }
      }) || []

      setAllPathologies(pathologiesWithData)
    } catch (error) {
      console.error('Error loading pathologies:', error)
    }
  }

  const buildCurrentEpisode = (): ConsultationEpisode => ({
    region: selectedRegion,
    triageAnswers,
    filteredPathologies,
    selectedPathology,
    testResults,
  })

  const getAllEpisodes = (): ConsultationEpisode[] => {
    const hasCurrentData =
      filteredPathologies.length > 0 ||
      selectedPathology ||
      testResults.length > 0

    return hasCurrentData ? [...episodes, buildCurrentEpisode()] : episodes
  }

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region)
    setConsultationData(prev => ({ ...prev, region }))
    setCurrentStep('triage')
    setTriageStep(0)
    setTriageAnswers({})
  }

  const handleTriageAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...triageAnswers, [questionId]: value }
    setTriageAnswers(newAnswers)
    setConsultationData(prev => ({ ...prev, triageAnswers: newAnswers }))

    if (triageStep < TRIAGE_QUESTIONS.length - 1) {
      setTriageStep(triageStep + 1)
    } else {
      filterPathologies(newAnswers)
      setCurrentStep('pathologies')
    }
  }

  const filterPathologies = (answers: TriageAnswers) => {
    const regionPathologies = allPathologies.filter(p => p.region === selectedRegion)

    const matches: PathologyMatch[] = regionPathologies.map(pathology => {
      let matchScore = 0
      const matchedCriteria: string[] = []

      if (pathology.triage_criteria) {
        const criteria = pathology.triage_criteria

        // Convertir les critères en arrays s'ils ne le sont pas déjà
        const painTypes = Array.isArray(criteria.pain_type) ? criteria.pain_type : (criteria.pain_type ? [criteria.pain_type] : [])
        const painOnsets = Array.isArray(criteria.pain_onset) ? criteria.pain_onset : (criteria.pain_onset ? [criteria.pain_onset] : [])
        const aggravatingFactors = Array.isArray(criteria.aggravating_factors) ? criteria.aggravating_factors : (criteria.aggravating_factors ? [criteria.aggravating_factors] : [])
        const radiationPatterns = Array.isArray(criteria.radiation_pattern) ? criteria.radiation_pattern : (criteria.radiation_pattern ? [criteria.radiation_pattern] : [])
        const relievingMovements = Array.isArray(criteria.relieving_movement) ? criteria.relieving_movement : (criteria.relieving_movement ? [criteria.relieving_movement] : [])

        // Vérifier chaque critère avec support des choix multiples
        if (painTypes.includes(answers.painType)) {
          matchScore += 20
          matchedCriteria.push('Type de douleur')
        } else if (painTypes.includes('non_applicable')) {
          matchScore += 10
        }

        if (painOnsets.includes(answers.painOnset)) {
          matchScore += 20
          matchedCriteria.push('Apparition')
        } else if (painOnsets.includes('non_applicable')) {
          matchScore += 10
        }

        if (aggravatingFactors.includes(answers.aggravatingFactors)) {
          matchScore += 15
          matchedCriteria.push('Facteurs aggravants')
        } else if (aggravatingFactors.includes('non_applicable')) {
          matchScore += 7
        }

        if (radiationPatterns.includes(answers.radiationPattern)) {
          matchScore += 15
          matchedCriteria.push('Irradiation')
        } else if (radiationPatterns.includes('non_applicable')) {
          matchScore += 7
        }

        if (criteria.neurological_symptoms === answers.neurologicalSymptoms) {
          matchScore += 15
          matchedCriteria.push('Symptômes neuro')
        }

        if (relievingMovements.includes(answers.relievingMovement)) {
          matchScore += 15
          matchedCriteria.push('Mouvement soulageant')
        } else if (relievingMovements.includes('non_applicable')) {
          matchScore += 7
        }

        if (criteria.triage_weight) {
          matchScore = (matchScore * criteria.triage_weight) / 50
        }
      }

      return {
        pathology,
        matchScore,
        matchedCriteria,
        tests: pathology.tests || [],
        clusters: pathology.clusters || []
      }
    })

    const filtered = matches
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)

    setFilteredPathologies(filtered)
  }

  const handleTestResult = (testId: string, result: 'positive' | 'negative' | 'uncertain') => {
    setTestResults(prev => {
      const existing = prev.find(r => r.testId === testId)
      if (existing) {
        return prev.map(r => r.testId === testId ? { ...r, result } : r)
      } else {
        return [...prev, { testId, result }]
      }
    })
  }

  const saveConsultation = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const allEpisodes = getAllEpisodes()

      const evaluated_pathologies = allEpisodes.flatMap(ep =>
        ep.filteredPathologies.map(p => ({
          id: p.pathology.id,
          name: p.pathology.name,
          matchScore: p.matchScore,
          region: ep.region,
          selected: ep.selectedPathology?.id === p.pathology.id
        }))
      )

      const allTestResults = allEpisodes.flatMap(ep =>
        ep.testResults.map(r => ({
          ...r,
          region: ep.region,
        }))
      )

      const sessionData = {
        patient_name: consultationData.patientName,
        patient_age: consultationData.patientAge,
        consultation_date: consultationData.consultationDate,
        anatomical_region: selectedRegion,
        triage_answers: triageAnswers,
        evaluated_pathologies,
        test_results: allTestResults,
        final_diagnosis: allEpisodes
          .map(ep => ep.selectedPathology?.name)
          .filter(Boolean),
        notes: consultationData.notes,
        created_by: user?.id
      }

      const { error } = await supabase
        .from('consultation_sessions')
        .insert(sessionData)

      if (error) throw error

      alert('Consultation sauvegardée avec succès')
    } catch (error) {
      console.error('Error saving consultation:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const generatePDF = async () => {
    const allEpisodes = getAllEpisodes()

    await generateConsultationPDF({
      patientName: consultationData.patientName,
      patientAge: consultationData.patientAge,
      consultationDate: consultationData.consultationDate,
      notes: consultationData.notes,
      episodes: allEpisodes
    })
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec progression */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="h-7 w-7 text-primary-600" />
                Module de Consultation Guidée
              </h1>
              <p className="text-gray-600 mt-1">
                Aide au raisonnement clinique
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 rounded-full"></div>
            <div 
              className="absolute left-0 top-5 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
              style={{
                width: currentStep === 'region' ? '25%' : 
                       currentStep === 'triage' ? '50%' :
                       currentStep === 'pathologies' ? '75%' : '100%'
              }}
            />
            
            {['Région', 'Triage', 'Pathologies', 'Tests'].map((step, index) => {
              const isActive = 
                (index === 0 && currentStep === 'region') ||
                (index === 1 && currentStep === 'triage') ||
                (index === 2 && currentStep === 'pathologies') ||
                (index === 3 && currentStep === 'tests')
              
              const isCompleted = 
                (index === 0 && currentStep !== 'region') ||
                (index === 1 && (currentStep === 'pathologies' || currentStep === 'tests')) ||
                (index === 2 && currentStep === 'tests')

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                    ${isActive ? 'bg-primary-600 text-white shadow-lg scale-110' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-white border-2 border-gray-300 text-gray-400'}
                  `}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-primary-600' : 
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Étape 1: Sélection de la région */}
        {currentStep === 'region' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Map className="h-6 w-6 text-primary-600" />
              Sélectionnez la région anatomique concernée
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {REGIONS.map(region => (
                <button
                  key={region.value}
                  onClick={() => handleRegionSelect(region.value)}
                  className="group relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-all transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="text-4xl mb-3">{region.icon}</div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">
                    {region.label}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {region.description}
                  </p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-primary-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2: Questions de triage */}
        {currentStep === 'triage' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${TRIAGE_QUESTIONS[triageStep].color}`} />
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {(() => {
                      const Icon = TRIAGE_QUESTIONS[triageStep].icon
                      return <Icon className="h-6 w-6 text-primary-600" />
                    })()}
                    Question {triageStep + 1} sur {TRIAGE_QUESTIONS.length}
                  </h2>

                  {triageStep > 0 && (
                    <button
                      onClick={() => setTriageStep(triageStep - 1)}
                      className="text-gray-600 hover:text-primary-600 flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </button>
                  )}
                </div>
                
                <p className="text-lg text-gray-700">
                  {TRIAGE_QUESTIONS[triageStep].question}
                </p>
              </div>

              <div className={`grid gap-4 ${
                TRIAGE_QUESTIONS[triageStep].options.length > 6 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1 md:grid-cols-3'
              }`}>
                {TRIAGE_QUESTIONS[triageStep].options.map(option => (
                  <button
                    key={String(option.value)}
                    onClick={() => handleTriageAnswer(
                      TRIAGE_QUESTIONS[triageStep].id,
                      option.value
                    )}
                    className="group relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-all transform hover:scale-105 hover:shadow-lg text-left"
                  >
                    <div className="text-3xl mb-3">{option.icon}</div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 mb-2">
                      {option.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                    <Sparkles className="absolute top-3 right-3 h-5 w-5 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Étape 3: Pathologies filtrées - DESIGN AMÉLIORÉ */}
        {currentStep === 'pathologies' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="h-6 w-6 text-primary-600" />
                Pathologies correspondantes
              </h2>
              
              {filteredPathologies.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Aucune pathologie ne correspond aux critères sélectionnés
                  </p>
                  <button
                    onClick={() => {
                      setCurrentStep('triage')
                      setTriageStep(0)
                      setTriageAnswers({})
                    }}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Refaire le triage
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPathologies.map((match) => (
                    <div 
                      key={match.pathology.id}
                      className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-2xl cursor-pointer overflow-hidden"
                      onClick={() => {
                        setSelectedPathology(match.pathology)
                        setCurrentStep('tests')
                      }}
                    >
                      {/* Score de correspondance - en haut à droite */}
                      <div className="absolute top-4 right-4 z-20">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full px-4 py-2 shadow-lg">
                          {Math.round(match.matchScore)}%
                        </div>
                      </div>

                      {/* Image topographique - MISE EN AVANT */}
                      {match.pathology.topographic_image_url ? (
                        <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-b-2 border-gray-200">
                          <img
                            src={match.pathology.topographic_image_url}
                            alt={match.pathology.name}
                            className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110"
                          />
                          {/* Overlay gradient au survol */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ) : (
                        <div className="h-72 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-b-2 border-gray-200">
                          <ImageIcon className="h-20 w-20 text-gray-300" />
                        </div>
                      )}

                      {/* Contenu de la carte */}
                      <div className="p-5">
                        <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                          {match.pathology.name}
                        </h3>
                        
                        {match.pathology.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {match.pathology.description}
                          </p>
                        )}

                        {/* Critères matchés - badges visuels */}
                        {match.matchedCriteria.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                              Critères correspondants
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {match.matchedCriteria.slice(0, 3).map(criteria => (
                                <div key={criteria} className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>{criteria}</span>
                                </div>
                              ))}
                              {match.matchedCriteria.length > 3 && (
                                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                  +{match.matchedCriteria.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Statistiques */}
                        <div className="flex items-center justify-between text-sm text-gray-500 pb-3 border-b border-gray-200 mb-4">
                          <div className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            <span>{match.tests.length} tests</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{match.clusters.length} clusters</span>
                          </div>
                        </div>

                        {/* Bouton d'action */}
                        <button className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transform group-hover:translate-y-[-2px]">
                          Évaluer cette pathologie
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Étape 4: Tests de la pathologie sélectionnée */}
        {currentStep === 'tests' && selectedPathology && (
          <div className="space-y-6">
            {/* Informations de la pathologie */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedPathology.name}</h2>
                  
                  {selectedPathology.topographic_image_url && (
                    <div className="mb-4">
                      <img 
                        src={selectedPathology.topographic_image_url} 
                        alt={selectedPathology.name}
                        className="h-40 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  
                  {selectedPathology.description && (
                    <p className="text-gray-600">{selectedPathology.description}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setCurrentStep('pathologies')
                    setSelectedPathology(null)
                  }}
                  className="text-gray-600 hover:text-primary-600 flex items-center gap-1"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Retour
                </button>
              </div>

              {selectedPathology.recommendations && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Recommandations
                  </h3>
                  <p className="text-blue-800 text-sm">{selectedPathology.recommendations}</p>
                </div>
              )}
            </div>

            {/* Tests orthopédiques */}
            {selectedPathology.tests?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-600" />
                  Tests orthopédiques ({selectedPathology.tests.length})
                </h3>
                
                <div className="space-y-4">
                  {selectedPathology.tests.map((test: any) => {
                    const result = testResults.find(r => r.testId === test.id)
                    
                    return (
                      <div key={test.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{test.name}</h4>
                            {test.description && (
                              <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{test.description}</p>
                            )}
                            {test.relevance_score && (
                              <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs text-gray-500 font-medium">Pertinence:</span>
                                <div className="flex">
                                  {[...Array(10)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`h-2 w-6 ${
                                        i < test.relevance_score
                                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                                          : 'bg-gray-200'
                                      } ${i === 0 ? 'rounded-l' : ''} ${i === 9 ? 'rounded-r' : ''}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-gray-700">
                                  {test.relevance_score}/10
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleTestResult(test.id, 'positive')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                              result?.result === 'positive'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <CheckCircle className="h-5 w-5 inline mr-2" />
                            Positif
                          </button>
                          <button
                            onClick={() => handleTestResult(test.id, 'negative')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                              result?.result === 'negative'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <XCircle className="h-5 w-5 inline mr-2" />
                            Négatif
                          </button>
                          <button
                            onClick={() => handleTestResult(test.id, 'uncertain')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                              result?.result === 'uncertain'
                                ? 'bg-yellow-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <AlertCircle className="h-5 w-5 inline mr-2" />
                            Incertain
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Informations patient et actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de consultation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="inline h-4 w-4 mr-1" />
                    Nom du patient
                  </label>
                  <input
                    type="text"
                    value={consultationData.patientName}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      patientName: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Jean Dupont"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Âge
                  </label>
                  <input
                    type="text"
                    value={consultationData.patientAge}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      patientAge: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="45 ans"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={consultationData.consultationDate}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      consultationDate: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes de consultation
                </label>
                <textarea
                  value={consultationData.notes}
                  onChange={(e) => setConsultationData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Notes complémentaires..."
                />
              </div>

              <button
                onClick={() => {
                  const episode = buildCurrentEpisode()
                  setEpisodes(prev => [...prev, episode])

                  setCurrentStep('region')
                  setSelectedRegion('')
                  setTriageAnswers({})
                  setTriageStep(0)
                  setFilteredPathologies([])
                  setSelectedPathology(null)
                  setTestResults([])
                }}
                className="mb-4 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                + Ajouter un autre élément à cette consultation
              </button>

              <div className="flex gap-3">
                <button
                  onClick={saveConsultation}
                  disabled={saving || !consultationData.patientName}
                  className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-semibold"
                >
                  <Save className="h-5 w-5" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                
                <button
                  onClick={generatePDF}
                  disabled={!consultationData.patientName}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-semibold"
                >
                  <Download className="h-5 w-5" />
                  Générer PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}