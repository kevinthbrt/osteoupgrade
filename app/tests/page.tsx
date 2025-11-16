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
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  User,
  Activity,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Catégories de régions anatomiques
const BODY_REGIONS = {
  'Tête et Cou': ['Cervical', 'ATM', 'Crâne'],
  'Membre Supérieur': ['Épaule', 'Coude', 'Poignet', 'Main'],
  'Tronc': ['Thoracique', 'Lombaire', 'Sacro-iliaque', 'Côtes'],
  'Membre Inférieur': ['Hanche', 'Genou', 'Cheville', 'Pied'],
  'Général': ['Neurologique', 'Vasculaire', 'Systémique']
}

export default function ImprovedTestsPage() {
  const router = useRouter()

  // Tests isolés
  const [tests, setTests] = useState<any[]>([])
  const [filteredTests, setFilteredTests] = useState<any[]>([])

  // Clusters
  const [clusters, setClusters] = useState<any[]>([])
  const [filteredClusters, setFilteredClusters] = useState<any[]>([])

  // Profil & UI
  const [profile, setProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [expandedRegions, setExpandedRegions] = useState<string[]>(
    Object.keys(BODY_REGIONS)
  )

  // Modals
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState<any>(null)
  const [showClusterModal, setShowClusterModal] = useState(false)

  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterAll()
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

      // Récupération des tests
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

      // Récupération des clusters + pivot
      const [{ data: clustersData }, { data: clusterTestsData }] = await Promise.all([
        supabase
          .from('orthopedic_clusters')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('orthopedic_cluster_tests')
          .select('cluster_id, test_id')
      ])

      const testsMap = new Map(
        (testsWithRegions || []).map((t: any) => [t.id, t])
      )

      const clustersWithTests =
        (clustersData || []).map((cluster: any) => ({
          ...cluster,
          region: cluster.region || 'Général',
          tests:
            (clusterTestsData || [])
              .filter((ct: any) => ct.cluster_id === cluster.id)
              .map((ct: any) => testsMap.get(ct.test_id))
              .filter(Boolean) || []
        })) || []

      setClusters(clustersWithTests)

      // Initial filtered states
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

  const filterAll = () => {
    let filteredT = [...tests]
    let filteredC = [...clusters]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()

      // Tests
      filteredT = filteredT.filter((test) =>
        test.name.toLowerCase().includes(q) ||
        test.description?.toLowerCase().includes(q) ||
        test.indications?.toLowerCase().includes(q) ||
        test.interest?.toLowerCase().includes(q) ||
        test.sources?.toLowerCase().includes(q)
      )

      // Clusters (nom, desc, indications, interest, sources + noms de tests du cluster)
      filteredC = filteredC.filter((cluster: any) => {
        const inFields =
          cluster.name?.toLowerCase().includes(q) ||
          cluster.description?.toLowerCase().includes(q) ||
          cluster.indications?.toLowerCase().includes(q) ||
          cluster.interest?.toLowerCase().includes(q) ||
          cluster.sources?.toLowerCase().includes(q)

        const inTests =
          cluster.tests &&
          cluster.tests.some(
            (t: any) =>
              t?.name?.toLowerCase().includes(q) ||
              t?.description?.toLowerCase().includes(q)
          )

        return inFields || inTests
      })
    }

    if (selectedRegion !== 'all') {
      filteredT = filteredT.filter((test) => test.region === selectedRegion)
      filteredC = filteredC.filter((cluster) => cluster.region === selectedRegion)
    }

    setFilteredTests(filteredT)
    setFilteredClusters(filteredC)
  }

  const handleTestClick = (test: any) => {
    setSelectedTest(test)
    setShowModal(true)
  }

  const handleClusterClick = (cluster: any) => {
    setSelectedCluster(cluster)
    setShowClusterModal(true)
  }

  const handleDeleteTest = async (testId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) {
      await supabase.from('orthopedic_tests').delete().eq('id', testId)
      loadData()
    }
  }

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    )
  }

  const getTestsByCategory = () => {
    const testsByCategory: Record<string, any[]> = {}

    Object.keys(BODY_REGIONS).forEach((category) => {
      testsByCategory[category] = filteredTests.filter((test) => {
        const subRegions = BODY_REGIONS[category as keyof typeof BODY_REGIONS]
        return subRegions.includes(test.region)
      })
    })

    return testsByCategory
  }

  const getClustersByCategory = () => {
    const clustersByCategory: Record<string, any[]> = {}

    Object.keys(BODY_REGIONS).forEach((category) => {
      const subRegions = BODY_REGIONS[category as keyof typeof BODY_REGIONS]
      clustersByCategory[category] = filteredClusters.filter((cluster: any) =>
        subRegions.includes(cluster.region || 'Général')
      )
    })

    return clustersByCategory
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

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AuthLayout>
    )
  }

  const testsByCategory = getTestsByCategory()
  const clustersByCategory = getClustersByCategory()

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
                  onClick={() => router.push('/admin/tests/new')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouveau test</span>
                </button>
                <button
                  onClick={() => router.push('/admin/tests')}
                  className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
            <p className="text-gray-600">Modifiez vos critères de recherche</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(testsByCategory).map(([category, categoryTests]) => {
              const categoryClusters = clustersByCategory[category] || []
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
                    <div className="px-6 pb-6 space-y-6">
                      {/* Clusters pour cette région */}
                      {categoryClusters.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-2">
                            Clusters recommandés
                          </h3>
                          <div className="flex flex-col gap-3">
                            {categoryClusters.map((cluster: any) => (
                              <div
                                key={cluster.id}
                                className="border border-primary-100 bg-primary-50/40 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => handleClusterClick(cluster)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {cluster.name}
                                    </p>
                                    {cluster.indications && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-medium">Indications :</span>{' '}
                                        {cluster.indications}
                                      </p>
                                    )}
                                    {cluster.description && (
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {cluster.description}
                                      </p>
                                    )}
                                    {cluster.tests && cluster.tests.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {cluster.tests.map((t: any) => (
                                          <span
                                            key={t.id}
                                            className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-primary-100 text-primary-700"
                                          >
                                            {t.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {cluster.sensitivity !== null &&
                                      cluster.sensitivity !== undefined && (
                                        <div className="text-right">
                                          <p className="text-[11px] text-gray-500">Se</p>
                                          {getStatBadge(
                                            cluster.sensitivity,
                                            'sensitivity'
                                          )}
                                        </div>
                                      )}
                                    {cluster.specificity !== null &&
                                      cluster.specificity !== undefined && (
                                        <div className="text-right">
                                          <p className="text-[11px] text-gray-500">Sp</p>
                                          {getStatBadge(
                                            cluster.specificity,
                                            'specificity'
                                          )}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tests isolés pour cette région */}
                      {categoryTests.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-2">
                            Tests individuels
                          </h3>
                          {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {categoryTests.map((test: any) => (
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
                                              <span className="text-xs text-gray-500">
                                                Se:
                                              </span>
                                              {getStatBadge(
                                                test.sensitivity,
                                                'sensitivity'
                                              )}
                                            </div>
                                          )}
                                          {test.specificity !== null && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs text-gray-500">
                                                Sp:
                                              </span>
                                              {getStatBadge(
                                                test.specificity,
                                                'specificity'
                                              )}
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
                              {categoryTests.map((test: any) => (
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
                                          <span className="font-medium">
                                            Indications :
                                          </span>{' '}
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
                                          <p className="text-xs text-gray-500">
                                            Sensibilité
                                          </p>
                                          {getStatBadge(
                                            test.sensitivity,
                                            'sensitivity'
                                          )}
                                        </div>
                                      )}
                                      {test.specificity !== null && (
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Spécificité
                                          </p>
                                          {getStatBadge(
                                            test.specificity,
                                            'specificity'
                                          )}
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
      </div>

      {/* Modal de détail TEST */}
      {showModal && selectedTest && (
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
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedTest.description}</p>
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

      {/* Modal de détail CLUSTER */}
      {showClusterModal && selectedCluster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Cluster : {selectedCluster.name}
                  </h2>
                  {selectedCluster.region && (
                    <p className="text-sm text-gray-500 mt-1">
                      Région : {selectedCluster.region}
                    </p>
                  )}
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
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedCluster.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedCluster.sensitivity !== null &&
                  selectedCluster.sensitivity !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Sensibilité (cluster)
                        </span>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedCluster.sensitivity}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Capacité globale du cluster à détecter les vrais positifs
                      </p>
                    </div>
                  )}

                {selectedCluster.specificity !== null &&
                  selectedCluster.specificity !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Spécificité (cluster)
                        </span>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedCluster.specificity}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Capacité globale du cluster à détecter les vrais négatifs
                      </p>
                    </div>
                  )}

                {selectedCluster.rv_positive !== null &&
                  selectedCluster.rv_positive !== undefined && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          RV+ (cluster)
                        </span>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {selectedCluster.rv_positive}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Rapport de vraisemblance positif global
                      </p>
                    </div>
                  )}

                {selectedCluster.rv_negative !== null &&
                  selectedCluster.rv_negative !== undefined && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          RV- (cluster)
                        </span>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-indigo-900">
                        {selectedCluster.rv_negative}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Rapport de vraisemblance négatif global
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

              {selectedCluster.tests && selectedCluster.tests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Tests composant ce cluster
                  </h3>
                  <div className="space-y-2">
                    {selectedCluster.tests.map((test: any) => (
                      <div
                        key={test.id}
                        className="flex items-start justify-between border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {test.name}
                          </p>
                          {test.indications && (
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">Indications :</span>{' '}
                              {test.indications}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTest(test)
                            setShowModal(true)
                            setShowClusterModal(false)
                          }}
                          className="text-xs px-3 py-1 rounded-full border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          Voir le test
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCluster.sources && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sources du cluster</h3>
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
