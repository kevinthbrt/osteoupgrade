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
  BarChart
} from 'lucide-react'

// Catégories de régions anatomiques
const BODY_REGIONS = {
  'Tête et Cou': ['Cervical', 'ATM', 'Crâne'],
  'Membre Supérieur': ['Épaule', 'Coude', 'Poignet', 'Main'],
  'Tronc': ['Thoracique', 'Lombaire', 'Sacro-iliaque', 'Côtes'],
  'Membre Inférieur': ['Hanche', 'Genou', 'Cheville', 'Pied'],
  'Général': ['Neurologique', 'Vasculaire', 'Systémique']
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

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    filterTests()
  }, [searchQuery, filterRegion, filterStats, tests])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
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
        .select(`
          *,
          profiles:created_by (
            email,
            full_name
          )
        `)
        .order('name', { ascending: true })

      const testsWithData = testsData || []
      setTests(testsWithData)
      setFilteredTests(testsWithData)

      // Calculer les statistiques
      const regionCounts: Record<string, number> = {}
      testsWithData.forEach(test => {
        if (test.category) {
          regionCounts[test.category] = (regionCounts[test.category] || 0) + 1
        }
      })

      setStats({
        total: testsWithData.length,
        withVideo: testsWithData.filter(t => t.video_url).length,
        withStats: testsWithData.filter(t => t.sensitivity || t.specificity).length,
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
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.interest?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtre par région
    if (filterRegion !== 'all') {
      filtered = filtered.filter(test => test.category === filterRegion)
    }

    // Filtre par statistiques
    if (filterStats === 'with-stats') {
      filtered = filtered.filter(test => test.sensitivity || test.specificity)
    } else if (filterStats === 'without-stats') {
      filtered = filtered.filter(test => !test.sensitivity && !test.specificity)
    }

    setFilteredTests(filtered)
  }

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ? Cette action est irréversible.')) {
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
    // TODO: Créer une page d'édition de test
    alert('Page d\'édition en cours de développement')
    // router.push(`/admin/tests/${testId}/edit`)
  }

  const exportToCSV = () => {
    const csv = [
      ['Nom', 'Région', 'Description', 'Sensibilité', 'Spécificité', 'RV+', 'RV-', 'Vidéo', 'Créé le'].join(','),
      ...filteredTests.map(t => [
        t.name,
        t.category || '',
        t.description.replace(/,/g, ';'),
        t.sensitivity || '',
        t.specificity || '',
        t.rv_positive || '',
        t.rv_negative || '',
        t.video_url ? 'Oui' : 'Non',
        new Date(t.created_at).toLocaleDateString('fr-FR')
      ].join(','))
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {value}%
      </span>
    )
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
                Administrez la base de données des tests
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
                <p className="text-2xl font-bold text-purple-600">{stats.withStats}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par région</h3>
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
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
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
    </AuthLayout>
  )
}
