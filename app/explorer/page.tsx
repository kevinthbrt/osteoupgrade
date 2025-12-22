'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  Stethoscope,
  TestTube,
  Lock,
  Sparkles,
  Search,
  Filter,
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
  Play,
  X
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
}

type OrthopedicTest = {
  id: string
  name: string
  description: string
  category?: string
  sensitivity: number
  specificity: number
  video_url: string
}

const REGIONS = [
  { value: 'all', label: 'Toutes', icon: Activity, color: 'slate' },
  { value: 'cervical', label: 'Cervical', icon: Brain, color: 'purple' },
  { value: 'epaule', label: 'Épaule', icon: Bone, color: 'blue' },
  { value: 'lombaire', label: 'Lombaire', icon: Heart, color: 'rose' },
  { value: 'genou', label: 'Genou', icon: Zap, color: 'emerald' },
  { value: 'cheville', label: 'Cheville', icon: Eye, color: 'amber' }
]

export default function ExplorerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'pathologies' | 'tests'>('pathologies')
  const [pathologies, setPathologies] = useState<Pathology[]>([])
  const [tests, setTests] = useState<OrthopedicTest[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [selectedRegion, selectedType])

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
        .eq('is_active', true)

      if (selectedRegion !== 'all') {
        pathologiesQuery = pathologiesQuery.eq('region', selectedRegion)
      }

      const { data: pathologiesData } = await pathologiesQuery
      setPathologies(pathologiesData || [])

      // Load tests
      let testsQuery = supabase
        .from('orthopedic_tests')
        .select('id, name, description, category, sensitivity, specificity, video_url')

      const { data: testsData } = await testsQuery
      setTests(testsData || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const isPremium = profile?.role && ['premium_silver', 'premium_gold', 'admin'].includes(profile.role)

  const filteredItems = selectedType === 'pathologies'
    ? pathologies.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tests.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )

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
              L'explorateur interactif de diagnostics et pathologies est réservé aux membres Premium.
              Découvrez plus de 200 pathologies et 150+ tests orthopédiques de manière ludique et interactive.
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

              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-rose-100">
                Explorateur Interactif
              </h1>

              <p className="text-base md:text-lg text-rose-100 mb-6 max-w-2xl">
                Découvrez et explorez les pathologies et tests orthopédiques de manière ludique et interactive.
                Filtrez par région, recherchez et apprenez visuellement.
              </p>

              {/* Type Selector */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedType('pathologies')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    selectedType === 'pathologies'
                      ? 'bg-white text-rose-600 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Stethoscope className="h-5 w-5" />
                  Pathologies
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedType === 'pathologies'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-white/20 text-white'
                  }`}>
                    {pathologies.length}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedType('tests')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    selectedType === 'tests'
                      ? 'bg-white text-rose-600 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <TestTube className="h-5 w-5" />
                  Tests Orthopédiques
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedType === 'tests'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-white/20 text-white'
                  }`}>
                    {tests.length}
                  </span>
                </button>
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
                placeholder={`Rechercher ${selectedType === 'pathologies' ? 'une pathologie' : 'un test'}...`}
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
            const isPathology = selectedType === 'pathologies'

            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-rose-300 shadow-sm hover:shadow-xl transition-all duration-300 text-left"
              >
                {/* Image de fond pour pathologies */}
                {isPathology && item.image_url && (
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
                {isPathology && !item.image_url && (
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

                {/* Image/placeholder pour tests */}
                {!isPathology && (
                  <div className="relative h-48 bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 flex items-center justify-center">
                    <TestTube className="h-16 w-16 text-emerald-300" />
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
                        {item.region || item.category || 'Non classé'}
                      </span>
                      {isPathology && item.severity && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(item.severity)}`}>
                          {getSeverityLabel(item.severity)}
                        </span>
                      )}
                      {!isPathology && item.sensitivity && (
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                          Se: {item.sensitivity}%
                        </span>
                      )}
                      {!isPathology && item.specificity && (
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                          Sp: {item.specificity}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Indicateurs pour pathologies */}
                  {isPathology && (
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {item.clinical_signs && (
                        <span className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Signes cliniques
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bouton voir plus */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-rose-600 group-hover:text-rose-700">
                      Voir les détails
                    </span>
                    <ChevronRight className="h-5 w-5 text-rose-600 group-hover:translate-x-1 transition-all" />
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
              {selectedType === 'pathologies' && selectedItem.image_url && (
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
                        {selectedItem.region || selectedItem.category}
                      </span>
                      {selectedType === 'pathologies' && selectedItem.severity && (
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
              {(!selectedItem.image_url || selectedType === 'tests') && (
                <div className={`sticky top-0 ${selectedType === 'pathologies' ? 'bg-gradient-to-br from-rose-600 to-purple-700' : 'bg-gradient-to-br from-emerald-600 to-teal-700'} text-white p-6 rounded-t-2xl`}>
                  <div className="flex items-start justify-between">
                    <div>
                      {selectedType === 'pathologies' && selectedItem.is_red_flag && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold mb-2">
                          <AlertCircle className="h-3 w-3" />
                          Drapeau rouge
                        </span>
                      )}
                      <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedType === 'pathologies' && (
                          <>
                            <span className="px-2 py-1 rounded bg-white/20 text-sm font-semibold">
                              {selectedItem.region}
                            </span>
                            {selectedItem.severity && (
                              <span className="px-2 py-1 rounded bg-white/20 text-sm font-semibold">
                                {getSeverityLabel(selectedItem.severity)}
                              </span>
                            )}
                          </>
                        )}
                        {selectedType === 'tests' && selectedItem.category && (
                          <span className="px-2 py-1 rounded bg-white/20 text-sm font-semibold">
                            {selectedItem.category}
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
                    <p className="text-slate-600 leading-relaxed">{selectedItem.description}</p>
                  </div>
                )}

                {selectedType === 'pathologies' && selectedItem.clinical_signs && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Signes cliniques
                    </h3>
                    <p className="text-amber-800 leading-relaxed">{selectedItem.clinical_signs}</p>
                  </div>
                )}

                {selectedType === 'tests' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedItem.sensitivity && (
                        <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                          <div className="text-xs text-green-700 font-semibold mb-1">Sensibilité</div>
                          <div className="text-3xl font-bold text-green-700">{selectedItem.sensitivity}%</div>
                        </div>
                      )}
                      {selectedItem.specificity && (
                        <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                          <div className="text-xs text-blue-700 font-semibold mb-1">Spécificité</div>
                          <div className="text-3xl font-bold text-blue-700">{selectedItem.specificity}%</div>
                        </div>
                      )}
                    </div>

                    {selectedItem.video_url && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Vidéo du test
                        </h3>
                        <button
                          onClick={() => window.open(selectedItem.video_url, '_blank')}
                          className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Play className="h-5 w-5" />
                          Voir la vidéo de démonstration
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
