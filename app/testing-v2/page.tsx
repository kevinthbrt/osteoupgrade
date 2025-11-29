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
  Save,
  Download,
  Info,
  Clock,
  MapPin,
  Target,
  Stethoscope
} from 'lucide-react'
import { 
  applyInclusionExclusion, 
  filterPathologiesWithInclusionExclusion,
  getInclusionBadgeProps,
  type PatientData
} from '@/lib/scoring-algorithm'

interface TriageAnswers {
  region?: string
  temporalEvolution?: string
  painType?: string
  painLocation?: string
}

interface PathologyMatch {
  pathology: any
  matchScore: number
  matchedCriteria: string[]
  tests: any[]
  clusters: any[]
  inclusionModifier?: number
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
  patientData?: PatientData
}

interface ConsultationEpisode {
  region: string
  triageAnswers: TriageAnswers
  filteredPathologies: PathologyMatch[]
  selectedPathology: any
  testResults: any[]
  patientData?: PatientData
}

const REGIONS = [
  { value: 'cervical', label: 'Cervical', icon: '🔵' },
  { value: 'thoracique', label: 'Thoracique', icon: '🟢' },
  { value: 'lombaire', label: 'Lombaire', icon: '🟠' },
  { value: 'epaule', label: 'Épaule', icon: '🔴' },
  { value: 'coude', label: 'Coude', icon: '🟣' },
  { value: 'poignet', label: 'Poignet', icon: '🟡' },
  { value: 'main', label: 'Main', icon: '✋' },
  { value: 'hanche', label: 'Hanche', icon: '🔶' },
  { value: 'genou', label: 'Genou', icon: '🔷' },
  { value: 'cheville', label: 'Cheville', icon: '🟤' },
  { value: 'pied', label: 'Pied', icon: '👣' }
]

const AGE_RANGES = [
  { value: '0-18', label: '0-18 ans', description: 'Enfant / Adolescent', icon: '👶' },
  { value: '18-30', label: '18-30 ans', description: 'Jeune adulte', icon: '🧑' },
  { value: '30-50', label: '30-50 ans', description: 'Adulte', icon: '👤' },
  { value: '50-65', label: '50-65 ans', description: 'Adulte mature', icon: '👨' },
  { value: '65+', label: '65 ans et plus', description: 'Senior', icon: '👴' }
]

const SEX_OPTIONS = [
  { value: 'homme', label: 'Homme', icon: '♂️', color: 'blue' },
  { value: 'femme', label: 'Femme', icon: '♀️', color: 'pink' }
]

const LIFESTYLE_OPTIONS = [
  { 
    value: 'sedentaire', 
    label: 'Sédentaire', 
    description: 'Activité physique faible ou nulle', 
    icon: '💺' 
  },
  { 
    value: 'actif', 
    label: 'Actif', 
    description: 'Activité modérée (1-3×/semaine)', 
    icon: '🚶' 
  },
  { 
    value: 'athlete', 
    label: 'Athlète', 
    description: 'Activité intense (>3×/semaine)', 
    icon: '🏋️' 
  }
]

