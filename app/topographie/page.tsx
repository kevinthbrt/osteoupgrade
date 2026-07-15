'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import { createTopographieView, getAllTopographieViews, updateTopographieView } from '@/lib/topographie-topographic-api'
import type { AnatomicalRegion, TopographieView } from '@/lib/types-topographic-system'
import {
  BookOpen,
  CheckCircle,
  Image as ImageIcon,
  Lock,
  Map,
  Plus,
  Sparkles,
  Upload,
  X,
  User,
  Activity
} from 'lucide-react'
import FreeContentGate from '@/components/FreeContentGate'
import FreeUserBanner from '@/components/FreeUserBanner'

const FREE_ACCESSIBLE_REGIONS_TOPO = ['epaule']

// Catégories de régions anatomiques
const BODY_REGIONS = {
  'Tête et Cou': ['cervical', 'atm', 'crane'],
  'Membre Supérieur': ['epaule', 'coude', 'poignet'],
  'Tronc': ['thoracique', 'lombaire', 'sacro-iliaque', 'cotes'],
  'Membre Inférieur': ['hanche', 'genou', 'cheville', 'pied'],
  'Général': ['neurologique', 'vasculaire', 'systemique']
}

// Mapping pour les labels des régions
const REGION_LABELS: Record<AnatomicalRegion, string> = {
  cervical: 'Cervical',
  atm: 'ATM',
  crane: 'Crâne',
  thoracique: 'Thoracique',
  lombaire: 'Lombaire',
  'sacro-iliaque': 'Sacro-iliaque',
  cotes: 'Côtes',
  epaule: 'Épaule',
  coude: 'Coude',
  poignet: 'Poignet + main',
  hanche: 'Hanche',
  genou: 'Genou',
  cheville: 'Cheville',
  pied: 'Pied',
  neurologique: 'Neurologique',
  vasculaire: 'Vasculaire',
  systemique: 'Systémique'
}

// Fonction pour obtenir l'icône de catégorie
const getRegionIcon = (category: string) => {
  const icons: Record<string, JSX.Element> = {
    'Tête et Cou': <User className="h-5 w-5" />,
    'Membre Supérieur': <Activity className="h-5 w-5" />,
    'Tronc': <User className="h-5 w-5" />,
    'Membre Inférieur': <Activity className="h-5 w-5" />,
    'Général': <Map className="h-5 w-5" />
  }
  return icons[category] || <Map className="h-5 w-5" />
}

interface TopographicFormData {
  region: AnatomicalRegion | ''
  name: string
  description: string
  image_url: string
}

