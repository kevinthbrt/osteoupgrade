'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  Stethoscope,
  Sparkles,
  Search,
  ChevronRight,
  Info,
  Activity,
  Zap,
  Crown,
  Heart,
  Brain,
  Bone,
  Eye,
  Loader2,
  AlertCircle,
  X,
  Plus,
  Edit,
  Trash2,
  EyeOff
} from 'lucide-react'

type Pathology = {
  id: string
  name: string
  description: string
  region: string
  severity: string
  is_red_flag: boolean
  clinical_signs: string
  image_url: string
  is_active?: boolean
  tests?: {
    id: string
    name: string
    description?: string | null
    category?: string | null
  }[]
  clusters?: {
    id: string
    name: string
    description?: string | null
    region?: string | null
  }[]
}

const REGIONS = [
  { value: 'all', label: 'Toutes', icon: Activity, color: 'slate' },
  { value: 'atm', label: 'ATM', icon: Activity, color: 'slate' },
  { value: 'cervical', label: 'Cervical', icon: Brain, color: 'purple' },
  { value: 'crane', label: 'Crâne', icon: Brain, color: 'purple' },
  { value: 'thoracique', label: 'Thoracique', icon: Heart, color: 'rose' },
  { value: 'epaule', label: 'Épaule', icon: Bone, color: 'blue' },
  { value: 'coude', label: 'Coude', icon: Bone, color: 'blue' },
  { value: 'poignet', label: 'Poignet', icon: Bone, color: 'blue' },
  { value: 'main', label: 'Main', icon: Bone, color: 'blue' },
  { value: 'cotes', label: 'Côtes', icon: Bone, color: 'blue' },
  { value: 'hanche', label: 'Hanche', icon: Heart, color: 'rose' },
  { value: 'lombaire', label: 'Lombaire', icon: Heart, color: 'rose' },
  { value: 'sacro-iliaque', label: 'Sacro-iliaque', icon: Heart, color: 'rose' },
  { value: 'genou', label: 'Genou', icon: Zap, color: 'emerald' },
  { value: 'cheville', label: 'Cheville', icon: Eye, color: 'amber' },
  { value: 'pied', label: 'Pied', icon: Eye, color: 'amber' },
  { value: 'neurologique', label: 'Neurologique', icon: Brain, color: 'purple' },
  { value: 'vasculaire', label: 'Vasculaire', icon: Heart, color: 'rose' },
  { value: 'systemique', label: 'Systémique', icon: Activity, color: 'slate' }
]

