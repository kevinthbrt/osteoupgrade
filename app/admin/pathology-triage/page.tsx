'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Activity,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Image,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Settings,
  Map
} from 'lucide-react'

interface PathologyWithTriage {
  id: string
  name: string
  description?: string
  region?: string
  severity?: string
  icd_code?: string
  topographic_image_url?: string
  recommendations?: string
  is_active: boolean
  triage_criteria?: {
    pain_type?: string
    pain_onset?: string
    aggravating_factors?: string
    radiation_pattern?: string
    neurological_symptoms?: boolean
    relieving_movement?: string
    triage_weight?: number
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

const PAIN_TYPES = [
  { value: 'mecanique', label: 'Mécanique', description: 'Augmentée au mouvement, soulagée au repos' },
  { value: 'inflammatoire', label: 'Inflammatoire', description: 'Réveils nocturnes, raideur matinale' },
  { value: 'mixte', label: 'Mixte', description: 'Caractéristiques mécaniques et inflammatoires' },
  { value: 'non_applicable', label: 'Non applicable', description: 'Cette question ne s\'applique pas' }
]

const PAIN_ONSETS = [
  { value: 'brutale', label: 'Brutale/Précise', description: 'Structurel (ligament, disque, articulation)' },
  { value: 'progressive', label: 'Progressive', description: 'Inflammatoire ou dégénératif' },
  { value: 'charge_repetee', label: 'Charge répétée', description: 'Tendinopathie, surcharge' },
  { value: 'non_applicable', label: 'Non applicable' }
]

const AGGRAVATING_FACTORS = [
  { value: 'mouvement', label: 'Mouvement/Charge', description: 'Douleur mécanique' },
  { value: 'repos', label: 'Repos/Position fixe', description: 'Inflammatoire, discal, chimique' },
  { value: 'les_deux', label: 'Les deux' },
  { value: 'non_applicable', label: 'Non applicable' }
]

const RADIATION_PATTERNS = [
  { value: 'radiculaire', label: 'Radiculaire', description: 'Trajet précis' },
  { value: 'referree', label: 'Référée', description: 'Flou/diffus (discale, facettaire, musculaire)' },
  { value: 'locale', label: 'Locale', description: 'Pas d\'irradiation' },
  { value: 'non_applicable', label: 'Non applicable' }
]

const RELIEVING_MOVEMENTS = [
  { value: 'extension', label: 'Extension', description: 'Suggère discal' },
  { value: 'flexion', label: 'Flexion', description: 'Suggère facettaire/sténose' },
  { value: 'aucun', label: 'Aucun', description: 'Musculaire/inflammatoire/complexe' },
  { value: 'non_applicable', label: 'Non applicable' }
]

export default function PathologyTriageAdminPage() {
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
      // Charger les pathologies avec leurs critères de triage
      const { data: pathologiesData, error: pathError } = await supabase
        .from('pathologies')
        .select('*')
        .order('region', { ascending: true })
        .order('name')

      if (pathError) throw pathError

      // Charger les critères de triage
      const { data: triageData, error: triageError } = await supabase
        .from('pathology_triage_criteria')
        .select('*')

      if (triageError && triageError.code !== 'PGRST116') throw triageError

      // Charger les liens pathologie-tests
      const { data: testLinks } = await supabase
        .from('pathology_tests')
        .select('*, test:orthopedic_tests(*)')

      // Charger les liens pathologie-clusters
      const { data: clusterLinks } = await supabase
        .from('pathology_clusters')
        .select('*, cluster:orthopedic_test_clusters(*)')

      // Combiner les données
      const pathologiesWithTriage = pathologiesData?.map(pathology => {
      const triage = triageData?.find(t => t.pathology_id === pathology.id)
      const tests = testLinks
        ?.filter(l => l.pathology_id === pathology.id)
        .map(l => l.test) ?? []

      const clusters = clusterLinks
        ?.filter(l => l.pathology_id === pathology.id)
        .map(l => l.cluster) ?? []

      return {
        ...pathology,
        triage_criteria: triage ? {
          pain_type: triage.pain_type,
          pain_onset: triage.pain_onset,
          aggravating_factors: triage.aggravating_factors,
          radiation_pattern: triage.radiation_pattern,
          neurological_symptoms: triage.neurological_symptoms,
          relieving_movement: triage.relieving_movement,
          triage_weight: triage.triage_weight
        } : undefined,
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

    // Appel de la route API Next -> Vercel Blob
    const res = await fetch('/api/pathology-image-upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      throw new Error('Erreur lors de l’upload vers Vercel Blob')
    }

    const { url } = await res.json()

    // Mettre à jour la pathologie dans Supabase avec l’URL Blob
    const { error: updateError } = await supabase
      .from('pathologies')
      .update({ topographic_image_url: url })
      .eq('id', pathologyId)

    if (updateError) throw updateError

    alert('Image téléchargée avec succès')
    loadPathologies()
  } catch (error) {
    console.error('Error uploading image:', error)
    alert("Erreur lors du téléchargement de l'image")
  } finally {
    setUploadingImage(false)
  }
}


  const saveTriage = async () => {
    if (!selectedPathology) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Mettre à jour les informations de base de la pathologie
      const { error: pathologyError } = await supabase
        .from('pathologies')
        .update({
          region: selectedPathology.region,
          recommendations: selectedPathology.recommendations,
          topographic_image_url: selectedPathology.topographic_image_url
        })
        .eq('id', selectedPathology.id)

      if (pathologyError) throw pathologyError

      // Vérifier si les critères de triage existent déjà
      const { data: existingTriage } = await supabase
        .from('pathology_triage_criteria')
        .select('id')
        .eq('pathology_id', selectedPathology.id)
        .single()

      const triageData = {
        pathology_id: selectedPathology.id,
        pain_type: selectedPathology.triage_criteria?.pain_type,
        pain_onset: selectedPathology.triage_criteria?.pain_onset,
        aggravating_factors: selectedPathology.triage_criteria?.aggravating_factors,
        radiation_pattern: selectedPathology.triage_criteria?.radiation_pattern,
        neurological_symptoms: selectedPathology.triage_criteria?.neurological_symptoms,
        relieving_movement: selectedPathology.triage_criteria?.relieving_movement,
        triage_weight: selectedPathology.triage_criteria?.triage_weight || 50,
        created_by: user?.id
      }

      if (existingTriage) {
        // Mise à jour
        const { error } = await supabase
          .from('pathology_triage_criteria')
          .update(triageData)
          .eq('pathology_id', selectedPathology.id)
        
        if (error) throw error
      } else {
        // Création
        const { error } = await supabase
          .from('pathology_triage_criteria')
          .insert(triageData)
        
        if (error) throw error
      }

      alert('Critères de triage sauvegardés avec succès')
      setSelectedPathology(null)
      loadPathologies()
    } catch (error) {
      console.error('Error saving triage:', error)
      alert('Erreur lors de la sauvegarde')
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
                <h1 className="text-2xl font-bold">Configuration du Triage</h1>
              </div>
              <p className="text-purple-100">
                Configurez les critères de triage et images topographiques des pathologies
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
              Cliquez sur une pathologie pour configurer ses critères
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
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Triage configuré
                              </span>
                            )}
                            {pathology.topographic_image_url && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Image disponible
                              </span>
                            )}
                          </div>
                          {pathology.description && (
                            <p className="text-sm text-gray-600 ml-6">
                              {pathology.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-gray-500">
                            {pathology.tests.length > 0 && (
                              <span>{pathology.tests.length} tests</span>
                            )}
                            {pathology.clusters.length > 0 && (
                              <span>{pathology.clusters.length} clusters</span>
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
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Type de douleur:</span>{' '}
                              <span className="text-gray-900">
                                {PAIN_TYPES.find(t => t.value === pathology.triage_criteria?.pain_type)?.label || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Apparition:</span>{' '}
                              <span className="text-gray-900">
                                {PAIN_ONSETS.find(t => t.value === pathology.triage_criteria?.pain_onset)?.label || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Facteurs aggravants:</span>{' '}
                              <span className="text-gray-900">
                                {AGGRAVATING_FACTORS.find(t => t.value === pathology.triage_criteria?.aggravating_factors)?.label || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Irradiation:</span>{' '}
                              <span className="text-gray-900">
                                {RADIATION_PATTERNS.find(t => t.value === pathology.triage_criteria?.radiation_pattern)?.label || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Symptômes neuro:</span>{' '}
                              <span className="text-gray-900">
                                {pathology.triage_criteria?.neurological_symptoms ? 'Oui' : 'Non'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Mouvement soulageant:</span>{' '}
                              <span className="text-gray-900">
                                {RELIEVING_MOVEMENTS.find(t => t.value === pathology.triage_criteria?.relieving_movement)?.label || '-'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 italic">
                            Aucun critère de triage configuré
                          </p>
                        )}
                        
                        {pathology.topographic_image_url && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Image topographique:</p>
                            <img 
                              src={pathology.topographic_image_url} 
                              alt={pathology.name}
                              className="h-32 object-contain rounded-lg border border-gray-200"
                            />
                          </div>
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
                  Configuration de {selectedPathology.name}
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
                  Informations de base
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
                      <option value="">Sélectionner une région</option>
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
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(selectedPathology.id, file)
                          }
                        }}
                        disabled={uploadingImage}
                        className="flex-1 text-sm"
                      />
                      {selectedPathology.topographic_image_url && (
                        <a 
                          href={selectedPathology.topographic_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        >
                          <Image className="h-4 w-4" />
                        </a>
                      )}
                    </div>
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
                      placeholder="Recommandations de prise en charge..."
                    />
                  </div>
                </div>
              </div>

              {/* Critères de triage */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Critères de triage
                </h3>
                
                <div className="space-y-4">
                  {/* Type de douleur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de douleur
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAIN_TYPES.map(type => (
                        <button
                          key={type.value}
                          onClick={() => setSelectedPathology({
                            ...selectedPathology,
                            triage_criteria: {
                              ...selectedPathology.triage_criteria,
                              pain_type: type.value
                            }
                          })}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedPathology.triage_criteria?.pain_type === type.value
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{type.label}</p>
                          {type.description && (
                            <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apparition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apparition de la douleur
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAIN_ONSETS.map(onset => (
                        <button
                          key={onset.value}
                          onClick={() => setSelectedPathology({
                            ...selectedPathology,
                            triage_criteria: {
                              ...selectedPathology.triage_criteria,
                              pain_onset: onset.value
                            }
                          })}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedPathology.triage_criteria?.pain_onset === onset.value
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{onset.label}</p>
                          {onset.description && (
                            <p className="text-xs text-gray-600 mt-1">{onset.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Facteurs aggravants */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facteurs aggravants
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AGGRAVATING_FACTORS.map(factor => (
                        <button
                          key={factor.value}
                          onClick={() => setSelectedPathology({
                            ...selectedPathology,
                            triage_criteria: {
                              ...selectedPathology.triage_criteria,
                              aggravating_factors: factor.value
                            }
                          })}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedPathology.triage_criteria?.aggravating_factors === factor.value
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{factor.label}</p>
                          {factor.description && (
                            <p className="text-xs text-gray-600 mt-1">{factor.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Irradiation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pattern d'irradiation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {RADIATION_PATTERNS.map(pattern => (
                        <button
                          key={pattern.value}
                          onClick={() => setSelectedPathology({
                            ...selectedPathology,
                            triage_criteria: {
                              ...selectedPathology.triage_criteria,
                              radiation_pattern: pattern.value
                            }
                          })}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedPathology.triage_criteria?.radiation_pattern === pattern.value
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{pattern.label}</p>
                          {pattern.description && (
                            <p className="text-xs text-gray-600 mt-1">{pattern.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symptômes neurologiques */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptômes neurologiques (picotements, perte de force, engourdissements)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedPathology({
                          ...selectedPathology,
                          triage_criteria: {
                            ...selectedPathology.triage_criteria,
                            neurological_symptoms: true
                          }
                        })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedPathology.triage_criteria?.neurological_symptoms === true
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-900">Présents</p>
                        <p className="text-xs text-gray-600 mt-1">Suspicion neuro (radiculaire, canal, compression)</p>
                      </button>
                      <button
                        onClick={() => setSelectedPathology({
                          ...selectedPathology,
                          triage_criteria: {
                            ...selectedPathology.triage_criteria,
                            neurological_symptoms: false
                          }
                        })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedPathology.triage_criteria?.neurological_symptoms === false
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-900">Absents</p>
                        <p className="text-xs text-gray-600 mt-1">Loco-régional</p>
                      </button>
                    </div>
                  </div>

                  {/* Mouvements soulageants */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mouvements qui soulagent
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {RELIEVING_MOVEMENTS.map(movement => (
                        <button
                          key={movement.value}
                          onClick={() => setSelectedPathology({
                            ...selectedPathology,
                            triage_criteria: {
                              ...selectedPathology.triage_criteria,
                              relieving_movement: movement.value
                            }
                          })}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedPathology.triage_criteria?.relieving_movement === movement.value
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{movement.label}</p>
                          {movement.description && (
                            <p className="text-xs text-gray-600 mt-1">{movement.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Poids du triage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poids du triage (priorité d'affichage)
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
                      <span>Faible priorité</span>
                      <span className="font-medium text-purple-600">
                        {selectedPathology.triage_criteria?.triage_weight || 50}
                      </span>
                      <span>Haute priorité</span>
                    </div>
                  </div>
                </div>
              </div>

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