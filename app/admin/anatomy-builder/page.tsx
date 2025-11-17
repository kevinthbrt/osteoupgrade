'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import dynamic from 'next/dynamic'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Box,
  Move,
  Maximize2,
  Palette
} from 'lucide-react'

// Charger le composant 3D côté client uniquement
const AnatomyZonePlacer = dynamic(() => import('@/components/AnatomyZonePlacer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement du modèle 3D...</p>
      </div>
    </div>
  )
})

interface Zone {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  position_x: number
  position_y: number
  position_z: number
  size_x: number
  size_y: number
  size_z: number
  is_symmetric: boolean
  is_active: boolean
  display_order: number
}

export default function AnatomyBuilderPage() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // État pour la création/édition d'une zone
  const [editingZone, setEditingZone] = useState<Partial<Zone>>({
    name: '',
    display_name: '',
    description: '',
    color: '#3b82f6',
    position_x: 0,
    position_y: 0,
    position_z: 0,
    size_x: 0.2,
    size_y: 0.2,
    size_z: 0.2,
    is_symmetric: false,
    is_active: true,
    display_order: 0
  })

  useEffect(() => {
    checkAdminAndLoadZones()
  }, [])

  const checkAdminAndLoadZones = async () => {
    try {
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

      await loadZones()
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    }
  }

  const loadZones = async () => {
    try {
      const { data, error } = await supabase
        .from('anatomical_zones')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error

      setZones(data || [])
    } catch (error) {
      console.error('Error loading zones:', error)
      alert('Erreur lors du chargement des zones')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingZone({
      name: '',
      display_name: '',
      description: '',
      color: '#3b82f6',
      position_x: 0,
      position_y: 0,
      position_z: 0,
      size_x: 0.2,
      size_y: 0.2,
      size_z: 0.2,
      is_symmetric: false,
      is_active: true,
      display_order: zones.length
    })
    setShowEditor(true)
    setSelectedZone(null)
  }

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone)
    setSelectedZone(zone)
    setShowEditor(true)
  }

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ? Toutes les structures et pathologies associées seront également supprimées.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('anatomical_zones')
        .delete()
        .eq('id', zoneId)

      if (error) throw error

      await loadZones()
      alert('Zone supprimée avec succès')
    } catch (error) {
      console.error('Error deleting zone:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (zone: Zone) => {
    try {
      const { error } = await supabase
        .from('anatomical_zones')
        .update({ is_active: !zone.is_active })
        .eq('id', zone.id)

      if (error) throw error

      await loadZones()
    } catch (error) {
      console.error('Error toggling zone:', error)
      alert('Erreur lors de la modification')
    }
  }

  const handleSave = async () => {
    if (!editingZone.name || !editingZone.display_name) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (selectedZone) {
        // Update existing zone
        const { error } = await supabase
          .from('anatomical_zones')
          .update({
            ...editingZone,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedZone.id)

        if (error) throw error
      } else {
        // Create new zone
        const { error } = await supabase
          .from('anatomical_zones')
          .insert({
            ...editingZone,
            created_by: user?.id
          })

        if (error) throw error
      }

      await loadZones()
      setShowEditor(false)
      setSelectedZone(null)
      alert('Zone sauvegardée avec succès')
    } catch (error: any) {
      console.error('Error saving zone:', error)
      alert('Erreur lors de la sauvegarde: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePositionUpdate = (x: number, y: number, z: number) => {
    setEditingZone(prev => ({
      ...prev,
      position_x: x,
      position_y: y,
      position_z: z
    }))
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Box className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Anatomy Builder</h1>
              </div>
              <p className="text-purple-100">
                Créez et placez les zones anatomiques sur le modèle 3D
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Nouvelle zone</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des zones */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Zones configurées ({zones.length})
              </h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {zones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Box className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune zone créée</p>
                  <p className="text-sm mt-1">Cliquez sur "Nouvelle zone" pour commencer</p>
                </div>
              ) : (
                zones.map((zone) => (
                  <div key={zone.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: zone.color }}
                        >
                          <Box className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {zone.display_name}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {zone.name}
                          </p>
                          {zone.is_symmetric && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              Symétrique
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleToggleActive(zone)}
                          className={`p-1 rounded ${zone.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={zone.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {zone.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(zone)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Éditer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Visualisation 3D et Éditeur */}
          <div className="lg:col-span-2 space-y-6">
            {/* Modèle 3D */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Visualisation 3D
              </h2>
              <AnatomyZonePlacer
                zones={zones}
                selectedZone={editingZone as Zone}
                onPositionChange={handlePositionUpdate}
                editMode={showEditor}
              />
            </div>

            {/* Éditeur de zone */}
            {showEditor && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedZone ? 'Éditer la zone' : 'Nouvelle zone'}
                  </h2>
                  <button
                    onClick={() => setShowEditor(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nom technique */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom technique * (sans espaces)
                    </label>
                    <input
                      type="text"
                      value={editingZone.name || ''}
                      onChange={(e) => setEditingZone(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="ex: lumbar_region"
                    />
                  </div>

                  {/* Nom d'affichage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom d'affichage *
                    </label>
                    <input
                      type="text"
                      value={editingZone.display_name || ''}
                      onChange={(e) => setEditingZone(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="ex: Région Lombaire"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingZone.description || ''}
                      onChange={(e) => setEditingZone(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Description de la zone anatomique"
                    />
                  </div>

                  {/* Couleur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Palette className="inline h-4 w-4 mr-1" />
                      Couleur
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingZone.color || '#3b82f6'}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, color: e.target.value }))}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingZone.color || '#3b82f6'}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  {/* Position */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Move className="inline h-4 w-4 mr-1" />
                        Position X
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingZone.position_x || 0}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, position_x: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position Y
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingZone.position_y || 0}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, position_y: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position Z
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingZone.position_z || 0}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, position_z: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Taille */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Maximize2 className="inline h-4 w-4 mr-1" />
                        Taille X
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingZone.size_x || 0.2}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, size_x: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taille Y
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingZone.size_y || 0.2}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, size_y: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taille Z
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingZone.size_z || 0.2}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, size_z: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingZone.is_symmetric || false}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, is_symmetric: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Zone symétrique (G/D)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingZone.is_active !== false}
                        onChange={(e) => setEditingZone(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Save className="h-5 w-5" />
                      <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                    <button
                      onClick={() => setShowEditor(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
