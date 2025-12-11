'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  GripVertical,
  Search,
  Image as ImageIcon,
  FileText,
  TestTube2,
  Loader2
} from 'lucide-react'
import Image from 'next/image'

type AnatomicalRegion = 'cervical' | 'thoracique' | 'lombaire' | 'epaule' | 'coude' | 'poignet' | 'main' | 'hanche' | 'genou' | 'cheville' | 'pied'

const REGIONS: { value: AnatomicalRegion; label: string }[] = [
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

interface OrthopedicTest {
  id: string
  name: string
  description: string
  category: string
  indications: string | null
}

export default function EditDiagnosticPage() {
  const router = useRouter()
  const params = useParams()
  const diagnosticId = params.id as string

  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    checkAccess()
  }, [])

  useEffect(() => {
    filterTests()
  }, [searchQuery, availableTests, formData.region])

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

    await loadData()
  }

  const loadData = async () => {
    try {
      // Charger la pathologie
      const { data: pathology, error: pathologyError } = await supabase
        .from('pathologies')
        .select('*')
        .eq('id', diagnosticId)
        .single()

      if (pathologyError) throw pathologyError

      setFormData({
        name: pathology.name,
        description: pathology.description || '',
        region: pathology.region,
        clinical_signs: pathology.clinical_signs || '',
        image_url: pathology.image_url || '',
        is_active: pathology.is_active
      })

      if (pathology.image_url) {
        setImagePreview(pathology.image_url)
      }

      // Charger tous les tests
      const { data: tests } = await supabase
        .from('orthopedic_tests')
        .select('id, name, description, category, indications')
        .order('name')

      setAvailableTests(tests || [])

      // Charger les tests liés
      const { data: linkedTests } = await supabase
        .from('pathology_tests')
        .select('test_id, order_index')
        .eq('pathology_id', diagnosticId)
        .order('order_index')

      const testIds = linkedTests?.map(lt => lt.test_id) || []
      setSelectedTests(testIds)
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Erreur lors du chargement')
      router.push('/admin/diagnostics')
    } finally {
      setLoading(false)
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.region) {
      alert('Le nom et la région sont obligatoires')
      return
    }

    setSaving(true)

    try {
      let imageUrl = formData.image_url

      // Upload de l'image si une nouvelle a été sélectionnée
      if (imageFile) {
        setUploading(true)
        const formDataUpload = new FormData()
        formDataUpload.append('file', imageFile)
        formDataUpload.append('pathologyId', diagnosticId)

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

      // Mettre à jour la pathologie
      const { error: pathologyError } = await supabase
        .from('pathologies')
        .update({
          name: formData.name,
          description: formData.description || null,
          region: formData.region,
          clinical_signs: formData.clinical_signs || null,
          image_url: imageUrl || null,
          is_active: formData.is_active
        })
        .eq('id', diagnosticId)

      if (pathologyError) throw pathologyError

      // Supprimer les anciens liens
      const { error: deleteError } = await supabase
        .from('pathology_tests')
        .delete()
        .eq('pathology_id', diagnosticId)

      if (deleteError) throw deleteError

      // Créer les nouveaux liens
      if (selectedTests.length > 0) {
        const testLinks = selectedTests.map((testId, index) => ({
          pathology_id: diagnosticId,
          test_id: testId,
          order_index: index
        }))

        const { error: linksError } = await supabase
          .from('pathology_tests')
          .insert(testLinks)

        if (linksError) throw linksError
      }

      alert('✅ Diagnostic mis à jour avec succès !')
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

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        </div>
      </AuthLayout>
    )
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
                    Modifier le Diagnostic
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {formData.name}
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

              {/* Colonne droite - Tests associés */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                    <TestTube2 className="h-5 w-5 text-purple-600" />
                    Tests associés ({selectedTests.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Sélectionnez les tests pertinents pour ce diagnostic. Vous pouvez réorganiser l'ordre.
                  </p>
                </div>

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
                {saving ? 'Enregistrement...' : uploading ? 'Upload...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
