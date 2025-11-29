'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Activity,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Filter,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Settings,
  Map,
  Clock,
  MapPin,
  Zap,
  AlertCircle
} from 'lucide-react'

type MultipleChoiceField = 'temporal_evolution' | 'pain_type' | 'pain_location'

interface PathologyWithTriage {
  id: string
  name: string
  description?: string
  region?: string
  topographic_image_url?: string
  recommendations?: string
  is_active: boolean
  triage_criteria?: {
    temporal_evolution?: string[]
    pain_type?: string[]
    pain_location?: string[]
    triage_weight?: number
    additional_criteria?: any
  }
  tests: any[]
  clusters: any[]
}

const REGIONS = [
  { value: 'cervical', label: 'Cervical' },
  { value: 'thoracique', label: 'Thoracique' },
  { value: 'lombaire', label: 'Lombaire' },
  { value: 'epaule', label: 'Épaule' },
  { value: 'coude', label: 'Coude' },
  { value: 'poignet', label: 'Poignet' },
  { value: 'main', label: 'Main' },
  { value: 'hanche', label: 'Hanche' },
  { value: 'genou', label: 'Genou' },
  { value: 'cheville', label: 'Cheville' },
  { value: 'pied', label: 'Pied' }
]

const TEMPORAL_EVOLUTION = [
  { value: 'aigue', label: 'Aiguë', description: 'Apparition récente (<6 semaines)', icon: '⚡' },
  { value: 'chronique', label: 'Chronique', description: 'Installation progressive (>3 mois)', icon: '📅' },
  { value: 'aigue_fond_chronique', label: 'Aiguë sur fond chronique', description: 'Exacerbation aiguë d\'une condition chronique', icon: '🔄' },
  { value: 'traumatique', label: 'Traumatique', description: 'Suite à un traumatisme identifié', icon: '💥' }
]

const PAIN_TYPES = [
  { value: 'mecanique', label: 'Mécanique', description: 'Augmentée au mouvement, soulagée au repos', icon: '⚙️' },
  { value: 'inflammatoire', label: 'Inflammatoire', description: 'Réveils nocturnes, raideur matinale', icon: '🔥' },
  { value: 'mixte', label: 'Mixte', description: 'Caractéristiques mécaniques et inflammatoires', icon: '⚡' },
  { value: 'autre', label: 'Autre', description: 'Neuropathique, référée, ou atypique', icon: '❓' }
]

const PAIN_LOCATIONS = [
  { value: 'locale_precise', label: 'Locale précise', description: 'Douleur bien localisée sur une structure', icon: '📍' },
  { value: 'diffuse', label: 'Diffuse', description: 'Douleur étendue, mal délimitée', icon: '☁️' },
  { value: 'radiculaire_mi_membre', label: 'Irradiation radiculaire mi-membre', description: 'Trajet nerveux jusqu\'au coude/genou', icon: '⚡' },
  { value: 'radiculaire_vraie', label: 'Irradiation radiculaire vraie', description: 'Trajet nerveux complet jusqu\'aux extrémités', icon: '⚡⚡' },
  { value: 'projetee', label: 'Douleur projetée', description: 'Référée depuis une autre structure', icon: '🔀' }
]

