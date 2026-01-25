'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import {
  Stethoscope,
  Sparkles,
  Search,
  ChevronRight,
  ChevronDown,
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
  EyeOff,
  TestTube2
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
  tests?: OrthopedicTest[]
  clusters?: OrthopedicTestCluster[]
}

type OrthopedicTest = {
  id: string
  name: string
  description?: string | null
  category?: string | null
  video_url?: string | null
  sensitivity?: number | null
  specificity?: number | null
}

type OrthopedicTestCluster = {
  id: string
  name: string
  description?: string | null
  region?: string | null
  indications?: string | null
  interest?: string | null
  sources?: string | null
  sensitivity?: number | null
  specificity?: number | null
}

const getVideoEmbedUrl = (url: string) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)
    if (idMatch?.[1]) {
      return `https://www.youtube.com/embed/${idMatch[1]}`
    }
  }

  if (url.includes('vimeo.com')) {
    const idMatch = url.match(/vimeo\.com\/(\d+)/)
    if (idMatch?.[1]) {
      return `https://player.vimeo.com/video/${idMatch[1]}`
    }
  }

  return url
}

const REGION_CATEGORIES = [
  {
    name: 'Tête et Cou',
    icon: Brain,
    regions: [
      { value: 'cervical', label: 'Cervical' },
      { value: 'atm', label: 'ATM' },
      { value: 'crane', label: 'Crâne' }
    ]
  },
  {
    name: 'Membre Supérieur',
    icon: Bone,
    regions: [
      { value: 'epaule', label: 'Épaule' },
      { value: 'coude', label: 'Coude' },
      { value: 'poignet', label: 'Poignet + main' }
    ]
  },
  {
    name: 'Tronc',
    icon: Heart,
    regions: [
      { value: 'thoracique', label: 'Thoracique' },
      { value: 'lombaire', label: 'Lombaire' },
      { value: 'sacro-iliaque', label: 'Sacro-iliaque' },
      { value: 'cotes', label: 'Côtes' }
    ]
  },
  {
    name: 'Membre Inférieur',
    icon: Zap,
    regions: [
      { value: 'hanche', label: 'Hanche' },
      { value: 'genou', label: 'Genou' },
      { value: 'cheville', label: 'Cheville' },
      { value: 'pied', label: 'Pied' }
    ]
  },
  {
    name: 'Général',
    icon: Activity,
    regions: [
      { value: 'neurologique', label: 'Neurologique' },
      { value: 'vasculaire', label: 'Vasculaire' },
      { value: 'systemique', label: 'Systémique' }
    ]
  }
]

