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

// Modal des diagnostics
import DiagnosticsModal from '@/components/DiagnosticsModal'

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

interface TestingClusterResult {
  clusterId: string
  clusterName: string
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
  clusterResults?: TestingClusterResult[]
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

interface OrthopedicTestCluster {
  id: string
  name: string
  region: string
  description: string | null
  indications: string | null
  interest: string | null
  sources: string | null
  sensitivity: number | null
  specificity: number | null
  rv_positive: number | null
  rv_negative: number | null
}

interface OrthopedicTestClusterItem {
  id: string
  cluster_id: string
  test_id: string
  order_index: number
  created_at: string
}

interface Profile {
  id: string
  role: string
  full_name?: string
  email?: string
}

// Helper pour YouTube
const extractYoutubeId = (url: string) => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([^&\n?#]+)/
  )
  return match ? match[1] : null
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
  const [clusters, setClusters] = useState<OrthopedicTestCluster[]>([])
  const [clusterItems, setClusterItems] = useState<OrthopedicTestClusterItem[]>(
    []
  )
  const [loadingData, setLoadingData] = useState(true)

  // Session en cours
  const [currentSession, setCurrentSession] = useState<TestingSession>({
    patientName: '',
    patientAge: '',
    sessionDate: new Date().toISOString().split('T')[0],
    results: [],
    clusterResults: [],
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

  // Modal diagnostics
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false)

  const specialCategoryZones: Record<string, AnatomicalZone> = {
    neurologique: {
      id: 'special-neurologique',
      name: 'neurologique',
      display_name: 'Tests neurologiques',
      description: null,
      color: '#7c3aed',
      position_x: 0,
      position_y: 0,
      position_z: 0,
      size_x: 0,
      size_y: 0,
      size_z: 0,
      is_symmetric: false,
      model_path: null,
      is_active: true,
      display_order: 0,
      created_by: null,
      created_at: '',
      updated_at: ''
    },
    vasculaire: {
      id: 'special-vasculaire',
      name: 'vasculaire',
      display_name: 'Tests vasculaires',
      description: null,
      color: '#dc2626',
      position_x: 0,
      position_y: 0,
      position_z: 0,
      size_x: 0,
      size_y: 0,
      size_z: 0,
      is_symmetric: false,
      model_path: null,
      is_active: true,
      display_order: 0,
      created_by: null,
      created_at: '',
      updated_at: ''
    },
    systemique: {
      id: 'special-systemique',
      name: 'systemique',
      display_name: 'Tests systémiques',
      description: null,
      color: '#2563eb',
      position_x: 0,
      position_y: 0,
      position_z: 0,
      size_x: 0,
      size_y: 0,
      size_z: 0,
      is_symmetric: false,
      model_path: null,
      is_active: true,
      display_order: 0,
      created_by: null,
      created_at: '',
      updated_at: ''
    }
  }

  // Modal Test
  const [selectedTest, setSelectedTest] = useState<OrthopedicTest | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)

  // Modal Cluster
  const [selectedCluster, setSelectedCluster] =
    useState<OrthopedicTestCluster | null>(null)
  const [showClusterModal, setShowClusterModal] = useState(false)

  useEffect(() => {
    checkAccess()
    loadData()
    loadSavedSessions()
  }, [])

  const checkAccess = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

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

      const { data: clustersData, error: clustersError } = await supabase
        .from('orthopedic_test_clusters')
        .select('*')
        .order('name')

      if (clustersError) throw clustersError
      setClusters(clustersData || [])

      const {
        data: clusterItemsData,
        error: clusterItemsError
      } = await supabase
        .from('orthopedic_test_cluster_items')
        .select('*')
        .order('order_index')

      if (clusterItemsError) throw clusterItemsError
      setClusterItems(clusterItemsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleZoneClick = (zone: AnatomicalZone) => {
    setSelectedZone(zone)
    setShowDiagnosticsModal(true) // Afficher d'abord le modal des diagnostics
  }

  const handleAddDiagnosticTests = (tests: OrthopedicTest[], diagnosticName: string) => {
    // Ajouter tous les tests du diagnostic à la session
    const newResults: TestingSessionResult[] = tests.map(test => ({
      testId: test.id,
      testName: test.name,
      category: test.category || selectedZone?.name || '',
      region: test.category || selectedZone?.name || '',
      result: null,
      notes: `Depuis diagnostic: ${diagnosticName}`,
      sensitivity: test.sensitivity || undefined,
      specificity: test.specificity || undefined
    }))

    // Filtrer les tests déjà dans la session
    const filteredResults = newResults.filter(
      newTest => !currentSession.results.some(
        existingTest => existingTest.testId === newTest.testId
      )
    )

    if (filteredResults.length === 0) {
      alert('Tous ces tests sont déjà dans la session')
      return
    }

    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      results: [...prev.results, ...filteredResults]
    }))

