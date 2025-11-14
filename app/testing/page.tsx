'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { generateTestingPDF, generateStatsSummary } from '@/utils/generateTestingPDF'
import {
  Activity,
  Search,
  Plus,
  FileText,
  Download,
  Save,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  X,
  Edit,
  Trash2,
  Clipboard,
  BarChart,
  Brain,
  Droplet
} from 'lucide-react'

// Zones cliquables sur le bonhomme
const BODY_ZONES = {
  head: {
    name: 'Tête et Cou',
    regions: ['Cervical', 'ATM', 'Crâne'],
    position: { top: '5%', left: '45%', width: '10%', height: '8%' }
  },
  leftShoulder: {
    name: 'Épaule gauche',
    regions: ['Épaule'],
    position: { top: '18%', left: '28%', width: '8%', height: '8%' }
  },
  rightShoulder: {
    name: 'Épaule droite',
    regions: ['Épaule'],
    position: { top: '18%', right: '28%', width: '8%', height: '8%' }
  },
  leftElbow: {
    name: 'Coude gauche',
    regions: ['Coude'],
    position: { top: '28%', left: '25%', width: '6%', height: '6%' }
  },
  rightElbow: {
    name: 'Coude droit',
    regions: ['Coude'],
    position: { top: '28%', right: '25%', width: '6%', height: '6%' }
  },
  leftWrist: {
    name: 'Poignet / Main gauche',
    regions: ['Poignet', 'Main'],
    position: { top: '38%', left: '22%', width: '6%', height: '8%' }
  },
  rightWrist: {
    name: 'Poignet / Main droite',
    regions: ['Poignet', 'Main'],
    position: { top: '38%', right: '22%', width: '6%', height: '8%' }
  },
  trunk: {
    name: 'Tronc',
    regions: ['Thoracique', 'Lombaire', 'Sacro-iliaque', 'Côtes'],
    position: { top: '24%', left: '42%', width: '16%', height: '24%' }
  },
  leftHip: {
    name: 'Hanche gauche',
    regions: ['Hanche'],
    position: { top: '48%', left: '40%', width: '8%', height: '8%' }
  },
  rightHip: {
    name: 'Hanche droite',
    regions: ['Hanche'],
    position: { top: '48%', right: '40%', width: '8%', height: '8%' }
  },
  leftKnee: {
    name: 'Genou gauche',
    regions: ['Genou'],
    position: { top: '60%', left: '40%', width: '8%', height: '8%' }
  },
  rightKnee: {
    name: 'Genou droit',
    regions: ['Genou'],
    position: { top: '60%', right: '40%', width: '8%', height: '8%' }
  },
  leftAnkle: {
    name: 'Cheville / Pied gauche',
    regions: ['Cheville', 'Pied'],
    position: { top: '78%', left: '40%', width: '8%', height: '10%' }
  },
  rightAnkle: {
    name: 'Cheville / Pied droit',
    regions: ['Cheville', 'Pied'],
    position: { top: '78%', right: '40%', width: '8%', height: '10%' }
  }
} 

const GENERAL_CATEGORIES = [
  {
    key: 'Neurologique',
    label: 'Neuro',
    description: 'Tests neurologiques',
    icon: Brain
  },
  {
    key: 'Vasculaire',
    label: 'Vascu',
    description: 'Tests vasculaires',
    icon: Activity
  },
  {
    key: 'Systémique',
    label: 'Systémique',
    description: 'Tests systémiques',
    icon: Droplet
  }
] as const

interface TestResult {
  testId: string
  testName: string
  region: string
  result: 'positive' | 'negative' | 'uncertain' | null
  notes: string
  sensitivity?: number
  specificity?: number
}

interface TestingSession {
  id?: string
  patientName: string
  patientAge: string
  sessionDate: string
  results: TestResult[]
  notes: string
}

