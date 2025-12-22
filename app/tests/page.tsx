'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Clipboard,
  Search,
  PlayCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Plus,
  Lock,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  User,
  Activity,
  X,
  Layers,
  FolderOpen,
  GraduationCap,
  Stethoscope
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import RelatedContent, { RelatedItem } from '@/components/RelatedContent'

// Catégories de régions anatomiques
const BODY_REGIONS = {
  'Tête et Cou': ['Cervical', 'ATM', 'Crâne'],
  'Membre Supérieur': ['Épaule', 'Coude', 'Poignet', 'Main'],
  'Tronc': ['Thoracique', 'Lombaire', 'Sacro-iliaque', 'Côtes'],
  'Membre Inférieur': ['Hanche', 'Genou', 'Cheville', 'Pied'],
  'Général': ['Neurologique', 'Vasculaire', 'Systémique']
}

const CLUSTER_INITIAL_FORM = {
  name: '',
  region: '',
  description: '',
  indications: '',
  interest: '',
  sources: '',
  sensitivity: '',
  specificity: '',
  rv_positive: '',
  rv_negative: ''
}

export default function ImprovedTestsPage() {
  const router = useRouter()

  const [tests, setTests] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])

  const [filteredTests, setFilteredTests] = useState<any[]>([])
  const [filteredClusters, setFilteredClusters] = useState<any[]>([])

  const [profile, setProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [expandedRegions, setExpandedRegions] = useState<string[]>(
    Object.keys(BODY_REGIONS)
  )

  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [selectedCluster, setSelectedCluster] = useState<any>(null)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showClusterModal, setShowClusterModal] = useState(false)

  const [clusterModalOpen, setClusterModalOpen] = useState(false)
  const [clusterSaving, setClusterSaving] = useState(false)
  const [clusterForm, setClusterForm] = useState({ ...CLUSTER_INITIAL_FORM })
  const [clusterSelectedTests, setClusterSelectedTests] = useState<string[]>([])
  const [clusterSearchQuery, setClusterSearchQuery] = useState('')
  const [clusterRegionFilter, setClusterRegionFilter] = useState('all')

  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchQuery, selectedRegion, tests, clusters])

  const loadData = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // Profil utilisateur
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      if (profileData?.role !== 'admin') {
        router.push('/testing')
        setLoading(false)
        return
      }

      // Tous les tests
      const { data: testsData } = await supabase
        .from('orthopedic_tests')
        .select('*')
        .order('name', { ascending: true })

      const testsWithRegions =
        testsData?.map((test) => ({
          ...test,
          region: test.category || assignRegion(test.name)
        })) || []

      setTests(testsWithRegions)

      // Tous les clusters
      const { data: clustersData, error: clustersError } = await supabase
        .from('orthopedic_test_clusters')
        .select('*')
        .order('name', { ascending: true })

      if (clustersError) {
        console.error('Error loading clusters:', clustersError)
      }

      // Liens clusters <-> tests
      const { data: clusterItems, error: itemsError } = await supabase
        .from('orthopedic_test_cluster_items')
        .select('cluster_id, test_id')

      if (itemsError) {
        console.error('Error loading cluster items:', itemsError)
      }

      const testsMap = new Map(
        (testsWithRegions || []).map((t: any) => [t.id, t])
      )

      const clustersWithTests =
        clustersData?.map((cluster: any) => ({
          ...cluster,
          region: cluster.region || 'Général',
          tests:
            (clusterItems || [])
              .filter((ci: any) => ci.cluster_id === cluster.id)
              .map((ci: any) => testsMap.get(ci.test_id))
              .filter(Boolean) || []
        })) || []

      setClusters(clustersWithTests)

      // états filtrés initiaux
      setFilteredTests(testsWithRegions)
      setFilteredClusters(clustersWithTests)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Assignation de région de secours si category vide
  const assignRegion = (name: string): string => {
    const lowerName = name.toLowerCase()

    if (lowerName.includes('cervical') || lowerName.includes('cou')) return 'Cervical'
    if (lowerName.includes('épaule') || lowerName.includes('shoulder')) return 'Épaule'
    if (lowerName.includes('genou') || lowerName.includes('knee')) return 'Genou'
    if (lowerName.includes('lombaire') || lowerName.includes('lumbar')) return 'Lombaire'
    if (lowerName.includes('hanche') || lowerName.includes('hip')) return 'Hanche'
    if (lowerName.includes('cheville') || lowerName.includes('ankle')) return 'Cheville'
    if (lowerName.includes('poignet') || lowerName.includes('wrist')) return 'Poignet'
    if (lowerName.includes('coude') || lowerName.includes('elbow')) return 'Coude'
    if (lowerName.includes('thoracique')) return 'Thoracique'
    if (lowerName.includes('pied') || lowerName.includes('foot')) return 'Pied'
    if (lowerName.includes('main') || lowerName.includes('hand')) return 'Main'

    return 'Général'
  }

  const filterData = () => {
    let t = [...tests]
    let c = [...clusters]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()

      t = t.filter((test) =>
        test.name.toLowerCase().includes(q) ||
        test.description?.toLowerCase().includes(q) ||
        test.indications?.toLowerCase().includes(q) ||
        test.interest?.toLowerCase().includes(q) ||
        test.sources?.toLowerCase().includes(q)
      )

      c = c.filter((cluster) =>
        cluster.name.toLowerCase().includes(q) ||
        cluster.description?.toLowerCase().includes(q) ||
        cluster.indications?.toLowerCase().includes(q) ||
        cluster.interest?.toLowerCase().includes(q) ||
        cluster.sources?.toLowerCase().includes(q) ||
        (cluster.tests || []).some(
          (test: any) =>
            test?.name?.toLowerCase().includes(q) ||
            test?.description?.toLowerCase().includes(q)
        )
      )
    }

    if (selectedRegion !== 'all') {
      t = t.filter((test) => test.region === selectedRegion)
      c = c.filter((cluster) => cluster.region === selectedRegion)
    }

    setFilteredTests(t)
    setFilteredClusters(c)
  }

  const resetClusterForm = () => {
    setClusterForm({ ...CLUSTER_INITIAL_FORM })
    setClusterSelectedTests([])
    setClusterSearchQuery('')
    setClusterRegionFilter('all')
  }

  const toggleTestInCluster = (testId: string) => {
    setClusterSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    )
  }

  const clusterFilteredTests = tests.filter((test) => {
    if (clusterRegionFilter !== 'all' && test.region !== clusterRegionFilter) return false

    if (clusterSearchQuery) {
      const q = clusterSearchQuery.toLowerCase()
      return (
        test.name.toLowerCase().includes(q) ||
        test.description?.toLowerCase().includes(q) ||
        test.indications?.toLowerCase().includes(q)
      )
    }

    return true
  })

  const handleCreateCluster = async () => {
    if (!clusterForm.name || !clusterForm.region) {
      alert('Le nom du cluster et la région sont obligatoires.')
      return
    }

    if (clusterSelectedTests.length === 0) {
      alert('Sélectionnez au moins un test pour créer un cluster.')
      return
    }

    setClusterSaving(true)

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Session expirée, veuillez vous reconnecter.')
        return
      }

      const { data: cluster, error: clusterError } = await supabase
        .from('orthopedic_test_clusters')
        .insert({
          name: clusterForm.name,
          region: clusterForm.region,
          description: clusterForm.description || null,
          indications: clusterForm.indications || null,
          interest: clusterForm.interest || null,
          sources: clusterForm.sources || null,
          sensitivity: clusterForm.sensitivity ? parseFloat(clusterForm.sensitivity) : null,
          specificity: clusterForm.specificity ? parseFloat(clusterForm.specificity) : null,
          rv_positive: clusterForm.rv_positive ? parseFloat(clusterForm.rv_positive) : null,
          rv_negative: clusterForm.rv_negative ? parseFloat(clusterForm.rv_negative) : null,
          created_by: user.id
        })
        .select('id')
        .single()

      if (clusterError) throw clusterError

      const itemsPayload = clusterSelectedTests.map((testId, index) => ({
        cluster_id: cluster.id,
        test_id: testId,
        order_index: index
      }))

      const { error: itemsError } = await supabase
        .from('orthopedic_test_cluster_items')
        .insert(itemsPayload)

      if (itemsError) throw itemsError

      await loadData()
      alert('Cluster créé avec succès !')
      resetClusterForm()
      setClusterModalOpen(false)
    } catch (error: any) {
      alert('Erreur lors de la création du cluster : ' + error.message)
    } finally {
      setClusterSaving(false)
    }
  }

  const handleTestClick = (test: any) => {
    setSelectedCluster(null)
    setSelectedTest(test)
    setShowTestModal(true)
  }

  const handleClusterClick = (cluster: any) => {
    setSelectedTest(null)
    setSelectedCluster(cluster)
    setShowClusterModal(true)
  }

  const handleDeleteTest = async (testId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) {
      await supabase.from('orthopedic_tests').delete().eq('id', testId)
      loadData()
    }
  }

  const handleDeleteCluster = async (clusterId: string) => {
    if (!confirm('Supprimer ce cluster et ses liens avec les tests ?')) return

    // si tu as mis ON DELETE CASCADE sur cluster_id, cette partie peut être simplifiée
    await supabase
      .from('orthopedic_test_cluster_items')
      .delete()
      .eq('cluster_id', clusterId)

    await supabase
      .from('orthopedic_test_clusters')
      .delete()
      .eq('id', clusterId)

    loadData()
  }

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    )
  }

  const getRegionIcon = (region: string) => {
    const icons: Record<string, JSX.Element> = {
      'Tête et Cou': <User className="h-5 w-5" />,
      'Membre Supérieur': <Activity className="h-5 w-5" />,
      'Tronc': <User className="h-5 w-5" />,
      'Membre Inférieur': <Activity className="h-5 w-5" />,
      'Général': <Clipboard className="h-5 w-5" />
    }
    return icons[region] || <Clipboard className="h-5 w-5" />
  }

  const getStatBadge = (value: number | null, type: string) => {
    if (value === null || value === undefined) return null

    let bgColor = 'bg-gray-100'
    let textColor = 'text-gray-700'
    let icon = null

    if (type === 'sensitivity' || type === 'specificity') {
      if (value >= 80) {
        bgColor = 'bg-green-100'
        textColor = 'text-green-700'
        icon = <TrendingUp className="h-3 w-3" />
      } else if (value >= 60) {
        bgColor = 'bg-yellow-100'
        textColor = 'text-yellow-700'
      } else {
        bgColor = 'bg-red-100'
        textColor = 'text-red-700'
        icon = <TrendingDown className="h-3 w-3" />
      }
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {icon}
        {value}%
      </span>
    )
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AuthLayout>
    )
  }

  if (profile && profile.role !== 'admin') {
    return (
      <AuthLayout>
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Accès administrateur requis</h1>
          <p className="text-gray-600">
            La création et la gestion des tests orthopédiques sont réservées aux administrateurs. Utilisez le module Testing
            3D pour réaliser vos évaluations.
          </p>
          <button
            onClick={() => router.push('/testing')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            Accéder au Testing 3D
          </button>
        </div>
      </AuthLayout>
    )
  }

  // Regroupement par grandes catégories
  const categories = Object.keys(BODY_REGIONS).map((category) => {
    const subRegions = BODY_REGIONS[category as keyof typeof BODY_REGIONS]
    return {
      name: category,
      tests: filteredTests.filter((t) => subRegions.includes(t.region)),
      clusters: filteredClusters.filter((c) => subRegions.includes(c.region))
    }
  })

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tests orthopédiques</h1>
              <p className="mt-1 text-gray-600">
                Base de données complète organisée par région anatomique
              </p>
            </div>
            {profile?.role === 'admin' && (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/diagnostics')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  title="Gérer les diagnostics (dossiers avec tests)"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Diagnostics</span>
                </button>
                <button
                  onClick={() => router.push('/admin/tests/new')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouveau test</span>
                </button>
                <button
                  onClick={() => setClusterModalOpen(true)}
                  className="bg-primary-100 hover:bg-primary-200 text-primary-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Layers className="h-4 w-4" />
                  <span>Nouveau cluster</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search + filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un test ou un cluster (nom, description, indication...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Toutes les régions</option>
                {Object.entries(BODY_REGIONS).map(([category, regions]) => (
                  <optgroup key={category} label={category}>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  Grille
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  Liste
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            {filteredTests.length} test(s) et {filteredClusters.length} cluster(s) trouvé(s)
            {searchQuery && ` pour "${searchQuery}"`}
            {selectedRegion !== 'all' && ` dans la région ${selectedRegion}`}
          </div>
        </div>

        {/* Liste par catégorie */}
        {filteredTests.length === 0 && filteredClusters.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Clipboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun élément trouvé</h3>
            <p className="text-gray-600">Modifiez vos critères de recherche</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map(({ name: category, tests: categoryTests, clusters: categoryClusters }) => {
              if (categoryTests.length === 0 && categoryClusters.length === 0) return null

              const isExpanded = expandedRegions.includes(category)

              return (
                <div
                  key={category}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleRegion(category)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getRegionIcon(category)}
                      <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        {categoryClusters.length} cluster(s) • {categoryTests.length} test(s)
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4">
                      {/* Clusters */}
                      {categoryClusters.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Clusters recommandés
                          </h3>
                          {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {categoryClusters.map((cluster) => (
                                <div
                                  key={cluster.id}
                                  className="border border-indigo-100 rounded-lg hover:shadow-md transition-all cursor-pointer bg-indigo-50/40"
                                  onClick={() => handleClusterClick(cluster)}
                                >
                                  <div className="p-4">
                                    <div className="flex items-start justify-between mb-1">
                                      <h3 className="font-semibold text-gray-900">
                                        {cluster.name}
                                      </h3>
                                    </div>

                                    {cluster.indications && (
                                      <p className="text-xs text-gray-500 mb-2">
                                        <span className="font-medium">Indications :</span>{' '}
                                        {cluster.indications}
                                      </p>
                                    )}

                                    <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">
  					{cluster.description}
				</p>


                                    {cluster.tests && cluster.tests.length > 0 && (
                                      <p className="text-xs text-gray-500 mb-2">
                                        <span className="font-medium">Inclut :</span>{' '}
                                        {cluster.tests.map((t: any) => t?.name).join(', ')}
                                      </p>
                                    )}

                                    {/* Sensibilité / Spécificité du cluster */}
                                    {(cluster.sensitivity || cluster.specificity) && (
                                      <div className="flex items-center gap-3 mt-2">
                                        {cluster.sensitivity && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">Se:</span>
                                            {getStatBadge(cluster.sensitivity, 'sensitivity')}
                                          </div>
                                        )}
                                        {cluster.specificity && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">Sp:</span>
                                            {getStatBadge(cluster.specificity, 'specificity')}
                                          </div>
                                        )}
                                      </div>
                                    )}


                                    {/* Mode admin : éditer + supprimer */}
                                    {profile?.role === 'admin' && (
                                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                                        
                                        {/* EDIT cluster */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/admin/tests/cluster/${cluster.id}/edit`)
                                          }}

                                          className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>

                                        {/* DELETE cluster */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteCluster(cluster.id)
                                          }}
                                          className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {categoryClusters.map((cluster) => (
                                <div
                                  key={cluster.id}
                                  className="border border-indigo-100 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-indigo-50/40"
                                  onClick={() => handleClusterClick(cluster)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-gray-900">
                                        {cluster.name}
                                      </h3>
                                      {cluster.indications && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          <span className="font-medium">Indications :</span>{' '}
                                          {cluster.indications}
                                        </p>
                                      )}
                                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                                      {cluster.description}
                                      </p>
                                      {/* Sensibilité / Spécificité */}
                                      {(cluster.sensitivity || cluster.specificity) && (
                                        <div className="flex items-center gap-3 mt-2">
                                          {cluster.sensitivity && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs text-gray-500">Se:</span>
                                              {getStatBadge(cluster.sensitivity, 'sensitivity')}
                                            </div>
                                          )}
                                          {cluster.specificity && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs text-gray-500">Sp:</span>
                                              {getStatBadge(cluster.specificity, 'specificity')}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {cluster.tests && cluster.tests.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          <span className="font-medium">Inclut :</span>{' '}
                                          {cluster.tests.map((t: any) => t?.name).join(', ')}
                                        </p>
                                      )}
                                    </div>

                                    {/* Mode admin : éditer + supprimer */}
                                    {profile?.role === 'admin' && (
                                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                                        
                                        {/* EDIT cluster */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/admin/tests/cluster/${cluster.id}/edit`)
                                          }}
                                          className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>

                                        {/* DELETE cluster */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteCluster(cluster.id)
                                          }}
                                          className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tests individuels */}
                      {categoryTests.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Tests individuels
                          </h3>
                          {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {categoryTests.map((test) => (
                                <div
                                  key={test.id}
                                  className="border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                                  onClick={() => handleTestClick(test)}
                                >
                                  <div className="p-4">
                                    <div className="flex items-start justify-between mb-1">
                                      <h3 className="font-semibold text-gray-900">
                                        {test.name}
                                      </h3>
                                      {test.video_url && (
                                        <PlayCircle className="h-5 w-5 text-primary-600 flex-shrink-0" />
                                      )}
                                    </div>

                                    {test.indications && (
                                      <p className="text-xs text-gray-500 mb-2">
                                        <span className="font-medium">Indications :</span>{' '}
                                        {test.indications}
                                      </p>
                                    )}

                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                      {test.description}
                                    </p>

                                    <div className="space-y-2">
                                      {(test.sensitivity !== null ||
                                        test.specificity !== null) && (
                                        <div className="flex items-center gap-2">
                                          {test.sensitivity !== null && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs text-gray-500">Se:</span>
                                              {getStatBadge(test.sensitivity, 'sensitivity')}
                                            </div>
                                          )}
                                          {test.specificity !== null && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs text-gray-500">Sp:</span>
                                              {getStatBadge(test.specificity, 'specificity')}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {profile?.role === 'admin' && (
                                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/admin/tests/${test.id}/edit`)
                                          }}
                                          className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteTest(test.id)
                                          }}
                                          className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {categoryTests.map((test) => (
                                <div
                                  key={test.id}
                                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                                  onClick={() => handleTestClick(test)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3">
                                        <h3 className="font-semibold text-gray-900">
                                          {test.name}
                                        </h3>
                                        {test.video_url && (
                                          <PlayCircle className="h-4 w-4 text-primary-600" />
                                        )}
                                      </div>

                                      {test.indications && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          <span className="font-medium">Indications :</span>{' '}
                                          {test.indications}
                                        </p>
                                      )}

                                      <p className="text-sm text-gray-600 mt-1">
                                        {test.description}
                                      </p>
                                    </div>

                                    <div className="flex items-center space-x-4 ml-4">
                                      {test.sensitivity !== null && (
                                        <div>
                                          <p className="text-xs text-gray-500">Sensibilité</p>
                                          {getStatBadge(test.sensitivity, 'sensitivity')}
                                        </div>
                                      )}
                                      {test.specificity !== null && (
                                        <div>
                                          <p className="text-xs text-gray-500">Spécificité</p>
                                          {getStatBadge(test.specificity, 'specificity')}
                                        </div>
                                      )}

                                      {profile?.role === 'admin' && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/admin/tests/${test.id}/edit`)
                                            }}
                                            className="p-1.5 text-gray-600 hover:text-primary-600"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteTest(test.id)
                                            }}
                                            className="p-1.5 text-gray-600 hover:text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Related Modules */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <RelatedContent
            title="📚 Explorer aussi"
            items={[
              {
                id: 'diagnostics',
                title: 'Diagnostics & Pathologies',
                description: 'Pathologies par région avec photos, signes cliniques et red flags',
                module: 'Référence Clinique',
                href: '/diagnostics',
                gradient: 'from-rose-500 to-pink-600',
                icon: Stethoscope
              },
              {
                id: 'topographie',
                title: 'Topographie',
                description: 'Guides topographiques pour structurer votre raisonnement clinique',
                module: 'Référence Clinique',
                href: '/topographie',
                gradient: 'from-sky-500 to-blue-600',
                icon: User
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

      {/* Modal création CLUSTER */}
      {clusterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Nouveau cluster de tests</h2>
                  <p className="text-sm text-gray-500">
                    Assemblez une batterie cohérente directement depuis le module tests.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetClusterForm()
                  setClusterModalOpen(false)
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du cluster *</label>
                    <input
                      type="text"
                      value={clusterForm.name}
                      onChange={(e) => setClusterForm({ ...clusterForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex : Cluster épaule douloureuse"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Région principale *</label>
                    <select
                      value={clusterForm.region}
                      onChange={(e) => setClusterForm({ ...clusterForm, region: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Sélectionner une région...</option>
                      {Object.entries(BODY_REGIONS).map(([category, regions]) => (
                        <optgroup key={category} label={category}>
                          {regions.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={clusterForm.description}
                      onChange={(e) => setClusterForm({ ...clusterForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Résumé rapide du cluster"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Indications principales</label>
                    <textarea
                      value={clusterForm.indications}
                      onChange={(e) => setClusterForm({ ...clusterForm, indications: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex : suspicion de LCA, épaule douloureuse..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sources</label>
                    <textarea
                      value={clusterForm.sources}
                      onChange={(e) => setClusterForm({ ...clusterForm, sources: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Références et bibliographie (une par ligne)"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sensibilité globale (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={clusterForm.sensitivity}
                        onChange={(e) => setClusterForm({ ...clusterForm, sensitivity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex : 90"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spécificité globale (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={clusterForm.specificity}
                        onChange={(e) => setClusterForm({ ...clusterForm, specificity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex : 75"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RV+</label>
                      <input
                        type="number"
                        step="0.01"
                        value={clusterForm.rv_positive}
                        onChange={(e) => setClusterForm({ ...clusterForm, rv_positive: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex : 5.2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RV-</label>
                      <input
                        type="number"
                        step="0.01"
                        value={clusterForm.rv_negative}
                        onChange={(e) => setClusterForm({ ...clusterForm, rv_negative: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex : 0.3"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={clusterSearchQuery}
                          onChange={(e) => setClusterSearchQuery(e.target.value)}
                          placeholder="Filtrer les tests à ajouter"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <select
                        value={clusterRegionFilter}
                        onChange={(e) => setClusterRegionFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg"
                      >
                        <option value="all">Toutes les régions</option>
                        {Object.entries(BODY_REGIONS).map(([category, regions]) => (
                          <optgroup key={category} label={category}>
                            {regions.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y bg-white">
                      {clusterFilteredTests.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">Aucun test ne correspond aux filtres.</div>
                      ) : (
                        clusterFilteredTests.map((test) => {
                          const selected = clusterSelectedTests.includes(test.id)
                          return (
                            <button
                              key={test.id}
                              type="button"
                              onClick={() => toggleTestInCluster(test.id)}
                              className={`w-full text-left px-4 py-2 flex items-start justify-between gap-3 hover:bg-gray-50 ${selected ? 'bg-primary-50' : ''}`}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{test.name}</p>
                                <p className="text-xs text-gray-500">Région : {test.region || 'Non définie'}</p>
                                {test.indications && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                    <span className="font-medium">Indications :</span> {test.indications}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center">
                                {selected ? (
                                  <span className="text-xs font-medium text-primary-700 bg-primary-100 px-2 py-1 rounded-full">Ajouté</span>
                                ) : (
                                  <span className="text-xs text-gray-400">Ajouter</span>
                                )}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">Tests sélectionnés</p>
                        <span className="text-xs text-gray-500">{clusterSelectedTests.length} test(s)</span>
                      </div>
                      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white">
                        {clusterSelectedTests.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500">Aucun test sélectionné pour le moment.</div>
                        ) : (
                          <ul className="divide-y text-sm">
                            {clusterSelectedTests.map((testId, index) => {
                              const t = tests.find((tt) => tt.id === testId)
                              if (!t) return null
                              return (
                                <li key={testId} className="px-3 py-2 flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">#{index + 1} {t.name}</p>
                                    <p className="text-xs text-gray-500">{t.region || 'Non défini'}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleTestInCluster(testId)}
                                    className="text-xs text-red-500 hover:text-red-600"
                                  >
                                    Retirer
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {clusterSelectedTests.length} test(s) seront ajoutés automatiquement dans ce cluster.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetClusterForm()
                    setClusterModalOpen(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateCluster}
                  disabled={clusterSaving}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {clusterSaving && (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Créer le cluster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail TEST */}
      {showTestModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedTest.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Région : {selectedTest.region}
                  </p>
                  {selectedTest.indications && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Indications :</span>{' '}
                      {selectedTest.indications}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-line">
    		{selectedTest.description}</p>
              </div>

              {selectedTest.video_url && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Démonstration vidéo
                  </h3>
                  {selectedTest.video_url.includes('youtube.com') ||
                  selectedTest.video_url.includes('youtu.be') ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <iframe
                        src={selectedTest.video_url
                          .replace('watch?v=', 'embed/')
                          .replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a
                      href={selectedTest.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      <PlayCircle className="h-5 w-5" />
                      Voir la vidéo
                    </a>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedTest.sensitivity !== null && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Sensibilité
                      </span>
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedTest.sensitivity}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Capacité à détecter les vrais positifs
                    </p>
                  </div>
                )}

                {selectedTest.specificity !== null && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Spécificité
                      </span>
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedTest.specificity}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Capacité à détecter les vrais négatifs
                    </p>
                  </div>
                )}

                {selectedTest.rv_positive !== null && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        RV+
                      </span>
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedTest.rv_positive}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rapport de vraisemblance positif
                    </p>
                  </div>
                )}

                {selectedTest.rv_negative !== null && (
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        RV-
                      </span>
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">
                      {selectedTest.rv_negative}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rapport de vraisemblance négatif
                    </p>
                  </div>
                )}
              </div>

              {selectedTest.interest && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Intérêt clinique
                  </h3>
                  <p className="text-gray-600">{selectedTest.interest}</p>
                </div>
              )}

              {selectedTest.sources && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sources</h3>
                  <div className="text-gray-600 text-sm space-y-1">
                    {String(selectedTest.sources)
                      .split('\n')
                      .filter((s: string) => s.trim().length > 0)
                      .map((line: string, idx: number) => (
                        <p key={idx}>• {line}</p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal détail CLUSTER */}
      {showClusterModal && selectedCluster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedCluster.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Région : {selectedCluster.region}
                  </p>
                  {selectedCluster.indications && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Indications :</span>{' '}
                      {selectedCluster.indications}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowClusterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedCluster.description && (
  <div>
    <h3 className="font-semibold text-gray-900 mb-2">
      Description du cluster
    </h3>
    <p className="text-gray-600 whitespace-pre-line">
      {selectedCluster.description}
    </p>
  </div>
)}


              {selectedCluster.tests && selectedCluster.tests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tests inclus</h3>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    {selectedCluster.tests.map((t: any) => (
                      <li key={t.id}>
                        <span className="font-medium">{t.name}</span>
                        {t.indications && (
                          <span className="text-gray-500">
                            {' '}
                            – {t.indications}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedCluster.sensitivity !== null &&
                  selectedCluster.sensitivity !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Sensibilité globale
                        </span>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedCluster.sensitivity}%
                      </p>
                    </div>
                  )}

                {selectedCluster.specificity !== null &&
                  selectedCluster.specificity !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Spécificité globale
                        </span>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedCluster.specificity}%
                      </p>
                    </div>
                  )}
              </div>

              {selectedCluster.interest && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Intérêt clinique du cluster
                  </h3>
                  <p className="text-gray-600">{selectedCluster.interest}</p>
                </div>
              )}

              {selectedCluster.sources && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sources</h3>
                  <div className="text-gray-600 text-sm space-y-1">
                    {String(selectedCluster.sources)
                      .split('\n')
                      .filter((s: string) => s.trim().length > 0)
                      .map((line: string, idx: number) => (
                        <p key={idx}>• {line}</p>
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
