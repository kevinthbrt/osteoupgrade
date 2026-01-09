'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import QuizManager from '@/app/elearning/components/QuizManager'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Video,
  Image as ImageIcon,
  FileText,
  Upload,
  Edit3,
  Layers,
  GripVertical
} from 'lucide-react'
import {
  getCaseById,
  updateCase,
  getCaseChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  getChapterModules,
  createModule,
  updateModule,
  deleteModule,
  type ClinicalCase,
  type ClinicalCaseChapter,
  type ClinicalCaseModule
} from '@/lib/clinical-cases-api'

type ChapterWithModules = ClinicalCaseChapter & {
  modules: ClinicalCaseModule[]
}

export default function EditCasePage() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null)
  const [chapters, setChapters] = useState<ChapterWithModules[]>([])
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({})
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  const [editingCaseInfo, setEditingCaseInfo] = useState(false)
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [showAddModule, setShowAddModule] = useState<string | null>(null)
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [managingQuiz, setManagingQuiz] = useState<string | null>(null)

  const [newChapter, setNewChapter] = useState({ title: '', description: '' })
  const [newModule, setNewModule] = useState({
    title: '',
    content_type: 'text' as 'video' | 'image' | 'text' | 'mixed',
    vimeo_url: '',
    image_url: '',
    description_html: '',
    duration_minutes: 10
  })

  const [editChapterData, setEditChapterData] = useState<Partial<ClinicalCaseChapter>>({})
  const [editModuleData, setEditModuleData] = useState<Partial<ClinicalCaseModule>>({})

  useEffect(() => {
    loadData()
  }, [caseId])

  const loadData = async () => {
    try {
      const caseData = await getCaseById(caseId)
      if (!caseData) {
        setError('Cas introuvable')
        setLoading(false)
        return
      }

      setClinicalCase(caseData)

      const chaptersData = await getCaseChapters(caseId)
      const chaptersWithModules = await Promise.all(
        chaptersData.map(async (chapter) => {
          const modules = await getChapterModules(chapter.id)
          return { ...chapter, modules }
        })
      )

      setChapters(chaptersWithModules)

      // Expand first chapter by default
      if (chaptersWithModules.length > 0) {
        setExpandedChapters({ [chaptersWithModules[0].id]: true })
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCase = async () => {
    if (!clinicalCase) return

    setSaving(true)
    setError('')

    try {
      const success = await updateCase(caseId, clinicalCase)
      if (success) {
        setSuccess('Cas mis à jour !')
        setEditingCaseInfo(false)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Erreur lors de la mise à jour')
      }
    } catch (err) {
      console.error('Error updating case:', err)
      setError('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateChapter = async () => {
    if (!newChapter.title) {
      setError('Le titre du chapitre est requis')
      return
    }

    setSaving(true)
    setError('')

    try {
      const created = await createChapter({
        case_id: caseId,
        title: newChapter.title,
        description: newChapter.description,
        order_index: chapters.length
      })

      if (created) {
        setSuccess('Chapitre créé !')
        setNewChapter({ title: '', description: '' })
        setShowAddChapter(false)
        await loadData()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Error creating chapter:', err)
      setError('Erreur lors de la création du chapitre')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateChapter = async (chapterId: string) => {
    if (!editChapterData.title) {
      setError('Le titre est requis')
      return
    }

    setSaving(true)
    setError('')

    try {
      const success = await updateChapter(chapterId, editChapterData)
      if (success) {
        setSuccess('Chapitre mis à jour !')
        setEditingChapter(null)
        await loadData()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Error updating chapter:', err)
      setError('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Supprimer ce chapitre et tous ses modules ? Cette action est irréversible.')) return

    setSaving(true)
    const success = await deleteChapter(chapterId)
    setSaving(false)

    if (success) {
      setSuccess('Chapitre supprimé')
      await loadData()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('Erreur lors de la suppression')
    }
  }

  const handleCreateModule = async (chapterId: string) => {
    if (!newModule.title) {
      setError('Le titre du module est requis')
      return
    }

    setSaving(true)
    setError('')

    try {
      const chapter = chapters.find(c => c.id === chapterId)
      if (!chapter) return

      const created = await createModule({
        chapter_id: chapterId,
        title: newModule.title,
        content_type: newModule.content_type,
        vimeo_url: newModule.vimeo_url || undefined,
        image_url: newModule.image_url || undefined,
        description_html: newModule.description_html || undefined,
        order_index: chapter.modules.length,
        duration_minutes: newModule.duration_minutes
      })

      if (created) {
        setSuccess('Module créé !')
        setNewModule({
          title: '',
          content_type: 'text',
          vimeo_url: '',
          image_url: '',
          description_html: '',
          duration_minutes: 10
        })
        setShowAddModule(null)
        await loadData()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Error creating module:', err)
      setError('Erreur lors de la création du module')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateModule = async (moduleId: string) => {
    if (!editModuleData.title) {
      setError('Le titre est requis')
      return
    }

    setSaving(true)
    setError('')

    try {
      const success = await updateModule(moduleId, editModuleData)
      if (success) {
        setSuccess('Module mis à jour !')
        setEditingModule(null)
        await loadData()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Error updating module:', err)
      setError('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Supprimer ce module ? Cette action est irréversible.')) return

    setSaving(true)
    const success = await deleteModule(moduleId)
    setSaving(false)

    if (success) {
      setSuccess('Module supprimé')
      await loadData()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('Erreur lors de la suppression')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'case' | 'module') => {
    const file = e.target.files?.[0]
    if (!file) return

    setSaving(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `cases/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath)

      if (type === 'case') {
        setClinicalCase(prev => prev ? { ...prev, photo_url: publicUrl } : null)
      } else {
        setNewModule(prev => ({ ...prev, image_url: publicUrl }))
      }

      setSuccess('Image uploadée !')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError('Erreur lors de l\'upload')
    } finally {
      setSaving(false)
    }
  }

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }))
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (!clinicalCase) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Cas introuvable</h2>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen pb-12">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 text-white rounded-3xl p-8 mb-8 shadow-2xl">
          <button
            onClick={() => router.push('/encyclopedia/learning/cases')}
            className="text-sm text-amber-100 hover:text-white mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux cas
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Éditeur de cas clinique</h1>
              <p className="text-amber-100 mb-4">{clinicalCase.title}</p>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-white/20 rounded-lg">
                  <span className="font-semibold">{chapters.length} chapitres</span>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-lg">
                  <span className="font-semibold">
                    {chapters.reduce((sum, c) => sum + c.modules.length, 0)} modules
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/encyclopedia/learning/cases/${caseId}`)}
              className="px-4 py-2 bg-white text-amber-700 rounded-lg font-semibold hover:bg-amber-50 flex items-center gap-2"
            >
              <Eye className="h-5 w-5" />
              Prévisualiser
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">{success}</p>
          </div>
        )}

        {/* Case Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Informations du cas</h2>
            {!editingCaseInfo ? (
              <button
                onClick={() => setEditingCaseInfo(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCaseInfo(false)}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateCase}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Sauvegarder
                </button>
              </div>
            )}
          </div>

          {editingCaseInfo ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Titre</label>
                <input
                  type="text"
                  value={clinicalCase.title}
                  onChange={(e) => setClinicalCase({ ...clinicalCase, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={clinicalCase.description || ''}
                  onChange={(e) => setClinicalCase({ ...clinicalCase, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Région</label>
                  <select
                    value={clinicalCase.region}
                    onChange={(e) => setClinicalCase({ ...clinicalCase, region: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="cervical">Cervical</option>
                    <option value="thoracique">Thoracique</option>
                    <option value="lombaire">Lombaire</option>
                    <option value="epaule">Épaule</option>
                    <option value="genou">Genou</option>
                    <option value="hanche">Hanche</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Difficulté</label>
                  <select
                    value={clinicalCase.difficulty}
                    onChange={(e) => setClinicalCase({ ...clinicalCase, difficulty: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="débutant">🌱 Débutant</option>
                    <option value="intermédiaire">🔥 Intermédiaire</option>
                    <option value="avancé">⚡ Avancé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Durée (min)</label>
                  <input
                    type="number"
                    value={clinicalCase.duration_minutes}
                    onChange={(e) => setClinicalCase({ ...clinicalCase, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clinicalCase.is_free_access}
                    onChange={(e) => setClinicalCase({ ...clinicalCase, is_free_access: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium text-slate-700">Accès gratuit</span>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{clinicalCase.title}</h3>
              <p className="text-slate-600 mb-2">{clinicalCase.description}</p>
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                  {clinicalCase.region}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {clinicalCase.difficulty}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  {clinicalCase.duration_minutes} min
                </span>
                {clinicalCase.is_free_access && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                    Gratuit
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chapters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Chapitres et Modules</h2>
            <button
              onClick={() => setShowAddChapter(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Ajouter un chapitre
            </button>
          </div>

          {/* Add Chapter Form */}
          {showAddChapter && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-slate-900 mb-3">Nouveau chapitre</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Titre du chapitre"
                />
                <textarea
                  value={newChapter.description}
                  onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={2}
                  placeholder="Description (optionnel)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddChapter(false)}
                    className="px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateChapter}
                    disabled={saving}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chapters List */}
          <div className="space-y-3">
            {chapters.map((chapter, idx) => (
              <div key={chapter.id} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="flex items-center gap-3 flex-1"
                  >
                    {expandedChapters[chapter.id] ? (
                      <ChevronDown className="h-5 w-5 text-slate-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-600" />
                    )}
                    <GripVertical className="h-5 w-5 text-slate-400" />
                    <span className="font-bold text-amber-600">Chapitre {idx + 1}</span>
                    <span className="font-semibold text-slate-900">{chapter.title}</span>
                    <span className="text-sm text-slate-500">({chapter.modules.length} modules)</span>
                  </button>
                  <div className="flex gap-2">
                    {editingChapter !== chapter.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingChapter(chapter.id)
                          setEditChapterData(chapter)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteChapter(chapter.id)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Edit Chapter Form */}
                {editingChapter === chapter.id && (
                  <div className="bg-blue-50 border-t-2 border-blue-200 p-4">
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editChapterData.title || ''}
                        onChange={(e) => setEditChapterData({ ...editChapterData, title: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                        placeholder="Titre"
                      />
                      <textarea
                        value={editChapterData.description || ''}
                        onChange={(e) => setEditChapterData({ ...editChapterData, description: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                        rows={2}
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingChapter(null)}
                          className="px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleUpdateChapter(chapter.id)}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                        >
                          Sauvegarder
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {expandedChapters[chapter.id] && (
                  <div className="p-4">
                    {/* Add Module Button */}
                    {showAddModule !== chapter.id ? (
                      <button
                        onClick={() => setShowAddModule(chapter.id)}
                        className="w-full px-4 py-3 border-2 border-dashed border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 flex items-center justify-center gap-2 mb-4"
                      >
                        <Plus className="h-5 w-5" />
                        Ajouter un module
                      </button>
                    ) : (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Nouveau module</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newModule.title}
                            onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                            placeholder="Titre du module"
                          />
                          <select
                            value={newModule.content_type}
                            onChange={(e) => setNewModule({ ...newModule, content_type: e.target.value as any })}
                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                          >
                            <option value="text">📝 Texte</option>
                            <option value="video">🎥 Vidéo</option>
                            <option value="image">🖼️ Image</option>
                            <option value="mixed">🔀 Mixte (vidéo + texte)</option>
                          </select>
                          {(newModule.content_type === 'video' || newModule.content_type === 'mixed') && (
                            <input
                              type="text"
                              value={newModule.vimeo_url}
                              onChange={(e) => setNewModule({ ...newModule, vimeo_url: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                              placeholder="URL Vimeo"
                            />
                          )}
                          {(newModule.content_type === 'image' || newModule.content_type === 'mixed') && (
                            <div>
                              <input
                                type="text"
                                value={newModule.image_url}
                                onChange={(e) => setNewModule({ ...newModule, image_url: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg mb-2"
                                placeholder="URL Image"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'module')}
                                className="text-sm"
                              />
                            </div>
                          )}
                          <textarea
                            value={newModule.description_html}
                            onChange={(e) => setNewModule({ ...newModule, description_html: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                            rows={4}
                            placeholder="Description HTML (optionnel)"
                          />
                          <input
                            type="number"
                            value={newModule.duration_minutes}
                            onChange={(e) => setNewModule({ ...newModule, duration_minutes: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                            placeholder="Durée en minutes"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowAddModule(null)}
                              className="px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => handleCreateModule(chapter.id)}
                              disabled={saving}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer le module'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modules List */}
                    <div className="space-y-2">
                      {chapter.modules.map((module) => (
                        <div key={module.id} className="border-2 border-slate-200 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-3 bg-slate-50">
                            <button
                              onClick={() => toggleModule(module.id)}
                              className="flex items-center gap-3 flex-1"
                            >
                              {expandedModules[module.id] ? (
                                <ChevronDown className="h-4 w-4 text-slate-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-600" />
                              )}
                              {module.content_type === 'video' && <Video className="h-5 w-5 text-blue-600" />}
                              {module.content_type === 'image' && <ImageIcon className="h-5 w-5 text-green-600" />}
                              {module.content_type === 'text' && <FileText className="h-5 w-5 text-slate-600" />}
                              {module.content_type === 'mixed' && <Layers className="h-5 w-5 text-purple-600" />}
                              <span className="font-medium text-slate-900">{module.title}</span>
                              <span className="text-sm text-slate-500">({module.duration_minutes} min)</span>
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setManagingQuiz(managingQuiz === module.id ? null : module.id)
                                }}
                                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-semibold"
                              >
                                Quiz
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingModule(module.id)
                                  setEditModuleData(module)
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteModule(module.id)
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Quiz Manager */}
                          {managingQuiz === module.id && (
                            <div className="border-t-2 border-purple-200 bg-purple-50 p-4">
                              <QuizManager
                                subpartId={module.id}
                                subpartTitle={module.title}
                                onClose={() => setManagingQuiz(null)}
                                onSave={() => {
                                  setSuccess('Quiz sauvegardé !')
                                  setManagingQuiz(null)
                                  loadData()
                                  setTimeout(() => setSuccess(''), 3000)
                                }}
                              />
                            </div>
                          )}

                          {/* Edit Module Form */}
                          {editingModule === module.id && expandedModules[module.id] && (
                            <div className="border-t-2 border-blue-200 bg-blue-50 p-4">
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editModuleData.title || ''}
                                  onChange={(e) => setEditModuleData({ ...editModuleData, title: e.target.value })}
                                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                                  placeholder="Titre"
                                />
                                <select
                                  value={editModuleData.content_type || 'text'}
                                  onChange={(e) => setEditModuleData({ ...editModuleData, content_type: e.target.value as any })}
                                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                                >
                                  <option value="text">📝 Texte</option>
                                  <option value="video">🎥 Vidéo</option>
                                  <option value="image">🖼️ Image</option>
                                  <option value="mixed">🔀 Mixte</option>
                                </select>
                                {(editModuleData.content_type === 'video' || editModuleData.content_type === 'mixed') && (
                                  <input
                                    type="text"
                                    value={editModuleData.vimeo_url || ''}
                                    onChange={(e) => setEditModuleData({ ...editModuleData, vimeo_url: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                                    placeholder="URL Vimeo"
                                  />
                                )}
                                {(editModuleData.content_type === 'image' || editModuleData.content_type === 'mixed') && (
                                  <input
                                    type="text"
                                    value={editModuleData.image_url || ''}
                                    onChange={(e) => setEditModuleData({ ...editModuleData, image_url: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                                    placeholder="URL Image"
                                  />
                                )}
                                <textarea
                                  value={editModuleData.description_html || ''}
                                  onChange={(e) => setEditModuleData({ ...editModuleData, description_html: e.target.value })}
                                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                                  rows={4}
                                  placeholder="Description HTML"
                                />
                                <input
                                  type="number"
                                  value={editModuleData.duration_minutes || 10}
                                  onChange={(e) => setEditModuleData({ ...editModuleData, duration_minutes: parseInt(e.target.value) })}
                                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg"
                                  placeholder="Durée (minutes)"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingModule(null)}
                                    className="px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => handleUpdateModule(module.id)}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                                  >
                                    Sauvegarder
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {chapters.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Layers className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p>Aucun chapitre. Commencez par en créer un !</p>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
