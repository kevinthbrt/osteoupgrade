'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Map,
  Plus,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  Save,
  X,
  ChevronRight,
  Info,
  CheckCircle,
  Eye
} from 'lucide-react'
import {
  getAllTopographicZones,
  getTopographicZonesByRegion,
  createTopographicZone,
  updateTopographicZone,
  deleteTopographicZone
} from '@/lib/topographic-system-api'
import type { TopographicZone } from '@/lib/types-topographic-system'

const REGIONS = [
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

export default function TopographicZonesAdminPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<TopographicZone[]>([])
  const [filterRegion, setFilterRegion] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingZone, setEditingZone] = useState<TopographicZone | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    region: '',
    name: '',
    description: '',
    image_url: '',
    display_order: 0
  })

  useEffect(() => {
    checkAdminAccess()
    loadZones()
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

  const loadZones = async () => {
    try {
      const data = await getAllTopographicZones()
      setZones(data)
    } catch (error) {
      console.error('Error loading zones:', error)
      alert('❌ Erreur lors du chargement des zones')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pathologyId', 'zone-temp-' + Date.now())

      const res = await fetch('/api/pathology-image-upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error(`Erreur API: ${res.status}`)

      const { url } = await res.json()
      
      setFormData(prev => ({ ...prev, image_url: url }))
      alert('✅ Image téléchargée avec succès')
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`❌ Erreur : ${errorMessage}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const openCreateModal = () => {
    setEditingZone(null)
    setFormData({
      region: '',
      name: '',
      description: '',
      image_url: '',
      display_order: zones.length
    })
    setShowModal(true)
  }

  const openEditModal = (zone: TopographicZone) => {
    setEditingZone(zone)
    setFormData({
      region: zone.region,
      name: zone.name,
      description: zone.description || '',
      image_url: zone.image_url || '',
      display_order: zone.display_order
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.region || !formData.name) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires')
      return
    }

    setSaving(true)
    try {
      if (editingZone) {
        await updateTopographicZone(editingZone.id, formData)
        alert('✅ Zone mise à jour avec succès')
      } else {
        await createTopographicZone({
          region: formData.region as any,
          name: formData.name,
          description: formData.description,
          image_url: formData.image_url,
          display_order: formData.display_order
        })
        alert('✅ Zone créée avec succès')
      }
      
      setShowModal(false)
      loadZones()
    } catch (error) {
      console.error('Error saving zone:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (zone: TopographicZone) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${zone.name}" ?`)) {
      return
    }

    try {
      await deleteTopographicZone(zone.id)
      alert('✅ Zone supprimée')
      loadZones()
    } catch (error) {
      console.error('Error deleting zone:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  const filteredZones = filterRegion
    ? zones.filter(z => z.region === filterRegion)
    : zones

  const zonesByRegion = filteredZones.reduce((acc, zone) => {
    if (!acc[zone.region]) acc[zone.region] = []
    acc[zone.region].push(zone)
    return acc
  }, {} as Record<string, TopographicZone[]>)

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
                <Map className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Zones Topographiques</h1>
              </div>
              <p className="text-purple-100">
                Gérer les zones anatomiques avec images cliquables
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{zones.length}</p>
              <p className="text-purple-100">Zones créées</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between gap-4">
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
                    {region.icon} {region.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Zone
            </button>
          </div>
        </div>

        {/* Zones List */}
        {Object.keys(zonesByRegion).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Map className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucune zone topographique créée</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Créer la première zone
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(zonesByRegion).map(([region, regionZones]) => (
              <div key={region} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span className="text-2xl">
                        {REGIONS.find(r => r.value === region)?.icon}
                      </span>
                      {REGIONS.find(r => r.value === region)?.label}
                    </h2>
                    <span className="text-sm text-gray-600">
                      {regionZones.length} zone(s)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {regionZones.map(zone => (
                    <div 
                      key={zone.id}
                      className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all hover:shadow-lg overflow-hidden"
                    >
                      {/* Image */}
                      {zone.image_url ? (
                        <div className="relative h-48 bg-white border-b border-gray-200 overflow-hidden">
                          <img
                            src={zone.image_url}
                            alt={zone.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Image OK
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 border-b border-gray-300 flex items-center justify-center">
                          <div className="text-center">
                            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Pas d'image</p>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                          {zone.name}
                        </h3>
                        
                        {zone.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {zone.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Info className="h-3 w-3" />
                          <span>Ordre: {zone.display_order}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(zone)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                          >
                            <Edit className="h-4 w-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(zone)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingZone ? 'Modifier la zone' : 'Nouvelle zone topographique'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Région */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Région anatomique *
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Sélectionner une région</option>
                  {REGIONS.map(region => (
                    <option key={region.value} value={region.value}>
                      {region.icon} {region.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la zone *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Douleur antérieure de l'épaule"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la zone anatomique..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image topographique
                </label>
                
                {formData.image_url && (
                  <div className="mb-4 relative">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-contain bg-gray-50 rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-50 file:text-purple-700
                    hover:file:bg-purple-100
                    disabled:opacity-50"
                />
                {uploadingImage && (
                  <p className="mt-2 text-sm text-purple-600">
                    Upload en cours...
                  </p>
                )}
              </div>

              {/* Ordre d'affichage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Les zones seront affichées dans cet ordre (0 = premier)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.region || !formData.name}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}