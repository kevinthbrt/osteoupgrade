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
  Save,
  X,
  AlertCircle,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react'

const PathologyPlacer = dynamic(() => import('@/components/PathologyPlacer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement du visualisateur 3D...</p>
      </div>
    </div>
  )
})

export default function PathologyManagerPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Données
  const [zones, setZones] = useState<any[]>([])
  const [pathologies, setPathologies] = useState<any[]>([])
  const [orthopedicTests, setOrthopedicTests] = useState<any[]>([])
  const [pathologyTests, setPathologyTests] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])
  const [pathologyClusters, setPathologyClusters] = useState<any[]>([])

  // État UI
  const [selectedZone, setSelectedZone] = useState<any>(null)
  const [selectedPathology, setSelectedPathology] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showTestLinker, setShowTestLinker] = useState(false)
  const [linkerTab, setLinkerTab] = useState<'tests' | 'clusters'>('tests')
  const [formData, setFormData] = useState({
    id: '',
    zone_id: '',
    name: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    position_x: 0,
    position_y: 0,
    position_z: 0,
    size: 0.08,
    is_active: true,
    color: '#3b82f6'
  })

  useEffect(() => {
    checkAccess()
    loadData()
  }, [])

  const checkAccess = async () => {
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

    if (profileData?.role !== 'admin') {
      alert('Accès réservé aux administrateurs')
      router.push('/dashboard')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  const loadData = async () => {
    // Charger les zones
    const { data: zonesData } = await supabase
      .from('anatomical_zones')
      .select('*')
      .order('display_order')
    setZones(zonesData || [])

    // Charger les pathologies
    const { data: pathologiesData } = await supabase
      .from('pathologies')
      .select('*')
      .order('display_order')
    setPathologies(pathologiesData || [])

    // Charger les tests orthopédiques
    const { data: testsData } = await supabase
      .from('orthopedic_tests')
      .select('*')
      .order('name')
    setOrthopedicTests(testsData || [])

    // Charger les liens pathologie-tests
    const { data: linksData } = await supabase
      .from('pathology_tests')
      .select('*')
    setPathologyTests(linksData || [])

    // Charger les clusters
    const { data: clustersData } = await supabase
      .from('orthopedic_test_clusters')
      .select('*')
      .order('name')
    setClusters(clustersData || [])

    // Charger les liens pathologie-clusters
    const { data: clusterLinksData } = await supabase
      .from('pathology_clusters')
      .select('*')
    setPathologyClusters(clusterLinksData || [])
  }

  const handleZoneSelect = (zone: any) => {
    setSelectedZone(zone)
    setSelectedPathology(null)
  }

  const handlePathologySelect = (pathology: any) => {
    setSelectedPathology(pathology)
    setFormData({
      id: pathology.id,
      zone_id: pathology.zone_id,
      name: pathology.name,
      description: pathology.description || '',
      severity: pathology.severity || 'medium',
      position_x: pathology.position_x || 0,
      position_y: pathology.position_y || 0,
      position_z: pathology.position_z || 0,
      size: pathology.size || 0.08,
      is_active: pathology.is_active !== false,
      color: pathology.color || '#3b82f6'
    })
  }

  const handlePositionChange = (x: number, y: number, z: number) => {
    setFormData(prev => ({
      ...prev,
      position_x: x,
      position_y: y,
      position_z: z
    }))
  }

  const handleNewPathology = () => {
    if (!selectedZone) {
      alert('Sélectionnez d\'abord une zone')
      return
    }

    setFormData({
      id: '',
      zone_id: selectedZone.id,
      name: '',
      description: '',
      severity: 'medium',
      position_x: selectedZone.position_x,
      position_y: selectedZone.position_y,
      position_z: selectedZone.position_z,
      size: 0.08,
      is_active: true,
      color: '#3b82f6'
    })
    setSelectedPathology(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Le nom est requis')
      return
    }

    setSaving(true)

    try {
      if (formData.id) {
        // Mise à jour
        const { error } = await supabase
          .from('pathologies')
          .update({
            name: formData.name,
            description: formData.description || null,
            severity: formData.severity,
            position_x: formData.position_x,
            position_y: formData.position_y,
            position_z: formData.position_z,
            size: formData.size,
            is_active: formData.is_active,
            color: formData.color
          })
          .eq('id', formData.id)

        if (error) throw error
        alert('Pathologie mise à jour')
      } else {
        // Création
        const { error } = await supabase
          .from('pathologies')
          .insert({
            zone_id: formData.zone_id,
            name: formData.name,
            description: formData.description || null,
            severity: formData.severity,
            position_x: formData.position_x,
            position_y: formData.position_y,
            position_z: formData.position_z,
            size: formData.size,
            is_active: formData.is_active,
            display_order: pathologies.length,
            color: formData.color
          })

        if (error) throw error
        alert('Pathologie créée')
      }

      await loadData()
      setShowForm(false)
      setSelectedPathology(null)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pathologyId: string) => {
    if (!confirm('Supprimer cette pathologie ?')) return

    const { error } = await supabase
      .from('pathologies')
      .delete()
      .eq('id', pathologyId)

    if (error) {
      alert('Erreur lors de la suppression')
      return
    }

    await loadData()
    setSelectedPathology(null)
    setShowForm(false)
    alert('Pathologie supprimée')
  }

  const handleToggleActive = async (pathologyId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('pathologies')
      .update({ is_active: !currentState })
      .eq('id', pathologyId)

    if (error) {
      alert('Erreur lors de la mise à jour')
      return
    }

    await loadData()
  }

  const handleLinkTest = async (testId: string) => {
    if (!selectedPathology) return

    const existing = pathologyTests.find(
      pt => pt.pathology_id === selectedPathology.id && pt.test_id === testId
    )

    if (existing) {
      alert('Ce test est déjà lié à cette pathologie')
      return
    }

    const { error } = await supabase
      .from('pathology_tests')
      .insert({
        pathology_id: selectedPathology.id,
        test_id: testId,
        relevance_score: 8,
        recommended_order: pathologyTests.filter(pt => pt.pathology_id === selectedPathology.id).length + 1
      })

    if (error) {
      console.error('Erreur lors de la liaison:', error)
      alert('Erreur lors de la liaison: ' + error.message)
      return
    }

    await loadData()
    alert('Test lié avec succès')
  }

  const handleUnlinkTest = async (linkId: string) => {
    const { error } = await supabase
      .from('pathology_tests')
      .delete()
      .eq('id', linkId)

    if (error) {
      alert('Erreur lors de la suppression du lien')
      return
    }

    await loadData()
  }

  const handleLinkCluster = async (clusterId: string) => {
    if (!selectedPathology) return

    const existing = pathologyClusters.find(
      pc => pc.pathology_id === selectedPathology.id && pc.cluster_id === clusterId
    )

    if (existing) {
      alert('Ce cluster est déjà lié à cette pathologie')
      return
    }

    const { error } = await supabase
      .from('pathology_clusters')
      .insert({
        pathology_id: selectedPathology.id,
        cluster_id: clusterId,
        relevance_score: 8,
        recommended_order: pathologyClusters.filter(pc => pc.pathology_id === selectedPathology.id).length + 1
      })

    if (error) {
      console.error('Erreur lors de la liaison:', error)
      alert('Erreur lors de la liaison: ' + error.message)
      return
    }

    await loadData()
    alert('Cluster lié avec succès')
  }

  const handleUnlinkCluster = async (linkId: string) => {
    const { error } = await supabase
      .from('pathology_clusters')
      .delete()
      .eq('id', linkId)

    if (error) {
      alert('Erreur lors de la suppression du lien')
      return
    }

    await loadData()
  }

  const zonePathologies = selectedZone 
    ? pathologies.filter(p => p.zone_id === selectedZone.id)
    : []

  const linkedTests = selectedPathology
    ? pathologyTests
        .filter(pt => pt.pathology_id === selectedPathology.id)
        .map(pt => orthopedicTests.find(t => t.id === pt.test_id))
        .filter(Boolean)
    : []

  const linkedClusters = selectedPathology
    ? pathologyClusters
        .filter(pc => pc.pathology_id === selectedPathology.id)
        .map(pc => clusters.find(c => c.id === pc.cluster_id))
        .filter(Boolean)
    : []

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Pathologies</h1>
              <p className="text-gray-600 mt-1">
                Créez et positionnez visuellement les pathologies sur le modèle 3D
              </p>
            </div>
            {selectedZone && (
              <button
                onClick={handleNewPathology}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nouvelle Pathologie
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des zones */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Zones Anatomiques</h2>
              <p className="text-sm text-gray-600 mt-1">
                Sélectionnez une zone pour gérer ses pathologies
              </p>
            </div>
            <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
              {zones.map(zone => {
                const count = pathologies.filter(p => p.zone_id === zone.id).length
                return (
                  <button
                    key={zone.id}
                    onClick={() => handleZoneSelect(zone)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedZone?.id === zone.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{zone.display_name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {count} pathologie(s)
                        </p>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visualisateur 3D */}
          <div className="lg:col-span-2 space-y-6">
            {selectedZone ? (
              <>
                {/* Info zone */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: selectedZone.color }}>
                        {selectedZone.display_name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {zonePathologies.length} pathologie(s) configurée(s)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visualisateur 3D */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <PathologyPlacer
                    zone={selectedZone}
                    pathologies={zonePathologies}
                    selectedPathology={formData}
                    onPositionChange={handlePositionChange}
                    editMode={showForm}
                  />
                </div>

                {/* Liste des pathologies de la zone */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-900">
                      Pathologies de cette zone
                    </h3>
                  </div>
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {zonePathologies.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune pathologie configurée</p>
                        <p className="text-sm mt-2">Cliquez sur "Nouvelle Pathologie" pour commencer</p>
                      </div>
                    ) : (
                      zonePathologies.map(pathology => {
                        const testsCount = pathologyTests.filter(pt => pt.pathology_id === pathology.id).length
                        const severityColor = 
                          pathology.severity === 'high' ? 'bg-red-100 text-red-700' :
                          pathology.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'

                        return (
                          <div key={pathology.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {pathology.color && (
                                    <div 
                                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                                      style={{ backgroundColor: pathology.color }}
                                    />
                                  )}
                                  <p className="font-medium text-gray-900">{pathology.name}</p>
                                  <span className={`px-2 py-0.5 rounded text-xs ${severityColor}`}>
                                    {pathology.severity === 'high' ? 'Grave' :
                                     pathology.severity === 'medium' ? 'Modéré' : 'Léger'}
                                  </span>
                                  {!pathology.is_active && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                      Désactivée
                                    </span>
                                  )}
                                </div>
                                {pathology.description && (
                                  <p className="text-sm text-gray-600 mt-1">{pathology.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  {testsCount} test(s) lié(s)
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedPathology(pathology)
                                    setShowTestLinker(true)
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Lier aux tests/clusters"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(pathology.id, pathology.is_active)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title={pathology.is_active ? 'Désactiver' : 'Activer'}
                                >
                                  {pathology.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => {
                                    handlePathologySelect(pathology)
                                    setShowForm(true)
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(pathology.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 text-lg font-medium">
                  Sélectionnez une zone anatomique pour commencer
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Choisissez une zone dans la liste de gauche
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-primary-50 to-primary-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {formData.id ? 'Modifier la pathologie' : 'Nouvelle pathologie'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setSelectedPathology(null)
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la pathologie *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Hernie discale L4-L5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Description clinique..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sévérité
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Légère</option>
                    <option value="medium">Modérée</option>
                    <option value="high">Grave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Couleur visuelle
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position X
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.position_x}
                    onChange={(e) => setFormData(prev => ({ ...prev, position_x: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Y
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.position_y}
                    onChange={(e) => setFormData(prev => ({ ...prev, position_y: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Z
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.position_z}
                    onChange={(e) => setFormData(prev => ({ ...prev, position_z: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taille (rayon de la sphère)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Pathologie active (visible dans l'interface utilisateur)
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Astuce :</strong> Ajustez la position en modifiant les valeurs ci-dessus.
                  La sphère apparaîtra sur le modèle 3D avec la couleur choisie.
                </p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false)
                  setSelectedPathology(null)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal liaison tests & clusters */}
      {showTestLinker && selectedPathology && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Lier des tests/clusters à : {selectedPathology.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {linkedTests.length} test(s) • {linkedClusters.length} cluster(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowTestLinker(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Onglets */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setLinkerTab('tests')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    linkerTab === 'tests'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Tests individuels ({linkedTests.length})
                </button>
                <button
                  onClick={() => setLinkerTab('clusters')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    linkerTab === 'clusters'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Clusters de tests ({linkedClusters.length})
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {linkerTab === 'tests' ? (
                <div className="grid grid-cols-2 gap-6">
                  {/* Tests disponibles */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Tests disponibles</h4>
                    <div className="space-y-2">
                      {orthopedicTests.map(test => {
                        const isLinked = linkedTests.some((t: any) => t?.id === test.id)
                        return (
                          <button
                            key={test.id}
                            onClick={() => !isLinked && handleLinkTest(test.id)}
                            disabled={isLinked}
                            className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                              isLinked 
                                ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
                                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            <p className="font-medium text-sm">{test.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{test.category}</p>
                            {isLinked && (
                              <span className="text-xs text-green-600 mt-1 block">✓ Déjà lié</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tests liés */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Tests liés</h4>
                    {linkedTests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Aucun test lié</p>
                        <p className="text-sm mt-2">Cliquez sur un test à gauche pour le lier</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedTests.map((test: any) => {
                          if (!test) return null
                          const link = pathologyTests.find(
                            pt => pt.pathology_id === selectedPathology.id && pt.test_id === test.id
                          )
                          return (
                            <div 
                              key={test.id}
                              className="p-3 bg-green-50 border-2 border-green-200 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{test.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">{test.category}</p>
                                </div>
                                <button
                                  onClick={() => link && handleUnlinkTest(link.id)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                  title="Délier"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {/* Clusters disponibles */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Clusters disponibles</h4>
                    <div className="space-y-2">
                      {clusters.map(cluster => {
                        const isLinked = linkedClusters.some((c: any) => c?.id === cluster.id)
                        return (
                          <button
                            key={cluster.id}
                            onClick={() => !isLinked && handleLinkCluster(cluster.id)}
                            disabled={isLinked}
                            className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                              isLinked 
                                ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
                                : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                            }`}
                          >
                            <p className="font-medium text-sm">{cluster.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{cluster.region}</p>
                            {cluster.description && (
                              <p className="text-xs text-gray-500 mt-1">{cluster.description.substring(0, 50)}...</p>
                            )}
                            {isLinked && (
                              <span className="text-xs text-green-600 mt-1 block">✓ Déjà lié</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Clusters liés */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Clusters liés</h4>
                    {linkedClusters.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Aucun cluster lié</p>
                        <p className="text-sm mt-2">Cliquez sur un cluster à gauche pour le lier</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedClusters.map((cluster: any) => {
                          if (!cluster) return null
                          const link = pathologyClusters.find(
                            pc => pc.pathology_id === selectedPathology.id && pc.cluster_id === cluster.id
                          )
                          return (
                            <div 
                              key={cluster.id}
                              className="p-3 bg-purple-50 border-2 border-purple-200 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{cluster.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">{cluster.region}</p>
                                  {cluster.description && (
                                    <p className="text-xs text-gray-500 mt-1">{cluster.description.substring(0, 50)}...</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => link && handleUnlinkCluster(link.id)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                  title="Délier"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
