'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Clock3,
  GraduationCap,
  Layers,
  ListChecks,
  PlayCircle,
  Plus,
  Shield,
  Sparkles,
  Video,
  X
} from 'lucide-react'

type Subpart = {
  id: string
  title: string
  vimeo_url: string
  description_html?: string
  order_index?: number
  completed?: boolean
}

type Chapter = {
  id: string
  title: string
  order_index?: number
  subparts: Subpart[]
}

type Formation = {
  id: string
  title: string
  description?: string
  is_private?: boolean
  chapters: Chapter[]
}

type Profile = {
  id: string
  role: string
  full_name?: string
}

const canAccessFormation = (role: string | undefined, isPrivate?: boolean) => {
  if (!role) return false
  if (isPrivate) return role === 'admin'
  return ['premium_silver', 'premium_gold', 'admin'].includes(role)
}

const demoFormations: Formation[] = [
  {
    id: 'demo-formation-1',
    title: 'Techniques avancées de radiologie',
    description:
      "Un parcours guidé pour maîtriser l'interprétation radiologique avec des cas pratiques et des démonstrations vidéos.",
    is_private: false,
    chapters: [
      {
        id: 'demo-chapter-1',
        title: 'Bases essentielles',
        order_index: 1,
        subparts: [
          {
            id: 'demo-subpart-1',
            title: 'Lecture systématique des clichés',
            vimeo_url: 'https://player.vimeo.com/video/76979871',
            description_html: '<p>Approche pas à pas pour sécuriser vos diagnostics.</p>',
            order_index: 1
          },
          {
            id: 'demo-subpart-2',
            title: 'Pièges fréquents',
            vimeo_url: 'https://player.vimeo.com/video/1084537',
            description_html: '<p>Les erreurs courantes et comment les éviter.</p>',
            order_index: 2
          }
        ]
      },
      {
        id: 'demo-chapter-2',
        title: 'Cas cliniques commentés',
        order_index: 2,
        subparts: [
          {
            id: 'demo-subpart-3',
            title: 'Traumatologie',
            vimeo_url: 'https://player.vimeo.com/video/137857207',
            description_html: '<p>Analyse guidée avec un expert.</p>',
            order_index: 1
          }
        ]
      }
    ]
  }
]

