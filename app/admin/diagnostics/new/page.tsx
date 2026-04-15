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
  { value: 'poignet', label: 'Poignet + main' },
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
    severity: '' as '' | 'low' | 'medium' | 'high',
    is_red_flag: false,
    red_flag_reason: '',
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

    ;[newTests[index], newTests[newIndex]] = [newTests[newIndex], newTests[index]]
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

    ;[newClusters[index], newClusters[newIndex]] = [newClusters[newIndex], newClusters[index]]
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
          severity: formData.severity || null,
          is_red_flag: formData.is_red_flag,
          red_flag_reason: formData.red_flag_reason || null,
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
      <div className="min-h-screen -m-6 md:-m-8">
        {/* Dark glass header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-4 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide">
                <FileText className="h-4 w-4 inline mr-1" />
                Admin — Diagnostics
              </p>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                Nouveau Diagnostic
              </h1>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent blur-sm" />
        </div>

        {/* Light glass body */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche - Informations générales */}
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-white/30 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      Informations générales
                    </h2>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nom du diagnostic / Pathologie *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                        placeholder="Ex: Hernie discale L5-S1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Région anatomique *
                      </label>
                      <select
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value as AnatomicalRegion })}
                        className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                        required
                      >
                        {REGIONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                        placeholder="Description clinique de la pathologie..."
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Gravité
                        </label>
                        <select
                          value={formData.severity}
                          onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'low' | 'medium' | 'high' | '' })}
                          className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                        >
                          <option value="">Non définie</option>
                          <option value="low">🟢 Légère</option>
                          <option value="medium">🟡 Modérée</option>
                          <option value="high">🔴 Sévère</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Drapeau rouge
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 mt-1">
                          <input
                            type="checkbox"
                            checked={formData.is_red_flag}
                            onChange={(e) => setFormData({ ...formData, is_red_flag: e.target.checked })}
                            className="h-4 w-4 text-red-600 border-gray-300 rounded"
                          />
                          Oui, c&apos;est un drapeau rouge
                        </label>
                      </div>
                    </div>

                    {formData.is_red_flag && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Raison du drapeau rouge
                        </label>
                        <textarea
                          value={formData.red_flag_reason}
                          onChange={(e) => setFormData({ ...formData, red_flag_reason: e.target.value })}
                          rows={3}
                          className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                          placeholder="Expliquez brièvement pourquoi cette pathologie est un drapeau rouge..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Signes cliniques évidents
                      </label>
                      <textarea
                        value={formData.clinical_signs}
                        onChange={(e) => setFormData({ ...formData, clinical_signs: e.target.value })}
                        rows={4}
                        className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                        placeholder="Ex: Douleur en barre dans le bas du dos, irradiation dans la jambe, perte de force..."
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Ces signes seront affichés aux praticiens pour les aider à identifier la pathologie
                      </p>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-white/30 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-purple-500" />
                      Photo du diagnostic
                    </h2>

                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-blue-200/60 rounded-xl p-8 text-center hover:border-purple-400/60 transition-colors bg-white/40">
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
                          <Upload className="h-12 w-12 text-slate-400 mb-3" />
                          <span className="text-sm font-medium text-slate-700">
                            Cliquez pour ajouter une photo
                          </span>
                          <span className="text-xs text-slate-500 mt-1">
                            PNG, JPG jusqu&apos;à 10MB
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="relative h-64 rounded-xl overflow-hidden">
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
                          className="absolute top-2 right-2 p-2 bg-red-500/10 backdrop-blur-sm border border-red-300/30 text-red-600 hover:bg-red-500/20 rounded-xl"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <span className="text-sm text-slate-700">
                        Diagnostic actif (visible pour les praticiens)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Colonne droite - Tests et Clusters associés */}
                <div className="space-y-6">
                  <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-white/30 flex items-center gap-2">
                      <TestTube2 className="h-5 w-5 text-purple-500" />
                      Tests et Clusters associés ({selectedTests.length} tests, {selectedClusters.length} clusters)
                    </h2>

                    {/* Onglets */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('tests')}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                          activeTab === 'tests'
                            ? 'bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white shadow-sm'
                            : 'bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 hover:bg-white/90'
                        }`}
                      >
                        Tests ({selectedTests.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('clusters')}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                          activeTab === 'clusters'
                            ? 'bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white shadow-sm'
                            : 'bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 hover:bg-white/90'
                        }`}
                      >
                        Clusters ({selectedClusters.length})
                      </button>
                    </div>

                    <p className="text-sm text-slate-600">
                      {activeTab === 'tests'
                        ? 'Sélectionnez les tests individuels pertinents pour ce diagnostic.'
                        : 'Sélectionnez les clusters de tests pertinents pour ce diagnostic.'}
                    </p>

                    {/* Contenu de l'onglet Tests */}
                    {activeTab === 'tests' && (
                      <>
                        {/* Tests sélectionnés */}
                        {selectedTests.length > 0 && (
                          <div className="bg-purple-50/80 backdrop-blur-sm border border-purple-200/40 rounded-xl p-4">
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
                                    className="flex items-center gap-2 bg-white/80 rounded-lg p-3 border border-purple-200/60"
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
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {index + 1}. {test.name}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleTest(testId)}
                                      className="p-1 bg-red-500/10 backdrop-blur-sm border border-red-300/30 text-red-600 hover:bg-red-500/20 rounded-lg"
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Rechercher un test (nom, description, indication)..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full text-sm"
                            />
                          </div>

                          <div className="max-h-96 overflow-y-auto space-y-2 border border-white/50 bg-white/30 rounded-xl p-3">
                            {filteredTests.length === 0 ? (
                              <p className="text-sm text-slate-500 text-center py-4">
                                Aucun test trouvé pour cette région
                              </p>
                            ) : (
                              filteredTests.map(test => (
                                <div
                                  key={test.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    selectedTests.includes(test.id)
                                      ? 'bg-purple-50/90 border-purple-300/60'
                                      : 'hover:bg-white/80 border-blue-200/40 bg-white/50'
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
                                      <p className="text-sm font-medium text-slate-900">{test.name}</p>
                                      {test.category && (
                                        <p className="text-xs text-slate-500 mt-0.5">{test.category}</p>
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
                          <div className="bg-purple-50/80 backdrop-blur-sm border border-purple-200/40 rounded-xl p-4">
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
                                    className="flex items-center gap-2 bg-white/80 rounded-lg p-3 border border-purple-200/60"
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
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {index + 1}. {cluster.name}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleCluster(clusterId)}
                                      className="p-1 bg-red-500/10 backdrop-blur-sm border border-red-300/30 text-red-600 hover:bg-red-500/20 rounded-lg"
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Rechercher un cluster (nom, description, indication)..."
                              value={clusterSearchQuery}
                              onChange={(e) => setClusterSearchQuery(e.target.value)}
                              className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full text-sm"
                            />
                          </div>

                          <div className="max-h-96 overflow-y-auto space-y-2 border border-white/50 bg-white/30 rounded-xl p-3">
                            {filteredClusters.length === 0 ? (
                              <p className="text-sm text-slate-500 text-center py-4">
                                Aucun cluster trouvé pour cette région
                              </p>
                            ) : (
                              filteredClusters.map(cluster => (
                                <div
                                  key={cluster.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    selectedClusters.includes(cluster.id)
                                      ? 'bg-purple-50/90 border-purple-300/60'
                                      : 'hover:bg-white/80 border-blue-200/40 bg-white/50'
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
                                      <p className="text-sm font-medium text-slate-900">{cluster.name}</p>
                                      {cluster.region && (
                                        <p className="text-xs text-slate-500 mt-0.5">{cluster.region}</p>
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
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 hover:bg-white/90 font-medium transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Création...' : uploading ? 'Upload...' : 'Créer le diagnostic'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