export default function TopographiePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [zonesLoading, setZonesLoading] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [views, setViews] = useState<TopographieView[]>([])
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegion | 'all'>('all')
  const [activeZone, setActiveZone] = useState<TopographieView | null>(null)

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
    const sanitized = sanitizeHtml(html)
    const cleaned = sanitized === '<br>' ? '' : sanitized

    setFormData(prev => ({ ...prev, description: cleaned }))
  }

  const applyFormatting = (command: string, value?: string) => {
    descriptionRef.current?.focus()
    document.execCommand(command, false, value)
    handleDescriptionInput()
  }

  useEffect(() => {
    const ensureAuthenticated = async () => {
      setLoading(true)
      const payload = await fetchProfilePayload()

      if (!payload?.user) {
        router.push('/')
        return
      }

      setRole(payload.profile?.role || null)
      setLoading(false)
    }

    ensureAuthenticated()
  }, [router])

  useEffect(() => {
    if (role) {
      loadViews()
    }
  }, [role])

  useEffect(() => {
    if (showCreateModal && descriptionRef.current) {
      descriptionRef.current.innerHTML = formData.description || ''
    }
  }, [showCreateModal, editingZoneId, modalMode])

  const loadViews = async () => {
    try {
      setZonesLoading(true)
      const data = await getAllTopographieViews()
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

  const openEditModal = (zone: TopographieView) => {
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
        await updateTopographieView(editingZoneId, payload)
        alert('✅ Vue topographique mise à jour')
      } else {
        await createTopographieView(payload)
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

  const isPremium = role ? ['premium', 'admin'].includes(role) : false
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

  // 'trial' (essai gratuit MyOsteoFlow) est traité comme 'free' ici : le
  // contenu premium web reste verrouillé pendant l'essai.
  const isFree = role === 'free' || role === 'trial'

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">
        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-sky-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-cyan-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Module Topographie
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-sky-200 bg-clip-text text-transparent">
                Vues topographiques par zone
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Naviguez par région anatomique et ouvrez chaque vue pour afficher l&apos;image, le titre et la description.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-sky-300/50 to-transparent blur-sm" />
        </div>

        {/* ── Body ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          <div className="relative space-y-6">
        {isFree && <FreeUserBanner />}

        {/* Grille de sélection des zones anatomiques */}
        {selectedRegion === 'all' ? (
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Sélectionnez une zone anatomique</h2>
                <p className="text-sm text-slate-500">Cliquez sur une région pour afficher les vues topographiques associées</p>
              </div>
              {isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/90 backdrop-blur-sm border border-cyan-400/30 text-white text-sm font-semibold hover:bg-cyan-600/90 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle vue
                </button>
              )}
            </div>

            {/* Grille de régions organisée par catégories */}
            <div className="space-y-6">
              {Object.entries(BODY_REGIONS).map(([category, regions]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                    {getRegionIcon(category)}
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {regions.map((region) => {
                      return (
                        <button
                          key={region}
                          onClick={() => setSelectedRegion(region as AnatomicalRegion)}
                          className="w-full px-4 py-3 rounded-xl font-medium transition-all text-sm bg-white/70 backdrop-blur-sm border border-white/60 text-slate-600 hover:bg-cyan-50/80 hover:border-cyan-300/50 hover:text-cyan-700"
                        >
                          {REGION_LABELS[region as AnatomicalRegion]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/90 backdrop-blur-sm border border-cyan-400/30 text-white font-semibold shadow-sm">
                  {getRegionIcon(
                    Object.entries(BODY_REGIONS).find(([_, regions]) =>
                      regions.includes(selectedRegion)
                    )?.[0] || ''
                  )}
                  <span className="font-semibold">{REGION_LABELS[selectedRegion as AnatomicalRegion]}</span>
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{filteredZones.length}</span> vue(s) topographique(s)
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/90 backdrop-blur-sm border border-cyan-400/30 text-white text-sm font-semibold hover:bg-cyan-600/90 shadow-sm transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle vue
                  </button>
                )}
                <button
                  onClick={() => setSelectedRegion('all')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 text-sm font-medium hover:bg-white/90 transition-all"
                >
                  Changer de région
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
          {zonesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="text-center py-16">
              <Map className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucune vue topographique dans cette région pour le moment.</p>
              {isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/90 backdrop-blur-sm border border-cyan-400/30 text-white text-sm font-semibold hover:bg-cyan-600/90 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une vue
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZones.map(zone => (
                <FreeContentGate key={zone.id} isLocked={isFree && !FREE_ACCESSIBLE_REGIONS_TOPO.includes(zone.region)}>
                <div
                  className="group relative rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <div className="relative h-48 bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center overflow-hidden">
                    {zone.image_url ? (
                      <img
                        src={zone.image_url}
                        alt={zone.name}
                        className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">Image manquante</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-700 border border-white/60">
                      {REGION_LABELS[zone.region]}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-cyan-600 font-semibold">Vue topographique</p>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-cyan-700 transition-colors">{zone.name}</h3>
                      </div>
                      <Sparkles className="h-5 w-5 text-cyan-400" />
                    </div>

                    {zone.description && (
                      <div
                        className="text-sm text-slate-500 line-clamp-3 whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(zone.description || '')
                        }}
                      />
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveZone(zone)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/90 backdrop-blur-sm border border-cyan-400/30 text-white text-sm font-semibold hover:bg-cyan-600/90 shadow-sm transition-all"
                      >
                        Ouvrir la vue
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => openEditModal(zone)}
                          className="px-3 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-sm text-slate-600 hover:bg-white/90 transition-all"
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                </FreeContentGate>
              ))}
            </div>
          )}
        </div>
          </div>
        </div>
      </div>

      {activeZone && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-2xl ring-1 ring-inset ring-white/60 rounded-3xl max-w-7xl w-full max-h-[95vh] min-h-[70vh] overflow-hidden relative flex flex-col">
            <button
              onClick={() => setActiveZone(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-50"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            <div className="md:flex flex-1 overflow-hidden">
              <div className="md:w-2/3 bg-gray-50 flex items-center justify-center border-b md:border-b-0 md:border-r p-10">
                {activeZone.image_url ? (
                  <img
                    src={activeZone.image_url}
                    alt={activeZone.name}
                    className="max-h-[88vh] w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Aucune image fournie</p>
                  </div>
                )}
              </div>

              <div className="md:w-1/3 p-8 space-y-4 overflow-y-auto max-h-[90vh]">
                <p className="text-sm font-semibold text-primary-600 flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  {REGION_LABELS[activeZone.region]}
                </p>
                <h3 className="text-3xl font-bold text-gray-900">{activeZone.name}</h3>
                {activeZone.description ? (
                  <div
                    className="prose prose-lg text-gray-700 leading-relaxed whitespace-pre-line max-h-[70vh] overflow-y-auto pr-1"
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
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-2xl ring-1 ring-inset ring-white/60 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/30 flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-600 font-semibold">Admin</p>
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

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Région anatomique *</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value as AnatomicalRegion }))}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {Object.entries(BODY_REGIONS).map(([category, regions]) => (
                      <optgroup key={category} label={category}>
                        {regions.map((region) => (
                          <option key={region} value={region}>
                            {REGION_LABELS[region as AnatomicalRegion]}
                          </option>
                        ))}
                      </optgroup>
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
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none"
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
                <div className="relative">
                  <div
                    ref={descriptionRef}
                    contentEditable
                    onInput={handleDescriptionInput}
                    className="min-h-[120px] w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none"
                    aria-label="Description détaillée"
                    suppressContentEditableWarning
                  />
                  {!formData.description && (
                    <span className="pointer-events-none absolute left-3 top-2 text-sm text-gray-400">
                      Détails ou indications pédagogiques
                    </span>
                  )}
                </div>
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

            <div className="border-t border-white/30 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 hover:bg-white/90 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateZone}
                disabled={creating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/90 backdrop-blur-sm border border-cyan-400/30 text-white font-semibold hover:bg-cyan-600/90 disabled:opacity-50 shadow-sm transition-all"
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
