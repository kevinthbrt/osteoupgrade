'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Image as ImageIcon,
  TestTube,
  Map,
  GraduationCap
} from 'lucide-react'
import RelatedContent, { RelatedItem } from '@/components/RelatedContent'
import Image from 'next/image'

// Types
type AnatomicalRegion = 'cervical' | 'atm' | 'crane' | 'thoracique' | 'lombaire' | 'sacro-iliaque' | 'cotes' | 'epaule' | 'coude' | 'poignet' | 'main' | 'hanche' | 'genou' | 'cheville' | 'pied' | 'neurologique' | 'vasculaire' | 'systemique'

interface Pathology {
  id: string
  name: string
  description: string | null
  region: AnatomicalRegion
  clinical_signs: string | null
  image_url: string | null
  is_active: boolean
  display_order: number
  test_count?: number
  cluster_count?: number
}

const REGIONS: { value: AnatomicalRegion; label: string }[] = [
  { value: 'cervical', label: 'Cervical' },
  { value: 'atm', label: 'ATM' },
  { value: 'crane', label: 'Crâne' },
  { value: 'thoracique', label: 'Thoracique' },
  { value: 'lombaire', label: 'Lombaire' },
  { value: 'sacro-iliaque', label: 'Sacro-iliaque' },
  { value: 'cotes', label: 'Côtes' },
  { value: 'epaule', label: 'Épaule' },
  { value: 'coude', label: 'Coude' },
  { value: 'poignet', label: 'Poignet' },
  { value: 'main', label: 'Main' },
  { value: 'hanche', label: 'Hanche' },
  { value: 'genou', label: 'Genou' },
  { value: 'cheville', label: 'Cheville' },
  { value: 'pied', label: 'Pied' },
  { value: 'neurologique', label: 'Neurologique' },
  { value: 'vasculaire', label: 'Vasculaire' },
  { value: 'systemique', label: 'Systémique' }
]

const BODY_REGIONS = {
  'Tête et Cou': ['cervical', 'atm', 'crane'],
  'Membre Supérieur': ['epaule', 'coude', 'poignet', 'main'],
  'Tronc': ['thoracique', 'lombaire', 'sacro-iliaque', 'cotes'],
  'Membre Inférieur': ['hanche', 'genou', 'cheville', 'pied'],
  'Général': ['neurologique', 'vasculaire', 'systemique']
}