export default function TestingModulePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [tests, setTests] = useState<any[]>([])
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null) // Neuro / Vascu / Systémique
  const [selectedTests, setSelectedTests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [currentSession, setCurrentSession] = useState<TestingSession>({
    patientName: '',
    patientAge: '',
    sessionDate: new Date().toISOString().split('T')[0],
    results: [],
    notes: ''
  })
  const [savedSessions, setSavedSessions] = useState<TestingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAccess()
    loadTests()
    loadSessions()
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

  const loadTests = async () => {
    const { data } = await supabase
      .from('orthopedic_tests')
      .select('*')
      .order('name')

    setTests(data || [])
  }

  const loadSessions = () => {
    const saved = localStorage.getItem('testingSessions')
    if (saved) {
      setSavedSessions(JSON.parse(saved))
    }
  }

  // --- Sélection des zones du bonhomme ---

  const handleZoneClick = (zoneKey: string) => {
    const zone = BODY_ZONES[zoneKey as keyof typeof BODY_ZONES]
    setSelectedZone(zoneKey)
    setSelectedCategory(null)

    const regionTests = tests.filter(test =>
      zone.regions.includes(test.category)
    )
    setSelectedTests(regionTests)
    setShowTestModal(true)
  }

  const handleGeneralCategoryClick = (categoryKey: string) => {
    setSelectedZone(null)
    setSelectedCategory(categoryKey)
    const regionTests = tests.filter(test => test.category === categoryKey)
    setSelectedTests(regionTests)
    setShowTestModal(true)
  }

  // --- Gestion des résultats ---

  const addTestResult = (test: any) => {
    const existingIndex = currentSession.results.findIndex(r => r.testId === test.id)

    if (existingIndex >= 0) {
      const newResults = [...currentSession.results]
      newResults[existingIndex] = {
        ...newResults[existingIndex],
        testName: test.name
      }
      setCurrentSession({ ...currentSession, results: newResults })
    } else {
      const newResult: TestResult = {
        testId: test.id,
        testName: test.name,
        region: test.category,
        result: null,
        notes: '',
        sensitivity: test.sensitivity,
        specificity: test.specificity
      }
      setCurrentSession({
        ...currentSession,
        results: [...currentSession.results, newResult]
      })
    }
  }

  const updateTestResult = (testId: string, result: 'positive' | 'negative' | 'uncertain' | null) => {
    const newResults = currentSession.results.map(r =>
      r.testId === testId ? { ...r, result } : r
    )
    setCurrentSession({ ...currentSession, results: newResults })
  }

  const updateTestNotes = (testId: string, notes: string) => {
    const newResults = currentSession.results.map(r =>
      r.testId === testId ? { ...r, notes } : r
    )
    setCurrentSession({ ...currentSession, results: newResults })
  }

  const removeTestResult = (testId: string) => {
    const newResults = currentSession.results.filter(r => r.testId !== testId)
    setCurrentSession({ ...currentSession, results: newResults })
  }

  // --- Sauvegarde / export ---

  const saveSession = () => {
    if (!currentSession.patientName) {
      alert('Veuillez entrer le nom du patient')
      return
    }

    setSaving(true)
    const sessionToSave = {
      ...currentSession,
      id: Date.now().toString()
    }

    const newSessions = [...savedSessions, sessionToSave]
    setSavedSessions(newSessions)
    localStorage.setItem('testingSessions', JSON.stringify(newSessions))

    setCurrentSession({
      patientName: '',
      patientAge: '',
      sessionDate: new Date().toISOString().split('T')[0],
      results: [],
      notes: ''
    })

    setSaving(false)
    alert('Session sauvegardée avec succès !')
  }

  const exportToPDF = () => {
    if (currentSession.results.length === 0) {
      alert('Aucun test à exporter')
      return
    }

    generateTestingPDF(currentSession)
  }

  const loadSession = (session: TestingSession) => {
    setCurrentSession(session)
  }

  const deleteSession = (sessionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      const newSessions = savedSessions.filter(s => s.id !== sessionId)
      setSavedSessions(newSessions)
      localStorage.setItem('testingSessions', JSON.stringify(newSessions))
    }
  }

  // --- Lien résultats <-> zones ---

  const getZonesWithResults = () => {
    const zonesWithTests: Set<string> = new Set()
    currentSession.results.forEach(result => {
      Object.entries(BODY_ZONES).forEach(([key, zone]) => {
        if (zone.regions.includes(result.region)) {
          zonesWithTests.add(key)
        }
      })
    })
    return zonesWithTests
  }

  const stats = generateStatsSummary(currentSession.results)
  const zonesWithResults = getZonesWithResults()

  const hasTestsForGeneralCategory = (categoryKey: string) =>
    currentSession.results.some(r => r.region === categoryKey)

  const getSelectionLabel = () => {
    if (selectedZone && BODY_ZONES[selectedZone as keyof typeof BODY_ZONES]) {
      return BODY_ZONES[selectedZone as keyof typeof BODY_ZONES].name
    }
    if (selectedCategory) return selectedCategory
    return 'la sélection'
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
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary-600" />
                Module de Testing
              </h1>
              <p className="mt-1 text-gray-600">
                Réalisez et documentez vos tests orthopédiques
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatsModal(true)}
                disabled={currentSession.results.length === 0}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <BarChart className="h-4 w-4" />
                Stats
              </button>
              <button
                onClick={exportToPDF}
                disabled={currentSession.results.length === 0}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
              <button
                onClick={saveSession}
                disabled={currentSession.results.length === 0 || saving}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bonhomme anatomique */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sélectionnez une zone
              </h2>
              <div className="relative mx-auto" style={{ maxWidth: '300px' }}>
                {/* Silhouette */}
                <svg viewBox="0 0 200 400" className="w-full h-auto drop-shadow-sm">
                  {/* Corps simplifié */}
                  <g>
                    <circle cx="100" cy="40" r="25" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="90" y="60" width="20" height="20" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="70" y="80" width="60" height="80" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="40" y="85" width="25" height="60" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="35" y="145" width="20" height="50" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="135" y="85" width="25" height="60" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="145" y="145" width="20" height="50" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="70" y="160" width="60" height="40" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="75" y="200" width="20" height="80" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="70" y="280" width="20" height="70" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="65" y="350" width="25" height="30" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="105" y="200" width="20" height="80" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="110" y="280" width="20" height="70" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    <rect x="110" y="350" width="25" height="30" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                  </g>

                  {/* Zones interactives */}
                  {Object.entries(BODY_ZONES).map(([key, zone]) => {
                    const hasResults = zonesWithResults.has(key)
                    const position = zone.position as any
                    const isSelected = selectedZone === key

                    let x = 0
                    if ('left' in position) {
                      x = (parseFloat(position.left) / 100) * 200
                    } else if ('right' in position) {
                      x =
                        200 -
                        (parseFloat(position.right) / 100) * 200 -
                        (parseFloat(position.width) / 100) * 200
                    }

                    const y = (parseFloat(position.top) / 100) * 400
                    const width = (parseFloat(position.width) / 100) * 200
                    const height = (parseFloat(position.height) / 100) * 400

                    const baseFill = hasResults
                      ? 'rgba(34,197,94,0.25)'
                      : 'rgba(59,130,246,0.18)'
                    const selectedFill = 'rgba(37,99,235,0.38)'
                    const strokeColor = isSelected
                      ? '#2563eb'
                      : hasResults
                      ? '#22c55e'
                      : '#3b82f6'

                    return (
                      <g key={key}>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={isSelected ? selectedFill : baseFill}
                          stroke={strokeColor}
                          strokeWidth="2"
                          rx="6"
                          className="cursor-pointer transition-all hover:opacity-80"
                          onClick={() => handleZoneClick(key)}
                          onMouseEnter={() => setHoveredZone(zone.name)}
                          onMouseLeave={() => setHoveredZone(null)}
                        />
                        {hasResults && (
                          <circle
                            cx={x + width / 2}
                            cy={y + height / 2}
                            r="7"
                            fill="#22c55e"
                            className="pointer-events-none"
                          />
                        )}
                      </g>
                    )
                  })}
                </svg>

                {/* Légende dynamique */}
                <div className="mt-3 text-center text-xs text-gray-500 min-h-[1.25rem]">
                  {hoveredZone
                    ? hoveredZone
                    : selectedZone
                    ? BODY_ZONES[selectedZone as keyof typeof BODY_ZONES].name
                    : 'Survolez ou cliquez une zone pour voir le détail'}
                </div>

                {/* Légende couleurs */}
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-200 border-2 border-blue-500 rounded-sm" />
                    <span className="text-gray-600">Zone sélectionnable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded-sm" />
                    <span className="text-gray-600">Zone avec tests réalisés</span>
                  </div>
                </div>

                {/* Tests généraux : Neuro / Vascu / Systémique */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2 text-center">
                    Tests généraux
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {GENERAL_CATEGORIES.map(cat => {
                      const Icon = cat.icon
                      const hasTests = hasTestsForGeneralCategory(cat.key)
                      const isSelected = selectedCategory === cat.key

                      return (
                        <button
                          key={cat.key}
                          onClick={() => handleGeneralCategoryClick(cat.key)}
                          className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-full border text-xs transition-all
                            ${
                              isSelected
                                ? 'bg-primary-50 border-primary-500 text-primary-700'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          title={cat.description}
                        >
                          <Icon className="h-5 w-5 mb-1" />
                          <span>{cat.label}</span>
                          {hasTests && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Infos session + résultats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations patient */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de la session
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du patient
                  </label>
                  <input
                    type="text"
                    value={currentSession.patientName}
                    onChange={(e) =>
                      setCurrentSession({ ...currentSession, patientName: e.target.value })
                    }
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
                    value={currentSession.patientAge}
                    onChange={(e) =>
                      setCurrentSession({ ...currentSession, patientAge: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="45 ans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={currentSession.sessionDate}
                    onChange={(e) =>
                      setCurrentSession({ ...currentSession, sessionDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes générales
                </label>
                <textarea
                  value={currentSession.notes}
                  onChange={(e) =>
                    setCurrentSession({ ...currentSession, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Observations générales..."
                />
              </div>
            </div>

            {/* Résultats des tests */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tests effectués ({currentSession.results.length})
              </h2>

              {currentSession.results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clipboard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun test effectué pour le moment</p>
                  <p className="text-sm mt-1">
                    Cliquez sur une zone du corps ou une icône générale pour ajouter des tests
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSession.results.map((result) => (
                    <div key={result.testId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{result.testName}</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {result.region}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Résultat :</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => updateTestResult(result.testId, 'positive')}
                                  className={`p-2 rounded-lg transition-colors ${
                                    result.result === 'positive'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                  title="Positif"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => updateTestResult(result.testId, 'negative')}
                                  className={`p-2 rounded-lg transition-colors ${
                                    result.result === 'negative'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                  title="Négatif"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => updateTestResult(result.testId, 'uncertain')}
                                  className={`p-2 rounded-lg transition-colors ${
                                    result.result === 'uncertain'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                  title="Incertain"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {result.sensitivity && (
                              <span className="text-xs text-gray-500">
                                Se: {result.sensitivity}%
                              </span>
                            )}
                            {result.specificity && (
                              <span className="text-xs text-gray-500">
                                Sp: {result.specificity}%
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            <input
                              type="text"
                              value={result.notes}
                              onChange={(e) => updateTestNotes(result.testId, e.target.value)}
                              className="w-full text-sm px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-primary-500"
                              placeholder="Notes sur ce test..."
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => removeTestResult(result.testId)}
                          className="ml-4 p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sessions sauvegardées */}
        {savedSessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sessions sauvegardées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{session.patientName}</h3>
                      <p className="text-sm text-gray-600">{session.patientAge}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(session.sessionDate).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-primary-600 mt-2">
                        {session.results.length} tests effectués
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => loadSession(session)}
                        className="p-1 text-gray-400 hover:text-primary-600"
                        title="Charger"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const tempSession = currentSession
                          setCurrentSession(session)
                          generateTestingPDF(session)
                          setCurrentSession(tempSession)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id!)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de sélection de tests */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Tests pour {getSelectionLabel()}
                </h3>
                <button
                  onClick={() => {
                    setShowTestModal(false)
                    setSearchQuery('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un test..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                {selectedTests
                  .filter(
                    (test) =>
                      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      test.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((test) => {
                    const isAdded = currentSession.results.some((r) => r.testId === test.id)

                    return (
                      <button
                        key={test.id}
                        onClick={() => {
                          addTestResult(test)
                          setShowTestModal(false)
                          setSearchQuery('')
                        }}
                        className={`p-3 text-left border rounded-lg transition-colors ${
                          isAdded ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {test.name}
                              {isAdded && (
                                <span className="ml-2 text-green-600 text-sm">(Ajouté)</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de statistiques */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Statistiques de la session</h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total tests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Positifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Négatifs</p>
                  <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Incertains</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.uncertain}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Par région :</p>
                <div className="space-y-1">
                  {Object.entries(stats.byRegion).map(([region, count]) => (
                    <div key={region} className="flex justify-between text-sm">
                      <span className="text-gray-600">{region}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