export default function PathologyTriageAdminSimplifiedPage() {
  const router = useRouter()
  
  const [pathologies, setPathologies] = useState<PathologyWithTriage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPathology, setSelectedPathology] = useState<PathologyWithTriage | null>(null)
  const [expandedPathology, setExpandedPathology] = useState<string | null>(null)
  const [filterRegion, setFilterRegion] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadPathologies()
  }, [])

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
  }

  const loadPathologies = async () => {
    try {
      const { data: pathologiesData, error: pathError } = await supabase
        .from('pathologies')
        .select('*')
        .order('region', { ascending: true })
        .order('name')

      if (pathError) throw pathError

      const { data: triageData, error: triageError } = await supabase
        .from('pathology_triage_criteria')
        .select('*')

      if (triageError && triageError.code !== 'PGRST116') throw triageError

      const { data: testLinks } = await supabase
        .from('pathology_tests')
        .select('*, test:orthopedic_tests(*)')

      const { data: clusterLinks } = await supabase
        .from('pathology_clusters')
        .select('*, cluster:orthopedic_test_clusters(*)')

      const pathologiesWithTriage = pathologiesData?.map((pathology: any) => {
        const triage = triageData?.find((t: any) => t.pathology_id === pathology.id)
        const tests = testLinks
          ?.filter((l: any) => l.pathology_id === pathology.id)
          .map((l: any) => l.test) ?? []

        const clusters = clusterLinks
          ?.filter((l: any) => l.pathology_id === pathology.id)
          .map((l: any) => l.cluster) ?? []

        return {
          ...pathology,
          triage_criteria: triage ? {
            temporal_evolution: Array.isArray(triage.temporal_evolution) ? triage.temporal_evolution : (triage.temporal_evolution ? [triage.temporal_evolution] : []),
            pain_type: Array.isArray(triage.pain_type) ? triage.pain_type : (triage.pain_type ? [triage.pain_type] : []),
            pain_location: Array.isArray(triage.pain_location) ? triage.pain_location : (triage.pain_location ? [triage.pain_location] : []),
            triage_weight: triage.triage_weight,
            additional_criteria: triage.additional_criteria
          } : {
            temporal_evolution: [],
            pain_type: [],
            pain_location: [],
            triage_weight: 50,
            additional_criteria: {}
          },
          tests,
          clusters
        }
      }) || []

      setPathologies(pathologiesWithTriage)
    } catch (error) {
      console.error('Error loading pathologies:', error)
      alert('Erreur lors du chargement des pathologies')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (pathologyId: string, file: File) => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pathologyId', pathologyId)

      const res = await fetch('/api/pathology-image-upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error(`Erreur API: ${res.status}`)

      const { url } = await res.json()

      const { error: updateError } = await supabase
        .from('pathologies')
        .update({ topographic_image_url: url })
        .eq('id', pathologyId)

      if (updateError) throw updateError

      alert('✅ Image téléchargée avec succès')
      await loadPathologies()
      
      if (selectedPathology?.id === pathologyId) {
        setSelectedPathology({
          ...selectedPathology,
          topographic_image_url: url
        })
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`❌ Erreur : ${errorMessage}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const toggleMultipleChoice = (field: MultipleChoiceField, value: string) => {
    if (!selectedPathology) return

    const currentValues = (selectedPathology.triage_criteria?.[field] || []) as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]

    setSelectedPathology({
      ...selectedPathology,
      triage_criteria: {
        ...selectedPathology.triage_criteria,
        [field]: newValues
      }
    })
  }

  const saveTriage = async () => {
    if (!selectedPathology) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error: pathologyError } = await supabase
        .from('pathologies')
        .update({
          region: selectedPathology.region,
          recommendations: selectedPathology.recommendations,
          topographic_image_url: selectedPathology.topographic_image_url
        })
        .eq('id', selectedPathology.id)

      if (pathologyError) throw pathologyError

      const { data: existingTriage } = await supabase
        .from('pathology_triage_criteria')
        .select('id, additional_criteria')
        .eq('pathology_id', selectedPathology.id)
        .single()

      const triageData = {
        pathology_id: selectedPathology.id,
        temporal_evolution: selectedPathology.triage_criteria?.temporal_evolution || [],
        pain_type: selectedPathology.triage_criteria?.pain_type || [],
        pain_location: selectedPathology.triage_criteria?.pain_location || [],
        additional_criteria: existingTriage?.additional_criteria || {},
        triage_weight: selectedPathology.triage_criteria?.triage_weight || 50,
        created_by: user?.id
      }

      if (existingTriage) {
        const { error } = await supabase
          .from('pathology_triage_criteria')
          .update(triageData)
          .eq('pathology_id', selectedPathology.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('pathology_triage_criteria')
          .insert(triageData)
        
        if (error) throw error
      }

      alert('✅ Critères de triage sauvegardés')
      setSelectedPathology(null)
      loadPathologies()
    } catch (error) {
      console.error('Error saving triage:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const filteredPathologies = pathologies.filter(p => 
    !filterRegion || p.region === filterRegion
  )

  const pathologiesByRegion = filteredPathologies.reduce((acc, pathology) => {
    const region = pathology.region || 'Sans région'
    if (!acc[region]) acc[region] = []
    acc[region].push(pathology)
    return acc
  }, {} as Record<string, PathologyWithTriage[]>)

  const getLabels = (values: string[] | undefined, options: any[]) => {
    if (!values || values.length === 0) return '-'
    return values.map(v => options.find(o => o.value === v)?.label || v).join(', ')
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Filter className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Configuration du Triage (Simplifié)</h1>
              </div>
              <p className="text-purple-100">
                3 questions simples : Évolution, Type, Localisation
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{pathologies.length}</p>
              <p className="text-purple-100">Pathologies</p>
            </div>
          </div>
        </div>

        {/* Filtre par région */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Filtrer par région :
            </label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Toutes les régions</option>
              {REGIONS.map(region => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              Seulement 3 questions par pathologie
            </div>
          </div>
        </div>

        {/* Liste des pathologies par région */}
        <div className="space-y-4">
          {Object.entries(pathologiesByRegion).map(([region, regionPathologies]) => (
            <div key={region} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Map className="h-5 w-5 text-gray-500" />
                    {REGIONS.find(r => r.value === region)?.label || region}
                  </h2>
                  <span className="text-sm text-gray-600">
                    {regionPathologies.length} pathologie(s)
                  </span>
                </div>
              </div>

              <div className="divide-y">
                {regionPathologies.map(pathology => (
                  <div key={pathology.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div 
                      className="cursor-pointer"
                      onClick={() => setExpandedPathology(
                        expandedPathology === pathology.id ? null : pathology.id
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {expandedPathology === pathology.id ? 
                              <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            }
                            <h3 className="font-medium text-gray-900">{pathology.name}</h3>
                            {pathology.triage_criteria && (
                              (pathology.triage_criteria.temporal_evolution?.length || 0) > 0 ||
                              (pathology.triage_criteria.pain_type?.length || 0) > 0 ||
                              (pathology.triage_criteria.pain_location?.length || 0) > 0
                            ) && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                ✓ Configuré
                              </span>
                            )}
                            {pathology.topographic_image_url && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                📷 Image
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPathology(pathology)
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                        >
                          <Settings className="h-4 w-4" />
                          Configurer
                        </button>
                      </div>
                    </div>

                    {/* Détails expandés */}
                    {expandedPathology === pathology.id && (
                      <div className="mt-4 ml-6 p-4 bg-gray-50 rounded-lg space-y-3">
                        {pathology.triage_criteria ? (
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Évolution temporelle:</span>{' '}
                              <span className="text-gray-900">
                                {getLabels(pathology.triage_criteria?.temporal_evolution, TEMPORAL_EVOLUTION)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Type de douleur:</span>{' '}
                              <span className="text-gray-900">
                                {getLabels(pathology.triage_criteria?.pain_type, PAIN_TYPES)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Localisation:</span>{' '}
                              <span className="text-gray-900">
                                {getLabels(pathology.triage_criteria?.pain_location, PAIN_LOCATIONS)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 italic">
                            Aucun critère configuré
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de configuration */}
      {selectedPathology && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedPathology.name}
                </h2>
                <button
                  onClick={() => setSelectedPathology(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations de base */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informations
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Région anatomique
                    </label>
                    <select
                      value={selectedPathology.region || ''}
                      onChange={(e) => setSelectedPathology({
                        ...selectedPathology,
                        region: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Sélectionner</option>
                      {REGIONS.map(region => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image topographique
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(selectedPathology.id, file)
                      }}
                      disabled={uploadingImage}
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recommandations
                    </label>
                    <textarea
                      value={selectedPathology.recommendations || ''}
                      onChange={(e) => setSelectedPathology({
                        ...selectedPathology,
                        recommendations: e.target.value
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3 QUESTIONS SIMPLIFIÉES */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Critères de triage (3 questions)
                </h3>
                
                <div className="space-y-6">
                  {/* Question 1: Évolution temporelle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      1. Évolution temporelle
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPORAL_EVOLUTION.map(option => (
                        <button
                          key={option.value}
                          onClick={() => toggleMultipleChoice('temporal_evolution', option.value)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedPathology.triage_criteria?.temporal_evolution?.includes(option.value)
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-2xl">{option.icon}</span>
                            {selectedPathology.triage_criteria?.temporal_evolution?.includes(option.value) && (
                              <CheckCircle className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                          <p className="font-medium text-gray-900 mb-1">{option.label}</p>
                          <p className="text-xs text-gray-600">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question 2: Type de douleur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      2. Type de douleur
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAIN_TYPES.map(type => (
                        <button
                          key={type.value}
                          onClick={() => toggleMultipleChoice('pain_type', type.value)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedPathology.triage_criteria?.pain_type?.includes(type.value)
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-2xl">{type.icon}</span>
                            {selectedPathology.triage_criteria?.pain_type?.includes(type.value) && (
                              <CheckCircle className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                          <p className="font-medium text-gray-900 mb-1">{type.label}</p>
                          <p className="text-xs text-gray-600">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question 3: Localisation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      3. Localisation / Irradiation
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {PAIN_LOCATIONS.map(location => (
                        <button
                          key={location.value}
                          onClick={() => toggleMultipleChoice('pain_location', location.value)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedPathology.triage_criteria?.pain_location?.includes(location.value)
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{location.icon}</span>
                              <div>
                                <p className="font-medium text-gray-900">{location.label}</p>
                                <p className="text-xs text-gray-600 mt-1">{location.description}</p>
                              </div>
                            </div>
                            {selectedPathology.triage_criteria?.pain_location?.includes(location.value) && (
                              <CheckCircle className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Poids du triage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poids du triage (priorité)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedPathology.triage_criteria?.triage_weight || 50}
                      onChange={(e) => setSelectedPathology({
                        ...selectedPathology,
                        triage_criteria: {
                          ...selectedPathology.triage_criteria,
                          triage_weight: parseInt(e.target.value)
                        }
                      })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Faible</span>
                      <span className="font-medium text-purple-600">
                        {selectedPathology.triage_criteria?.triage_weight || 50}
                      </span>
                      <span>Haute</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CRITÈRES D'INCLUSION/EXCLUSION */}
              {selectedPathology.triage_criteria && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Critères d'Inclusion / Exclusion (Avancé)
                  </h3>
                  
                  {/* Affichage read-only des critères existants */}
                  {selectedPathology.triage_criteria.additional_criteria && 
                   Object.keys(selectedPathology.triage_criteria.additional_criteria).length > 0 ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
                      
                      {/* INCLUSION */}
                      {selectedPathology.triage_criteria.additional_criteria.inclusion && (
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            ✅ Critères d'Inclusion
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {/* Âge */}
                            {selectedPathology.triage_criteria.additional_criteria.inclusion.age && (
                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="text-xs text-gray-600 mb-1">📅 Âge</div>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPathology.triage_criteria.additional_criteria.inclusion.age.map((age: string) => (
                                    <span key={age} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                      {age} ans
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Sexe */}
                            {selectedPathology.triage_criteria.additional_criteria.inclusion.sex && (
                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="text-xs text-gray-600 mb-1">⚧ Sexe</div>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPathology.triage_criteria.additional_criteria.inclusion.sex.map((sex: string) => (
                                    <span key={sex} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                      {sex === 'homme' ? '♂️ Homme' : '♀️ Femme'}
                                    </span>
                                  ))}
                                </div>
                                {selectedPathology.triage_criteria.additional_criteria.sex_preference && (
                                  <div className="mt-2 text-xs text-purple-600 font-medium">
                                    ⭐ Préférence: {selectedPathology.triage_criteria.additional_criteria.sex_preference === 'homme' ? '♂️' : '♀️'}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Mode de vie */}
                            {selectedPathology.triage_criteria.additional_criteria.inclusion.lifestyle && (
                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="text-xs text-gray-600 mb-1">🏃 Mode de vie</div>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPathology.triage_criteria.additional_criteria.inclusion.lifestyle.map((lifestyle: string) => (
                                    <span key={lifestyle} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                      {lifestyle === 'athlete' ? '🏋️ Athlète' : lifestyle === 'actif' ? '🚶 Actif' : '💺 Sédentaire'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* EXCLUSION */}
                      {selectedPathology.triage_criteria.additional_criteria.exclusion && (
                        <div className="mt-4 pt-4 border-t border-blue-300">
                          <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                            <X className="h-4 w-4" />
                            ❌ Critères d'Exclusion
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {/* Évolution temporelle */}
                            {selectedPathology.triage_criteria.additional_criteria.exclusion.temporal_evolution && 
                             selectedPathology.triage_criteria.additional_criteria.exclusion.temporal_evolution.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-red-200">
                                <div className="text-xs text-gray-600 mb-1">⏱️ Évolution</div>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPathology.triage_criteria.additional_criteria.exclusion.temporal_evolution.map((ev: string) => (
                                    <span key={ev} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                      {TEMPORAL_EVOLUTION.find(t => t.value === ev)?.label || ev}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Type douleur */}
                            {selectedPathology.triage_criteria.additional_criteria.exclusion.pain_type && 
                             selectedPathology.triage_criteria.additional_criteria.exclusion.pain_type.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-red-200">
                                <div className="text-xs text-gray-600 mb-1">⚡ Type</div>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPathology.triage_criteria.additional_criteria.exclusion.pain_type.map((pt: string) => (
                                    <span key={pt} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                      {PAIN_TYPES.find(t => t.value === pt)?.label || pt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Localisation */}
                            {selectedPathology.triage_criteria.additional_criteria.exclusion.pain_location && 
                             selectedPathology.triage_criteria.additional_criteria.exclusion.pain_location.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-red-200">
                                <div className="text-xs text-gray-600 mb-1">📍 Localisation</div>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPathology.triage_criteria.additional_criteria.exclusion.pain_location.map((pl: string) => (
                                    <span key={pl} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                      {PAIN_LOCATIONS.find(t => t.value === pl)?.label || pl}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* NOTES SPÉCIALES */}
                      {(selectedPathology.triage_criteria.additional_criteria.temporal_note ||
                        selectedPathology.triage_criteria.additional_criteria.age_note ||
                        selectedPathology.triage_criteria.additional_criteria.lifestyle_note ||
                        selectedPathology.triage_criteria.additional_criteria.special_note) && (
                        <div className="mt-4 pt-4 border-t border-blue-300">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            📝 Notes Spéciales
                          </h4>
                          <div className="space-y-2 text-sm">
                            {selectedPathology.triage_criteria.additional_criteria.temporal_note && (
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
                                <span className="font-medium text-yellow-800">Temporalité:</span>{' '}
                                <span className="text-yellow-700">{selectedPathology.triage_criteria.additional_criteria.temporal_note}</span>
                              </div>
                            )}
                            {selectedPathology.triage_criteria.additional_criteria.age_note && (
                              <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                                <span className="font-medium text-blue-800">Âge:</span>{' '}
                                <span className="text-blue-700">{selectedPathology.triage_criteria.additional_criteria.age_note}</span>
                              </div>
                            )}
                            {selectedPathology.triage_criteria.additional_criteria.lifestyle_note && (
                              <div className="bg-green-50 border-l-4 border-green-400 p-2 rounded">
                                <span className="font-medium text-green-800">Mode de vie:</span>{' '}
                                <span className="text-green-700">{selectedPathology.triage_criteria.additional_criteria.lifestyle_note}</span>
                              </div>
                            )}
                            {selectedPathology.triage_criteria.additional_criteria.special_note && (
                              <div className="bg-purple-50 border-l-4 border-purple-400 p-2 rounded">
                                <span className="font-medium text-purple-800">Spécial:</span>{' '}
                                <span className="text-purple-700">{selectedPathology.triage_criteria.additional_criteria.special_note}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* CRITÈRES SPÉCIAUX (requires_one_of) */}
                      {selectedPathology.triage_criteria.additional_criteria.requires_one_of && (
                        <div className="mt-4 pt-4 border-t border-blue-300">
                          <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            ⚠️ Requiert AU MOINS UN de ces critères
                          </h4>
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
                              {selectedPathology.triage_criteria.additional_criteria.requires_one_of.map((req: any, idx: number) => (
                                <li key={idx}>
                                  {Object.entries(req).map(([key, value]) => (
                                    <span key={key}>
                                      <span className="font-medium">{key}:</span> {String(value)}
                                    </span>
                                  )).reduce((prev, curr) => [prev, ' ET ', curr] as any)}
                                </li>
                              ))}
                            </ul>
                            {selectedPathology.triage_criteria.additional_criteria.penalty_if_missing && (
                              <div className="mt-2 text-xs text-orange-600 font-medium">
                                Pénalité si non respecté: × {selectedPathology.triage_criteria.additional_criteria.penalty_if_missing}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                      <Info className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">Aucun critère d'inclusion/exclusion configuré</p>
                      <p className="text-sm text-gray-500">
                        Exécutez le script SQL pour ajouter les critères automatiquement
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedPathology(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveTriage}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}