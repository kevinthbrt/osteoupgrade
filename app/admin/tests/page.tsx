'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Clipboard,
  Plus,
  Edit,
  Trash2,
  Search,
  PlayCircle,
  Activity,
  TrendingUp,
  MapPin,
  Download,
  Filter,
  BarChart,
  X,
  Layers
} from 'lucide-react'

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

export default function AdminTestsPage() {
  const router = useRouter()
  const [tests, setTests] = useState<any[]>([])
  const [filteredTests, setFilteredTests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterStats, setFilterStats] = useState('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    withVideo: 0,
    withStats: 0,
    byRegion: {} as Record<string, number>
  })

  // 🔹 État pour la création de cluster
  const [clusterModalOpen, setClusterModalOpen] = useState(false)
  const [clusterSaving, setClusterSaving] = useState(false)
  const [clusterForm, setClusterForm] = useState({ ...CLUSTER_INITIAL_FORM })
  const [clusterSelectedTests, setClusterSelectedTests] = useState<string[]>([])
  const [clusterSearchQuery, setClusterSearchQuery] = useState('')
  const [clusterRegionFilter, setClusterRegionFilter] = useState('all')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    filterTests()
  }, [searchQuery, filterRegion, filterStats, tests])

  const checkAdminAccess = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    loadTests()
  }

  const loadTests = async () => {
    try {
      const { data: testsData } = await supabase
        .from('orthopedic_tests')
        .select(
          `
          *,
          profiles:created_by (
            email,
            full_name
          )
        `
        )
        .order('name', { ascending: true })

      const testsWithData = testsData || []
      setTests(testsWithData)
      setFilteredTests(testsWithData)

      // Calculer les statistiques
      const regionCounts: Record<string, number> = {}
      testsWithData.forEach((test) => {
        if (test.category) {
          regionCounts[test.category] = (regionCounts[test.category] || 0) + 1
        }
      })

      setStats({
        total: testsWithData.length,
        withVideo: testsWithData.filter((t) => t.video_url).length,
        withStats: testsWithData.filter((t) => t.sensitivity || t.specificity).length,
        byRegion: regionCounts
      })
    } catch (error) {
      console.error('Error loading tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTests = () => {
    let filtered = [...tests]

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (test) =>
          test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.interest?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtre par région
    if (filterRegion !== 'all') {
      filtered = filtered.filter((test) => test.category === filterRegion)
    }

    // Filtre par statistiques
    if (filterStats === 'with-stats') {
      filtered = filtered.filter((test) => test.sensitivity || test.specificity)
    } else if (filterStats === 'without-stats') {
      filtered = filtered.filter((test) => !test.sensitivity && !test.specificity)
    }

    setFilteredTests(filtered)
  }

  const handleDeleteTest = async (testId: string) => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer ce test ? Cette action est irréversible.'
      )
    ) {
      return
    }

    try {
      const { error } = await supabase
        .from('orthopedic_tests')
        .delete()
        .eq('id', testId)

      if (error) throw error

      alert('Test supprimé avec succès')
      loadTests()
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }

  const handleEditTest = (testId: string) => {
    router.push(`/admin/tests/${testId}/edit`)
  }

  const exportToCSV = () => {
    const csv = [
      [
        'Nom',
        'Région',
        'Description',
        'Sensibilité',
        'Spécificité',
        'RV+',
        'RV-',
        'Vidéo',
        'Créé le'
      ].join(','),
      ...filteredTests.map((t) =>
        [
          t.name,
          t.category || '',
          (t.description || '').replace(/,/g, ';'),
          t.sensitivity || '',
          t.specificity || '',
          t.rv_positive || '',
          t.rv_negative || '',
          t.video_url ? 'Oui' : 'Non',
          new Date(t.created_at).toLocaleDateString('fr-FR')
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tests-orthopediques-export.csv'
    a.click()
  }

  const getStatBadge = (value: number | null, type: string) => {
    if (value === null) return <span className="text-gray-400">-</span>

    let bgColor = 'bg-gray-100'
    let textColor = 'text-gray-700'

    if (type === 'sensitivity' || type === 'specificity') {
      if (value >= 80) {
        bgColor = 'bg-green-100'
        textColor = 'text-green-700'
      } else if (value >= 60) {
        bgColor = 'bg-yellow-100'
        textColor = 'text-yellow-700'
      } else {
        bgColor = 'bg-red-100'
        textColor = 'text-red-700'
      }
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {value}%
      </span>
    )
  }

  // 🔹 Helpers pour le module de cluster

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
    if (clusterRegionFilter !== 'all' && test.category !== clusterRegionFilter) return false

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

      // Création du cluster
      const { data: cluster, error: clusterError } = await supabase
        .from('orthopedic_test_clusters')
        .insert({
          name: clusterForm.name,
          region: clusterForm.region,
          description: clusterForm.description || null,
          indications: clusterForm.indications || null,
          interest: clusterForm.interest || null,
          sources: clusterForm.sources || null,
          sensitivity: clusterForm.sensitivity
            ? parseFloat(clusterForm.sensitivity)
            : null,
          specificity: clusterForm.specificity
            ? parseFloat(clusterForm.specificity)
            : null,
          rv_positive: clusterForm.rv_positive
            ? parseFloat(clusterForm.rv_positive)
            : null,
          rv_negative: clusterForm.rv_negative
            ? parseFloat(clusterForm.rv_negative)
            : null,
          created_by: user.id
        })
        .select('id')
        .single()

      if (clusterError) throw clusterError

      // Liaisons cluster <-> tests
      const itemsPayload = clusterSelectedTests.map((testId, index) => ({
        cluster_id: cluster.id,
        test_id: testId,
        order_index: index
      }))

      const { error: itemsError } = await supabase
        .from('orthopedic_test_cluster_items')
        .insert(itemsPayload)

      if (itemsError) throw itemsError

      alert('Cluster créé avec succès !')
      resetClusterForm()
      setClusterModalOpen(false)
    } catch (error: any) {
      alert('Erreur lors de la création du cluster : ' + error.message)
    } finally {
      setClusterSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Clipboard className="h-6 w-6" />
                Gestion des tests orthopédiques
              </h1>
              <p className="mt-1 text-green-100">
                Administrez la base de données des tests et créez des clusters
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              <button
                onClick={() => setClusterModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Layers className="h-4 w-4" />
                Nouveau cluster
              </button>
              <button
                onClick={() => router.push('/admin/tests/new')}
                className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouveau test
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Clipboard className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avec vidéo</p>
                <p className="text-2xl font-bold text-blue-600">{stats.withVideo}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avec stats</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.withStats}
                </p>
              </div>
              <BarChart className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Régions</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Object.keys(stats.byRegion).length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Stats par région */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par région
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(stats.byRegion).map(([region, count]) => (
              <div key={region} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">{region}</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
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

            <select
              value={filterStats}
              onChange={(e) => setFilterStats(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les tests</option>
              <option value="with-stats">Avec statistiques</option>
              <option value="without-stats">Sans statistiques</option>
            </select>
          </div>
        </div>

        {/* Tests Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Région
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sensibilité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécificité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RV+/RV-
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médias
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Aucun test trouvé
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {test.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {test.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <MapPin className="h-3 w-3 mr-1" />
                          {test.category || 'Non défini'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatBadge(test.sensitivity, 'sensitivity')}
                      </td>
                      <td className="px-6 py-4">
                        {getStatBadge(test.specificity, 'specificity')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          {test.rv_positive && (
                            <p className="text-green-600">RV+ {test.rv_positive}</p>
                          )}
                          {test.rv_negative && (
                            <p className="text-red-600">RV- {test.rv_negative}</p>
                          )}
                          {!test.rv_positive && !test.rv_negative && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {test.video_url ? (
                          <a
                            href={test.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditTest(test.id)}
                            className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                            title="Éditer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🔹 Modal de création de cluster */}
      {clusterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header modal */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-green-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Nouveau cluster de tests
                  </h2>
                  <p className="text-sm text-gray-500">
                    Créez une batterie de tests cohérente (épaule douloureuse, LCA, etc.)
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

            {/* Contenu modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Infos générales + stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Infos générales */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Informations générales
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du cluster *
                    </label>
                    <input
                      type="text"
                      value={clusterForm.name}
                      onChange={(e) =>
                        setClusterForm({ ...clusterForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex : Cluster épaule douloureuse"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Région principale *
                    </label>
                    <select
                      value={clusterForm.region}
                      onChange={(e) =>
                        setClusterForm({ ...clusterForm, region: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Sélectionner une région...</option>
                      {Object.entries(BODY_REGIONS).map(
                        ([category, regions]) =>
                          regions &&
                          regions.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={clusterForm.description}
                      onChange={(e) =>
                        setClusterForm({
                          ...clusterForm,
                          description: e.target.value
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Résumé de la batterie : objectif, contexte clinique..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indications principales
                    </label>
                    <textarea
                      value={clusterForm.indications}
                      onChange={(e) =>
                        setClusterForm({
                          ...clusterForm,
                          indications: e.target.value
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex : Épaule douloureuse non traumatique, suspicion de conflit sous-acromial..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intérêt clinique global
                    </label>
                    <textarea
                      value={clusterForm.interest}
                      onChange={(e) =>
                        setClusterForm({
                          ...clusterForm,
                          interest: e.target.value
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Place du cluster dans le raisonnement clinique, avantages vs tests isolés..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sources / bibliographie
                    </label>
                    <textarea
                      value={clusterForm.sources}
                      onChange={(e) =>
                        setClusterForm({
                          ...clusterForm,
                          sources: e.target.value
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Références, articles, guidelines (une par ligne)..."
                    />
                  </div>
                </div>

                {/* Statistiques du cluster */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Statistiques du cluster (optionnel)
                  </h3>

                  <p className="text-xs text-gray-500">
                    Si la littérature propose une sensibilité/spécificité pour la
                    combinaison de tests, vous pouvez la renseigner ici.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sensibilité globale (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={clusterForm.sensitivity}
                        onChange={(e) =>
                          setClusterForm({
                            ...clusterForm,
                            sensitivity: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex : 90"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spécificité globale (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={clusterForm.specificity}
                        onChange={(e) =>
                          setClusterForm({
                            ...clusterForm,
                            specificity: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex : 85"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RV+ global
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={clusterForm.rv_positive}
                        onChange={(e) =>
                          setClusterForm({
                            ...clusterForm,
                            rv_positive: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex : 6.2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RV- global
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={clusterForm.rv_negative}
                        onChange={(e) =>
                          setClusterForm({
                            ...clusterForm,
                            rv_negative: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex : 0.12"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sélection des tests */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                  Sélection des tests du cluster
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Liste des tests filtrables */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={clusterSearchQuery}
                          onChange={(e) =>
                            setClusterSearchQuery(e.target.value)
                          }
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Rechercher un test (nom, description, indications)..."
                        />
                      </div>
                      <select
                        value={clusterRegionFilter}
                        onChange={(e) => setClusterRegionFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="all">Toutes les régions</option>
                        {Object.entries(BODY_REGIONS).map(
                          ([category, regions]) => (
                            <optgroup key={category} label={category}>
                              {regions.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </optgroup>
                          )
                        )}
                      </select>
                    </div>

                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y">
                      {clusterFilteredTests.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">
                          Aucun test ne correspond aux filtres.
                        </div>
                      ) : (
                        clusterFilteredTests.map((test) => {
                          const selected = clusterSelectedTests.includes(test.id)
                          return (
                            <button
                              key={test.id}
                              type="button"
                              onClick={() => toggleTestInCluster(test.id)}
                              className={`w-full text-left px-4 py-2 flex items-start justify-between gap-3 hover:bg-gray-50 ${
                                selected ? 'bg-green-50' : ''
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {test.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Région : {test.category || 'Non défini'}
                                </p>
                                {test.indications && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                    <span className="font-medium">
                                      Indications :
                                    </span>{' '}
                                    {test.indications}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center">
                                {selected ? (
                                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                    Ajouté
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    Ajouter
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Liste des tests sélectionnés */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Tests sélectionnés
                      </p>
                      <span className="text-xs text-gray-500">
                        {clusterSelectedTests.length} test(s)
                      </span>
                    </div>
                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      {clusterSelectedTests.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">
                          Aucun test sélectionné pour le moment.
                        </div>
                      ) : (
                        <ul className="divide-y text-sm">
                          {clusterSelectedTests.map((testId, index) => {
                            const t = tests.find((tt) => tt.id === testId)
                            if (!t) return null
                            return (
                              <li
                                key={testId}
                                className="px-3 py-2 flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    #{index + 1} {t.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {t.category || 'Non défini'}
                                  </p>
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

            {/* Footer modal */}
            <div className="p-6 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {clusterSelectedTests.length} test(s) seront ajoutés automatiquement
                quand vous utiliserez ce cluster dans le module de testing.
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
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
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
    </AuthLayout>
  )
}
