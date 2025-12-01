'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

// Types
type AnatomicalRegion = 'cervical' | 'thoracique' | 'lombaire' | 'epaule' | 'coude' | 'poignet' | 'main' | 'hanche' | 'genou' | 'cheville' | 'pied'
type PathologySeverity = 'low' | 'medium' | 'high'

interface Pathology {
  id: string
  name: string
  description: string | null
  region: AnatomicalRegion
  severity: PathologySeverity | null
  icd_code: string | null
  is_red_flag: boolean
  red_flag_reason: string | null
  is_active: boolean
  display_order: number
}

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

const BODY_REGIONS = {
  'Tête et Cou': ['cervical'],
  'Membre Supérieur': ['epaule', 'coude', 'poignet', 'main'],
  'Tronc': ['thoracique', 'lombaire'],
  'Membre Inférieur': ['hanche', 'genou', 'cheville', 'pied']
}

export default function PathologiesSimplePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [pathologies, setPathologies] = useState<Pathology[]>([])
  const [filteredPathologies, setFilteredPathologies] = useState<Pathology[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(Object.keys(BODY_REGIONS))
  
  const [showForm, setShowForm] = useState(false)
  const [editingPathology, setEditingPathology] = useState<Pathology | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: 'cervical' as AnatomicalRegion,
    severity: 'medium' as PathologySeverity,
    icd_code: '',
    is_red_flag: false,
    red_flag_reason: '',
    is_active: true
  })

  useEffect(() => {
    checkAccess()
  }, [])

  useEffect(() => {
    filterPathologies()
  }, [searchQuery, selectedRegion, pathologies])

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
      alert('Accès réservé aux administrateurs')
      router.push('/dashboard')
      return
    }

    await loadPathologies()
  }

  const loadPathologies = async () => {
    try {
      const { data, error } = await supabase
        .from('pathologies')
        .select('*')
        .order('region', { ascending: true })
        .order('display_order', { ascending: true })

      if (error) throw error
      setPathologies(data || [])
    } catch (error) {
      console.error('Error loading pathologies:', error)
      alert('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const filterPathologies = () => {
    let filtered = [...pathologies]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.icd_code?.toLowerCase().includes(q)
      )
    }

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(p => p.region === selectedRegion)
    }

    setFilteredPathologies(filtered)
  }

  const handleNew = () => {
    setFormData({
      name: '',
      description: '',
      region: 'cervical',
      severity: 'medium',
      icd_code: '',
      is_red_flag: false,
      red_flag_reason: '',
      is_active: true
    })
    setEditingPathology(null)
    setShowForm(true)
  }

  const handleEdit = (pathology: Pathology) => {
    setFormData({
      name: pathology.name,
      description: pathology.description || '',
      region: pathology.region,
      severity: pathology.severity || 'medium',
      icd_code: pathology.icd_code || '',
      is_red_flag: pathology.is_red_flag,
      red_flag_reason: pathology.red_flag_reason || '',
      is_active: pathology.is_active
    })
    setEditingPathology(pathology)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Le nom est requis')
      return
    }

    setSaving(true)

    try {
      if (editingPathology) {
        const { error } = await supabase
          .from('pathologies')
          .update({
            name: formData.name,
            description: formData.description || null,
            region: formData.region,
            severity: formData.severity,
            icd_code: formData.icd_code || null,
            is_red_flag: formData.is_red_flag,
            red_flag_reason: formData.red_flag_reason || null,
            is_active: formData.is_active
          })
          .eq('id', editingPathology.id)

        if (error) throw error
        alert('✅ Pathologie mise à jour')
      } else {
        const { error } = await supabase
          .from('pathologies')
          .insert({
            name: formData.name,
            description: formData.description || null,
            region: formData.region,
            severity: formData.severity,
            icd_code: formData.icd_code || null,
            is_red_flag: formData.is_red_flag,
            red_flag_reason: formData.red_flag_reason || null,
            is_active: formData.is_active,
            display_order: pathologies.length
          })

        if (error) throw error
        alert('✅ Pathologie créée')
      }

      await loadPathologies()
      setShowForm(false)
      setEditingPathology(null)
    } catch (error: any) {
      console.error('Error:', error)
      alert('❌ Erreur : ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette pathologie ?')) return

    try {
      const { error } = await supabase
        .from('pathologies')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadPathologies()
      alert('✅ Pathologie supprimée')
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (pathology: Pathology) => {
    try {
      const { error } = await supabase
        .from('pathologies')
        .update({ is_active: !pathology.is_active })
        .eq('id', pathology.id)

      if (error) throw error
      await loadPathologies()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Erreur')
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const getSeverityBadge = (severity: PathologySeverity | null) => {
    if (!severity) return null
    
    const config = {
      low: { label: 'Légère', color: 'bg-green-100 text-green-700' },
      medium: { label: 'Modérée', color: 'bg-yellow-100 text-yellow-700' },
      high: { label: 'Grave', color: 'bg-red-100 text-red-700' }
    }

    const badge = config[severity]
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  const groupedPathologies = Object.entries(BODY_REGIONS).map(([category, regions]) => ({
    category,
    pathologies: filteredPathologies.filter(p => regions.includes(p.region))
  }))

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Pathologies</h1>
              <p className="text-gray-600 mt-1">
                Pathologies simplifiées pour Consultation V3
              </p>
            </div>
            <button
              onClick={handleNew}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Pathologie
            </button>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Toutes les régions</option>
              {REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {filteredPathologies.length} pathologie(s) trouvée(s)
          </div>
        </div>

        {/* Liste par catégorie */}
        <div className="space-y-4">
          {groupedPathologies.map(({ category, pathologies: catPathologies }) => {
            if (catPathologies.length === 0) return null

            const isExpanded = expandedCategories.includes(category)

            return (
              <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                      {catPathologies.length}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catPathologies.map(pathology => (
                        <div
                          key={pathology.id}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{pathology.name}</h3>
                                {pathology.is_red_flag && (
                                  <span title="Drapeau rouge">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                  {REGIONS.find(r => r.value === pathology.region)?.label}
                                </span>
                                {getSeverityBadge(pathology.severity)}
                                {!pathology.is_active && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                    Désactivée
                                  </span>
                                )}
                              </div>
                              {pathology.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                  {pathology.description}
                                </p>
                              )}
                              {pathology.icd_code && (
                                <p className="text-xs text-gray-500">Code ICD: {pathology.icd_code}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1 pt-3 border-t">
                            <button
                              onClick={() => handleToggleActive(pathology)}
                              className="p-1.5 text-gray-400 hover:text-gray-600"
                              title={pathology.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {pathology.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleEdit(pathology)}
                              className="p-1.5 text-gray-400 hover:text-blue-600"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(pathology.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPathology ? 'Modifier la pathologie' : 'Nouvelle pathologie'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la pathologie *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Tendinopathie de la coiffe des rotateurs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Description clinique..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Région anatomique *
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value as AnatomicalRegion })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {REGIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sévérité
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as PathologySeverity })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Légère</option>
                    <option value="medium">Modérée</option>
                    <option value="high">Grave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code ICD (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.icd_code}
                  onChange={(e) => setFormData({ ...formData, icd_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: M75.1"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_red_flag}
                    onChange={(e) => setFormData({ ...formData, is_red_flag: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    🚩 Drapeau rouge (urgence médicale)
                  </span>
                </label>

                {formData.is_red_flag && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Raison du drapeau rouge
                    </label>
                    <textarea
                      value={formData.red_flag_reason}
                      onChange={(e) => setFormData({ ...formData, red_flag_reason: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ex: Signes neurologiques graves nécessitant une consultation immédiate"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Pathologie active (visible dans Consultation V3)
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}