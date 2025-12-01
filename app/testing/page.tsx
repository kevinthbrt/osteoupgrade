'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { generateTestingPDF } from '@/utils/generateTestingPDF'
import dynamic from 'next/dynamic'
import {
  Plus,
  Download,
  Save,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  FileText,
  Loader2,
  X,
  Search,
  Filter
} from 'lucide-react'

// Composant 3D chargé côté client
const TestingViewer3D = dynamic(() => import('@/components/TestingViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement du modèle 3D...</p>
      </div>
    </div>
  )
})

// ============================================================================
// TYPES
// ============================================================================

interface TestingSessionResult {
  testId: string
  testName: string
  category: string
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
  results: TestingSessionResult[]
  notes: string
}

interface AnatomicalZone {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  position_x: number
  position_y: number
  position_z: number
  size_x: number
  size_y: number
  size_z: number
  is_symmetric: boolean
  model_path: string | null
  is_active: boolean
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

interface OrthopedicTest {
  id: string
  name: string
  description: string
  category: string
  indications: string | null
  video_url: string | null
  sensitivity: number | null
  specificity: number | null
  rv_positive: number | null
  rv_negative: number | null
  interest: string | null
  sources: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  role: string
  full_name?: string
  email?: string
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function TestingModulePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  
  // Données
  const [zones, setZones] = useState<AnatomicalZone[]>([])
  const [tests, setTests] = useState<OrthopedicTest[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Session en cours
  const [currentSession, setCurrentSession] = useState<TestingSession>({
    patientName: '',
    patientAge: '',
    sessionDate: new Date().toISOString().split('T')[0],
    results: [],
    notes: ''
  })
  
  // Sessions sauvegardées
  const [savedSessions, setSavedSessions] = useState<TestingSession[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [selectedZone, setSelectedZone] = useState<AnatomicalZone | null>(null)
  const [showTestList, setShowTestList] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterIndication, setFilterIndication] = useState('')

  useEffect(() => {
    checkAccess()
    loadData()
    loadSavedSessions()
  }, [])

  const checkAccess = async () => {
    try {
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

      setProfile(profileData)

      if (profileData?.role === 'free') {
        router.push('/dashboard')
        return
      }

      setLoading(false)
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/dashboard')
    }
  }

  const loadData = async () => {
    try {
      const { data: zonesData, error: zonesError } = await supabase
        .from('anatomical_zones')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (zonesError) throw zonesError
      setZones(zonesData || [])

      const { data: testsData, error: testsError } = await supabase
        .from('orthopedic_tests')
        .select('*')
        .order('name')

      if (testsError) throw testsError
      setTests(testsData || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleZoneClick = (zone: AnatomicalZone) => {
    setSelectedZone(zone)
    setShowTestList(true)
  }

  const addTestToSession = (test: OrthopedicTest) => {
    const isAlreadyAdded = currentSession.results.some((r: TestingSessionResult) => r.testId === test.id)
    
    if (isAlreadyAdded) {
      alert('Ce test est déjà dans la liste')
      return
    }

    const newResult: TestingSessionResult = {
      testId: test.id,
      testName: test.name,
      category: test.category || selectedZone?.name || '',
      region: test.category || selectedZone?.name || '',
      result: null,
      notes: '',
      sensitivity: test.sensitivity || undefined,
      specificity: test.specificity || undefined
    }

    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      results: [...prev.results, newResult]
    }))

    setShowTestList(false)
  }

  const updateTestResult = (testId: string, result: 'positive' | 'negative' | 'uncertain') => {
    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      results: prev.results.map((r: TestingSessionResult) => 
        r.testId === testId ? { ...r, result } : r
      )
    }))
  }

  const updateTestNotes = (testId: string, notes: string) => {
    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      results: prev.results.map((r: TestingSessionResult) => 
        r.testId === testId ? { ...r, notes } : r
      )
    }))
  }

  const removeTestResult = (testId: string) => {
    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      results: prev.results.filter((r: TestingSessionResult) => r.testId !== testId)
    }))
  }

  const loadSavedSessions = () => {
    try {
      const saved = localStorage.getItem('testingSessions')
      if (saved) {
        setSavedSessions(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved sessions:', error)
    }
  }

  const saveSession = () => {
    if (!currentSession.patientName.trim()) {
      alert('Veuillez entrer le nom du patient')
      return
    }

    const sessionWithId = {
      ...currentSession,
      id: currentSession.id || Date.now().toString()
    }

    const existingIndex = savedSessions.findIndex(s => s.id === sessionWithId.id)
    let updatedSessions: TestingSession[]

    if (existingIndex >= 0) {
      updatedSessions = [...savedSessions]
      updatedSessions[existingIndex] = sessionWithId
    } else {
      updatedSessions = [...savedSessions, sessionWithId]
    }

    setSavedSessions(updatedSessions)
    localStorage.setItem('testingSessions', JSON.stringify(updatedSessions))
    
    alert('Session sauvegardée !')
  }

  const loadSession = (session: TestingSession) => {
    setCurrentSession(session)
  }

  const deleteSession = (sessionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      const updatedSessions = savedSessions.filter(s => s.id !== sessionId)
      setSavedSessions(updatedSessions)
      localStorage.setItem('testingSessions', JSON.stringify(updatedSessions))
    }
  }

  const newSession = () => {
    setCurrentSession({
      patientName: '',
      patientAge: '',
      sessionDate: new Date().toISOString().split('T')[0],
      results: [],
      notes: ''
    })
  }

  const exportToPDF = () => {
    if (!currentSession.patientName.trim()) {
      alert('Veuillez entrer le nom du patient avant d\'exporter')
      return
    }

    if (currentSession.results.length === 0) {
      alert('Aucun test dans la session')
      return
    }

    generateTestingPDF(currentSession)
  }

  const getFilteredTests = () => {
    if (!selectedZone) return []

    let filtered = tests.filter((test: OrthopedicTest) => test.category === selectedZone.name)

    if (searchQuery) {
      filtered = filtered.filter((test: OrthopedicTest) =>
        test.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterIndication) {
      filtered = filtered.filter((test: OrthopedicTest) =>
        test.indications?.toLowerCase().includes(filterIndication.toLowerCase())
      )
    }

    return filtered
  }

  const stats = {
    total: currentSession.results.length,
    positive: currentSession.results.filter((r: TestingSessionResult) => r.result === 'positive').length,
    negative: currentSession.results.filter((r: TestingSessionResult) => r.result === 'negative').length,
    uncertain: currentSession.results.filter((r: TestingSessionResult) => r.result === 'uncertain').length
  }

  if (loading || loadingData) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Testing 3D</h1>
              <p className="text-green-100 mt-1">
                Sélectionnez une zone anatomique pour voir les tests disponibles
              </p>
            </div>
            <button
              onClick={newSession}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Session
            </button>
          </div>
        </div>

        {/* Informations patient - EN HAUT */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <User className="h-5 w-5 inline mr-2" />
            Informations patient
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du patient
              </label>
              <input
                type="text"
                value={currentSession.patientName}
                onChange={(e) => setCurrentSession((prev: TestingSession) => ({
                  ...prev,
                  patientName: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Nom complet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Âge
              </label>
              <input
                type="text"
                value={currentSession.patientAge}
                onChange={(e) => setCurrentSession((prev: TestingSession) => ({
                  ...prev,
                  patientAge: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ex: 45 ans"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={currentSession.sessionDate}
                onChange={(e) => setCurrentSession((prev: TestingSession) => ({
                  ...prev,
                  sessionDate: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes générales
            </label>
            <textarea
              value={currentSession.notes}
              onChange={(e) => setCurrentSession((prev: TestingSession) => ({
                ...prev,
                notes: e.target.value
              }))}
              className="w-full px-3 py-2 border rounded-lg resize-none"
              rows={2}
              placeholder="Observations générales..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={saveSession}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Sauvegarder
            </button>
            <button
              onClick={exportToPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter PDF
            </button>
          </div>
        </div>

        {/* Stats */}
        {currentSession.results.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-green-600">Positifs</p>
              <p className="text-2xl font-bold text-green-700">{stats.positive}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-red-600">Négatifs</p>
              <p className="text-2xl font-bold text-red-700">{stats.negative}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-yellow-600">Incertains</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.uncertain}</p>
            </div>
          </div>
        )}

        {/* Contenu principal - MODULE 3D À GAUCHE, TESTS À DROITE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module 3D - 2 colonnes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visualisateur 3D */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Modèle anatomique 3D
              </h2>
              {zones.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Aucune zone anatomique configurée.</p>
                  <p className="text-sm mt-2">Utilisez Anatomy Builder pour créer des zones.</p>
                </div>
              ) : (
                <TestingViewer3D
                  zones={zones}
                  onZoneClick={handleZoneClick}
                />
              )}
            </div>

            {/* Tests sélectionnés */}
            {currentSession.results.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Tests de la session ({currentSession.results.length})
                </h2>
                <div className="space-y-4">
                  {currentSession.results.map((result: TestingSessionResult) => (
                    <div key={result.testId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{result.testName}</h3>
                          <p className="text-sm text-gray-600">{result.category}</p>
                        </div>
                        <button
                          onClick={() => removeTestResult(result.testId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Boutons résultat */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                          onClick={() => updateTestResult(result.testId, 'positive')}
                          className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                            result.result === 'positive'
                              ? 'bg-green-100 text-green-700 border-2 border-green-600'
                              : 'bg-gray-50 text-gray-700 hover:bg-green-50'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Positif
                        </button>
                        <button
                          onClick={() => updateTestResult(result.testId, 'negative')}
                          className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                            result.result === 'negative'
                              ? 'bg-red-100 text-red-700 border-2 border-red-600'
                              : 'bg-gray-50 text-gray-700 hover:bg-red-50'
                          }`}
                        >
                          <XCircle className="h-4 w-4" />
                          Négatif
                        </button>
                        <button
                          onClick={() => updateTestResult(result.testId, 'uncertain')}
                          className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                            result.result === 'uncertain'
                              ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-600'
                              : 'bg-gray-50 text-gray-700 hover:bg-yellow-50'
                          }`}
                        >
                          <AlertCircle className="h-4 w-4" />
                          Incertain
                        </button>
                      </div>

                      {/* Commentaires */}
                      <textarea
                        value={result.notes}
                        onChange={(e) => updateTestNotes(result.testId, e.target.value)}
                        placeholder="Commentaires..."
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                        rows={2}
                      />

                      {/* Stats test */}
                      {(result.sensitivity || result.specificity) && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {result.sensitivity && (
                            <span>Sensibilité: {result.sensitivity}%</span>
                          )}
                          {result.specificity && (
                            <span>Spécificité: {result.specificity}%</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TESTS À DROITE - 1 colonne */}
          <div className="space-y-6">
            {/* Liste des tests de la zone */}
            {showTestList && selectedZone && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tests - {selectedZone.display_name}
                  </h2>
                  <button
                    onClick={() => setShowTestList(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Filtres */}
                <div className="space-y-2 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Indication..."
                      value={filterIndication}
                      onChange={(e) => setFilterIndication(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Tests */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {getFilteredTests().map((test: OrthopedicTest) => (
                    <div
                      key={test.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => addTestToSession(test)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                          {test.indications && (
                            <p className="text-xs text-gray-600 mt-1">{test.indications}</p>
                          )}
                          {(test.sensitivity || test.specificity) && (
                            <div className="flex gap-2 mt-2 text-xs text-gray-500">
                              {test.sensitivity && <span>Se: {test.sensitivity}%</span>}
                              {test.specificity && <span>Sp: {test.specificity}%</span>}
                            </div>
                          )}
                        </div>
                        <Plus className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                  {getFilteredTests().length === 0 && (
                    <p className="text-center text-gray-500 py-8 text-sm">
                      Aucun test trouvé
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sessions sauvegardées */}
            {savedSessions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  <FileText className="h-5 w-5 inline mr-2" />
                  Sessions sauvegardées
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedSessions.map((session: TestingSession) => (
                    <div
                      key={session.id}
                      className="border rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {session.patientName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(session.sessionDate).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {session.results.length} test{session.results.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => loadSession(session)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Charger"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => session.id && deleteSession(session.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
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
        </div>
      </div>
    </AuthLayout>
  )
}