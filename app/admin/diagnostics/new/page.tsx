'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  Plus,
  GripVertical,
  Search,
  Image as ImageIcon,
  FileText,
  TestTube2
} from 'lucide-react'
import Image from 'next/image'

type AnatomicalRegion = 'cervical' | 'atm' | 'crane' | 'thoracique' | 'lombaire' | 'sacro-iliaque' | 'cotes' | 'epaule' | 'coude' | 'poignet' | 'main' | 'hanche' | 'genou' | 'cheville' | 'pied' | 'neurologique' | 'vasculaire' | 'systemique'

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

interface OrthopedicTest {
  id: string
  name: string
  description: string
  category: string
  indications: string | null
}

interface OrthopedicTestCluster {
  id: string
  name: string
  region: string
  description: string | null
  indications: string | null
}

export default function NewDiagnosticPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: 'lombaire' as AnatomicalRegion,
    clinical_signs: '',
    image_url: '',
    is_active: true
  })

  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [availableTests, setAvailableTests] = useState<OrthopedicTest[]>([])
  const [filteredTests, setFilteredTests] = useState<OrthopedicTest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  // Clusters
  const [selectedClusters, setSelectedClusters] = useState<string[]>([])
  const [availableClusters, setAvailableClusters] = useState<OrthopedicTestCluster[]>([])
  const [filteredClusters, setFilteredClusters] = useState<OrthopedicTestCluster[]>([])
  const [clusterSearchQuery, setClusterSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'tests' | 'clusters'>('tests')

  useEffect(() => {
    checkAccess()
  }, [])

  useEffect(() => {
    filterTests()
  }, [searchQuery, availableTests, formData.region])

  useEffect(() => {
    filterClusters()
  }, [clusterSearchQuery, availableClusters, formData.region])

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
      router.push('/dashboard')
      return
    }

    await loadTests()
  }

  const loadTests = async () => {
    // Charger les tests
    const { data: tests } = await supabase
      .from('orthopedic_tests')
      .select('id, name, description, category, indications')
      .order('name')

    setAvailableTests(tests || [])

    // Charger les clusters
    const { data: clusters } = await supabase
      .from('orthopedic_test_clusters')
      .select('id, name, region, description, indications')
      .order('name')

    setAvailableClusters(clusters || [])
  }

  const filterTests = () => {
    let filtered = [...availableTests]

    // Filtrer par région si possible
    const regionLabel = REGIONS.find(r => r.value === formData.region)?.label
    if (regionLabel) {
      filtered = filtered.filter(t =>
        t.category?.toLowerCase().includes(regionLabel.toLowerCase()) ||
        regionLabel.toLowerCase().includes(t.category?.toLowerCase() || '')
      )
    }

    // Filtrer par recherche (nom, description, indications)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.indications?.toLowerCase().includes(q)
      )
    }

    setFilteredTests(filtered)
  }

  const filterClusters = () => {
    let filtered = [...availableClusters]

    // Filtrer par région
    const regionLabel = REGIONS.find(r => r.value === formData.region)?.label
    if (regionLabel) {
      filtered = filtered.filter(c =>
        c.region?.toLowerCase().includes(regionLabel.toLowerCase()) ||
        regionLabel.toLowerCase().includes(c.region?.toLowerCase() || '')
      )
    }

    // Filtrer par recherche
    if (clusterSearchQuery) {
      const q = clusterSearchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.indications?.toLowerCase().includes(q)
      )
    }

    setFilteredClusters(filtered)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData({ ...formData, image_url: '' })
  }

  const toggleTest = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    )
  }

  const moveTest = (index: number, direction: 'up' | 'down') => {
    const newTests = [...selectedTests]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newTests.length) return

    [newTests[index], newTests[newIndex]] = [newTests[newIndex], newTests[index]]
    setSelectedTests(newTests)
  }

  const toggleCluster = (clusterId: string) => {
    setSelectedClusters(prev =>
      prev.includes(clusterId)
        ? prev.filter(id => id !== clusterId)
        : [...prev, clusterId]
    )
  }

  const moveCluster = (index: number, direction: 'up' | 'down') => {
    const newClusters = [...selectedClusters]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newClusters.length) return

    [newClusters[index], newClusters[newIndex]] = [newClusters[newIndex], newClusters[index]]
    setSelectedClusters(newClusters)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.region) {
      alert('Le nom et la région sont obligatoires')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      let imageUrl = formData.image_url

      // Upload de l'image si présente
      if (imageFile) {
        setUploading(true)
        const tempId = `temp-${Date.now()}`
        const formDataUpload = new FormData()
        formDataUpload.append('file', imageFile)
        formDataUpload.append('pathologyId', tempId)

        const uploadRes = await fetch('/api/pathology-image-upload', {
          method: 'POST',
          body: formDataUpload
        })

        const uploadData = await uploadRes.json()
        if (uploadData.url) {
          imageUrl = uploadData.url
        }
        setUploading(false)
      }

      // Créer la pathologie
      const { data: pathology, error: pathologyError } = await supabase
        .from('pathologies')
        .insert({
          name: formData.name,
          description: formData.description || null,
          region: formData.region,
          clinical_signs: formData.clinical_signs || null,
          image_url: imageUrl || null,
          is_active: formData.is_active,
          display_order: 0,
          created_by: user?.id
        })
        .select()
        .single()

      if (pathologyError) throw pathologyError

      // Associer les tests sélectionnés
      if (selectedTests.length > 0 && pathology) {
        const testLinks = selectedTests.map((testId, index) => ({
          pathology_id: pathology.id,
          test_id: testId,
          order_index: index
        }))

        const { error: linksError } = await supabase
          .from('pathology_tests')
          .insert(testLinks)

        if (linksError) throw linksError
      }

      // Associer les clusters sélectionnés
      if (selectedClusters.length > 0 && pathology) {
        const clusterLinks = selectedClusters.map((clusterId, index) => ({
          pathology_id: pathology.id,
          cluster_id: clusterId,
          order_index: index
        }))

        const { error: clusterLinksError } = await supabase
          .from('pathology_clusters')
          .insert(clusterLinks)

        if (clusterLinksError) throw clusterLinksError
      }

      alert('✅ Diagnostic créé avec succès !')
      router.push('/admin/diagnostics')
    } catch (error: any) {
      console.error('Error:', error)
      alert('❌ Erreur : ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const getTestDetails = (testId: string) => {
    return availableTests.find(t => t.id === testId)
  }

  const getClusterDetails = (clusterId: string) => {
    return availableClusters.find(c => c.id === clusterId)
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Nouveau Diagnostic
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Créez un dossier de diagnostic avec photo, signes cliniques et tests
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Colonne gauche - Informations générales */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Informations générales
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du diagnostic / Pathologie *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Hernie discale L5-S1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Région anatomique *
                    </label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value as AnatomicalRegion })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      {REGIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Description clinique de la pathologie..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signes cliniques évidents
                    </label>
                    <textarea
                      value={formData.clinical_signs}
                      onChange={(e) => setFormData({ ...formData, clinical_signs: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Douleur en barre dans le bas du dos, irradiation dans la jambe, perte de force..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ces signes seront affichés aux praticiens pour les aider à identifier la pathologie
                    </p>
                  </div>
                </div>

                {/* Image */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                    Photo du diagnostic
                  </h2>

                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                        <span className="text-sm font-medium text-gray-700">
                          Cliquez pour ajouter une photo
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PNG, JPG jusqu'à 10MB
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative h-64 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Diagnostic actif (visible pour les praticiens)
                    </span>
                  </label>
                </div>
              </div>

              {/* Colonne droite - Tests et Clusters associés */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                    <TestTube2 className="h-5 w-5 text-purple-600" />
                    Tests et Clusters associés ({selectedTests.length} tests, {selectedClusters.length} clusters)
                  </h2>

                  {/* Onglets */}
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('tests')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        activeTab === 'tests'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tests ({selectedTests.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('clusters')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        activeTab === 'clusters'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Clusters ({selectedClusters.length})
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mt-3">
                    {activeTab === 'tests'
                      ? 'Sélectionnez les tests individuels pertinents pour ce diagnostic.'
                      : 'Sélectionnez les clusters de tests pertinents pour ce diagnostic.'}
                  </p>
                </div>

                {/* Contenu de l'onglet Tests */}
                {activeTab === 'tests' && (
                  <>
                    {/* Tests sélectionnés */}
                    {selectedTests.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-purple-900 mb-3">
                      Tests sélectionnés
                    </h3>
                    <div className="space-y-2">
                      {selectedTests.map((testId, index) => {
                        const test = getTestDetails(testId)
                        if (!test) return null

                        return (
                          <div
                            key={testId}
                            className="flex items-center gap-2 bg-white rounded-lg p-3 border border-purple-200"
                          >
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => moveTest(index, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {index + 1}. {test.name}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTest(testId)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Recherche et liste des tests disponibles */}
                <div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un test (nom, description, indication)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                    {filteredTests.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Aucun test trouvé pour cette région
                      </p>
                    ) : (
                      filteredTests.map(test => (
                        <div
                          key={test.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedTests.includes(test.id)
                              ? 'bg-purple-50 border-purple-300'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => toggleTest(test.id)}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedTests.includes(test.id)}
                              onChange={() => {}}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{test.name}</p>
                              {test.category && (
                                <p className="text-xs text-gray-500 mt-0.5">{test.category}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                  </>
                )}

                {/* Contenu de l'onglet Clusters */}
                {activeTab === 'clusters' && (
                  <>
                    {/* Clusters sélectionnés */}
                    {selectedClusters.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-purple-900 mb-3">
                          Clusters sélectionnés
                        </h3>
                        <div className="space-y-2">
                          {selectedClusters.map((clusterId, index) => {
                            const cluster = getClusterDetails(clusterId)
                            if (!cluster) return null

                            return (
                              <div
                                key={clusterId}
                                className="flex items-center gap-2 bg-white rounded-lg p-3 border border-purple-200"
                              >
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveCluster(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                  >
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {index + 1}. {cluster.name}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleCluster(clusterId)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recherche et liste des clusters disponibles */}
                    <div>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher un cluster (nom, description, indication)..."
                          value={clusterSearchQuery}
                          onChange={(e) => setClusterSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                        {filteredClusters.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Aucun cluster trouvé pour cette région
                          </p>
                        ) : (
                          filteredClusters.map(cluster => (
                            <div
                              key={cluster.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedClusters.includes(cluster.id)
                                  ? 'bg-purple-50 border-purple-300'
                                  : 'hover:bg-gray-50 border-gray-200'
                              }`}
                              onClick={() => toggleCluster(cluster.id)}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedClusters.includes(cluster.id)}
                                  onChange={() => {}}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{cluster.name}</p>
                                  {cluster.region && (
                                    <p className="text-xs text-gray-500 mt-0.5">{cluster.region}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Création...' : uploading ? 'Upload...' : 'Créer le diagnostic'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