const TRIAGE_QUESTIONS = [
  {
    id: 'temporalEvolution',
    question: 'Quelle est l\'évolution temporelle de la douleur ?',
    icon: Clock,
    color: 'from-blue-500 to-blue-600',
    options: [
      { 
        value: 'aigue', 
        label: 'Aiguë',
        description: 'Apparition récente (<6 semaines)',
        icon: '⚡'
      },
      { 
        value: 'chronique', 
        label: 'Chronique',
        description: 'Installation progressive (>3 mois)',
        icon: '📅'
      },
      { 
        value: 'aigue_fond_chronique', 
        label: 'Aiguë sur fond chronique',
        description: 'Exacerbation aiguë d\'une condition chronique',
        icon: '🔄'
      },
      { 
        value: 'traumatique', 
        label: 'Traumatique',
        description: 'Suite à un traumatisme identifié',
        icon: '💥'
      }
    ]
  },
  {
    id: 'painType',
    question: 'Quel est le type de douleur ?',
    icon: Activity,
    color: 'from-purple-500 to-purple-600',
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
        description: 'Réveils nocturnes, raideur matinale',
        icon: '🔥'
      },
      { 
        value: 'mixte', 
        label: 'Mixte',
        description: 'Caractéristiques mécaniques et inflammatoires',
        icon: '⚡'
      },
      { 
        value: 'autre', 
        label: 'Autre',
        description: 'Neuropathique, référée, ou atypique',
        icon: '❓'
      }
    ]
  },
  {
    id: 'painLocation',
    question: 'Quelle est la localisation de la douleur ?',
    icon: MapPin,
    color: 'from-green-500 to-green-600',
    options: [
      { 
        value: 'locale_precise', 
        label: 'Locale précise',
        description: 'Douleur bien localisée sur une structure',
        icon: '📍'
      },
      { 
        value: 'diffuse', 
        label: 'Diffuse',
        description: 'Douleur étendue, mal délimitée',
        icon: '☁️'
      },
      { 
        value: 'radiculaire_mi_membre', 
        label: 'Irradiation radiculaire mi-membre',
        description: 'Trajet nerveux jusqu\'au coude/genou',
        icon: '⚡'
      },
      { 
        value: 'radiculaire_vraie', 
        label: 'Irradiation radiculaire vraie',
        description: 'Trajet nerveux complet jusqu\'aux extrémités',
        icon: '⚡⚡'
      },
      { 
        value: 'projetee', 
        label: 'Douleur projetée',
        description: 'Référée depuis une autre structure',
        icon: '🔀'
      }
    ]
  }
]