export default function DiagnosticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const [pathologies, setPathologies] = useState<Pathology[]>([])
  const [filteredPathologies, setFilteredPathologies] = useState<Pathology[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(Object.keys(BODY_REGIONS))

  useEffect(() => {
    checkAccess()
  }, [])

  useEffect(() => {
    filterPathologies()
  }, [searchQuery, selectedRegion, pathologies])

  const checkAccess = async () => {
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
      alert('Accès réservé aux administrateurs')
      router.push('/dashboard')
      return
    }

    await loadPathologies()
  }

  const loadPathologies = async () => {
    try {
      // Charger les pathologies avec le nombre de tests associés
      const { data: pathologiesData, error } = await supabase
        .from('pathologies')
        .select('*')
        .order('region', { ascending: true })
        .order('display_order', { ascending: true })

      if (error) throw error

      // Charger le nombre de tests pour chaque pathologie
      const { data: testCounts } = await supabase
        .from('pathology_tests')
        .select('pathology_id')

      const testCountsMap = new Map<string, number>()
      testCounts?.forEach(item => {
        testCountsMap.set(item.pathology_id, (testCountsMap.get(item.pathology_id) || 0) + 1)
      })

      // Charger le nombre de clusters pour chaque pathologie
      const { data: clusterCounts } = await supabase
        .from('pathology_clusters')
        .select('pathology_id')

      const clusterCountsMap = new Map<string, number>()
      clusterCounts?.forEach(item => {
        clusterCountsMap.set(item.pathology_id, (clusterCountsMap.get(item.pathology_id) || 0) + 1)
      })

      const pathologiesWithCounts = pathologiesData?.map(p => ({
        ...p,
        test_count: testCountsMap.get(p.id) || 0,
        cluster_count: clusterCountsMap.get(p.id) || 0
      })) || []

      setPathologies(pathologiesWithCounts)
    } catch (error) {
      console.error('Error loading pathologies:', error)
      alert('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const filterPathologies = () => {
    let filtered = [...pathologies]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.clinical_signs?.toLowerCase().includes(q)
      )
    }

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(p => p.region === selectedRegion)
    }

    setFilteredPathologies(filtered)
  }

  const handleNew = () => {
    router.push('/admin/diagnostics/new')
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/diagnostics/${id}/edit`)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le diagnostic "${name}" ?\n\nCeci supprimera également toutes les associations avec les tests.`)) return

    try {
      const { error } = await supabase
        .from('pathologies')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadPathologies()
      alert('✅ Diagnostic supprimé')
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (pathology: Pathology) => {
    try {
      const { error } = await supabase
        .from('pathologies')
        .update({ is_active: !pathology.is_active })
        .eq('id', pathology.id)

      if (error) throw error
      await loadPathologies()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Erreur')
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
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

  const groupedPathologies = Object.entries(BODY_REGIONS).map(([category, regions]) => ({
    category,
    pathologies: filteredPathologies.filter(p => regions.includes(p.region))
  }))

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Gestion des Diagnostics</h1>
              </div>
              <p className="text-purple-100">
                Créez des dossiers de diagnostics avec photos, signes cliniques et tests associés
              </p>
            </div>
            <button
              onClick={handleNew}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 flex items-center gap-2 font-semibold shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Nouveau Diagnostic
            </button>
          </div>
        </div>

        {/* Infos */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TestTube className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Comment ça fonctionne ?</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Créez des <strong>diagnostics</strong> (dossiers) par pathologie</li>
                <li>• Ajoutez une <strong>photo</strong> et des <strong>signes cliniques</strong> pour chaque diagnostic</li>
                <li>• Associez les <strong>tests orthopédiques</strong> pertinents (un test peut appartenir à plusieurs diagnostics)</li>
                <li>• Les praticiens verront ces diagnostics dans le module Testing 3D après avoir cliqué sur une région</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un diagnostic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Toutes les régions</option>
              {REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {filteredPathologies.length} diagnostic(s) trouvé(s)
          </div>
        </div>

        {/* Liste par catégorie */}
        <div className="space-y-4">
          {groupedPathologies.map(({ category, pathologies: catPathologies }) => {
            if (catPathologies.length === 0) return null

            const isExpanded = expandedCategories.includes(category)

            return (
              <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {catPathologies.length}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catPathologies.map(pathology => (
                        <div
                          key={pathology.id}
                          className="group relative border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all overflow-hidden"
                        >
                          {/* Image de fond si présente */}
                          {pathology.image_url && (
                            <div className="relative h-40 bg-gray-100">
                              <Image
                                src={pathology.image_url}
                                alt={pathology.name}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{pathology.name}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                    {REGIONS.find(r => r.value === pathology.region)?.label}
                                  </span>
                                  {!pathology.is_active && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                      Désactivé
                                    </span>
                                  )}
                                </div>

                                {/* Indicateurs */}
                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                  {pathology.image_url && (
                                    <span className="flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3" />
                                      Photo
                                    </span>
                                  )}
                                  {pathology.clinical_signs && (
                                    <span className="flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Signes
                                    </span>
                                  )}
                                  {pathology.test_count !== undefined && pathology.test_count > 0 && (
                                    <span className="flex items-center gap-1">
                                      <TestTube className="h-3 w-3" />
                                      {pathology.test_count} test{pathology.test_count > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {pathology.cluster_count !== undefined && pathology.cluster_count > 0 && (
                                    <span className="flex items-center gap-1 text-purple-600">
                                      <TestTube className="h-3 w-3" />
                                      {pathology.cluster_count} cluster{pathology.cluster_count > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>

                                {pathology.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {pathology.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1 pt-3 border-t">
                              <button
                                onClick={() => handleToggleActive(pathology)}
                                className="p-1.5 text-gray-400 hover:text-gray-600"
                                title={pathology.is_active ? 'Désactiver' : 'Activer'}
                              >
                                {pathology.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleEdit(pathology.id)}
                                className="p-1.5 text-gray-400 hover:text-purple-600"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(pathology.id, pathology.name)}
                                className="p-1.5 text-gray-400 hover:text-red-600"
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
            )
          })}
        </div>

        {filteredPathologies.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun diagnostic trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Créez votre premier diagnostic pour commencer
            </p>
            <button
              onClick={handleNew}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Créer un diagnostic
            </button>
          </div>
        )}

        {/* Related Modules */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <RelatedContent
            title="📚 Explorer aussi"
            items={[
              {
                id: 'tests',
                title: 'Tests Orthopédiques',
                description: 'Base de données complète des tests organisés par région avec vidéos',
                module: 'Référence Clinique',
                href: '/tests',
                gradient: 'from-emerald-500 to-teal-600',
                icon: TestTube
              },
              {
                id: 'topographie',
                title: 'Topographie',
                description: 'Guides topographiques pour structurer votre raisonnement clinique',
                module: 'Référence Clinique',
                href: '/topographie',
                gradient: 'from-sky-500 to-blue-600',
                icon: Map
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
    </AuthLayout>
  )
}