    alert(`✅ ${filteredResults.length} test(s) ajouté(s) à la session`)
  }

  const handleCloseDiagnosticsModal = () => {
    setShowDiagnosticsModal(false)
    // Optionnel : afficher la liste des tests après fermeture
    // setShowTestList(true)
  }

  const handleSpecialCategoryClick = (
    categoryKey: keyof typeof specialCategoryZones
  ) => {
    const specialZone = specialCategoryZones[categoryKey]
    if (specialZone) {
      setSelectedZone(specialZone)
      setShowTestList(true)
    }
  }

  const addTestToSession = (test: OrthopedicTest) => {
    const isAlreadyAdded = currentSession.results.some(
      (r: TestingSessionResult) => r.testId === test.id
    )

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

    // Si on est dans le modal, on le ferme après ajout
    if (showTestModal) {
      setShowTestModal(false)
      setSelectedTest(null)
    }
  }

  const addClusterToSession = (cluster: OrthopedicTestCluster) => {
    setCurrentSession((prev: TestingSession) => {
      const existingClusterResults = prev.clusterResults || []
      const clusterAlreadyAdded = existingClusterResults.some(
        (r: TestingClusterResult) => r.clusterId === cluster.id
      )

      // Ajout/maj cluster parent
      const newClusterResults = clusterAlreadyAdded
        ? existingClusterResults
        : [
            ...existingClusterResults,
            {
              clusterId: cluster.id,
              clusterName: cluster.name,
              region: cluster.region,
              result: null,
              notes: '',
              sensitivity: cluster.sensitivity || undefined,
              specificity: cluster.specificity || undefined
            } as TestingClusterResult
          ]

      // Tests enfants de ce cluster
      const childItems = clusterItems.filter(
        (item) => item.cluster_id === cluster.id
      )
      const childTests = childItems
        .map((item) => tests.find((t) => t.id === item.test_id))
        .filter((t): t is OrthopedicTest => Boolean(t))

      const existingResults = prev.results
      const newResults = [...existingResults]

      childTests.forEach((test) => {
        const already = existingResults.some(
          (r: TestingSessionResult) => r.testId === test.id
        )
        if (!already) {
          newResults.push({
            testId: test.id,
            testName: test.name,
            category: test.category || cluster.name || cluster.region || '',
            region: cluster.region || test.category || selectedZone?.name || '',
            result: null,
            notes: '',
            sensitivity: test.sensitivity || undefined,
            specificity: test.specificity || undefined
          })
        }
      })

      return {
        ...prev,
        results: newResults,
        clusterResults: newClusterResults
      }
    })

    if (showClusterModal) {
      setShowClusterModal(false)
      setSelectedCluster(null)
    }
  }

  const updateTestResult = (
    testId: string,
    result: 'positive' | 'negative' | 'uncertain'
  ) => {
    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      results: prev.results.map((r: TestingSessionResult) =>
        r.testId === testId ? { ...r, result } : r
      )
    }))
  }

  const updateClusterResult = (
    clusterId: string,
    result: 'positive' | 'negative' | 'uncertain'
  ) => {
    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      clusterResults: (prev.clusterResults || []).map(
        (r: TestingClusterResult) =>
          r.clusterId === clusterId ? { ...r, result } : r
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

  const updateClusterNotes = (clusterId: string, notes: string) => {
    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      clusterResults: (prev.clusterResults || []).map(
        (r: TestingClusterResult) =>
          r.clusterId === clusterId ? { ...r, notes } : r
      )
    }))
  }

  const removeTestResult = (testId: string) => {
    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      results: prev.results.filter((r: TestingSessionResult) => r.testId !== testId)
    }))
  }

  const removeClusterResult = (clusterId: string) => {
    setCurrentSession((prev: TestingSession) => ({
      ...prev,
      clusterResults: (prev.clusterResults || []).filter(
        (r: TestingClusterResult) => r.clusterId !== clusterId
      )
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

    const existingIndex = savedSessions.findIndex(
      (s) => s.id === sessionWithId.id
    )
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
    setCurrentSession({
      ...session,
      clusterResults: session.clusterResults || []
    })
  }

  const deleteSession = (sessionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      const updatedSessions = savedSessions.filter((s) => s.id !== sessionId)
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
      clusterResults: [],
      notes: ''
    })
  }

  const exportToPDF = () => {
    if (!currentSession.patientName.trim()) {
      alert("Veuillez entrer le nom du patient avant d'exporter")
      return
    }

    if (
      currentSession.results.length === 0 &&
      (!currentSession.clusterResults ||
        currentSession.clusterResults.length === 0)
    ) {
      alert('Aucun test ou cluster dans la session')
      return
    }

    generateTestingPDF(currentSession)
  }

  const normalizeString = (value?: string | null) =>
    value
      ? value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
      : ''

  const getFilteredTests = () => {
    if (!selectedZone) return []

    const zoneName = normalizeString(selectedZone.name)
    const zoneDisplay = normalizeString(selectedZone.display_name)

    // Essayer de matcher avec name OU display_name
    let filtered = tests.filter((test: OrthopedicTest) => {
      const testCategory = normalizeString(test.category)
      return testCategory === zoneName || testCategory === zoneDisplay
    })

    if (searchQuery) {
      filtered = filtered.filter((test: OrthopedicTest) =>
        test.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterIndication) {
      filtered = filtered.filter((test: OrthopedicTest) =>
        test.indications
          ?.toLowerCase()
          .includes(filterIndication.toLowerCase())
      )
    }

    return filtered
  }

  const getFilteredClusters = () => {
    if (!selectedZone) return []

    let filtered = clusters.filter((cluster: OrthopedicTestCluster) => {
      const region = normalizeString(cluster.region)
      const zoneName = normalizeString(selectedZone.name)
      const zoneDisplay = normalizeString(selectedZone.display_name)

      if (!region) return false

      // On essaie de matcher strictement ou par inclusion (ex: "lombaire" vs "lombaire_basse")
      return (
        region === zoneName ||
        region === zoneDisplay ||
        zoneName.includes(region) ||
        zoneDisplay.includes(region) ||
        region.includes(zoneName) ||
        region.includes(zoneDisplay)
      )
    })

    if (searchQuery) {
      filtered = filtered.filter((cluster: OrthopedicTestCluster) =>
        cluster.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterIndication) {
      filtered = filtered.filter((cluster: OrthopedicTestCluster) =>
        (cluster.indications || cluster.description || '')
          .toLowerCase()
          .includes(filterIndication.toLowerCase())
      )
    }

    return filtered
  }

  // Tests enfants du cluster actuellement sélectionné (pour le modal)
  const selectedClusterChildTests: OrthopedicTest[] = selectedCluster
    ? clusterItems
        .filter((item) => item.cluster_id === selectedCluster.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((item) => tests.find((t) => t.id === item.test_id))
        .filter((t): t is OrthopedicTest => Boolean(t))
    : []

  const statsBase = [
    ...currentSession.results,
    ...(currentSession.clusterResults || [])
  ]

  const stats = {
    total: statsBase.length,
    positive: statsBase.filter((r) => r.result === 'positive').length,
    negative: statsBase.filter((r) => r.result === 'negative').length,
    uncertain: statsBase.filter((r) => r.result === 'uncertain').length
  }

  const openTestModal = (test: OrthopedicTest) => {
    setSelectedTest(test)
    setShowTestModal(true)
  }

  const closeTestModal = () => {
    setShowTestModal(false)
    setSelectedTest(null)
  }

  const openClusterModal = (cluster: OrthopedicTestCluster) => {
    setSelectedCluster(cluster)
    setShowClusterModal(true)
  }

  const closeClusterModal = () => {
    setShowClusterModal(false)
    setSelectedCluster(null)
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
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-xl border border-white/10">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Module Testing
                </p>
                <h1 className="text-3xl font-bold leading-tight">Testing 3D</h1>
                <p className="text-slate-200 text-sm md:text-base">
                  Sélectionnez une zone anatomique pour voir les tests et
                  clusters disponibles
                </p>
              </div>
              <button
                onClick={newSession}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
              >
                <Plus className="h-5 w-5" />
                Nouvelle Session
              </button>
            </div>
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
                onChange={(e) =>
                  setCurrentSession((prev: TestingSession) => ({
                    ...prev,
                    patientName: e.target.value
                  }))
                }
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
                onChange={(e) =>
                  setCurrentSession((prev: TestingSession) => ({
                    ...prev,
                    patientAge: e.target.value
                  }))
                }
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
                onChange={(e) =>
                  setCurrentSession((prev: TestingSession) => ({
                    ...prev,
                    sessionDate: e.target.value
                  }))
                }
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
              onChange={(e) =>
                setCurrentSession((prev: TestingSession) => ({
                  ...prev,
                  notes: e.target.value
                }))
              }
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
        {stats.total > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total (tests + clusters)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-green-600">Positifs</p>
              <p className="text-2xl font-bold text-green-700">
                {stats.positive}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-red-600">Négatifs</p>
              <p className="text-2xl font-bold text-red-700">
                {stats.negative}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-yellow-600">Incertains</p>
              <p className="text-2xl font-bold text-yellow-700">
                {stats.uncertain}
              </p>
            </div>
          </div>
        )}

        {/* Contenu principal - MODULE 3D À GAUCHE, TESTS À DROITE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module 3D - moitié gauche */}
          <div className="space-y-6">
            {/* Visualisateur 3D */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Modèle anatomique 3D
              </h2>
              {zones.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Aucune zone anatomique configurée.</p>
                  <p className="text-sm mt-2">
                    Utilisez Anatomy Builder pour créer des zones.
                  </p>
                </div>
              ) : (
                <TestingViewer3D
                  zones={zones}
                  onZoneClick={handleZoneClick}
                  onSpecialCategoryClick={handleSpecialCategoryClick}
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
                  {currentSession.results.map(
                    (result: TestingSessionResult) => (
                      <div key={result.testId} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {result.testName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {result.category}
                            </p>
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
                            onClick={() =>
                              updateTestResult(result.testId, 'positive')
                            }
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
                            onClick={() =>
                              updateTestResult(result.testId, 'negative')
                            }
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
                            onClick={() =>
                              updateTestResult(result.testId, 'uncertain')
                            }
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
                          onChange={(e) =>
                            updateTestNotes(result.testId, e.target.value)
                          }
                          placeholder="Commentaires..."
                          className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                          rows={2}
                        />

                        {/* Stats test */}
                        {(result.sensitivity || result.specificity) && (
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            {result.sensitivity && (
                              <span>
                                Sensibilité: {result.sensitivity}%
                              </span>
                            )}
                            {result.specificity && (
                              <span>
                                Spécificité: {result.specificity}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Clusters sélectionnés */}
            {currentSession.clusterResults &&
              currentSession.clusterResults.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Clusters de tests ({currentSession.clusterResults.length})
                  </h2>
                  <div className="space-y-4">
                    {currentSession.clusterResults.map(
                      (clusterResult: TestingClusterResult) => (
                        <div
                          key={clusterResult.clusterId}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {clusterResult.clusterName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {clusterResult.region}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                removeClusterResult(clusterResult.clusterId)
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Boutons résultat */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <button
                              onClick={() =>
                                updateClusterResult(
                                  clusterResult.clusterId,
                                  'positive'
                                )
                              }
                              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                                clusterResult.result === 'positive'
                                  ? 'bg-green-100 text-green-700 border-2 border-green-600'
                                  : 'bg-gray-50 text-gray-700 hover:bg-green-50'
                              }`}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Positif
                            </button>
                            <button
                              onClick={() =>
                                updateClusterResult(
                                  clusterResult.clusterId,
                                  'negative'
                                )
                              }
                              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                                clusterResult.result === 'negative'
                                  ? 'bg-red-100 text-red-700 border-2 border-red-600'
                                  : 'bg-gray-50 text-gray-700 hover:bg-red-50'
                              }`}
                            >
                              <XCircle className="h-4 w-4" />
                              Négatif
                            </button>
                            <button
                              onClick={() =>
                                updateClusterResult(
                                  clusterResult.clusterId,
                                  'uncertain'
                                )
                              }
                              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                                clusterResult.result === 'uncertain'
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
                            value={clusterResult.notes}
                            onChange={(e) =>
                              updateClusterNotes(
                                clusterResult.clusterId,
                                e.target.value
                              )
                            }
                            placeholder="Commentaires..."
                            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                            rows={2}
                          />

                          {/* Stats cluster */}
                          {(clusterResult.sensitivity ||
                            clusterResult.specificity) && (
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              {clusterResult.sensitivity && (
                                <span>
                                  Sensibilité: {clusterResult.sensitivity}%
                                </span>
                              )}
                              {clusterResult.specificity && (
                                <span>
                                  Spécificité: {clusterResult.specificity}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* TESTS / CLUSTERS À DROITE - moitié droite */}
          <div className="space-y-6">
            {/* Liste des tests / clusters de la zone */}
            {showTestList && selectedZone && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tests & clusters - {selectedZone.display_name}
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
                      placeholder="Rechercher (tests ou clusters)..."
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

                {/* Clusters */}
                <div className="space-y-2 mb-4">
                  {getFilteredClusters().length > 0 && (
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Clusters validés
                    </p>
                  )}
                  {getFilteredClusters().map(
                    (cluster: OrthopedicTestCluster) => (
                      <div
                        key={cluster.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openClusterModal(cluster)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {cluster.name}
                            </p>
                            {cluster.indications && (
                              <p className="text-xs text-gray-600 mt-1">
                                {cluster.indications}
                              </p>
                            )}
                            {(cluster.sensitivity || cluster.specificity) && (
                              <div className="flex gap-2 mt-2 text-xs text-gray-500">
                                {cluster.sensitivity && (
                                  <span>Se: {cluster.sensitivity}%</span>
                                )}
                                {cluster.specificity && (
                                  <span>Sp: {cluster.specificity}%</span>
                                )}
                              </div>
                            )}
                          </div>
                          <Plus className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Tests */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {getFilteredTests().length > 0 && (
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Tests individuels
                    </p>
                  )}

                  {getFilteredTests().map((test: OrthopedicTest) => (
                    <div
                      key={test.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => openTestModal(test)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {test.name}
                          </p>
                          {test.indications && (
                            <p className="text-xs text-gray-600 mt-1">
                              {test.indications}
                            </p>
                          )}
                          {(test.sensitivity || test.specificity) && (
                            <div className="flex gap-2 mt-2 text-xs text-gray-500">
                              {test.sensitivity && (
                                <span>Se: {test.sensitivity}%</span>
                              )}
                              {test.specificity && (
                                <span>Sp: {test.specificity}%</span>
                              )}
                            </div>
                          )}
                        </div>
                        <Plus className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}

                  {getFilteredTests().length === 0 &&
                    getFilteredClusters().length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm mb-3">
                          Aucun test ou cluster trouvé
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                          <p className="text-xs font-semibold text-blue-900 mb-2">
                            💡 Aide au diagnostic :
                          </p>
                          <p className="text-xs text-blue-800 mb-1">
                            • Zone :{' '}
                            <span className="font-mono">
                              {selectedZone.name}
                            </span>{' '}
                            /{' '}
                            <span className="font-mono">
                              {selectedZone.display_name}
                            </span>
                          </p>
                          <p className="text-xs text-blue-800 mb-1">
                            • Total tests chargés : {tests.length}
                          </p>
                          <p className="text-xs text-blue-800 mb-1">
                            • Total clusters chargés : {clusters.length}
                          </p>
                          <p className="text-xs text-blue-800">
                            • Vérifiez que les tests ont une{' '}
                            <span className="font-mono">category</span> et les
                            clusters une <span className="font-mono">region</span>{' '}
                            qui correspondent
                          </p>
                          <button
                            onClick={() =>
                              console.log(
                                '📊 Tous les tests:',
                                tests,
                                '📊 Tous les clusters:',
                                clusters,
                                '📊 Items:',
                                clusterItems
                              )
                            }
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                          >
                            Afficher détails dans console
                          </button>
                        </div>
                      </div>
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
                  {savedSessions.map((session: TestingSession) => {
                    const testsCount = session.results?.length || 0
                    const clustersCount = session.clusterResults?.length || 0
                    return (
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
                              {new Date(
                                session.sessionDate
                              ).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {testsCount} test
                              {testsCount > 1 ? 's' : ''} • {clustersCount}{' '}
                              cluster
                              {clustersCount > 1 ? 's' : ''}
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
                              onClick={() =>
                                session.id && deleteSession(session.id)
                              }
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DÉTAIL TEST ORTHO */}
      {showTestModal && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <button
              onClick={closeTestModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-semibold text-gray-900 pr-10">
              {selectedTest.name}
            </h3>

            {selectedTest.category && (
              <p className="mt-1 text-sm text-gray-600">
                Région :{' '}
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                  {selectedTest.category}
                </span>
              </p>
            )}

            {/* Statistiques */}
            {(selectedTest.sensitivity ||
              selectedTest.specificity ||
              selectedTest.rv_positive ||
              selectedTest.rv_negative) && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-700">
                {selectedTest.sensitivity != null && (
                  <span className="rounded bg-green-50 px-2 py-0.5">
                    Se : {selectedTest.sensitivity}%
                  </span>
                )}
                {selectedTest.specificity != null && (
                  <span className="rounded bg-blue-50 px-2 py-0.5">
                    Sp : {selectedTest.specificity}%
                  </span>
                )}
                {selectedTest.rv_positive != null && (
                  <span className="rounded bg-purple-50 px-2 py-0.5">
                    RV+ : {selectedTest.rv_positive}
                  </span>
                )}
                {selectedTest.rv_negative != null && (
                  <span className="rounded bg-orange-50 px-2 py-0.5">
                    RV- : {selectedTest.rv_negative}
                  </span>
                )}
              </div>
            )}

            {/* Vidéo */}
            {selectedTest.video_url && (
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Vidéo de démonstration
                </h4>
                {extractYoutubeId(selectedTest.video_url) ? (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeId(
                        selectedTest.video_url
                      )}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={selectedTest.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary-600 underline"
                  >
                    Ouvrir la vidéo
                  </a>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">
                Description / Réalisation
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {selectedTest.description}
              </p>
            </div>

            {/* Indications */}
            {selectedTest.indications && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Indications principales
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {selectedTest.indications}
                </p>
              </div>
            )}

            {/* Intérêt clinique */}
            {selectedTest.interest && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Intérêt clinique
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {selectedTest.interest}
                </p>
              </div>
            )}

            {/* Sources */}
            {selectedTest.sources && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Sources / Références
                </h4>
                <p className="text-xs text-gray-600 whitespace-pre-line">
                  {selectedTest.sources}
                </p>
              </div>
            )}

            {/* Actions modal */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeTestModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
              <button
                onClick={() => addTestToSession(selectedTest)}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter ce test à la session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAIL CLUSTER */}
      {showClusterModal && selectedCluster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <button
              onClick={closeClusterModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-semibold text-gray-900 pr-10">
              {selectedCluster.name}
            </h3>

            {selectedCluster.region && (
              <p className="mt-1 text-sm text-gray-600">
                Région :{' '}
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                  {selectedCluster.region}
                </span>
              </p>
            )}

            {/* Statistiques */}
            {(selectedCluster.sensitivity ||
              selectedCluster.specificity ||
              selectedCluster.rv_positive ||
              selectedCluster.rv_negative) && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-700">
                {selectedCluster.sensitivity != null && (
                  <span className="rounded bg-green-50 px-2 py-0.5">
                    Se : {selectedCluster.sensitivity}%
                  </span>
                )}
                {selectedCluster.specificity != null && (
                  <span className="rounded bg-blue-50 px-2 py-0.5">
                    Sp : {selectedCluster.specificity}%
                  </span>
                )}
                {selectedCluster.rv_positive != null && (
                  <span className="rounded bg-purple-50 px-2 py-0.5">
                    RV+ : {selectedCluster.rv_positive}
                  </span>
                )}
                {selectedCluster.rv_negative != null && (
                  <span className="rounded bg-orange-50 px-2 py-0.5">
                    RV- : {selectedCluster.rv_negative}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {selectedCluster.description && (
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Description du cluster
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {selectedCluster.description}
                </p>
              </div>
            )}

            {/* Indications */}
            {selectedCluster.indications && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Indications principales
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {selectedCluster.indications}
                </p>
              </div>
            )}

            {/* Intérêt clinique */}
            {selectedCluster.interest && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Intérêt clinique
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {selectedCluster.interest}
                </p>
              </div>
            )}

            {/* Tests enfants du cluster */}
            {selectedClusterChildTests.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Tests inclus dans ce cluster
                </h4>
                <ul className="space-y-2">
                  {selectedClusterChildTests.map((test) => (
                    <li
                      key={test.id}
                      className="text-sm text-gray-800 border rounded-md px-3 py-2 bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{test.name}</span>
                        {(test.sensitivity || test.specificity) && (
                          <span className="text-xs text-gray-500">
                            {test.sensitivity && `Se ${test.sensitivity}%`}
                            {test.sensitivity && test.specificity && ' • '}
                            {test.specificity && `Sp ${test.specificity}%`}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-gray-500">
                  En ajoutant ce cluster à la session, chacun de ces tests sera
                  aussi ajouté à la liste des tests, afin de pouvoir marquer
                  individuellement Positif / Négatif / Incertain.
                </p>
              </div>
            )}

            {/* Sources */}
            {selectedCluster.sources && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Sources / Références
                </h4>
                <p className="text-xs text-gray-600 whitespace-pre-line">
                  {selectedCluster.sources}
                </p>
              </div>
            )}

            {/* Actions modal */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeClusterModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
              <button
                onClick={() => addClusterToSession(selectedCluster)}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter ce cluster (+ tests enfants)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIAGNOSTICS */}
      {showDiagnosticsModal && selectedZone && (
        <DiagnosticsModal
          region={selectedZone.name}
          regionDisplay={selectedZone.display_name}
          isOpen={showDiagnosticsModal}
          onClose={handleCloseDiagnosticsModal}
          onAddTests={handleAddDiagnosticTests}
        />
      )}
    </AuthLayout>
  )
}