const ToolbarButton = ({
  label,
  onClick
}: {
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50"
  >
    {label}
  </button>
)

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (html: string) => void }) => {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const applyFormat = (command: string, value?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    onChange(editorRef.current.innerHTML)
  }

  const handleInput = () => {
    if (!editorRef.current) return
    onChange(editorRef.current.innerHTML)
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <ToolbarButton label="Gras" onClick={() => applyFormat('bold')} />
        <ToolbarButton label="Italique" onClick={() => applyFormat('italic')} />
        <ToolbarButton label="Liste" onClick={() => applyFormat('insertUnorderedList')} />
        <ToolbarButton label="Titre" onClick={() => applyFormat('formatBlock', 'h3')} />
        <select
          className="px-2 py-1 text-sm rounded border border-gray-200 bg-white"
          onChange={(e) => applyFormat('fontSize', e.target.value)}
          defaultValue="16"
        >
          {[12, 14, 16, 20, 24].map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
        <input
          type="color"
          className="w-10 h-8 border border-gray-200 rounded"
          onChange={(e) => applyFormat('foreColor', e.target.value)}
          aria-label="Choisir une couleur"
        />
      </div>
      <div
        ref={editorRef}
        className="min-h-[140px] p-4 focus:outline-none"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  )
}

export default function ElearningPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formations, setFormations] = useState<Formation[]>(demoFormations)
  const [selectedFormationId, setSelectedFormationId] = useState<string>(demoFormations[0].id)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [formationForm, setFormationForm] = useState({ title: '', description: '', is_private: false })
  const [chapterForm, setChapterForm] = useState({ title: '', order_index: 1, formationId: demoFormations[0].id })
  const [subpartForm, setSubpartForm] = useState({
    title: '',
    vimeo_url: '',
    order_index: 1,
    chapterId: demoFormations[0].chapters[0].id,
    description_html: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', user.id)
        .single()

      setProfile(profileData as Profile)

      await loadFormationsFromSupabase(user.id, (profileData as Profile | null)?.role)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFormationsFromSupabase = async (userId: string, role?: string) => {
    const roleToUse = role ?? profile?.role

    try {
      const { data, error } = await supabase
        .from('elearning_formations')
        .select(
          `id, title, description, is_private,
          chapters:elearning_chapters(id, title, order_index,
            subparts:elearning_subparts(id, title, vimeo_url, description_html, order_index,
              progress:elearning_subpart_progress(user_id, completed_at)
            )
          )`
        )
        .order('title', { ascending: true })

      if (error) throw error

      if (data) {
        const parsed: Formation[] = data.map((formation: any) => ({
          id: formation.id,
          title: formation.title,
          description: formation.description,
          is_private: formation.is_private,
          chapters:
            formation.chapters?.map((chapter: any) => ({
              id: chapter.id,
              title: chapter.title,
              order_index: chapter.order_index,
              subparts:
                chapter.subparts?.map((sub: any) => ({
                  id: sub.id,
                  title: sub.title,
                  vimeo_url: sub.vimeo_url,
                  description_html: sub.description_html,
                  order_index: sub.order_index,
                  completed: (sub.progress || []).some((p: any) => p.user_id === userId)
                })) || []
            })) || []
        }))

        const accessible = parsed.filter((formation) => canAccessFormation(roleToUse, formation.is_private))

        if (accessible.length) {
          setFormations(accessible)
          setSelectedFormationId(accessible[0].id)
          setChapterForm((prev) => ({ ...prev, formationId: accessible[0].id }))
          if (accessible[0].chapters[0]) {
            setSubpartForm((prev) => ({ ...prev, chapterId: accessible[0].chapters[0].id }))
          }
        } else {
          setFormations([])
          setSelectedFormationId('')
        }
      }
    } catch (error) {
      console.warn('Fallback to démonstration data, tables manquantes ?', error)
      setFormations(demoFormations)
      setSelectedFormationId(demoFormations[0].id)
    }
  }

  const isPremium = profile?.role === 'premium_silver' || profile?.role === 'premium_gold' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  const selectedFormation = useMemo(
    () => formations.find((f) => f.id === selectedFormationId) ?? formations[0],
    [formations, selectedFormationId]
  )

  const progress = useMemo(() => {
    if (!selectedFormation) return { total: 0, done: 0, percent: 0 }
    const total = selectedFormation.chapters.reduce((acc, chapter) => acc + chapter.subparts.length, 0)
    const done = selectedFormation.chapters.reduce(
      (acc, chapter) => acc + chapter.subparts.filter((s) => s.completed).length,
      0
    )
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 }
  }, [selectedFormation])

  const handleCreateFormation = async () => {
    if (!formationForm.title.trim()) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_formations')
        .insert({
          title: formationForm.title,
          description: formationForm.description,
          is_private: formationForm.is_private
        })
        .select()
        .single()

      if (error) throw error

      const newFormation: Formation = {
        id: data.id,
        title: data.title,
        description: data.description,
        is_private: data.is_private,
        chapters: []
      }

      setFormations((prev) => [...prev, newFormation])
      setSelectedFormationId(newFormation.id)
      setFormationForm({ title: '', description: '', is_private: false })
    } catch (error) {
      console.error('Impossible de créer la formation', error)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateChapter = async () => {
    if (!chapterForm.title.trim() || !chapterForm.formationId) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_chapters')
        .insert({
          title: chapterForm.title,
          order_index: chapterForm.order_index,
          formation_id: chapterForm.formationId
        })
        .select()
        .single()

      if (error) throw error

      const newChapter: Chapter = { id: data.id, title: data.title, order_index: data.order_index, subparts: [] }

      setFormations((prev) =>
        prev.map((formation) =>
          formation.id === chapterForm.formationId
            ? { ...formation, chapters: [...formation.chapters, newChapter] }
            : formation
        )
      )

      setChapterForm({ title: '', order_index: 1, formationId: chapterForm.formationId })
      setSubpartForm((prev) => ({ ...prev, chapterId: newChapter.id }))
    } catch (error) {
      console.error('Impossible de créer le chapitre', error)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateSubpart = async () => {
    if (!subpartForm.title.trim() || !subpartForm.vimeo_url.trim() || !subpartForm.chapterId) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_subparts')
        .insert({
          title: subpartForm.title,
          vimeo_url: subpartForm.vimeo_url,
          description_html: subpartForm.description_html,
          order_index: subpartForm.order_index,
          chapter_id: subpartForm.chapterId
        })
        .select()
        .single()

      if (error) throw error

      const newSubpart: Subpart = {
        id: data.id,
        title: data.title,
        vimeo_url: data.vimeo_url,
        description_html: data.description_html,
        order_index: data.order_index
      }

      setFormations((prev) =>
        prev.map((formation) => ({
          ...formation,
          chapters: formation.chapters.map((chapter) =>
            chapter.id === subpartForm.chapterId
              ? { ...chapter, subparts: [...chapter.subparts, newSubpart] }
              : chapter
          )
        }))
      )

      setSubpartForm({ title: '', vimeo_url: '', order_index: 1, chapterId: subpartForm.chapterId, description_html: '' })
    } catch (error) {
      console.error('Impossible de créer la sous-partie', error)
    } finally {
      setCreating(false)
    }
  }

  const toggleCompletion = async (subpartId: string, completed: boolean) => {
    if (!profile) return

    try {
      if (completed) {
        await supabase.from('elearning_subpart_progress').upsert({
          subpart_id: subpartId,
          user_id: profile.id,
          completed_at: new Date().toISOString()
        })
      } else {
        await supabase
          .from('elearning_subpart_progress')
          .delete()
          .eq('subpart_id', subpartId)
          .eq('user_id', profile.id)
      }
    } catch (error) {
      console.error('Impossible de mettre à jour le suivi', error)
    }

    setFormations((prev) =>
      prev.map((formation) => ({
        ...formation,
        chapters: formation.chapters.map((chapter) => ({
          ...chapter,
          subparts: chapter.subparts.map((sub) =>
            sub.id === subpartId ? { ...sub, completed } : sub
          )
        }))
      }))
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

  if (!isPremium) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold mb-3">
              <GraduationCap className="h-5 w-5" />
              E-learning
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Formations en ligne</h1>
            <p className="text-gray-600">
              Accès réservé aux membres Premium. Construisez vos parcours avec des vidéos Vimeo, descriptions enrichies et
              suivi de progression dès activation.
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-8 shadow-lg">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-4">
                <AlertCircle className="h-4 w-4" />
                Accès Premium requis
              </div>
              <h2 className="text-3xl font-bold mb-4">Passez Premium pour débloquer les parcours</h2>
              <p className="text-white/90 text-lg mb-6">
                Les administrateurs peuvent créer des formations, chapitres et sous-parties avec vidéos Vimeo. Les membres
                Premium suivent leur avancement en cochant chaque vidéo terminée.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Lecteur Vimeo intégré</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Editeur riche</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Suivi visuel</span>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
              >
                Activer Premium
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold">
              <GraduationCap className="h-5 w-5" />
              E-learning
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Construire et suivre les parcours</h1>
            <p className="text-gray-600">
              Créez des formations avec chapitres et sous-parties vidéo. Les membres Premium marquent chaque étape comme
              terminée pour valider leur progression.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-xl text-primary-700">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-semibold">{isAdmin ? 'Admin : construction active' : 'Accès Premium'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-primary-600 font-semibold">
                  <BookOpen className="h-5 w-5" />
                  Formations disponibles
                </div>
                <div className="flex gap-2">
                  {formations.map((formation) => (
                    <button
                      key={formation.id}
                      onClick={() => setSelectedFormationId(formation.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
                        selectedFormationId === formation.id
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {formation.title}
                    </button>
                  ))}
                </div>
              </div>

              {selectedFormation ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="h-4 w-4 text-primary-600" />
                      <h2 className="text-lg font-semibold">{selectedFormation.title}</h2>
                      {selectedFormation.is_private && (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800 font-semibold uppercase">
                          Privé
                        </span>
                      )}
                    </div>
                    {selectedFormation.description && (
                      <div
                        className="text-gray-700 text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedFormation.description }}
                      />
                    )}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>
                          {progress.done}/{progress.total} sous-parties terminées
                        </span>
                        <span>{progress.percent}%</span>
                      </div>
                      <div className="h-3 bg-white rounded-full border border-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-primary-600"
                          style={{ width: `${progress.percent}%` }}
                          aria-label={`Progression ${progress.percent}%`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {selectedFormation.chapters.map((chapter) => (
                    <div key={chapter.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-800 font-semibold">
                          <Layers className="h-4 w-4 text-primary-600" />
                          {chapter.title}
                        </div>
                        <span className="text-xs text-gray-500">{chapter.subparts.length} sous-parties</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {chapter.subparts.map((subpart) => (
                          <div key={subpart.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                  <Video className="h-4 w-4 text-primary-500" />
                                  {subpart.title}
                                </div>
                                {subpart.description_html && (
                                  <div
                                    className="text-sm text-gray-700 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: subpart.description_html }}
                                  />
                                )}
                                <a
                                  href={subpart.vimeo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-primary-700 mt-2"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                  Ouvrir dans le lecteur Vimeo
                                </a>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock3 className="h-4 w-4" />
                                  Suivi
                                </span>
                                <button
                                  onClick={() => toggleCompletion(subpart.id, !subpart.completed)}
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
                                    subpart.completed
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <CheckSquare className="h-4 w-4" />
                                  {subpart.completed ? 'Terminé' : 'Marquer terminé'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600 text-sm">Aucune formation disponible pour le moment.</div>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-primary-100">
                <div className="flex items-center gap-2 text-primary-600 font-semibold mb-3">
                  <ListChecks className="h-5 w-5" />
                  Construction des parcours
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Créez la formation, ajoutez des chapitres puis des sous-parties avec liens Vimeo et description
                  enrichie. Toutes les actions sont enregistrées dans Supabase.
                </p>
                <div className="space-y-4">
                  <div className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nouvelle formation
                      </h3>
                      {creating && <span className="text-xs text-primary-600">Enregistrement...</span>}
                    </div>
                    <div className="space-y-3">
                      <input
                        value={formationForm.title}
                        onChange={(e) => setFormationForm({ ...formationForm, title: e.target.value })}
                        placeholder="Titre de la formation"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formationForm.is_private}
                          onChange={(e) => setFormationForm({ ...formationForm, is_private: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        Formation privée (visible seulement par les admins)
                      </label>
                      <RichTextEditor
                        value={formationForm.description}
                        onChange={(html) => setFormationForm({ ...formationForm, description: html })}
                      />
                      <button
                        onClick={handleCreateFormation}
                        disabled={creating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Enregistrer la formation
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nouveau chapitre
                      </h3>
                      {creating && <span className="text-xs text-primary-600">Enregistrement...</span>}
                    </div>
                    <div className="space-y-3">
                      <select
                        value={chapterForm.formationId}
                        onChange={(e) => setChapterForm({ ...chapterForm, formationId: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        {formations.map((formation) => (
                          <option key={formation.id} value={formation.id}>
                            {formation.title}
                          </option>
                        ))}
                      </select>
                      <input
                        value={chapterForm.title}
                        onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                        placeholder="Titre du chapitre"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={chapterForm.order_index}
                        onChange={(e) => setChapterForm({ ...chapterForm, order_index: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Ordre d'affichage"
                      />
                      <button
                        onClick={handleCreateChapter}
                        disabled={creating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-semibold border border-primary-200 hover:bg-primary-100"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Ajouter le chapitre
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nouvelle sous-partie
                      </h3>
                      {creating && <span className="text-xs text-primary-600">Enregistrement...</span>}
                    </div>
                    <div className="space-y-3">
                      <select
                        value={subpartForm.chapterId}
                        onChange={(e) => setSubpartForm({ ...subpartForm, chapterId: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        {formations.flatMap((formation) =>
                          formation.chapters.map((chapter) => (
                            <option key={chapter.id} value={chapter.id}>
                              {formation.title} — {chapter.title}
                            </option>
                          ))
                        )}
                      </select>
                      <input
                        value={subpartForm.title}
                        onChange={(e) => setSubpartForm({ ...subpartForm, title: e.target.value })}
                        placeholder="Titre de la sous-partie"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        value={subpartForm.vimeo_url}
                        onChange={(e) => setSubpartForm({ ...subpartForm, vimeo_url: e.target.value })}
                        placeholder="URL du lecteur Vimeo"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={subpartForm.order_index}
                        onChange={(e) => setSubpartForm({ ...subpartForm, order_index: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Ordre d'affichage"
                      />
                      <RichTextEditor
                        value={subpartForm.description_html}
                        onChange={(html) => setSubpartForm({ ...subpartForm, description_html: html })}
                      />
                      <button
                        onClick={handleCreateSubpart}
                        disabled={creating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Ajouter la vidéo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-semibold">
                  <Shield className="h-4 w-4" /> Règles d'accès
                </div>
                <ul className="text-sm text-gray-700 list-disc list-inside space-y-2">
                  <li>Les formations Silver et Gold sont visibles uniquement par les membres Premium correspondants.</li>
                  <li>Les sous-parties sont considérées comme validées lorsque l'abonné clique sur "Marquer terminé".</li>
                  <li>Toutes les écritures (création, progression) sont stockées dans Supabase via les tables proposées.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
