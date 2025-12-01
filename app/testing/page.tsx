'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { generateTestingPDF } from '@/utils/generateTestingPDF'
import dynamic from 'next/dynamic'
import {
  TestingSession,
  TestingSessionResult,
  AnatomicalZone,
  OrthopedicTest
} from '@/types/testing'
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
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement du modèle 3D...</p>
      </div>
    </div>
  )
})

export default function TestingModulePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  
  // Données
  const [zones, setZones] = useState<any[]>([])
  const [tests, setTests] = useState<any[]>([])
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
  const [saving, setSaving] = useState(false)
  
  // UI States
  const [selectedZone, setSelectedZone] = useState<any>(null)
  const [showTestList, setShowTestList] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterIndication, setFilterIndication] = useState('')

  useEffect(() => {
    checkAccess()
    loadData()
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

  const loadData = async () => {
    try {
      setLoadingData(true)

      // Charger les zones anatomiques actives
      const { data: zonesData } = await supabase
        .from('anatomical_zones')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      setZones(zonesData || [])

      // Charger tous les tests orthopédiques
      const { data: testsData } = await supabase
        .from('orthopedic_tests')
        .select('*')
        .order('name')

      setTests(testsData || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadSessions = () => {
    const saved = localStorage.getItem('testingSessions')
    if (saved) {
      setSavedSessions(JSON.parse(saved))
    }
  }

  const handleZoneClick = (zone: any) => {
    setSelectedZone(zone)
    setShowTestList(true)
    setSearchQuery('')
    setFilterIndication('')
  }

  const handleTestSelect = (test: any) => {
    const isAlreadyAdded = currentSession.results.some(r => r.testId === test.id)
    
    if (isAlreadyAdded) {
      alert('Ce test est déjà dans la liste')
      return
    }

    const newResult: TestingSessionResult = {
      testId: test.id,
      testName: test.name,
      category: test.category || selectedZone?.name || '',
      region: test.category || selectedZone?.name || '', // Même valeur que category
      result: null,
      notes: '',
      sensitivity: test.sensitivity,
      specificity: test.specificity
    }

    setCurrentSession(prev => ({
      ...prev,
      results: [...prev.results, newResult]
    }))

    alert(`✅ ${test.name} ajouté`)
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
      alert('✅ Session sauvegardée')
    }, 500)
  }

  const loadSession = (session: TestingSession) => {
    setCurrentSession(session)
    setShowTestList(false)
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
    setShowTestList(false)
  }

  // Filtrer les tests de la zone sélectionnée
  const zoneTests = selectedZone 
    ? tests.filter(t => t.category === selectedZone.name || t.category === selectedZone.display_name)
    : []

  const filteredZoneTests = zoneTests.filter(test => {
    const matchesSearch = !searchQuery || 
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesIndication = !filterIndication ||
      test.indications?.toLowerCase().includes(filterIndication.toLowerCase())
    
    return matchesSearch && matchesIndication
  })

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
              <h1 className="text-2xl font-bold text-gray-900">Module de Testing 3D</h1>
              <p className="text-gray-600 mt-1">
                Cliquez sur une zone anatomique pour voir les tests disponibles
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
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visualisateur 3D */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-primary-50 to-primary-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sélection anatomique
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {loadingData
                    ? 'Chargement...'
                    : zones.length > 0
                      ? `Cliquez sur une zone pour voir les ${tests.length} tests disponibles`
                      : 'Aucune zone configurée'}
                </p>
              </div>
              
              {loadingData ? (
                <div className="flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-3" />
                    <p className="text-gray-600">Chargement...</p>
                  </div>
                </div>
              ) : (
                <TestingViewer3D
                  zones={zones}
                  onZoneClick={handleZoneClick}
                />
              )}
            </div>

            {/* Liste des tests de la zone */}
            {showTestList && selectedZone && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b" style={{ backgroundColor: `${selectedZone.color}15` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: selectedZone.color }}>
                        Tests - {selectedZone.display_name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {filteredZoneTests.length} test(s) disponible(s)
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTestList(false)}
                      className="p-2 hover:bg-white rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Filtres */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un test..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Indication..."
                        value={filterIndication}
                        onChange={(e) => setFilterIndication(e.target.value)}
                        className="w-48 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {filteredZoneTests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>Aucun test trouvé</p>
                    </div>
                  ) : (
                    filteredZoneTests.map(test => (
                      <div key={test.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{test.name}</h3>
                            {test.indications && (
                              <p className="text-sm text-primary-600 mt-1">
                                {test.indications}
                              </p>
                            )}
                            {test.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {test.description}
                              </p>
                            )}
                            {(test.sensitivity || test.specificity) && (
                              <div className="flex gap-3 mt-2 text-xs text-gray-600">
                                {test.sensitivity && <span>Se: {test.sensitivity}%</span>}
                                {test.specificity && <span>Sp: {test.specificity}%</span>}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleTestSelect(test)}
                            className="ml-3 px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm whitespace-nowrap"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Liste des tests sélectionnés */}
            {currentSession.results.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tests Sélectionnés ({currentSession.results.length})
                  </h2>
                  <div className="flex gap-2 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      ✓ {stats.positive}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                      ✗ {stats.negative}
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      ? {stats.uncertain}
                    </span>
                  </div>
                </div>
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {currentSession.results.map((result) => (
                    <div key={result.testId} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{result.testName}</h3>
                          <p className="text-sm text-primary-600">{result.category}</p>
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
                        placeholder="Commentaires..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne info session */}
          <div className="space-y-6">
            {/* Informations patient */}
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
                            {session.results.length} tests
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
    </AuthLayout>
  )
}