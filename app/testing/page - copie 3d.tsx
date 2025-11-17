'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { generateTestingPDF } from '@/utils/generateTestingPDF'
import dynamic from 'next/dynamic'
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
  Droplet,
  Maximize2
} from 'lucide-react'

// Charger le composant 3D uniquement côté client
const AnatomyViewer3D = dynamic(() => import('@/components/AnatomyViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement du modèle anatomique 3D...</p>
      </div>
    </div>
  )
})

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTests, setSelectedTests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showPathologyModal, setShowPathologyModal] = useState(false)
  const [selectedPathologies, setSelectedPathologies] = useState<string[]>([])
  const [selectedStructure, setSelectedStructure] = useState<string>('')
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
  const [is3DView, setIs3DView] = useState(true)

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

  const handlePathologySelect = (pathologies: string[], structureName: string) => {
    setSelectedPathologies(pathologies)
    setSelectedStructure(structureName)
    setShowPathologyModal(true)
  }

  const handleCategoryClick = (categoryKey: string) => {
    setSelectedCategory(categoryKey)
    const categoryTests = tests.filter(test => test.category === categoryKey)
    setSelectedTests(categoryTests)
    setShowTestModal(true)
  }

  const addTestResult = (test: any) => {
    const newResult: TestResult = {
      testId: test.id,
      testName: test.name,
      region: test.category,
      result: null,
      notes: '',
      sensitivity: test.sensitivity,
      specificity: test.specificity
    }

    setCurrentSession(prev => ({
      ...prev,
      results: [...prev.results, newResult]
    }))
  }

  const updateTestResult = (testId: string, result: 'positive' | 'negative' | 'uncertain') => {
    setCurrentSession(prev => ({
      ...prev,
      results: prev.results.map(r =>
        r.testId === testId ? { ...r, result } : r
      )
    }))
  }

  const updateTestNotes = (testId: string, notes: string) => {
    setCurrentSession(prev => ({
      ...prev,
      results: prev.results.map(r =>
        r.testId === testId ? { ...r, notes } : r
      )
    }))
  }

  const removeTestResult = (testId: string) => {
    setCurrentSession(prev => ({
      ...prev,
      results: prev.results.filter(r => r.testId !== testId)
    }))
  }

  const saveSession = () => {
    if (!currentSession.patientName) {
      alert('Veuillez entrer le nom du patient')
      return
    }

    setSaving(true)
    const sessionToSave = {
      ...currentSession,
      id: currentSession.id || Date.now().toString()
    }

    const existingIndex = savedSessions.findIndex(s => s.id === sessionToSave.id)
    let updatedSessions

    if (existingIndex >= 0) {
      updatedSessions = [...savedSessions]
      updatedSessions[existingIndex] = sessionToSave
    } else {
      updatedSessions = [sessionToSave, ...savedSessions]
    }

    localStorage.setItem('testingSessions', JSON.stringify(updatedSessions))
    setSavedSessions(updatedSessions)
    setSaving(false)
    alert('Session sauvegardée avec succès')
  }

  const loadSession = (session: TestingSession) => {
    setCurrentSession(session)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteSession = (sessionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      const updated = savedSessions.filter(s => s.id !== sessionId)
      localStorage.setItem('testingSessions', JSON.stringify(updated))
      setSavedSessions(updated)
    }
  }

  const newSession = () => {
    if (currentSession.results.length > 0) {
      if (!confirm('Créer une nouvelle session ? Les données non sauvegardées seront perdues.')) {
        return
      }
    }

    setCurrentSession({
      patientName: '',
      patientAge: '',
      sessionDate: new Date().toISOString().split('T')[0],
      results: [],
      notes: ''
    })
  }

  const stats = {
    total: currentSession.results.length,
    positive: currentSession.results.filter(r => r.result === 'positive').length,
    negative: currentSession.results.filter(r => r.result === 'negative').length,
    uncertain: currentSession.results.filter(r => r.result === 'uncertain').length,
    byRegion: currentSession.results.reduce((acc, r) => {
      acc[r.region] = (acc[r.region] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🧪 Module de Testing</h1>
              <p className="text-primary-100">
                Sélectionnez une région anatomique pour effectuer vos tests
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIs3DView(!is3DView)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Maximize2 className="h-5 w-5" />
                {is3DView ? 'Vue 2D' : 'Vue 3D'}
              </button>
            </div>
          </div>
        </div>

        {/* Section principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visualisation anatomique 3D */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-primary-50 to-primary-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary-600" />
                Modèle Anatomique Interactif
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Cliquez sur une région puis sur une structure pour voir les pathologies
              </p>
            </div>

            {is3DView ? (
              <AnatomyViewer3D onPathologySelect={handlePathologySelect} />
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Vue 2D à venir...</p>
              </div>
            )}

            {/* Catégories générales */}
            <div className="p-4 border-t bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tests Généraux</h3>
              <div className="grid grid-cols-3 gap-2">
                {GENERAL_CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleCategoryClick(cat.key)}
                      className="p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1 text-gray-600 group-hover:text-primary-600" />
                      <p className="text-xs font-medium text-gray-900">{cat.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Session en cours */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-primary-600" />
                Session en cours
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={newSession}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Nouvelle session"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Statistiques"
                >
                  <BarChart className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Infos patient */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Nom du patient
                </label>
                <input
                  type="text"
                  value={currentSession.patientName}
                  onChange={(e) =>
                    setCurrentSession({ ...currentSession, patientName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nom complet"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Âge
                  </label>
                  <input
                    type="text"
                    value={currentSession.patientAge}
                    onChange={(e) =>
                      setCurrentSession({ ...currentSession, patientAge: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="ex: 45 ans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="inline h-4 w-4 mr-1" />
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
            </div>

            {/* Tests effectués */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Tests effectués ({currentSession.results.length})
                </h3>
              </div>

              {currentSession.results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun test effectué</p>
                  <p className="text-sm">Cliquez sur une région pour commencer</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {currentSession.results.map((result) => (
                    <div
                      key={result.testId}
                      className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{result.testName}</p>
                          <p className="text-sm text-gray-600 mb-2">{result.region}</p>

                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => updateTestResult(result.testId, 'positive')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                result.result === 'positive'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                              }`}
                            >
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              Positif
                            </button>
                            <button
                              onClick={() => updateTestResult(result.testId, 'negative')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                result.result === 'negative'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-red-50'
                              }`}
                            >
                              <XCircle className="inline h-4 w-4 mr-1" />
                              Négatif
                            </button>
                            <button
                              onClick={() => updateTestResult(result.testId, 'uncertain')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                result.result === 'uncertain'
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-yellow-50'
                              }`}
                            >
                              <AlertCircle className="inline h-4 w-4 mr-1" />
                              Incertain
                            </button>
                          </div>

                          <div className="flex gap-3">
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

            {/* Notes de session */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes de session
              </label>
              <textarea
                value={currentSession.notes}
                onChange={(e) =>
                  setCurrentSession({ ...currentSession, notes: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Observations générales, conclusions..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={saveSession}
                disabled={saving || !currentSession.patientName}
                className="flex-1 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>

              <button
                onClick={() => generateTestingPDF(currentSession)}
                disabled={currentSession.results.length === 0}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                Exporter PDF
              </button>
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

      {/* Modal de pathologies */}
      {showPathologyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-primary-50 to-primary-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Pathologies - {selectedStructure}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Cliquez sur une pathologie pour ajouter les tests associés
                  </p>
                </div>
                <button
                  onClick={() => setShowPathologyModal(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {selectedPathologies.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune pathologie définie pour cette structure</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {selectedPathologies.map((pathology, index) => (
                    <div
                      key={index}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                            {pathology}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Cliquez pour voir les tests diagnostiques
                          </p>
                        </div>
                        <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-primary-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de sélection de tests */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Tests - {selectedCategory}
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

              {Object.keys(stats.byRegion).length > 0 && (
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
              )}
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
