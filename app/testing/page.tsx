'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { generateTestingPDF } from '@/utils/generateTestingPDF'
import dynamic from 'next/dynamic'
import {
  Activity,
  Plus,
  Download,
  Save,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  BarChart,
  FileText,
  Loader2,
  X
} from 'lucide-react'

// Charger le composant 3D v2 uniquement côté client
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

interface TestResult {
  testId: string
  testName: string
  pathologyName: string
  region: string          // <--- ajouté
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
  
  // Données anatomiques chargées depuis Supabase
  const [anatomyZones, setAnatomyZones] = useState<any[]>([])
  const [pathologies, setPathologies] = useState<Record<string, any[]>>({})
  const [pathologyTests, setPathologyTests] = useState<Record<string, any[]>>({})
  const [loadingAnatomy, setLoadingAnatomy] = useState(true)
  
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
  const [showStatsModal, setShowStatsModal] = useState(false)

  useEffect(() => {
    checkAccess()
    loadAnatomyData()
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

  const loadSessions = () => {
    const saved = localStorage.getItem('testingSessions')
    if (saved) {
      setSavedSessions(JSON.parse(saved))
    }
  }

  // Charger toutes les données anatomiques depuis Supabase
  const loadAnatomyData = async () => {
    try {
      setLoadingAnatomy(true)

      // 1. Charger les zones actives
      const { data: zonesData } = await supabase
        .from('anatomical_zones')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      setAnatomyZones(zonesData || [])

      // 2. Charger toutes les pathologies avec leur position
      const { data: pathologiesData } = await supabase
        .from('pathologies')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      // Grouper pathologies par zone
      const pathosByZone: Record<string, any[]> = {}
      pathologiesData?.forEach(patho => {
        if (!pathosByZone[patho.zone_id]) {
          pathosByZone[patho.zone_id] = []
        }
        pathosByZone[patho.zone_id].push(patho)
      })
      setPathologies(pathosByZone)

      // 3. Charger les liens pathologie-tests
      const { data: linksData } = await supabase
        .from('pathology_tests')
        .select(`
          *,
          test:orthopedic_tests(*)
        `)
        .order('recommended_order')

      // Grouper tests par pathologie
      const testsByPatho: Record<string, any[]> = {}
      linksData?.forEach(link => {
        if (!testsByPatho[link.pathology_id]) {
          testsByPatho[link.pathology_id] = []
        }
        if (link.test) {
          testsByPatho[link.pathology_id].push({
            ...link.test,
            relevance_score: link.relevance_score,
            notes: link.notes
          })
        }
      })
      setPathologyTests(testsByPatho)

    } catch (error) {
      console.error('Error loading anatomy data:', error)
    } finally {
      setLoadingAnatomy(false)
    }
  }

  const handleTestSelect = (tests: any[], pathologyName: string) => {
    // Ajouter les tests à la session
    tests.forEach(test => {
      const isAlreadyAdded = currentSession.results.some(r => r.testId === test.id)
      if (!isAlreadyAdded) {
        addTestResult(test, pathologyName)
      }
    })

    alert(`${tests.length} test(s) ajouté(s) pour ${pathologyName}`)
  }

  const addTestResult = (test: any, pathologyName: string, region = '') => {
  const newResult: TestResult = {
    testId: test.id,
    testName: test.name,
    pathologyName,
    region: (test.region as string) || region || '', // on remplit toujours une string
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

    setSavedSessions(updatedSessions)
    localStorage.setItem('testingSessions', JSON.stringify(updatedSessions))
    
    setTimeout(() => {
      setSaving(false)
      alert('Session sauvegardée avec succès')
    }, 500)
  }

  const loadSession = (session: TestingSession) => {
    setCurrentSession(session)
  }

  const deleteSession = (sessionId: string) => {
    if (!confirm('Supprimer cette session ?')) return
    
    const updated = savedSessions.filter(s => s.id !== sessionId)
    setSavedSessions(updated)
    localStorage.setItem('testingSessions', JSON.stringify(updated))
  }

  const newSession = () => {
    if (currentSession.results.length > 0 && !confirm('Créer une nouvelle session ? Les tests non sauvegardés seront perdus.')) {
      return
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
    uncertain: currentSession.results.filter(r => r.result === 'uncertain').length
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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Module de Testing</h1>
              <p className="text-gray-600 mt-1">
                Cliquez sur une zone anatomique pour voir les pathologies et leurs tests
              </p>
            </div>
            <button
              onClick={newSession}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Session
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vue principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sélection anatomique 3D */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-primary-50 to-primary-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Visualisateur Anatomique 3D
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {loadingAnatomy ? 'Chargement des zones anatomiques...' : 
                   anatomyZones.length > 0 ? 'Cliquez sur une zone → puis sur une pathologie (sphère colorée)' :
                   'Aucune zone configurée - Utilisez l\'interface admin'}
                </p>
              </div>
              
              {loadingAnatomy ? (
                <div className="flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-3" />
                    <p className="text-gray-600">Chargement...</p>
                  </div>
                </div>
              ) : (
                <AnatomyViewer3D
                  zones={anatomyZones}
                  pathologies={pathologies}
                  pathologyTests={pathologyTests}
                  onTestSelect={handleTestSelect}
                />
              )}
            </div>

            {/* Liste des tests sélectionnés */}
            {currentSession.results.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tests Sélectionnés ({currentSession.results.length})
                  </h2>
                  <button
                    onClick={() => setShowStatsModal(true)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1"
                  >
                    <BarChart className="h-4 w-4" />
                    Stats
                  </button>
                </div>
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {currentSession.results.map((result) => (
                    <div key={result.testId} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{result.testName}</h3>
                          <p className="text-sm text-primary-600">{result.pathologyName}</p>
                        </div>
                        <button
                          onClick={() => removeTestResult(result.testId)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Retirer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <button
                          onClick={() => updateTestResult(result.testId, 'positive')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            result.result === 'positive'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Positif
                        </button>
                        <button
                          onClick={() => updateTestResult(result.testId, 'negative')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            result.result === 'negative'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <XCircle className="h-4 w-4 inline mr-1" />
                          Négatif
                        </button>
                        <button
                          onClick={() => updateTestResult(result.testId, 'uncertain')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            result.result === 'uncertain'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          Incertain
                        </button>
                      </div>

                      <textarea
                        value={result.notes}
                        onChange={(e) => updateTestNotes(result.testId, e.target.value)}
                        placeholder="Notes..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel Session Info */}
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations Session
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="inline h-4 w-4 mr-1" />
                    Nom du patient
                  </label>
                  <input
                    type="text"
                    value={currentSession.patientName}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Âge
                  </label>
                  <input
                    type="text"
                    value={currentSession.patientAge}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, patientAge: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="45 ans"
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
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, sessionDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes générales
                  </label>
                  <textarea
                    value={currentSession.notes}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Notes sur la session..."
                  />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <button
                    onClick={saveSession}
                    disabled={saving}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  
                  <button
                    onClick={() => generateTestingPDF(currentSession)}
                    disabled={currentSession.results.length === 0}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download className="h-5 w-5" />
                    Exporter PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Sessions sauvegardées */}
            {savedSessions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">
                    Sessions Sauvegardées ({savedSessions.length})
                  </h3>
                </div>
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {savedSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {session.patientName}
                          </p>
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
        </div>
      </div>

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
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
