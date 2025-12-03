'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { createElearningView, getAllElearningViews, updateElearningView } from '@/lib/elearning-topographic-api'
import type { AnatomicalRegion, ElearningTopographicView } from '@/lib/types-topographic-system'
import {
  BookOpen,
  CheckCircle,
  Image as ImageIcon,
  Lock,
  Map,
  Plus,
  Sparkles,
  Upload,
  X
} from 'lucide-react'

const REGIONS: { value: AnatomicalRegion; label: string; icon: string }[] = [
  { value: 'cervical', label: 'Cervical', icon: '🔵' },
  { value: 'thoracique', label: 'Thoracique', icon: '🟢' },
  { value: 'lombaire', label: 'Lombaire', icon: '🟠' },
  { value: 'epaule', label: 'Épaule', icon: '🔴' },
  { value: 'coude', label: 'Coude', icon: '🟣' },
  { value: 'poignet', label: 'Poignet', icon: '🟡' },
  { value: 'main', label: 'Main', icon: '✋' },
  { value: 'hanche', label: 'Hanche', icon: '🔶' },
  { value: 'genou', label: 'Genou', icon: '🔷' },
  { value: 'cheville', label: 'Cheville', icon: '🟤' },
  { value: 'pied', label: 'Pied', icon: '👣' }
]

interface TopographicFormData {
  region: AnatomicalRegion | ''
  name: string
  description: string
  image_url: string
}