export default function DiagnosticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pathologies, setPathologies] = useState<Pathology[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedTest, setSelectedTest] = useState<OrthopedicTest | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<OrthopedicTestCluster | null>(null)
  const [expandedSigns, setExpandedSigns] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [selectedRegion])

  const loadData = async () => {
    try {
      const payload = await fetchProfilePayload()
      if (!payload?.user) {
        router.push('/')
        return
      }

      const profileData = payload.profile

      setProfile(profileData)

      // Ne charger les pathologies que si une région est sélectionnée
      if (!selectedRegion) {
        setPathologies([])
        setLoading(false)
        return
      }

      // Load pathologies
      let pathologiesQuery = supabase
        .from('pathologies')
        .select('*')
        .eq('region', selectedRegion)

      if (profileData?.role !== 'admin') {
        pathologiesQuery = pathologiesQuery.eq('is_active', true)
      }

      const { data: pathologiesData } = await pathologiesQuery
      const pathologiesList = pathologiesData || []

      if (pathologiesList.length > 0) {
        const pathologyIds = pathologiesList.map((pathology) => pathology.id)
        const { data: testLinks } = await supabase
          .from('pathology_tests')
          .select('pathology_id, test:orthopedic_tests(id, name, description, category, video_url, sensitivity, specificity)')
          .in('pathology_id', pathologyIds)

        const { data: clusterLinks } = await supabase
          .from('pathology_clusters')
          .select('pathology_id, cluster:orthopedic_test_clusters(id, name, description, region, indications, interest, sources, sensitivity, specificity)')
          .in('pathology_id', pathologyIds)

        const testsByPathology = (testLinks || []).reduce(
          (
            acc,
            link: {
              pathology_id: string
              test: OrthopedicTest | OrthopedicTest[] | null
            }
          ) => {
            const test = Array.isArray(link.test) ? link.test[0] : link.test
            if (!test) return acc
            acc[link.pathology_id] = acc[link.pathology_id] || []
            acc[link.pathology_id].push(test)
            return acc
          },
          {} as Record<string, OrthopedicTest[]>
        )

        const clustersByPathology = (clusterLinks || []).reduce(
          (
            acc,
            link: {
              pathology_id: string
              cluster: OrthopedicTestCluster | OrthopedicTestCluster[] | null
            }
          ) => {
            const cluster = Array.isArray(link.cluster) ? link.cluster[0] : link.cluster
            if (!cluster) return acc
            acc[link.pathology_id] = acc[link.pathology_id] || []
            acc[link.pathology_id].push(cluster)
            return acc
          },
          {} as Record<string, OrthopedicTestCluster[]>
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

  const toggleSignsExpansion = (pathologyId: string) => {
    setExpandedSigns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pathologyId)) {
        newSet.delete(pathologyId)
      } else {
        newSet.add(pathologyId)
      }
      return newSet
    })
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

        {/* Breadcrumb et recherche */}
        {selectedRegion && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Bouton retour */}
              <button
                onClick={() => {
                  setSelectedRegion(null)
                  setSearchQuery('')
                }}
                className="text-rose-600 hover:text-rose-700 flex items-center gap-2 text-sm font-medium"
              >
                ← Retour aux régions
              </button>

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
            </div>
          </div>
        )}

        {/* Grille des régions (quand aucune région sélectionnée) */}
        {!selectedRegion ? (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Sélectionnez une zone anatomique</h2>
            <p className="text-slate-600 mb-8">Cliquez sur une région pour afficher les diagnostics associés</p>

            <div className="space-y-8">
              {REGION_CATEGORIES.map((category) => {
                const CategoryIcon = category.icon
                return (
                  <div key={category.name}>
                    <div className="flex items-center gap-3 mb-4">
                      <CategoryIcon className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {category.regions.map((region) => (
                        <button
                          key={region.value}
                          onClick={() => setSelectedRegion(region.value)}
                          className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-all text-slate-900 font-medium text-sm text-center"
                        >
                          {region.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Grille des pathologies (quand une région est sélectionnée) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item: any) => {
            // Extraire les bullet points des signes cliniques
            const clinicalSignsList = item.clinical_signs
              ? item.clinical_signs
                  .split('\n')
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 0)
              : []

            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-rose-300 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col"
              >
                {/* En-tête fixe avec titre uniquement */}
                <div className="p-5 pb-3 h-[80px] flex items-center flex-shrink-0">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                </div>

                {/* Image - hauteur fixe pour alignement */}
                {item.image_url ? (
                  <div className="relative h-48 bg-slate-100 mx-5 mb-3 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100 flex items-center justify-center mx-5 mb-3 rounded-lg flex-shrink-0">
                    <Stethoscope className="h-16 w-16 text-rose-300" />
                  </div>
                )}

                {/* Badges (région, gravité, drapeau rouge) */}
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                      {item.region || 'Non classé'}
                    </span>
                    {item.severity && (
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(item.severity)}`}>
                        {getSeverityLabel(item.severity)}
                      </span>
                    )}
                    {item.is_red_flag && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                        <AlertCircle className="h-3 w-3" />
                        Drapeau rouge
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenu flexible (signes cliniques, indicateurs) */}
                <div className="px-5 pb-5 flex-grow">
                  {/* Signes cliniques sous forme de tirets - limités à 2 lignes */}
                  {clinicalSignsList.length > 0 && (
                    <div className="mb-3">
                      <ul className="space-y-1">
                        {(expandedSigns.has(item.id)
                          ? clinicalSignsList
                          : clinicalSignsList.slice(0, 2)
                        ).map((sign: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-rose-600 mt-1">•</span>
                            <span className="flex-1 line-clamp-1">{sign}</span>
                          </li>
                        ))}
                      </ul>
                      {clinicalSignsList.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSignsExpansion(item.id)
                          }}
                          className="mt-2 text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
                        >
                          <ChevronDown className={`h-3 w-3 transition-transform ${expandedSigns.has(item.id) ? 'rotate-180' : ''}`} />
                          {expandedSigns.has(item.id)
                            ? 'Voir moins'
                            : `Voir ${clinicalSignsList.length - 2} signe${clinicalSignsList.length - 2 > 1 ? 's' : ''} de plus`
                          }
                        </button>
                      )}
                    </div>
                  )}

                  {/* Indicateurs de tests */}
                  {(item.tests?.length > 0 || item.clusters?.length > 0) && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      {item.tests?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <TestTube2 className="h-3 w-3" />
                          {item.tests.length} test{item.tests.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {item.clusters?.length > 0 && (
                        <span className="flex items-center gap-1 text-rose-600">
                          <TestTube2 className="h-3 w-3" />
                          {item.clusters.length} cluster{item.clusters.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bouton voir plus ou actions admin */}
                  <div className="pt-3 border-t border-slate-100">
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

            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-slate-600">
                  Essayez de modifier votre recherche
                </p>
              </div>
            )}
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
                <div className="relative h-96 bg-gradient-to-br from-slate-100 to-slate-200">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
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

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Clusters associés
                  </h3>
                  {selectedItem.clusters?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedItem.clusters.map((cluster: OrthopedicTestCluster) => (
                        <div
                          key={cluster.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:border-slate-300 hover:bg-slate-100 transition"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedCluster(cluster)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              setSelectedCluster(cluster)
                            }
                          }}
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
                  ) : (
                    <div className="text-sm text-slate-500">Aucun cluster associé.</div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Tests associés
                  </h3>
                  {selectedItem.tests?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedItem.tests.map((test: OrthopedicTest) => (
                        <div
                          key={test.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-slate-300 hover:bg-slate-50 transition"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedTest(test)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              setSelectedTest(test)
                            }
                          }}
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
                  ) : (
                    <div className="text-sm text-slate-500">Aucun test associé.</div>
                  )}
                </div>

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

        {selectedTest && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedTest(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedTest.name}</h2>
                  {selectedTest.category && (
                    <div className="text-sm text-slate-500">{selectedTest.category}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {selectedTest.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                    <p className="text-slate-600 whitespace-pre-line">{selectedTest.description}</p>
                  </div>
                )}
                {(selectedTest.sensitivity || selectedTest.specificity) && (
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {selectedTest.sensitivity && (
                      <div>
                        <span className="font-semibold text-slate-800">Sensibilité:</span>{' '}
                        {selectedTest.sensitivity}%
                      </div>
                    )}
                    {selectedTest.specificity && (
                      <div>
                        <span className="font-semibold text-slate-800">Spécificité:</span>{' '}
                        {selectedTest.specificity}%
                      </div>
                    )}
                  </div>
                )}
              {selectedTest.video_url && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-slate-700">Vidéo du test</div>
                  <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-black" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={getVideoEmbedUrl(selectedTest.video_url)}
                      className="absolute inset-0 h-full w-full"
                      title={`Vidéo ${selectedTest.name}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        {selectedCluster && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedCluster(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedCluster.name}</h2>
                  {selectedCluster.region && (
                    <div className="text-sm text-slate-500">{selectedCluster.region}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {selectedCluster.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                    <p className="text-slate-600 whitespace-pre-line">{selectedCluster.description}</p>
                  </div>
                )}
                {selectedCluster.indications && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Indications</h3>
                    <p className="text-slate-600 whitespace-pre-line">{selectedCluster.indications}</p>
                  </div>
                )}
                {selectedCluster.interest && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Intérêt</h3>
                    <p className="text-slate-600 whitespace-pre-line">{selectedCluster.interest}</p>
                  </div>
                )}
                {selectedCluster.sources && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Sources</h3>
                    <p className="text-slate-600 whitespace-pre-line">{selectedCluster.sources}</p>
                  </div>
                )}
                {(selectedCluster.sensitivity || selectedCluster.specificity) && (
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {selectedCluster.sensitivity && (
                      <div>
                        <span className="font-semibold text-slate-800">Sensibilité:</span>{' '}
                        {selectedCluster.sensitivity}%
                      </div>
                    )}
                    {selectedCluster.specificity && (
                      <div>
                        <span className="font-semibold text-slate-800">Spécificité:</span>{' '}
                        {selectedCluster.specificity}%
                      </div>
                    )}
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