export default function DiagnosticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pathologies, setPathologies] = useState<Pathology[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [selectedRegion])

  const loadData = async () => {
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

      // Load pathologies
      let pathologiesQuery = supabase
        .from('pathologies')
        .select('*')

      if (profileData?.role !== 'admin') {
        pathologiesQuery = pathologiesQuery.eq('is_active', true)
      }

      if (selectedRegion !== 'all') {
        pathologiesQuery = pathologiesQuery.eq('region', selectedRegion)
      }

      const { data: pathologiesData } = await pathologiesQuery
      const pathologiesList = pathologiesData || []

      if (pathologiesList.length > 0) {
        const pathologyIds = pathologiesList.map((pathology) => pathology.id)
        const { data: testLinks } = await supabase
          .from('pathology_tests')
          .select('pathology_id, test:orthopedic_tests(id, name, description, category)')
          .in('pathology_id', pathologyIds)

        const { data: clusterLinks } = await supabase
          .from('pathology_clusters')
          .select('pathology_id, cluster:orthopedic_test_clusters(id, name, description, region)')
          .in('pathology_id', pathologyIds)

        const testsByPathology = (testLinks || []).reduce(
          (acc, link: { pathology_id: string; test: Pathology['tests'][number] | null }) => {
            if (!link.test) return acc
            acc[link.pathology_id] = acc[link.pathology_id] || []
            acc[link.pathology_id].push(link.test)
            return acc
          },
          {} as Record<string, Pathology['tests']>
        )

        const clustersByPathology = (clusterLinks || []).reduce(
          (acc, link: { pathology_id: string; cluster: Pathology['clusters'][number] | null }) => {
            if (!link.cluster) return acc
            acc[link.pathology_id] = acc[link.pathology_id] || []
            acc[link.pathology_id].push(link.cluster)
            return acc
          },
          {} as Record<string, Pathology['clusters']>
        )

        const enrichedPathologies = pathologiesList.map((pathology) => ({
          ...pathology,
          tests: testsByPathology[pathology.id] || [],
          clusters: clustersByPathology[pathology.id] || []
        }))

        setPathologies(enrichedPathologies)
      } else {
        setPathologies([])
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const isPremium = profile?.role && ['premium_silver', 'premium_gold', 'admin'].includes(profile.role)
  const isAdmin = profile?.role === 'admin'

  const filteredItems = pathologies.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateNew = () => {
    router.push('/admin/diagnostics/new')
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/diagnostics/${id}/edit`)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) return

    try {
      const { error } = await supabase
        .from('pathologies')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('✅ Supprimé avec succès')
      loadData() // Reload data
    } catch (error) {
      console.error('Error deleting:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pathologies')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadData() // Reload data
    } catch (error) {
      console.error('Error toggling active:', error)
      alert('❌ Erreur')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low': return '🟢 Légère'
      case 'medium': return '🟡 Modérée'
      case 'high': return '🔴 Sévère'
      default: return '⚪ Non définie'
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (!isPremium) {
    return (
      <AuthLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center p-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mb-6">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Fonctionnalité Premium
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Les diagnostics et pathologies sont réservés aux membres Premium.
              Découvrez plus de 200 pathologies de manière ludique et interactive.
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 mx-auto"
            >
              <Crown className="h-5 w-5" />
              Passer à Premium
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen pb-12">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700 text-white mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-rose-100 hover:text-white mb-4 flex items-center gap-2"
            >
              ← Retour au dashboard
            </button>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                <span className="text-xs font-semibold text-rose-100">Premium</span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-rose-100">
                    Diagnostics
                  </h1>

                  <p className="text-base md:text-lg text-rose-100 mb-6 max-w-2xl">
                    Accédez rapidement aux pathologies par région, avec les signes cliniques,
                    la gravité et les drapeaux rouges pour guider votre raisonnement.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleCreateNew}
                    className="px-6 py-3 bg-white text-rose-600 rounded-xl hover:bg-rose-50 flex items-center gap-2 font-semibold shadow-lg transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Créer une pathologie
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une pathologie..."
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              />
            </div>

            {/* Region Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {REGIONS.map((region) => {
                const Icon = region.icon
                const isSelected = selectedRegion === region.value

                return (
                  <button
                    key={region.value}
                    onClick={() => setSelectedRegion(region.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? `bg-${region.color}-100 text-${region.color}-700 border-2 border-${region.color}-300`
                        : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {region.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => {
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-rose-300 shadow-sm hover:shadow-xl transition-all duration-300 text-left"
              >
                {/* Image de fond pour pathologies */}
                {item.image_url && (
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    {item.is_red_flag && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-lg">
                          <AlertCircle className="h-3 w-3" />
                          Drapeau rouge
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Placeholder si pas d'image */}
                {!item.image_url && (
                  <div className="relative h-48 bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100 flex items-center justify-center">
                    <Stethoscope className="h-16 w-16 text-rose-300" />
                    {item.is_red_flag && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-lg">
                          <AlertCircle className="h-3 w-3" />
                          Drapeau rouge
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-rose-700 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                        {item.region || 'Non classé'}
                      </span>
                      {item.severity && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(item.severity)}`}>
                          {getSeverityLabel(item.severity)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3 whitespace-pre-line">
                      {item.description}
                    </p>
                  )}

                  {/* Indicateurs pour pathologies */}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {item.clinical_signs && (
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Signes cliniques
                      </span>
                    )}
                  </div>

                  {/* Bouton voir plus ou actions admin */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {!isAdmin ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-rose-600 group-hover:text-rose-700">
                          Voir les détails
                        </span>
                        <ChevronRight className="h-5 w-5 text-rose-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleActive(item.id, item.is_active)
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title={item.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(item.id)
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(item.id, item.name)
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                        >
                          Détails
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-slate-600">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image en haut pour pathologies */}
              {selectedItem.image_url && (
                <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    {selectedItem.is_red_flag && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-bold mb-3 shadow-lg">
                        <AlertCircle className="h-4 w-4" />
                        Drapeau rouge
                      </span>
                    )}
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedItem.name}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-sm font-semibold text-slate-900">
                        {selectedItem.region || 'Non classé'}
                      </span>
                      {selectedItem.severity && (
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getSeverityColor(selectedItem.severity)} backdrop-blur-sm`}>
                          {getSeverityLabel(selectedItem.severity)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-lg"
                  >
                    <X className="h-5 w-5 text-slate-900" />
                  </button>
                </div>
              )}

              {/* Header sans image */}
              {!selectedItem.image_url && (
                <div className="sticky top-0 bg-gradient-to-br from-rose-600 to-purple-700 text-white p-6 rounded-t-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      {selectedItem.is_red_flag && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold mb-2">
                          <AlertCircle className="h-3 w-3" />
                          Drapeau rouge
                        </span>
                      )}
                      <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 rounded bg-white/20 text-sm font-semibold">
                          {selectedItem.region}
                        </span>
                        {selectedItem.severity && (
                          <span className="px-2 py-1 rounded bg-white/20 text-sm font-semibold">
                            {getSeverityLabel(selectedItem.severity)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-6">
                {selectedItem.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Description
                    </h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedItem.description}</p>
                  </div>
                )}

                {selectedItem.clinical_signs && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Signes cliniques
                    </h3>
                    <p className="text-amber-800 leading-relaxed whitespace-pre-line">{selectedItem.clinical_signs}</p>
                  </div>
                )}

                {selectedItem.clusters?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Clusters associés
                    </h3>
                    <div className="space-y-2">
                      {selectedItem.clusters.map((cluster: Pathology['clusters'][number]) => (
                        <div
                          key={cluster.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <div className="text-sm font-semibold text-slate-900">{cluster.name}</div>
                          {cluster.description && (
                            <div className="text-xs text-slate-600 whitespace-pre-line">
                              {cluster.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.tests?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Tests associés
                    </h3>
                    <div className="space-y-2">
                      {selectedItem.tests.map((test: Pathology['tests'][number]) => (
                        <div
                          key={test.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="text-sm font-semibold text-slate-900">{test.name}</div>
                          {test.description && (
                            <div className="text-xs text-slate-600 whitespace-pre-line">
                              {test.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin actions in modal */}
                {isAdmin && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedItem(null)
                          handleEdit(selectedItem.id)
                        }}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(null)
                          handleDelete(selectedItem.id, selectedItem.name)
                        }}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
