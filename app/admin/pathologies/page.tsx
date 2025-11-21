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
  Palette,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

// Composant 3D pour structures (chargement dynamique)
const StructurePlacer = dynamic(() => import('@/components/StructurePlacer'), {
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

// Types de structures disponibles
const STRUCTURE_TYPES = [
  { value: 'musculaire', label: 'Musculaire', color: '#ef4444', icon: '💪' },
  { value: 'osseuse', label: 'Osseuse', color: '#f59e0b', icon: '🦴' },
  { value: 'articulaire', label: 'Articulaire', color: '#3b82f6', icon: '🔵' },
  { value: 'neuro', label: 'Neurologique', color: '#8b5cf6', icon: '⚡' },
  { value: 'vasculaire', label: 'Vasculaire', color: '#ec4899', icon: '💓' },
  { value: 'ligamentaire', label: 'Ligamentaire', color: '#10b981', icon: '🔗' },
  { value: 'cutanée', label: 'Cutanée', color: '#6366f1', icon: '🎨' }
]

export default function UnifiedPathologyManagerPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Données
  const [zones, setZones] = useState<any[]>([])
  const [structures, setStructures] = useState<any[]>([])
  const [pathologies, setPathologies] = useState<any[]>([])
  const [orthopedicTests, setOrthopedicTests] = useState<any[]>([])
  const [pathologyTests, setPathologyTests] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])
  const [pathologyClusters, setPathologyClusters] = useState<any[]>([])

  // État UI - Navigation
  const [selectedZone, setSelectedZone] = useState<any>(null)
  const [selectedStructure, setSelectedStructure] = useState<any>(null)
  const [selectedPathology, setSelectedPathology] = useState<any>(null)
  
  // État UI - Formulaires
  const [showStructureForm, setShowStructureForm] = useState(false)
  const [showPathologyForm, setShowPathologyForm] = useState(false)
  const [showTestLinker, setShowTestLinker] = useState(false)
  const [linkerTab, setLinkerTab] = useState<'tests' | 'clusters'>('tests')
  
  // État UI - Expansion
  const [expandedStructures, setExpandedStructures] = useState<Set<string>>(new Set())

  // Formulaire structure
  const [structureFormData, setStructureFormData] = useState({
    id: '',
    zone_id: '',
    name: '',
    type: 'musculaire' as any,
    description: '',
    color: '#ef4444',
    position_x: 0,
    position_y: 0,
    position_z: 0,
    size: 0.08,
    is_active: true
  })

  // Formulaire pathologie
  const [pathologyFormData, setPathologyFormData] = useState({
    id: '',
    structure_id: '',
    name: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    icd_code: '',
    is_active: true
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

    // Charger les structures
    const { data: structuresData } = await supabase
      .from('structures')
      .select('*')
      .order('display_order')
    setStructures(structuresData || [])

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

  // ========================================
  // GESTION DES ZONES
  // ========================================

  const handleZoneSelect = (zone: any) => {
    setSelectedZone(zone)
    setSelectedStructure(null)
    setSelectedPathology(null)
    setShowStructureForm(false)
    setShowPathologyForm(false)
  }

  // ========================================
  // GESTION DES STRUCTURES
  // ========================================

  const handleNewStructure = () => {
    if (!selectedZone) {
      alert('Sélectionnez d\'abord une zone')
      return
    }

    const defaultType = STRUCTURE_TYPES[0]
    setStructureFormData({
      id: '',
      zone_id: selectedZone.id,
      name: '',
      type: defaultType.value,
      description: '',
      color: defaultType.color,
      position_x: selectedZone.position_x,
      position_y: selectedZone.position_y,
      position_z: selectedZone.position_z,
      size: 0.08,
      is_active: true
    })
    setSelectedStructure(null)
    setSelectedPathology(null)
    setShowStructureForm(true)
    setShowPathologyForm(false)
  }

  const handleStructureSelect = (structure: any) => {
    setSelectedStructure(structure)
    setSelectedPathology(null)
    setStructureFormData({
      id: structure.id,
      zone_id: structure.zone_id,
      name: structure.name,
      type: structure.type,
      description: structure.description || '',
      color: structure.color || STRUCTURE_TYPES.find(t => t.value === structure.type)?.color || '#3b82f6',
      position_x: structure.position_x,
      position_y: structure.position_y,
      position_z: structure.position_z,
      size: structure.size || 0.08,
      is_active: structure.is_active !== false
    })
    setShowStructureForm(true)
    setShowPathologyForm(false)
  }

  const handleStructurePositionChange = (x: number, y: number, z: number) => {
    setStructureFormData(prev => ({
      ...prev,
      position_x: x,
      position_y: y,
      position_z: z
    }))
  }

  const handleStructureTypeChange = (type: string) => {
    const typeInfo = STRUCTURE_TYPES.find(t => t.value === type)
    setStructureFormData(prev => ({
      ...prev,
      type: type as any,
      color: typeInfo?.color || prev.color
    }))
  }

  const handleSaveStructure = async () => {
    if (!structureFormData.name.trim()) {
      alert('Le nom est requis')
      return
    }

    setSaving(true)

    try {
      if (structureFormData.id) {
        // Mise à jour
        const { error } = await supabase
          .from('structures')
          .update({
            name: structureFormData.name,
            type: structureFormData.type,
            description: structureFormData.description || null,
            color: structureFormData.color,
            position_x: structureFormData.position_x,
            position_y: structureFormData.position_y,
            position_z: structureFormData.position_z,
            size: structureFormData.size,
            is_active: structureFormData.is_active
          })
          .eq('id', structureFormData.id)

        if (error) throw error
        alert('Structure mise à jour')
      } else {
        // Création
        const { error } = await supabase
          .from('structures')
          .insert({
            zone_id: structureFormData.zone_id,
            name: structureFormData.name,
            type: structureFormData.type,
            description: structureFormData.description || null,
            color: structureFormData.color,
            position_x: structureFormData.position_x,
            position_y: structureFormData.position_y,
            position_z: structureFormData.position_z,
            size: structureFormData.size,
            is_active: structureFormData.is_active,
            display_order: structures.length
          })

        if (error) throw error
        alert('Structure créée')
      }

      await loadData()
      setShowStructureForm(false)
      setSelectedStructure(null)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStructure = async (structureId: string) => {
    if (!confirm('Supprimer cette structure ? Toutes les pathologies associées seront également supprimées.')) return

    const { error } = await supabase
      .from('structures')
      .delete()
      .eq('id', structureId)

    if (error) {
      alert('Erreur lors de la suppression')
      return
    }

    await loadData()
    setSelectedStructure(null)
    setShowStructureForm(false)
    alert('Structure supprimée')
  }

  const toggleStructureExpansion = (structureId: string) => {
    const newExpanded = new Set(expandedStructures)
    if (newExpanded.has(structureId)) {
      newExpanded.delete(structureId)
    } else {
      newExpanded.add(structureId)
    }
    setExpandedStructures(newExpanded)
  }

  // ========================================
  // GESTION DES PATHOLOGIES
  // ========================================

  const handleNewPathology = (structure: any) => {
    if (!structure) {
      alert('Sélectionnez d\'abord une structure')
      return
    }

    setPathologyFormData({
      id: '',
      structure_id: structure.id,
      name: '',
      description: '',
      severity: 'medium',
      icd_code: '',
      is_active: true
    })
    setSelectedPathology(null)
    setShowPathologyForm(true)
    setShowStructureForm(false)
  }

  const handlePathologySelect = (pathology: any) => {
    setSelectedPathology(pathology)
    setPathologyFormData({
      id: pathology.id,
      structure_id: pathology.structure_id,
      name: pathology.name,
      description: pathology.description || '',
      severity: pathology.severity || 'medium',
      icd_code: pathology.icd_code || '',
      is_active: pathology.is_active !== false
    })
    setShowPathologyForm(true)
    setShowStructureForm(false)
  }

  const handleSavePathology = async () => {
    if (!pathologyFormData.name.trim()) {
      alert('Le nom est requis')
      return
    }

    setSaving(true)

    try {
      if (pathologyFormData.id) {
        // Mise à jour
        const { error } = await supabase
          .from('pathologies')
          .update({
            name: pathologyFormData.name,
            description: pathologyFormData.description || null,
            severity: pathologyFormData.severity,
            icd_code: pathologyFormData.icd_code || null,
            is_active: pathologyFormData.is_active
          })
          .eq('id', pathologyFormData.id)

        if (error) throw error
        alert('Pathologie mise à jour')
      } else {
        // Création
        const { error } = await supabase
          .from('pathologies')
          .insert({
            structure_id: pathologyFormData.structure_id,
            name: pathologyFormData.name,
            description: pathologyFormData.description || null,
            severity: pathologyFormData.severity,
            icd_code: pathologyFormData.icd_code || null,
            is_active: pathologyFormData.is_active,
            display_order: pathologies.length
          })

        if (error) throw error
        alert('Pathologie créée')
      }

      await loadData()
      setShowPathologyForm(false)
      setSelectedPathology(null)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePathology = async (pathologyId: string) => {
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
    setShowPathologyForm(false)
    alert('Pathologie supprimée')
  }

  const handleTogglePathologyActive = async (pathologyId: string, currentState: boolean) => {
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

  // ========================================
  // GESTION DES LIENS TESTS/CLUSTERS
  // ========================================

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
      alert('Erreur lors de la liaison')
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
      alert('Erreur lors de la liaison')
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

  // ========================================
  // CALCULS ET FILTRES
  // ========================================

  const zoneStructures = selectedZone 
    ? structures.filter(s => s.zone_id === selectedZone.id)
    : []

  const structurePathologies = (structureId: string) =>
    pathologies.filter(p => p.structure_id === structureId)

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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Structures & Pathologies</h1>
              <p className="text-gray-600 mt-1">
                Créez des structures anatomiques positionnées en 3D, puis ajoutez-y des pathologies
              </p>
            </div>
            {selectedZone && (
              <button
                onClick={handleNewStructure}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nouvelle Structure
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
                Sélectionnez une zone pour gérer ses structures
              </p>
            </div>
            <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
              {zones.map(zone => {
                const count = structures.filter(s => s.zone_id === zone.id).length
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
                          {count} structure(s)
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

          {/* Visualisateur 3D et Formulaires */}
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
                        {zoneStructures.length} structure(s) • {pathologies.filter(p => structures.find(s => s.id === p.structure_id && s.zone_id === selectedZone.id)).length} pathologie(s)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visualisateur 3D */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <StructurePlacer
                    zone={selectedZone}
                    structures={zoneStructures.map(s => ({
                      ...s,
                      pathology_count: structurePathologies(s.id).length
                    }))}
                    selectedStructure={showStructureForm ? structureFormData : null}
                    onPositionChange={handleStructurePositionChange}
                    onStructureSelect={handleStructureSelect}
                    editMode={showStructureForm}
                  />
                </div>

                {/* Formulaire structure - EN DESSOUS du 3D */}
                {showStructureForm && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {structureFormData.id ? 'Modifier la structure' : 'Nouvelle structure'}
                      </h2>
                      <button
                        onClick={() => {
                          setShowStructureForm(false)
                          setSelectedStructure(null)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom de la structure *
                        </label>
                        <input
                          type="text"
                          value={structureFormData.name}
                          onChange={(e) => setStructureFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ex: Muscle trapèze supérieur"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type de structure *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {STRUCTURE_TYPES.map(type => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => handleStructureTypeChange(type.value)}
                              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                structureFormData.type === type.value
                                  ? 'border-current'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              style={{
                                color: structureFormData.type === type.value ? type.color : '#374151',
                                backgroundColor: structureFormData.type === type.value ? `${type.color}15` : 'white'
                              }}
                            >
                              <span className="mr-1">{type.icon}</span>
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={structureFormData.description}
                          onChange={(e) => setStructureFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Description anatomique..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Couleur visuelle
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={structureFormData.color}
                              onChange={(e) => setStructureFormData(prev => ({ ...prev, color: e.target.value }))}
                              className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={structureFormData.color}
                              onChange={(e) => setStructureFormData(prev => ({ ...prev, color: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                            value={structureFormData.size}
                            onChange={(e) => setStructureFormData(prev => ({ ...prev, size: parseFloat(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
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
                            value={structureFormData.position_x}
                            onChange={(e) => setStructureFormData(prev => ({ ...prev, position_x: parseFloat(e.target.value) }))}
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
                            value={structureFormData.position_y}
                            onChange={(e) => setStructureFormData(prev => ({ ...prev, position_y: parseFloat(e.target.value) }))}
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
                            value={structureFormData.position_z}
                            onChange={(e) => setStructureFormData(prev => ({ ...prev, position_z: parseFloat(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="structure_active"
                          checked={structureFormData.is_active}
                          onChange={(e) => setStructureFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="structure_active" className="ml-2 text-sm text-gray-700">
                          Structure active (visible dans l'interface utilisateur)
                        </label>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Astuce :</strong> Utilisez le visualisateur 3D ci-dessus pour positionner visuellement la structure !
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <button
                          onClick={handleSaveStructure}
                          disabled={saving}
                          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <Save className="h-5 w-5" />
                          <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowStructureForm(false)
                            setSelectedStructure(null)
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulaire pathologie */}
                {showPathologyForm &&  (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {pathologyFormData.id ? 'Modifier la pathologie' : 'Nouvelle pathologie'}
                      </h2>
                      <button
                        onClick={() => {
                          setShowPathologyForm(false)
                          setSelectedPathology(null)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom de la pathologie *
                        </label>
                        <input
                          type="text"
                          value={pathologyFormData.name}
                          onChange={(e) => setPathologyFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ex: Tendinopathie"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={pathologyFormData.description}
                          onChange={(e) => setPathologyFormData(prev => ({ ...prev, description: e.target.value }))}
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
                            value={pathologyFormData.severity}
                            onChange={(e) => setPathologyFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="low">Légère</option>
                            <option value="medium">Modérée</option>
                            <option value="high">Grave</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code ICD (optionnel)
                          </label>
                          <input
                            type="text"
                            value={pathologyFormData.icd_code}
                            onChange={(e) => setPathologyFormData(prev => ({ ...prev, icd_code: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Ex: M75.1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pathology_active"
                          checked={pathologyFormData.is_active}
                          onChange={(e) => setPathologyFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="pathology_active" className="ml-2 text-sm text-gray-700">
                          Pathologie active (visible dans l'interface utilisateur)
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <button
                          onClick={handleSavePathology}
                          disabled={saving}
                          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <Save className="h-5 w-5" />
                          <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowPathologyForm(false)
                            setSelectedPathology(null)
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liste des structures et leurs pathologies - SEULEMENT SI PAS DE FORMULAIRE */}
                {!showStructureForm && !showPathologyForm && (
                  <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900">
                        Structures et pathologies
                      </h3>
                    </div>
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                      {zoneStructures.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>Aucune structure configurée</p>
                          <p className="text-sm mt-2">Cliquez sur "Nouvelle Structure" pour commencer</p>
                        </div>
                      ) : (
                        zoneStructures.map(structure => {
                          const pathologiesList = structurePathologies(structure.id)
                          const isExpanded = expandedStructures.has(structure.id)
                          const typeInfo = STRUCTURE_TYPES.find(t => t.value === structure.type)

                          return (
                            <div key={structure.id} className="border-b last:border-b-0">
                              {/* En-tête structure */}
                              <div className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 flex items-start gap-3">
                                    <button
                                      onClick={() => toggleStructureExpansion(structure.id)}
                                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-gray-600" />
                                      ) : (
                                        <ChevronRight className="h-5 w-5 text-gray-600" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 rounded-full border-2 border-gray-300"
                                          style={{ backgroundColor: structure.color }}
                                        />
                                        <p className="font-medium text-gray-900">{structure.name}</p>
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                          {typeInfo?.icon} {typeInfo?.label}
                                        </span>
                                        {!structure.is_active && (
                                          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                            Désactivée
                                          </span>
                                        )}
                                      </div>
                                      {structure.description && (
                                        <p className="text-sm text-gray-600 mt-1">{structure.description}</p>
                                      )}
                                      <p className="text-xs text-gray-500 mt-2">
                                        {pathologiesList.length} pathologie(s)
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleNewPathology(structure)}
                                      className="p-1 text-gray-400 hover:text-green-600"
                                      title="Ajouter pathologie"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleStructureSelect(structure)}
                                      className="p-1 text-gray-400 hover:text-blue-600"
                                      title="Modifier"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStructure(structure.id)}
                                      className="p-1 text-gray-400 hover:text-red-600"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Liste des pathologies (si expanded) */}
                              {isExpanded && (
                                <div className="pl-12 pr-4 pb-4 space-y-2">
                                  {pathologiesList.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">
                                      Aucune pathologie. Cliquez sur + pour en ajouter une.
                                    </p>
                                  ) : (
                                    pathologiesList.map(pathology => {
                                      const testsCount = pathologyTests.filter(pt => pt.pathology_id === pathology.id).length
                                      const severityColor = 
                                        pathology.severity === 'high' ? 'bg-red-100 text-red-700' :
                                        pathology.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'

                                      return (
                                        <div 
                                          key={pathology.id}
                                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 text-sm">{pathology.name}</p>
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
                                                onClick={() => handleTogglePathologyActive(pathology.id, pathology.is_active)}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                                title={pathology.is_active ? 'Désactiver' : 'Activer'}
                                              >
                                                {pathology.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                              </button>
                                              <button
                                                onClick={() => handlePathologySelect(pathology)}
                                                className="p-1 text-gray-400 hover:text-blue-600"
                                                title="Modifier"
                                              >
                                                <Edit className="h-4 w-4" />
                                              </button>
                                              <button
                                                onClick={() => handleDeletePathology(pathology.id)}
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
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
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