export default function ElearningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [zonesLoading, setZonesLoading] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [views, setViews] = useState<ElearningTopographicView[]>([])
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegion | 'all'>('all')
  const [activeZone, setActiveZone] = useState<ElearningTopographicView | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<TopographicFormData>({
    region: '',
    name: '',
    description: '',
    image_url: ''
  })

  const descriptionRef = useRef<HTMLDivElement>(null)

  const sanitizeHtml = (html: string) => html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')

  const handleDescriptionInput = () => {
    const html = descriptionRef.current?.innerHTML || ''
    setFormData(prev => ({ ...prev, description: sanitizeHtml(html) }))
  }

  const applyFormatting = (command: string, value?: string) => {
    descriptionRef.current?.focus()
    document.execCommand(command, false, value)
    handleDescriptionInput()
  }

  useEffect(() => {
    const ensureAuthenticated = async () => {
      setLoading(true)
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role || null)
      setLoading(false)
    }

    ensureAuthenticated()
  }, [router])

  useEffect(() => {
    if (role === 'premium' || role === 'admin') {
      loadViews()
    }
  }, [role])

  useEffect(() => {
    if (showCreateModal && descriptionRef.current) {
      descriptionRef.current.innerHTML = formData.description || ''
    }
  }, [formData.description, showCreateModal])

  const loadViews = async () => {
    try {
      setZonesLoading(true)
      const data = await getAllElearningViews()
      setViews(data)
    } catch (error) {
      console.error('Error loading views:', error)
      alert('❌ Erreur lors du chargement des vues topographiques')
    } finally {
      setZonesLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('viewId', formData.name || `topographic-view-${Date.now()}`)

      const res = await fetch('/api/topographic-view-upload', {
        method: 'POST',
        body: uploadForm
      })

      if (!res.ok) {
        throw new Error(`Erreur API: ${res.status}`)
      }

      const { url } = await res.json()
      setFormData(prev => ({ ...prev, image_url: url }))
      alert('✅ Image téléchargée avec succès')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`❌ Erreur : ${message}`)
    } finally {
      setUploading(false)
    }
  }

  const openCreateModal = () => {
    setFormData({
      region: selectedRegion === 'all' ? '' : selectedRegion,
      name: '',
      description: '',
      image_url: ''
    })
    setModalMode('create')
    setEditingZoneId(null)
    setShowCreateModal(true)
  }

  const openEditModal = (zone: ElearningTopographicView) => {
    setFormData({
      region: zone.region,
      name: zone.name,
      description: zone.description || '',
      image_url: zone.image_url || ''
    })
    setModalMode('edit')
    setEditingZoneId(zone.id)
    setShowCreateModal(true)
  }

  const handleCreateZone = async () => {
    if (!formData.region || !formData.name || !formData.image_url) {
      alert('⚠️ Merci de renseigner la région, le nom et une image')
      return
    }

    try {
      setCreating(true)
      const regionCount = views.filter(z => z.region === formData.region).length
      const currentZone = editingZoneId ? views.find(z => z.id === editingZoneId) : null
      const payload = {
        region: formData.region,
        name: formData.name,
        description: sanitizeHtml(formData.description),
        image_url: formData.image_url,
        display_order: modalMode === 'edit' && currentZone ? currentZone.display_order : regionCount
      }

      if (modalMode === 'edit' && editingZoneId) {
        await updateElearningView(editingZoneId, payload)
        alert('✅ Vue topographique mise à jour')
      } else {
        await createElearningView(payload)
        alert('✅ Vue topographique créée')
      }
      setShowCreateModal(false)
      await loadViews()
    } catch (error) {
      console.error('Error creating zone:', error)
      alert('❌ Impossible de sauvegarder la vue')
    } finally {
      setCreating(false)
    }
  }

  const isPremium = role === 'premium' || role === 'admin'
  const isAdmin = role === 'admin'

  const filteredZones = useMemo(() => {
    if (selectedRegion === 'all') return views
    return views.filter(zone => zone.region === selectedRegion)
  }, [selectedRegion, views])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AuthLayout>
    )
  }

  if (!isPremium) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-50 text-primary-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-700">E-Learning</p>
              <h1 className="text-2xl font-bold text-gray-900">Bibliothèque topographique</h1>
              <p className="text-gray-600 mt-1">
                Accédez à des vues topographiques par zone anatomique pour guider votre raisonnement clinique.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-700">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Accès Premium requis</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Les vues topographiques par zone sont réservées aux membres Premium. Passez à l'abonnement pour débloquer les
              contenus et visualiser chaque zone en détail.
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg font-semibold transition"
            >
              Activer le Premium
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-white/10">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm text-primary-100 font-semibold">E-Learning</p>
                <h1 className="text-2xl font-bold">Vues topographiques par zone</h1>
                <p className="text-primary-50 mt-1">
                  Naviguez par région anatomique et ouvrez chaque vue pour afficher l'image, le titre et la description.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-200" />
                <div>
                  <p className="text-xs text-primary-100">Contenu Premium</p>
                  <p className="text-sm font-semibold">Par zones anatomiques</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Map className="h-4 w-4" />
              Zones anatomiques
            </span>
            <button
              onClick={() => setSelectedRegion('all')}
              className={`px-3 py-2 rounded-lg text-sm border ${
                selectedRegion === 'all'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
              }`}
            >
              Toutes
            </button>
            {REGIONS.map(region => (
              <button
                key={region.value}
                onClick={() => setSelectedRegion(region.value)}
                className={`px-3 py-2 rounded-lg text-sm border flex items-center gap-1 ${
                  selectedRegion === region.value
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                }`}
              >
                <span>{region.icon}</span>
                {region.label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle vue
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {zonesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="text-center py-16">
              <Map className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Aucune vue topographique dans cette région pour le moment.</p>
              {isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une vue
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZones.map(zone => (
                <div
                  key={zone.id}
                  className="group relative rounded-xl border border-gray-200 overflow-hidden bg-gradient-to-br from-gray-50 to-white shadow-sm"
                >
                  <div className="relative h-48 bg-white border-b border-gray-200 flex items-center justify-center overflow-hidden">
                    {zone.image_url ? (
                      <img
                        src={zone.image_url}
                        alt={zone.name}
                        className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">Image manquante</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                      <span>{REGIONS.find(r => r.value === zone.region)?.icon}</span>
                      {REGIONS.find(r => r.value === zone.region)?.label}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">Vue topographique</p>
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{zone.name}</h3>
                      </div>
                      <Sparkles className="h-5 w-5 text-primary-500" />
                    </div>

                    {zone.description && (
                      <div
                        className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(zone.description || '')
                        }}
                      />
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveZone(zone)}
                        className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                      >
                        Ouvrir la vue
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => openEditModal(zone)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-primary-200"
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeZone && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden relative">
            <button
              onClick={() => setActiveZone(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-50"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            <div className="md:flex">
              <div className="md:w-1/2 bg-gray-50 flex items-center justify-center border-b md:border-b-0 md:border-r p-6">
                {activeZone.image_url ? (
                  <img
                    src={activeZone.image_url}
                    alt={activeZone.name}
                    className="max-h-[500px] w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Aucune image fournie</p>
                  </div>
                )}
              </div>

              <div className="md:w-1/2 p-6 space-y-3">
                <p className="text-sm font-semibold text-primary-600 flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  {REGIONS.find(r => r.value === activeZone.region)?.label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">{activeZone.name}</h3>
                {activeZone.description ? (
                  <div
                    className="text-gray-700 leading-relaxed whitespace-pre-line prose"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeZone.description) }}
                  />
                ) : (
                  <p className="text-gray-500 text-sm">Pas de description disponible pour cette vue.</p>
                )}
                {isAdmin && (
                  <button
                    onClick={() => {
                      openEditModal(activeZone)
                      setActiveZone(null)
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-primary-200"
                  >
                    Modifier cette vue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-semibold">Admin</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {modalMode === 'edit' ? 'Modifier la vue topographique' : 'Nouvelle vue topographique'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Région anatomique *</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value as AnatomicalRegion }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {REGIONS.map(region => (
                      <option key={region.value} value={region.value}>
                        {region.icon} {region.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la vue *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Vue antérieure de l'épaule"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Description (sauts de ligne et mise en forme)</label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={() => applyFormatting('bold')}
                      className="px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      Gras
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('fontSize', '4')}
                      className="px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      Texte grand
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('fontSize', '3')}
                      className="px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      Texte moyen
                    </button>
                  </div>
                </div>
                <div
                  ref={descriptionRef}
                  contentEditable
                  onInput={handleDescriptionInput}
                  className="min-h-[120px] w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                  placeholder="Détails ou indications pédagogiques"
                  suppressContentEditableWarning
                />
                <p className="text-xs text-gray-500">Les retours à la ligne, le gras et la taille de police seront conservés lors de l'affichage.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Image topographique *</label>
                  {formData.image_url && (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Retirer
                    </button>
                  )}
                </div>

                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Aperçu"
                      className="w-full h-56 object-contain bg-gray-50 rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary-600 mb-3">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Glissez-déposez ou sélectionnez une image</p>
                    <p className="text-xs text-gray-500">Utilisation de Vercel Blob comme pour la consultation guidée</p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                />
                {uploading && <p className="text-sm text-primary-600">Upload en cours...</p>}
              </div>
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateZone}
                disabled={creating}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {modalMode === 'edit' ? 'Enregistrer les modifications' : 'Créer la vue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
