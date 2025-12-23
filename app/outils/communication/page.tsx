'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  FileText,
  Download,
  Search,
  Lock,
  Crown,
  Filter,
  Plus,
  Edit,
  Trash2,
  Upload,
  Save,
  X,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react'
import type { CommunicationDocument, CommunicationDocumentInsert } from '@/lib/types-communication'

const CATEGORIES = [
  { value: 'courrier', label: 'Courrier', icon: '📧' },
  { value: 'attestation', label: 'Attestation', icon: '📋' },
  { value: 'facture', label: 'Facture', icon: '💰' },
  { value: 'autre', label: 'Autre', icon: '📄' }
]

const ALLOWED_ROLES = ['premium_silver', 'premium_gold', 'admin']

export default function CommunicationPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [documents, setDocuments] = useState<CommunicationDocument[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Admin states
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<CommunicationDocument | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'courrier' as 'courrier' | 'attestation' | 'facture' | 'autre',
    file_url: '',
    file_name: '',
    file_size: 0,
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    checkAccess()
  }, [])

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

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    // Check if user is admin
    setIsAdmin(profile.role === 'admin')

    loadDocuments(profile.role === 'admin')
  }

  const loadDocuments = async (isAdminUser: boolean = false) => {
    try {
      let query = supabase
        .from('communication_documents')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      // Non-admin users only see active documents
      if (!isAdminUser) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/communication-document-upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'upload')
      }

      const data = await response.json()

      setFormData(prev => ({
        ...prev,
        file_url: data.url,
        file_name: data.fileName,
        file_size: data.fileSize
      }))

      alert('✅ Fichier uploadé avec succès')
    } catch (error: any) {
      console.error('Error uploading file:', error)
      alert(`❌ ${error.message}`)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSaveDocument = async () => {
    if (!formData.title || !formData.file_url) {
      alert('⚠️ Le titre et le fichier sont obligatoires')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (editingDocument) {
        // Update
        const { error } = await supabase
          .from('communication_documents')
          .update({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            file_url: formData.file_url,
            file_name: formData.file_name,
            file_size: formData.file_size,
            display_order: formData.display_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDocument.id)

        if (error) throw error
        alert('✅ Document mis à jour avec succès')
      } else {
        // Create
        const newDocument: CommunicationDocumentInsert = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          file_url: formData.file_url,
          file_name: formData.file_name,
          file_size: formData.file_size,
          display_order: formData.display_order,
          is_active: formData.is_active,
          created_by: user?.id
        }

        const { error } = await supabase
          .from('communication_documents')
          .insert([newDocument])

        if (error) throw error
        alert('✅ Document créé avec succès')
      }

      closeAdminModal()
      loadDocuments(isAdmin)
    } catch (error) {
      console.error('Error saving document:', error)
      alert('❌ Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('communication_documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('✅ Document supprimé avec succès')
      loadDocuments(isAdmin)
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  const toggleDocumentActive = async (doc: CommunicationDocument) => {
    try {
      const { error } = await supabase
        .from('communication_documents')
        .update({ is_active: !doc.is_active })
        .eq('id', doc.id)

      if (error) throw error
      loadDocuments(isAdmin)
    } catch (error) {
      console.error('Error toggling active:', error)
      alert('❌ Erreur lors de la modification')
    }
  }

  const openAdminModal = (document?: CommunicationDocument) => {
    if (document) {
      setEditingDocument(document)
      setFormData({
        title: document.title,
        description: document.description || '',
        category: document.category || 'courrier',
        file_url: document.file_url,
        file_name: document.file_name,
        file_size: document.file_size || 0,
        display_order: document.display_order,
        is_active: document.is_active
      })
    } else {
      setEditingDocument(null)
      setFormData({
        title: '',
        description: '',
        category: 'courrier',
        file_url: '',
        file_name: '',
        file_size: 0,
        display_order: 0,
        is_active: true
      })
    }
    setShowAdminModal(true)
  }

  const closeAdminModal = () => {
    setShowAdminModal(false)
    setEditingDocument(null)
  }

  const handleDownload = (doc: CommunicationDocument) => {
    window.open(doc.file_url, '_blank')
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = filterCategory ? doc.category === filterCategory : true
    const matchesSearch = searchTerm
      ? doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
    return matchesCategory && matchesSearch
  })

  // Grouper par catégorie
  const documentsByCategory = CATEGORIES.map(category => ({
    ...category,
    documents: filteredDocuments.filter(doc => doc.category === category.value)
  })).filter(cat => cat.documents.length > 0)

  if (accessDenied) {
    return (
      <AuthLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Accès Premium Requis
            </h2>
            <p className="text-blue-200 mb-6">
              Ce module est réservé aux membres Premium. Passez à un abonnement Premium pour accéder aux modèles de communication.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Voir les Abonnements
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Communication</h1>
                  <p className="text-blue-200">Modèles de courriers et documents professionnels</p>
                </div>
              </div>

              {/* Admin Button */}
              {isAdmin && (
                <button
                  onClick={() => openAdminModal()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un document
                </button>
              )}
            </div>

            {/* Admin Badge */}
            {isAdmin && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                <Shield className="w-4 h-4 text-purple-300" />
                <span className="text-purple-200 text-sm font-medium">
                  Mode Administrateur - Vous pouvez gérer tous les documents
                </span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un document..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filtre catégorie */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les catégories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Documents */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-white mt-4">Chargement...</p>
            </div>
          ) : (
            <>
              {documentsByCategory.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl">
                  <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">
                    {searchTerm || filterCategory
                      ? 'Aucun document ne correspond à votre recherche'
                      : 'Aucun document disponible pour le moment'}
                  </p>
                  {isAdmin && !searchTerm && !filterCategory && (
                    <button
                      onClick={() => openAdminModal()}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Ajouter le premier document
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {documentsByCategory.map((category) => (
                    <div key={category.value}>
                      {/* Titre de catégorie */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{category.icon}</span>
                        <h2 className="text-2xl font-bold text-white">{category.label}</h2>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                          {category.documents.length}
                        </span>
                      </div>

                      {/* Liste des documents */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all group relative ${
                              !doc.is_active && isAdmin ? 'opacity-60 border-2 border-red-500/30' : ''
                            }`}
                          >
                            {/* Admin Controls */}
                            {isAdmin && (
                              <div className="absolute top-3 right-3 flex items-center gap-2">
                                <button
                                  onClick={() => toggleDocumentActive(doc)}
                                  className={`p-2 ${
                                    doc.is_active
                                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                                      : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300'
                                  } rounded-lg transition-colors`}
                                  title={doc.is_active ? 'Désactiver' : 'Activer'}
                                >
                                  {doc.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => openAdminModal(doc)}
                                  className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                  {doc.title}
                                </h3>
                                {doc.description && (
                                  <p className="text-blue-200 text-sm line-clamp-2">
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm text-blue-300">
                                <span className="truncate">📄 {doc.file_name}</span>
                              </div>
                              {doc.file_size && doc.file_size > 0 && (
                                <div className="flex items-center gap-2 text-sm text-blue-300">
                                  <span>📊 {(doc.file_size / 1024).toFixed(2)} KB</span>
                                </div>
                              )}
                              {isAdmin && (
                                <div className="flex items-center gap-2 text-sm text-blue-300">
                                  <span>🔢 Ordre: {doc.display_order}</span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleDownload(doc)}
                              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-105"
                            >
                              <Download className="w-5 h-5" />
                              Télécharger
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Info Premium */}
          <div className="mt-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Crown className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Accès Premium
                </h3>
                <p className="text-blue-200">
                  Vous avez accès à tous les modèles de communication grâce à votre abonnement Premium.
                  Ces documents sont régulièrement mis à jour et de nouveaux modèles sont ajoutés.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingDocument ? 'Modifier le Document' : 'Nouveau Document'}
                </h2>
                <button
                  onClick={closeAdminModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Modèle de facture"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500"
                    placeholder="Description du document..."
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Upload Fichier */}
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Fichier * (Word ou PDF)
                  </label>
                  {formData.file_url ? (
                    <div className="flex items-center gap-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <FileText className="w-8 h-8 text-green-300" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{formData.file_name}</p>
                        {formData.file_size > 0 && (
                          <p className="text-green-300 text-sm">
                            {(formData.file_size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, file_url: '', file_name: '', file_size: 0 })}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full p-8 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors">
                      <input
                        type="file"
                        accept=".doc,.docx,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                        className="hidden"
                        disabled={uploadingFile}
                      />
                      <div className="text-center">
                        {uploadingFile ? (
                          <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white">Upload en cours...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
                            <p className="text-white mb-2">Cliquez pour uploader un fichier</p>
                            <p className="text-white/60 text-sm">Formats acceptés: .doc, .docx, .pdf</p>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                {/* Ordre d'affichage */}
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Actif */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-white font-medium">
                    Document actif (visible pour les utilisateurs)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={closeAdminModal}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveDocument}
                  disabled={saving || !formData.title || !formData.file_url}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