export default function TestingV2SimplifiedPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  const [currentStep, setCurrentStep] = useState<'region' | 'patient' | 'triage' | 'pathologies' | 'tests'>('region')
  const [triageStep, setTriageStep] = useState(0)
  const [triageAnswers, setTriageAnswers] = useState<TriageAnswers>({})
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [patientData, setPatientData] = useState<PatientData>({
    age: '',
    sex: '',
    lifestyle: ''
  })
  
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

      const { data: clusterItems } = await supabase
        .from('orthopedic_test_cluster_items')
        .select('*, test:orthopedic_tests(*)')
        .order('order_index')

      const pathologiesWithData = pathologiesData?.map((pathology: any) => {
        const triage = triageData?.find((t: any) => t.pathology_id === pathology.id)
        const tests = testLinks?.filter((l: any) => l.pathology_id === pathology.id).map((l: any) => ({
          ...l.test,
          relevance_score: l.relevance_score,
          notes: l.notes
        })) || []
        
        const clusters = clusterLinks
          ?.filter((l: any) => l.pathology_id === pathology.id)
          .map((l: any) => {
            const clusterTestItems = clusterItems
              ?.filter((item: any) => item.cluster_id === l.cluster.id)
              .map((item: any) => item.test) || []
            
            return {
              ...l.cluster,
              tests: clusterTestItems,
              relevance_score: l.relevance_score,
              notes: l.notes
            }
          }) || []

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
    patientData
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
    setCurrentStep('patient')
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
    
    const filtered = filterPathologiesWithInclusionExclusion(
      regionPathologies,
      answers,
      patientData
    )

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
        patient_data: patientData,
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

      alert('✅ Consultation sauvegardée')
    } catch (error) {
      console.error('Error saving consultation:', error)
      alert('❌ Erreur lors de la sauvegarde')
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
                Consultation Guidée (Simplifié)
              </h1>
              <p className="text-gray-600 mt-1">
                Profil patient + 3 questions simples pour un triage efficace
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 rounded-full"></div>
            <div 
              className="absolute left-0 top-5 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
              style={{
                width: currentStep === 'region' ? '20%' : 
                       currentStep === 'patient' ? '40%' :
                       currentStep === 'triage' ? '60%' :
                       currentStep === 'pathologies' ? '80%' : '100%'
              }}
            />
            
            {['Région', 'Patient', 'Triage', 'Pathologies', 'Tests'].map((step, index) => {
              const isActive = 
                (index === 0 && currentStep === 'region') ||
                (index === 1 && currentStep === 'patient') ||
                (index === 2 && currentStep === 'triage') ||
                (index === 3 && currentStep === 'pathologies') ||
                (index === 4 && currentStep === 'tests')
              
              const isCompleted = 
                (index === 0 && currentStep !== 'region') ||
                (index === 1 && (currentStep === 'triage' || currentStep === 'pathologies' || currentStep === 'tests')) ||
                (index === 2 && (currentStep === 'pathologies' || currentStep === 'tests')) ||
                (index === 3 && currentStep === 'tests')

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
              Région anatomique
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
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2: Informations Patient */}
        {currentStep === 'patient' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations Patient</h2>
                <p className="text-gray-600">
                  Ces informations permettent d'affiner les recommandations diagnostiques
                </p>
              </div>

              <div className="space-y-6">
                {/* Âge */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    Quel est l'âge du patient ?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {AGE_RANGES.map(range => (
                      <button
                        key={range.value}
                        onClick={() => setPatientData(prev => ({ ...prev, age: range.value as any }))}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          patientData.age === range.value
                            ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-purple-300 hover:shadow'
                        }`}
                      >
                        <div className="text-3xl mb-2">{range.icon}</div>
                        <div className="font-semibold text-gray-900 mb-1">{range.label}</div>
                        <div className="text-xs text-gray-600">{range.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sexe */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚧</span>
                    Quel est le sexe biologique du patient ?
                  </label>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl">
                    {SEX_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setPatientData(prev => ({ ...prev, sex: option.value as any }))}
                        className={`p-6 rounded-xl border-2 text-center transition-all ${
                          patientData.sex === option.value
                            ? `border-${option.color}-600 bg-${option.color}-50 shadow-lg scale-105`
                            : 'border-gray-200 hover:border-purple-300 hover:shadow'
                        }`}
                      >
                        <div className="text-5xl mb-3">{option.icon}</div>
                        <div className="font-bold text-xl text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode de vie */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏃</span>
                    Quel est le niveau d'activité physique du patient ?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {LIFESTYLE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setPatientData(prev => ({ ...prev, lifestyle: option.value as any }))}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${
                          patientData.lifestyle === option.value
                            ? 'border-green-600 bg-green-50 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-green-300 hover:shadow'
                        }`}
                      >
                        <div className="text-4xl mb-3">{option.icon}</div>
                        <div className="font-bold text-lg text-gray-900 mb-2">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Boutons navigation */}
              <div className="mt-8 flex justify-between items-center pt-6 border-t">
                <button
                  onClick={() => setCurrentStep('region')}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Retour
                </button>

                <button
                  onClick={() => {
                    if (!patientData.age || !patientData.sex || !patientData.lifestyle) {
                      alert('Veuillez renseigner toutes les informations patient')
                      return
                    }
                    setCurrentStep('triage')
                  }}
                  disabled={!patientData.age || !patientData.sex || !patientData.lifestyle}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Continuer vers le triage
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Carte récapitulatif en live */}
            {(patientData.age || patientData.sex || patientData.lifestyle) && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Profil Patient
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-white rounded-lg p-4">
                    <div className="text-3xl mb-2">
                      {AGE_RANGES.find(r => r.value === patientData.age)?.icon || '📅'}
                    </div>
                    <div className="text-xs text-gray-600">Âge</div>
                    <div className="font-bold text-purple-900">
                      {AGE_RANGES.find(r => r.value === patientData.age)?.label || '-'}
                    </div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-4">
                    <div className="text-3xl mb-2">
                      {SEX_OPTIONS.find(s => s.value === patientData.sex)?.icon || '⚧'}
                    </div>
                    <div className="text-xs text-gray-600">Sexe</div>
                    <div className="font-bold text-purple-900">
                      {SEX_OPTIONS.find(s => s.value === patientData.sex)?.label || '-'}
                    </div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-4">
                    <div className="text-3xl mb-2">
                      {LIFESTYLE_OPTIONS.find(l => l.value === patientData.lifestyle)?.icon || '🏃'}
                    </div>
                    <div className="text-xs text-gray-600">Activité</div>
                    <div className="font-bold text-purple-900">
                      {LIFESTYLE_OPTIONS.find(l => l.value === patientData.lifestyle)?.label || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 3: Questions de triage (3 questions) */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Étape 4: Pathologies filtrées */}
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
                    Aucune pathologie ne correspond
                  </p>
                  <button
                    onClick={() => {
                      setCurrentStep('triage')
                      setTriageStep(0)
                      setTriageAnswers({})
                    }}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Refaire le triage
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* PODIUM - Top 3 */}
                  {filteredPathologies.length >= 3 && (
                    <div className="relative">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
                        🏆 Pathologies les plus probables
                      </h3>
                      
                      {/* Podium visuel */}
                      <div className="flex items-end justify-center gap-4 mb-8">
                        {/* 2ème place (Argent) - Gauche */}
                        {filteredPathologies[1] && (
                          <div 
                            className="group flex flex-col items-center cursor-pointer"
                            onClick={() => {
                              setSelectedPathology(filteredPathologies[1].pathology)
                              setCurrentStep('tests')
                            }}
                          >
                            {/* Badge Inclusion/Exclusion */}
                            {(() => {
                              const badgeProps = getInclusionBadgeProps(
                                filteredPathologies[1].pathology,
                                patientData,
                                filteredPathologies[1].inclusionModifier || 1.0
                              )
                              if (!badgeProps?.show) return null
                              
                              return (
                                <div className={`mb-2 px-3 py-1 rounded-full text-xs font-bold ${
                                  badgeProps.type === 'excluded' ? 'bg-red-600 text-white' :
                                  badgeProps.type === 'bonus' ? 'bg-green-600 text-white' :
                                  'bg-orange-500 text-white'
                                }`}>
                                  {badgeProps.label}
                                </div>
                              )
                            })()}

                            {/* Médaille */}
                            <div className="relative mb-4 transform group-hover:scale-110 transition-transform">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-xl border-4 border-gray-200">
                                <span className="text-3xl font-bold text-white">2</span>
                              </div>
                              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full px-2 py-1">
                                  {Math.round(filteredPathologies[1].matchScore)}%
                                </div>
                              </div>
                              {filteredPathologies[1].pathology.is_red_flag && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-lg animate-pulse flex items-center gap-1">
                                  <span>🚨</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="w-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-xl p-4 shadow-lg border-t-4 border-gray-400 group-hover:shadow-2xl transition-shadow">
                              {filteredPathologies[1].pathology.is_red_flag && (
                                <div className="mb-2 bg-red-50 border-2 border-red-500 rounded p-1.5">
                                  <div className="flex items-center gap-1 text-red-700">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span className="text-xs font-bold">URGENT</span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="text-center">
                                {filteredPathologies[1].pathology.topographic_image_url ? (
                                  <div className="h-32 mb-3 flex items-center justify-center">
                                    <img
                                      src={filteredPathologies[1].pathology.topographic_image_url}
                                      alt={filteredPathologies[1].pathology.name}
                                      className="max-h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-4xl mb-3">🥈</div>
                                )}
                                <h4 className="font-bold text-sm text-gray-900 line-clamp-2 mb-2">
                                  {filteredPathologies[1].pathology.name}
                                </h4>
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                  <Activity className="h-3 w-3" />
                                  <span>{filteredPathologies[1].tests.length} tests</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-40 h-32 bg-gradient-to-b from-gray-300 to-gray-400"></div>
                          </div>
                        )}

                        {/* 1ère place (Or) - Centre */}
                        {filteredPathologies[0] && (
                          <div 
                            className="group flex flex-col items-center cursor-pointer"
                            onClick={() => {
                              setSelectedPathology(filteredPathologies[0].pathology)
                              setCurrentStep('tests')
                            }}
                          >
                            {/* Badge Inclusion/Exclusion */}
                            {(() => {
                              const badgeProps = getInclusionBadgeProps(
                                filteredPathologies[0].pathology,
                                patientData,
                                filteredPathologies[0].inclusionModifier || 1.0
                              )
                              if (!badgeProps?.show) return null
                              
                              return (
                                <div className={`mb-2 px-3 py-1 rounded-full text-xs font-bold ${
                                  badgeProps.type === 'excluded' ? 'bg-red-600 text-white' :
                                  badgeProps.type === 'bonus' ? 'bg-green-600 text-white' :
                                  'bg-orange-500 text-white'
                                }`}>
                                  {badgeProps.label}
                                </div>
                              )
                            })()}

                            {/* Médaille avec couronne */}
                            <div className="relative mb-4 transform group-hover:scale-110 transition-transform">
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                                👑
                              </div>
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-2xl border-4 border-yellow-200">
                                <span className="text-4xl font-bold text-white">1</span>
                              </div>
                              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full px-3 py-1">
                                  {Math.round(filteredPathologies[0].matchScore)}%
                                </div>
                              </div>
                              {filteredPathologies[0].pathology.is_red_flag && (
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold rounded-full px-3 py-1 shadow-lg animate-pulse flex items-center gap-1">
                                  <span>🚨</span>
                                  <span>URGENT</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="w-48 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-t-xl p-5 shadow-2xl border-t-4 border-yellow-400 group-hover:shadow-3xl transition-shadow">
                              {filteredPathologies[0].pathology.is_red_flag && (
                                <div className="mb-3 bg-red-50 border-2 border-red-500 rounded-lg p-2 animate-pulse">
                                  <div className="flex items-center gap-2 text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-xs font-bold">DRAPEAU ROUGE</span>
                                  </div>
                                  {filteredPathologies[0].pathology.red_flag_reason && (
                                    <p className="text-xs text-red-600 mt-1 leading-tight">
                                      {filteredPathologies[0].pathology.red_flag_reason}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-center">
                                {filteredPathologies[0].pathology.topographic_image_url ? (
                                  <div className="h-40 mb-3 flex items-center justify-center">
                                    <img
                                      src={filteredPathologies[0].pathology.topographic_image_url}
                                      alt={filteredPathologies[0].pathology.name}
                                      className="max-h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-5xl mb-3">🥇</div>
                                )}
                                <h4 className="font-bold text-base text-gray-900 line-clamp-2 mb-3">
                                  {filteredPathologies[0].pathology.name}
                                </h4>
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                                  <Activity className="h-4 w-4" />
                                  <span>{filteredPathologies[0].tests.length} tests</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-48 h-40 bg-gradient-to-b from-yellow-200 to-yellow-400"></div>
                          </div>
                        )}

                        {/* 3ème place (Bronze) - Droite */}
                        {filteredPathologies[2] && (
                          <div 
                            className="group flex flex-col items-center cursor-pointer"
                            onClick={() => {
                              setSelectedPathology(filteredPathologies[2].pathology)
                              setCurrentStep('tests')
                            }}
                          >
                            {/* Badge Inclusion/Exclusion */}
                            {(() => {
                              const badgeProps = getInclusionBadgeProps(
                                filteredPathologies[2].pathology,
                                patientData,
                                filteredPathologies[2].inclusionModifier || 1.0
                              )
                              if (!badgeProps?.show) return null
                              
                              return (
                                <div className={`mb-2 px-3 py-1 rounded-full text-xs font-bold ${
                                  badgeProps.type === 'excluded' ? 'bg-red-600 text-white' :
                                  badgeProps.type === 'bonus' ? 'bg-green-600 text-white' :
                                  'bg-orange-500 text-white'
                                }`}>
                                  {badgeProps.label}
                                </div>
                              )
                            })()}

                            {/* Médaille */}
                            <div className="relative mb-4 transform group-hover:scale-110 transition-transform">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 flex items-center justify-center shadow-xl border-4 border-orange-200">
                                <span className="text-3xl font-bold text-white">3</span>
                              </div>
                              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full px-2 py-1">
                                  {Math.round(filteredPathologies[2].matchScore)}%
                                </div>
                              </div>
                              {filteredPathologies[2].pathology.is_red_flag && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-lg animate-pulse flex items-center gap-1">
                                  <span>🚨</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="w-40 bg-gradient-to-br from-orange-100 to-orange-200 rounded-t-xl p-4 shadow-lg border-t-4 border-orange-400 group-hover:shadow-2xl transition-shadow">
                              {filteredPathologies[2].pathology.is_red_flag && (
                                <div className="mb-2 bg-red-50 border-2 border-red-500 rounded p-1.5">
                                  <div className="flex items-center gap-1 text-red-700">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span className="text-xs font-bold">URGENT</span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="text-center">
                                {filteredPathologies[2].pathology.topographic_image_url ? (
                                  <div className="h-32 mb-3 flex items-center justify-center">
                                    <img
                                      src={filteredPathologies[2].pathology.topographic_image_url}
                                      alt={filteredPathologies[2].pathology.name}
                                      className="max-h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-4xl mb-3">🥉</div>
                                )}
                                <h4 className="font-bold text-sm text-gray-900 line-clamp-2 mb-2">
                                  {filteredPathologies[2].pathology.name}
                                </h4>
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                  <Activity className="h-3 w-3" />
                                  <span>{filteredPathologies[2].tests.length} tests</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-40 h-24 bg-gradient-to-b from-orange-200 to-orange-400"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Liste des pathologies restantes (si >3) */}
                  {filteredPathologies.length > 3 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary-600" />
                        Autres pathologies à considérer
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPathologies.slice(3).map((match) => (
                          <div 
                            key={match.pathology.id}
                            className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-lg cursor-pointer overflow-hidden p-4"
                            onClick={() => {
                              setSelectedPathology(match.pathology)
                              setCurrentStep('tests')
                            }}
                          >
                            {/* Score compact */}
                            <div className="absolute top-3 right-3">
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full px-3 py-1 shadow">
                                {Math.round(match.matchScore)}%
                              </div>
                            </div>

                            {/* Badge Inclusion/Exclusion */}
                            {(() => {
                              const badgeProps = getInclusionBadgeProps(
                                match.pathology,
                                patientData,
                                match.inclusionModifier || 1.0
                              )
                              if (!badgeProps?.show) return null
                              
                              return (
                                <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs font-bold ${
                                  badgeProps.type === 'excluded' ? 'bg-red-600 text-white' :
                                  badgeProps.type === 'bonus' ? 'bg-green-600 text-white' :
                                  'bg-orange-500 text-white'
                                }`}>
                                  {badgeProps.label}
                                </div>
                              )
                            })()}

                            {/* Badge Drapeau Rouge */}
                            {match.pathology.is_red_flag && (
                              <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-1 shadow-lg animate-pulse flex items-center gap-1 z-10">
                                <AlertCircle className="h-3 w-3" />
                                <span>URGENT</span>
                              </div>
                            )}

                            <div className="flex gap-4">
                              {match.pathology.topographic_image_url ? (
                                <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                                  <img
                                    src={match.pathology.topographic_image_url}
                                    alt={match.pathology.name}
                                    className="w-full h-full object-contain p-1"
                                  />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                  📋
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2">
                                  {match.pathology.name}
                                </h4>
                                
                                {match.pathology.is_red_flag && match.pathology.red_flag_reason && (
                                  <div className="mb-2 bg-red-50 border border-red-200 rounded p-2">
                                    <p className="text-xs text-red-700 leading-tight">
                                      {match.pathology.red_flag_reason}
                                    </p>
                                  </div>
                                )}
                                
                                {match.matchedCriteria.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {match.matchedCriteria.map(criteria => (
                                      <div key={criteria} className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">
                                        <CheckCircle className="h-2.5 w-2.5" />
                                        <span className="truncate">{criteria}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />
                                    <span>{match.tests.length}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    <span>{match.clusters.length}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Si moins de 3 pathologies, affichage standard */}
                  {filteredPathologies.length < 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredPathologies.map((match) => (
                        <div 
                          key={match.pathology.id}
                          className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-2xl cursor-pointer overflow-hidden"
                          onClick={() => {
                            setSelectedPathology(match.pathology)
                            setCurrentStep('tests')
                          }}
                        >
                          <div className="absolute top-4 right-4 z-20">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full px-4 py-2 shadow-lg">
                              {Math.round(match.matchScore)}%
                            </div>
                          </div>

                          {match.pathology.topographic_image_url ? (
                            <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-b-2 border-gray-200">
                              <img
                                src={match.pathology.topographic_image_url}
                                alt={match.pathology.name}
                                className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110"
                              />
                            </div>
                          ) : (
                            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-b-2 border-gray-200">
                              <div className="text-gray-300 text-5xl">📋</div>
                            </div>
                          )}

                          <div className="p-5">
                            <h3 className="font-bold text-xl text-gray-900 mb-3">
                              {match.pathology.name}
                            </h3>
                            
                            {match.pathology.description && (
                              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                {match.pathology.description}
                              </p>
                            )}

                            {match.matchedCriteria.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                  {match.matchedCriteria.map(criteria => (
                                    <div key={criteria} className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                      <CheckCircle className="h-3 w-3" />
                                      <span>{criteria}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

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

                            <button className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center gap-2 font-semibold">
                              Évaluer
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Étape 5: Tests */}
        {currentStep === 'tests' && selectedPathology && (
          <div className="space-y-6">
            {/* En-tête de la pathologie */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {/* Badge Drapeau Rouge en haut */}
                  {selectedPathology.is_red_flag && (
                    <div className="mb-4 bg-red-50 border-2 border-red-500 rounded-xl p-4 animate-pulse">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-red-800 font-bold text-lg mb-2 flex items-center gap-2">
                            🚨 DRAPEAU ROUGE - URGENCE
                          </h3>
                          <p className="text-red-700 text-sm leading-relaxed">
                            {selectedPathology.red_flag_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profil Patient */}
                  <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Profil Patient</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-3xl mb-1">
                              {AGE_RANGES.find(r => r.value === patientData.age)?.icon}
                            </div>
                            <div className="text-xs text-gray-600">Âge</div>
                            <div className="font-bold text-purple-900">
                              {AGE_RANGES.find(r => r.value === patientData.age)?.label}
                            </div>
                          </div>
                          <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-3xl mb-1">
                              {SEX_OPTIONS.find(s => s.value === patientData.sex)?.icon}
                            </div>
                            <div className="text-xs text-gray-600">Sexe</div>
                            <div className="font-bold text-purple-900">
                              {SEX_OPTIONS.find(s => s.value === patientData.sex)?.label}
                            </div>
                          </div>
                          <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-3xl mb-1">
                              {LIFESTYLE_OPTIONS.find(l => l.value === patientData.lifestyle)?.icon}
                            </div>
                            <div className="text-xs text-gray-600">Activité</div>
                            <div className="font-bold text-purple-900">
                              {LIFESTYLE_OPTIONS.find(l => l.value === patientData.lifestyle)?.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Titre et image */}
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedPathology.name}
                      </h2>
                      
                      {selectedPathology.description && (
                        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                          <div className="flex items-start gap-2">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-blue-900 font-semibold mb-2">Description</h3>
                              <div className="text-sm text-blue-800 whitespace-pre-line leading-relaxed">
                                {selectedPathology.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedPathology.topographic_image_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={selectedPathology.topographic_image_url} 
                          alt={selectedPathology.name}
                          className="h-48 w-48 object-contain rounded-lg border-2 border-gray-200 bg-white p-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setCurrentStep('pathologies')
                    setSelectedPathology(null)
                  }}
                  className="ml-4 text-gray-600 hover:text-primary-600 flex items-center gap-1 flex-shrink-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Retour
                </button>
              </div>

              {/* RÉSUMÉ DES CRITÈRES DE TRIAGE */}
              <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Correspondance avec vos réponses au triage
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Évolution temporelle */}
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Évolution</h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Votre réponse :</p>
                        <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                          <p className="text-sm font-bold text-blue-900">
                            {TRIAGE_QUESTIONS[0].options.find(o => o.value === triageAnswers.temporalEvolution)?.label || 'Non renseigné'}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            {TRIAGE_QUESTIONS[0].options.find(o => o.value === triageAnswers.temporalEvolution)?.description}
                          </p>
                        </div>
                      </div>

                      {/* Type de douleur */}
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Activity className="h-5 w-5 text-purple-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Type douleur</h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Votre réponse :</p>
                        <div className="bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                          <p className="text-sm font-bold text-purple-900">
                            {TRIAGE_QUESTIONS[1].options.find(o => o.value === triageAnswers.painType)?.label || 'Non renseigné'}
                          </p>
                          <p className="text-xs text-purple-700 mt-1">
                            {TRIAGE_QUESTIONS[1].options.find(o => o.value === triageAnswers.painType)?.description}
                          </p>
                        </div>
                      </div>

                      {/* Localisation */}
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <MapPin className="h-5 w-5 text-green-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Localisation</h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Votre réponse :</p>
                        <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                          <p className="text-sm font-bold text-green-900">
                            {TRIAGE_QUESTIONS[2].options.find(o => o.value === triageAnswers.painLocation)?.label || 'Non renseigné'}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {TRIAGE_QUESTIONS[2].options.find(o => o.value === triageAnswers.painLocation)?.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Score de correspondance */}
                    {(() => {
                      const match = filteredPathologies.find(p => p.pathology.id === selectedPathology.id)
                      if (match) {
                        return (
                          <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-xl">
                                  <Target className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">Score de correspondance</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {match.matchedCriteria.map(criteria => (
                                      <div key={criteria} className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        <span>{criteria}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-4xl font-bold text-green-600">
                                  {Math.round(match.matchScore)}%
                                </div>
                                <p className="text-xs text-gray-500 mt-1 font-medium">
                                  {match.matchedCriteria.length}/3 critères matchés
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              </div>

              {/* Informations patient et sauvegarde */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={consultationData.patientName}
                    onChange={(e) => setConsultationData(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="Nom du patient"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={consultationData.patientAge}
                    onChange={(e) => setConsultationData(prev => ({ ...prev, patientAge: e.target.value }))}
                    placeholder="Âge"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="date"
                    value={consultationData.consultationDate}
                    onChange={(e) => setConsultationData(prev => ({ ...prev, consultationDate: e.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>

                <textarea
                  value={consultationData.notes}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />

                <div className="flex gap-3">
                  <button
                    onClick={saveConsultation}
                    disabled={saving || !consultationData.patientName}
                    className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  
                  <button
                    onClick={generatePDF}
                    disabled={!consultationData.patientName}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}